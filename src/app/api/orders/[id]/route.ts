import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // HIGH #2: Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }
    const userId = (session.user as { id: string }).id;

    const { id } = await params;

    // Try by order ID first
    let order = await db.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: { redemption: true },
        },
      },
    });

    // HIGH #2: Verify ownership — either userId matches OR buyerEmail matches
    // (buyerEmail check allows guest orders by the same email)
    if (order && order.userId !== userId && order.buyerEmail !== session.user.email) {
      return NextResponse.json(
        { error: "You do not have access to this order" },
        { status: 403 },
      );
    }

    if (!order) {
      // Try by order number
      const orderByNumber = await db.order.findUnique({
        where: { orderNumber: id },
        include: {
          orderItems: {
            include: { redemption: true },
          },
        },
      });

      if (!orderByNumber) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 },
        );
      }

      // HIGH #2: Verify ownership for order-number lookup too
      if (
        orderByNumber.userId !== userId &&
        orderByNumber.buyerEmail !== session.user.email
      ) {
        return NextResponse.json(
          { error: "You do not have access to this order" },
          { status: 403 },
        );
      }

      return NextResponse.json(orderByNumber);
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}
