import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";
import { generateOrderNumber, generateRedemptionCode } from "@/lib/ids";
import { verifyTransaction } from "@/lib/paystack";

// ============================================================
// FEATURE FLAG: Paystack server-side verification
// ============================================================
// When false, the API ignores paystackReference entirely and always
// creates the order as "pending" (bank transfer flow). The Paystack
// verification logic remains in the codebase, fully intact, shielded
// behind this flag — set to true to re-enable Paystack verification.
//
// NOTE: The checkout UI has its own ENABLE_PAYSTACK flag at the top
// of src/app/checkout/page.tsx. Both must be `true` for the full
// Paystack flow to work.
const ENABLE_PAYSTACK = false;
// ============================================================

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
  // Paystack transaction reference — required when paymentMethod === "card"
  // and ENABLE_PAYSTACK is true. When ENABLE_PAYSTACK is false (bank transfer
  // flow), this is null — the server skips Paystack verification.
  // Accept null OR undefined OR a string (Zod's .optional() only allows
  // undefined, not null — so we use .nullable() + .optional() to cover both).
  paystackReference: z.string().max(100).nullable().optional(),
  recipients: z.array(recipientSchema).min(1).max(20),
});

// ============ Helpers ============
// Order-number and redemption-code generators are now in `src/lib/ids.ts`.
// They use `crypto.randomBytes` (OS CSPRNG) so codes never collide, even
// when two orders are placed in the same call stack.

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
      paystackReference,
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

    // ============ PAYSTACK VERIFICATION ============
    // For card payments (only when ENABLE_PAYSTACK is true), verify the
    // Paystack transaction BEFORE creating the order. This prevents users
    // from getting gift cards without paying.
    //
    // Flow:
    //   1. Client opens Paystack popup → user pays → client receives reference
    //   2. Client POSTs here with { ..., paymentMethod: "card", paystackReference }
    //   3. We call Paystack's /transaction/verify endpoint with our secret key
    //   4. If status=success AND amount=totalAmount AND currency=NGN → create order
    //   5. Otherwise → return 400, no order is created
    //
    // In dev (no PAYSTACK_SECRET_KEY), verification is skipped — the order
    // goes through as "demo mode" so the rest of the flow can be tested.
    //
    // When ENABLE_PAYSTACK is false (current setting), this entire block
    // is skipped — the order is always created as "pending" (bank transfer
    // flow). The Paystack verification logic is preserved above the flag
    // check, fully intact — set ENABLE_PAYSTACK = true to re-enable.
    if (ENABLE_PAYSTACK && paymentMethod === "card") {
      if (!paystackReference) {
        return NextResponse.json(
          { error: "Payment reference is required for card payments" },
          { status: 400 },
        );
      }

      const verification = await verifyTransaction(paystackReference);
      if (!verification.verified) {
        return NextResponse.json(
          {
            error: "Payment verification failed",
            details: verification.error,
          },
          { status: 400 },
        );
      }

      // Amount check — totalAmount is in kobo (NGN × 100), Paystack returns
      // amount in kobo too. Skip in demo mode (no secret key).
      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      const isDemoMode = !secretKey || secretKey === "sk_test_placeholder";
      if (!isDemoMode && verification.data?.amount !== totalAmount) {
        return NextResponse.json(
          {
            error: "Payment amount mismatch",
            details: `Expected ₦${(totalAmount / 100).toLocaleString()} but received ₦${((verification.data?.amount ?? 0) / 100).toLocaleString()}`,
          },
          { status: 400 },
        );
      }

      // Verify customer email matches the buyer email (prevents paying with
      // someone else's email). Skip in demo mode.
      if (
        !isDemoMode &&
        verification.data?.customerEmail &&
        verification.data.customerEmail.toLowerCase() !== buyerEmail.toLowerCase()
      ) {
        return NextResponse.json(
          {
            error: "Payment email mismatch",
            details: `Payment was made by ${verification.data.customerEmail} but order is for ${buyerEmail}`,
          },
          { status: 400 },
        );
      }
    }
    // For transfer payments (the only flow when ENABLE_PAYSTACK is false),
    // no verification — the merchant manually confirms receipt of bank
    // transfer before fulfilling the order.

    const orderNumber = generateOrderNumber();

    // Create order + items + redemptions in a transaction.
    // - When ENABLE_PAYSTACK is true + paymentMethod==="card" + payment verified:
    //   order starts as "completed" (gift card emails fire immediately).
    // - Otherwise (transfer payments, or ENABLE_PAYSTACK is false):
    //   order starts as "pending" — merchant manually confirms receipt of
    //   the bank transfer before marking the order as "completed".
    const isVerifiedCardPayment = ENABLE_PAYSTACK && paymentMethod === "card";
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          buyerName,
          buyerEmail,
          paymentMethod: paymentMethod || "card",
          totalAmount,
          status: isVerifiedCardPayment ? "completed" : "pending",
        },
      });

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
            confirmed: isVerifiedCardPayment,
          },
        });

        await tx.redemption.create({
          data: {
            code: generateRedemptionCode(),
            orderItemId: orderItem.id,
            orderId: newOrder.id,
            creditAmount: card.price,
            sessionsRemaining: 0,
            sessionsUsed: 0,
            status: "active",
          },
        });
      }

      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: { orderItems: { include: { redemption: true } } },
      });
    });

    // Send gift card emails for completed (card) orders. Transfer orders
    // wait until the merchant confirms receipt.
    if (order?.status === "completed" && order.orderItems) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      await Promise.all(
        order.orderItems.map((item) =>
          fetch(`${baseUrl}/api/email/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderItemId: item.id }),
          }).catch(() => {}),
        ),
      );
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
