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

    const bookings = await db.booking.findMany({
      include: {
        user: { select: { name: true, email: true } },
        redemption: { include: { orderItem: { select: { cardTitle: true } } } },
      },
      orderBy: { scheduledDate: "desc" },
      take: 50,
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Admin bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
