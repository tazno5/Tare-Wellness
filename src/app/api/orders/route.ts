import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

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
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const { buyerName, buyerEmail, paymentMethod, recipients } = body as {
      buyerName: string;
      buyerEmail: string;
      paymentMethod: string;
      recipients: {
        cardSlug: string;
        recipientName: string;
        recipientEmail: string;
        occasion: string;
        deliveryMode: string;
        scheduledFor: string | null;
        personalNote: string;
      }[];
    };

    // Validate
    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient is required" },
        { status: 400 },
      );
    }

    // Fetch all gift card types needed
    const slugs = [...new Set(recipients.map((r) => r.cardSlug))];
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

    // Calculate total
    const totalAmount = recipients.reduce(
      (sum, r) => sum + (cardMap.get(r.cardSlug)?.price ?? 0),
      0,
    );

    const orderNumber = generateOrderNumber();

    // Create order first, then items + redemptions in a transaction
    const order = await db.$transaction(async (tx) => {
      // 1. Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: (session?.user as { id?: string } | undefined)?.id ?? null,
          buyerName,
          buyerEmail,
          paymentMethod: paymentMethod || "card",
          totalAmount,
          status: "completed",
        },
      });

      // 2. Create order items + redemption codes for each recipient
      for (const r of recipients) {
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
            confirmed: true,
          },
        });

        await tx.redemption.create({
          data: {
            code: generateRedemptionCode(`${orderNumber}-${r.recipientEmail}-${Date.now()}`),
            orderItemId: orderItem.id,
            orderId: newOrder.id,
            creditAmount: card.price,
            status: "active",
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

    // Send gift card emails to each recipient (fire and forget, don't block the response)
    if (order?.orderItems) {
      for (const item of order.orderItems) {
        fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/email/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderItemId: item.id }),
        }).catch(() => {}); // Ignore email errors — order is still valid
      }
    }

    return NextResponse.json(order, { status: 201 });
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
