import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ============ Helpers ============

function generateOrderNumber(): string {
  const hash = Math.abs(
    Date.now().toString().split("").reduce((s, c) => s + parseInt(c), 0) * 7919,
  ).toString().padStart(6, "0").slice(0, 6);
  return `TG-${hash}`;
}

function generateRedemptionCode(seed: string): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let n = 0;
  for (let i = 0; i < seed.length; i++) {
    n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  }
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += "-";
    for (let j = 0; j < 4; j++) {
      code += charset[n % charset.length];
      n = (n * 31 + i * 7 + j * 13) >>> 0;
    }
  }
  return code.slice(1);
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
          userId: session?.user?.id ?? null,
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
