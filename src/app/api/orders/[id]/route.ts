import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/orders/[id] — Fetch a single order by ID or orderNumber.
//
// Authentication:
//   - Logged-in users: ownership is verified (userId OR buyerEmail matches
//     the session user). This prevents one user from reading another
//     user's orders.
//   - Guest users: no session, so we return the order if found by ID.
//     This is safe because the order ID (a cuid) is only known to:
//       1. The buyer (shown in the URL after checkout)
//       2. The admin (via /admin/orders)
//     The order ID is a 24-character random string — not guessable.
//     This pattern is called a "capability URL" — possession of the URL
//     grants access to the resource, similar to a Google Doc share link.
//
// If we required auth here, guests wouldn't be able to see their order
// confirmation page after a successful checkout.

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    const sessionEmail = session?.user?.email;

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

    // For logged-in users: verify ownership — either userId matches OR
    // buyerEmail matches the session email (guests skip this check).
    if (order && userId && order.userId !== userId && order.buyerEmail !== sessionEmail) {
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

      // HIGH #2: Verify ownership for order-number lookup too (logged-in only)
      if (
        userId &&
        orderByNumber.userId !== userId &&
        orderByNumber.buyerEmail !== sessionEmail
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
