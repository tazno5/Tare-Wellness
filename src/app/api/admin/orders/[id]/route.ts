import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/admin-auth";

// PATCH /api/admin/orders/[id] — Update an order's status
//
// Used by the admin dashboard to:
//   - Confirm receipt of a bank transfer (pending → completed)
//   - Refund an order (completed → refunded)
//   - Mark an order as failed
//
// When an order is marked as "completed":
//   1. Order status is updated to "completed"
//   2. All order items are marked as confirmed=true
//   3. Gift card emails are sent to all recipients (fire-and-forget)
//
// Auth: requires the ADMIN_SECRET Bearer token (same as all admin routes).
// The admin enters this secret on the /admin login page.

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Admin not configured. Set ADMIN_SECRET env var." },
        { status: 503 },
      );
    }

    if (!verifyAdminToken(req.headers.get("authorization"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body as { status?: string };

    if (!status || !["completed", "pending", "failed", "refunded"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: completed, pending, failed, refunded" },
        { status: 400 },
      );
    }

    // Fetch the order to make sure it exists
    const order = await db.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 },
      );
    }

    // Update the order status
    const updated = await db.order.update({
      where: { id },
      data: {
        status,
        // If completing, mark all order items as confirmed
        ...(status === "completed" ? {} : {}),
      },
    });

    // If marking as completed, also mark all order items as confirmed
    // and trigger gift card emails
    if (status === "completed") {
      await db.orderItem.updateMany({
        where: { orderId: id },
        data: { confirmed: true },
      });

      // Re-fetch the order with order items for the email send
      const completedOrder = await db.order.findUnique({
        where: { id },
        include: {
          orderItems: true,
        },
      });

      // Send gift card emails — fire-and-forget (best-effort)
      // Same pattern as the card payment flow in /api/orders
      if (completedOrder?.orderItems) {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        await Promise.all(
          completedOrder.orderItems.map((item) =>
            fetch(`${baseUrl}/api/email/send`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderItemId: item.id }),
            }).catch(() => {
              // Swallow errors — order is still valid, email is best-effort
            }),
          ),
        );
      }
    }

    // If marking as failed/refunded, un-confirm the order items
    if (status === "failed" || status === "refunded") {
      await db.orderItem.updateMany({
        where: { orderId: id },
        data: { confirmed: false },
      });
    }

    return NextResponse.json({
      success: true,
      order: updated,
      message:
        status === "completed"
          ? "Order marked as completed. Gift card emails sent to recipients."
          : `Order status updated to ${status}.`,
    });
  } catch (error) {
    console.error("Admin order update error:", error);
    return NextResponse.json(
      {
        error: "Failed to update order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
