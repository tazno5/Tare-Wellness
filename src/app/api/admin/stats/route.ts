import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/admin-auth";

export async function GET(req: Request) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Admin access is not configured. Set ADMIN_SECRET env var." },
        { status: 503 },
      );
    }

    if (!verifyAdminToken(req.headers.get("authorization"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalOrders,
      totalUsers,
      totalBookings,
      totalRevenue,
      pendingOrders,
      activeRedemptions,
      emailsNotSent,
    ] = await Promise.all([
      db.order.count(),
      db.user.count(),
      db.booking.count(),
      db.order.aggregate({ _sum: { totalAmount: true }, where: { status: "completed" } }),
      db.order.count({ where: { status: "pending" } }),
      db.redemption.count({ where: { status: "active" } }),
      db.orderItem.count({ where: { emailSent: false } }),
    ]);

    return NextResponse.json({
      totalOrders,
      totalUsers,
      totalBookings,
      totalRevenue: totalRevenue._sum.totalAmount ?? 0,
      pendingOrders,
      activeRedemptions,
      emailsNotSent,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
