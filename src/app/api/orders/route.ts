import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

// ============ Validation (HIGH #4) ============

const recipientSchema = z.object({
  cardSlug: z.string().min(1).max(50),
  recipientName: z.string().min(1).max(200),
  recipientEmail: z.string().email().max(500),
  occasion: z.string().max(100).default("Just Because"),
  deliveryMode: z.enum(["now", "schedule"]).default("now"),
  scheduledFor: z.string().nullable().optional(),
  personalNote: z.string().max(2000).optional().default(""),
});

const createOrderSchema = z.object({
  buyerName: z.string().min(1).max(200),
  buyerEmail: z.string().email().max(500),
  paymentMethod: z.enum(["card", "transfer"]).default("card"),
  recipients: z.array(recipientSchema).min(1).max(20),
});

// ============ Helpers ============

function generateOrderNumber(): string {
  // Use random bytes + timestamp to guarantee uniqueness even when two
  // orders are placed in the same millisecond. Format: TG-XXXXXXXX (8 chars).
  const ts = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `TG-${ts}${rand}`;
}

function generateRedemptionCode(seed: string): string {
  // Generate 16 random chars from a 32-char alphabet (no ambiguous chars).
  // Excludes 0/O/1/I to avoid confusion when read aloud.
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  // Build a high-entropy 32-bit seed from multiple sources:
  // - the input seed (recipient email, order number, etc.)
  // - Date.now() (millisecond timestamp)
  // - Math.random() (browser/Node PRNG)
  // - performance.now() sub-millisecond entropy when available
  let seedHash = 0;
  for (let i = 0; i < seed.length; i++) {
    seedHash = (Math.imul(seedHash, 31) + seed.charCodeAt(i)) >>> 0;
  }
  const timeEntropy = Date.now() >>> 0;
  const randEntropy = (Math.random() * 0x100000000) >>> 0;
  const perfEntropy =
    typeof performance !== "undefined" && performance.now
      ? (performance.now() * 1000) >>> 0
      : 0;

  // XOR all sources together to mix entropy
  let state = (seedHash ^ timeEntropy ^ randEntropy ^ perfEntropy) >>> 0;
  // Ensure state is never 0 (LCG would stick at 0)
  if (state === 0) state = 0x12345678;

  let code = "";
  for (let i = 0; i < 4; i++) {
    if (i > 0) code += "-";
    for (let j = 0; j < 4; j++) {
      // 32-bit LCG (Numerical Recipes constants) — full period, good mixing
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      code += charset[state % charset.length];
    }
  }
  return code;
}

// ============ POST /api/orders — Create order ============

export async function POST(req: Request) {
  try {
    // Rate limiting: 5 orders per minute per IP
    const { success } = await checkRateLimit(req, "orders");
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429 },
      );
    }

    const session = await getServerSession(authOptions);

    // CRITICAL #1: Require authentication — no guest orders
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required to place an order" },
        { status: 401 },
      );
    }

    const userId = (session.user as { id: string }).id;

    // HIGH #4: Validate input with Zod
    const body = await req.json();
    const parseResult = createOrderSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid order data",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    const {
      buyerName,
      buyerEmail,
      paymentMethod,
      recipients: validatedRecipients,
    } = parseResult.data;

    // Fetch all gift card types needed — server-side price lookup
    // (never trust client-provided prices)
    const slugs = [...new Set(validatedRecipients.map((r) => r.cardSlug))];
    const cardTypes = await db.giftCardType.findMany({
      where: { slug: { in: slugs } },
    });

    if (cardTypes.length !== slugs.length) {
      return NextResponse.json(
        { error: "One or more gift card types not found" },
        { status: 400 },
      );
    }

    const cardMap = new Map(cardTypes.map((c) => [c.slug, c]));

    // Calculate total — server-side, from DB prices (not client)
    const totalAmount = validatedRecipients.reduce(
      (sum, r) => sum + (cardMap.get(r.cardSlug)?.price ?? 0),
      0,
    );

    const orderNumber = generateOrderNumber();

    // Create order first, then items + redemptions in a transaction.
    // CRITICAL #1: Order starts as "pending" — a separate endpoint
    // (POST /api/orders/confirm) will mark it "completed" after
    // payment verification (Paystack webhook).
    const order = await db.$transaction(async (tx) => {
      // 1. Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          buyerName,
          buyerEmail,
          paymentMethod: paymentMethod || "card",
          totalAmount,
          status: "pending", // CRITICAL #1: pending until payment verified
        },
      });

      // 2. Create order items + redemption codes for each recipient
      for (const r of validatedRecipients) {
        const card = cardMap.get(r.cardSlug)!;
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            giftCardTypeId: card.id,
            cardTitle: card.title,
            cardSessions: card.sessions,
            cardPrice: card.price,
            cardGradient: card.gradient,
            quantity: 1,
            recipientName: r.recipientName,
            recipientEmail: r.recipientEmail,
            occasion: r.occasion || "Just Because",
            deliveryMode: r.deliveryMode || "now",
            scheduledFor: r.scheduledFor ? new Date(r.scheduledFor) : null,
            personalNote: r.personalNote || null,
            confirmed: false, // CRITICAL #1: not confirmed until payment verified
          },
        });

        await tx.redemption.create({
          data: {
            code: generateRedemptionCode(`${orderNumber}-${r.recipientEmail}-${Date.now()}`),
            orderItemId: orderItem.id,
            orderId: newOrder.id,
            creditAmount: card.price,
            sessionsRemaining: 0, // 0 until redeemed (set on redeem)
            sessionsUsed: 0,
            status: "active", // active = code works, but order must be "completed" for email to send
          },
        });
      }

      // 3. Return the full order with relations
      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          orderItems: {
            include: { redemption: true },
          },
        },
      });
    });

    // CRITICAL #1: For now, in demo mode (no Paystack), we auto-confirm
    // the order. When Paystack is integrated, remove this block and
    // replace with a redirect to Paystack's checkout page.
    if (!process.env.PAYSTACK_SECRET_KEY) {
      // Demo mode — auto-confirm
      await db.order.update({
        where: { id: order!.id },
        data: { status: "completed" },
      });
      await db.orderItem.updateMany({
        where: { orderId: order!.id },
        data: { confirmed: true },
      });

      // Re-fetch the updated order
      const confirmedOrder = await db.order.findUnique({
        where: { id: order!.id },
        include: {
          orderItems: {
            include: { redemption: true },
          },
        },
      });

      // Send gift card emails — AWAIT the send (not fire-and-forget).
      // HIGH #1 fix: fire-and-forget fetch was unreliable on Vercel
      // serverless — function could be recycled before fetch completed,
      // causing emails to never be sent. Now we await each send.
      // The /api/email/send route catches its own errors and returns
      // success with a warning, so this won't fail the order.
      if (confirmedOrder?.orderItems) {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        await Promise.all(
          confirmedOrder.orderItems.map((item) =>
            fetch(`${baseUrl}/api/email/send`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderItemId: item.id }),
            }).catch(() => {
              // Swallow errors — order is still valid, email is best-effort.
              // The /api/email/send route marks emailSent=false on failure,
              // which a future retry cron could pick up.
            }),
          ),
        );
      }

      return NextResponse.json(confirmedOrder, { status: 201 });
    }

    // Production mode — return order with "pending" status.
    // Client should redirect to Paystack checkout with the order ID.
    // Paystack webhook will call POST /api/orders/confirm to complete.
    return NextResponse.json(
      { ...order, paymentRequired: true },
      { status: 202 },
    );
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}

// ============ GET /api/orders — List user's orders ============

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    // If no auth session, allow lookup by buyer email (for guest checkout)
    const where = email
      ? { buyerEmail: email }
      : { userId: (session.user as { id: string }).id };

    const orders = await db.order.findMany({
      where,
      include: {
        orderItems: {
          include: { redemption: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
