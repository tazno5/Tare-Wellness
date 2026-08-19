import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/admin-auth";

export async function GET(req: Request) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
    }
    if (!verifyAdminToken(req.headers.get("authorization"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await db.order.findMany({
      include: {
        orderItems: {
          include: { redemption: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Admin orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
