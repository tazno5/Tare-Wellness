import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/account/redemptions — Fetch all gift card redemptions for the
// current authenticated user. Used by the /account page to show the
// "My Gift Cards" section with session tracking (used / available / remaining).

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = (session.user as { id: string }).id;

    const redemptions = await db.redemption.findMany({
      where: { userId },
      include: {
        orderItem: {
          select: {
            cardTitle: true,
            cardSessions: true,
            cardPrice: true,
            cardGradient: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(redemptions);
  } catch (error) {
    console.error("Failed to fetch redemptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch gift cards" },
      { status: 500 },
    );
  }
}
