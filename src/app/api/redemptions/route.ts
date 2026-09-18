import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ============ GET /api/redemptions — List the signed-in user's gift cards ============
//
// Returns every redemption that is linked to the current user AND still has
// sessionsRemaining > 0 — i.e. gift cards they can book sessions against
// right now. Used by /book-session to populate the gift card selector and
// by the account page's Bookings tab "My Gift Cards" section.
//
// This endpoint exists because the client-side Zustand store only tracks a
// single redemption at a time, and we need a server-side source of truth for
// "what gift cards do I have, and how many sessions are left on each".

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
      where: {
        userId,
        // Only return gift cards that can actually be booked against.
        // Cancelled/expired/refunded gift cards (sessionsRemaining=0,
        // status="cancelled") are excluded so the UI doesn't show dead cards.
        sessionsRemaining: { gt: 0 },
      },
      include: {
        orderItem: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const cards = redemptions.map((r) => ({
      id: r.id,
      code: r.code,
      cardTitle: r.orderItem?.cardTitle ?? "Gift Card",
      cardSessions: r.orderItem?.cardSessions ?? 0,
      creditAmount: r.creditAmount,
      sessionsRemaining: r.sessionsRemaining,
      sessionsUsed: r.sessionsUsed,
      status: r.status,
      redeemedAt: r.redeemedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Failed to fetch user redemptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch redemptions" },
      { status: 500 },
    );
  }
}
