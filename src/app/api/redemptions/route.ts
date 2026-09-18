import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ============ GET /api/redemptions — List the signed-in user's gift cards ============
//
// Returns EVERY redemption linked to the current user — both active cards
// (sessionsRemaining > 0, can be booked against) AND exhausted cards
// (sessionsRemaining = 0, fully redeemed). The `isExhausted` flag lets the
// UI render them in different sections:
//   - Active cards → "My Gift Cards" with a "Book Next Session" CTA
//   - Exhausted cards → "Past Packages" with a "Fully Redeemed" badge + disabled CTA
//
// Why include exhausted cards at all? Because the user wants to see their
// full gift card history — when a 3-session card is fully used up, the
// record stays in the DB permanently (we never delete it) so the user
// can still see "I had this card, I used all 3 sessions, here are the
// bookings linked to it". Hiding depleted cards made it LOOK like the
// card was deleted, which was the original bug report.
//
// Cancelled/expired/refunded cards (status="cancelled") are still excluded
// because those represent payment failures / refunds — not legitimate
// history the user needs to see.

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
        // Exclude cancelled/refunded cards (status="cancelled") — those
        // represent failed/refunded orders, not legitimate history.
        // Keep "active" + "redeemed" + "expired" so fully-used cards still show.
        status: { not: "cancelled" },
      },
      include: {
        orderItem: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const cards = redemptions.map((r) => {
      const totalSessions = r.orderItem?.cardSessions ?? 0;
      const isExhausted =
        r.sessionsRemaining === 0 && r.sessionsUsed === totalSessions;
      return {
        id: r.id,
        code: r.code,
        cardTitle: r.orderItem?.cardTitle ?? "Gift Card",
        cardSessions: totalSessions,
        creditAmount: r.creditAmount,
        sessionsRemaining: r.sessionsRemaining,
        sessionsUsed: r.sessionsUsed,
        status: r.status,
        // New flag: true when the card has 0 sessions left AND all sessions
        // have been used (i.e. fully redeemed, not cancelled/refunded).
        // The UI uses this to render the card in a "Past Packages" section
        // with a "Fully Redeemed" badge and a disabled "Book Next Session" button.
        isExhausted,
        redeemedAt: r.redeemedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Failed to fetch user redemptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch redemptions" },
      { status: 500 },
    );
  }
}
