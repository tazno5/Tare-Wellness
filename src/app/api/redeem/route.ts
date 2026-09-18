import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

// ============ POST /api/redeem — Validate + apply redemption code ============

export async function POST(req: Request) {
  try {
    // Rate limiting: 10 redemption attempts per minute per IP
    const { success } = await checkRateLimit(req, "redeem");
    if (!success) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a moment before trying again." },
        { status: 429 },
      );
    }

    const session = await getServerSession(authOptions);

    // Require authentication — users must be signed in to redeem a gift card.
    // This ensures the redeemed credit is linked to their account.
    if (!session?.user) {
      return NextResponse.json(
        { error: "Please sign in to redeem your gift card." },
        { status: 401 },
      );
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const { code } = body as { code: string };

    if (!code || code.trim().length === 0) {
      return NextResponse.json(
        { error: "Redemption code is required" },
        { status: 400 },
      );
    }

    // Normalize the code: uppercase + strip all non-alphanumeric chars.
    // User might type "rc3e-vy72-zlbn-58fa", "RC3E VY72 ZLBN 58FA",
    // or "RC3EVY72ZLBN58FA" — all should match the DB code "RC3E-VY72-ZLBN-58FA".
    const normalizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

    // The DB stores codes in "XXXX-XXXX-XXXX-XXXX" format. Reconstruct
    // the dashed format from the normalized input so the lookup matches.
    const dashedCode = normalizedCode.replace(/(.{4})(?=.)/g, "$1-");

    // Find the redemption by code (try both dashed and non-dashed formats)
    const redemption = await db.redemption.findFirst({
      where: {
        OR: [
          { code: dashedCode },
          { code: normalizedCode },
        ],
      },
      include: {
        orderItem: true,
      },
    });

    if (!redemption) {
      return NextResponse.json(
        { error: "Invalid code — no gift card found with that code" },
        { status: 404 },
      );
    }

    if (redemption.status === "redeemed") {
      return NextResponse.json(
        { error: "This gift card has already been redeemed" },
        { status: 409 },
      );
    }

    if (redemption.status === "expired") {
      return NextResponse.json(
        { error: "This gift card has expired" },
        { status: 410 },
      );
    }

    // IDEMPOTENT SELF-PURCHASE HANDLING:
    // If this redemption is ALREADY attached to the current user (a self-
    // purchase that was auto-attached at order time, see /api/orders),
    // we treat this as a no-op success. We do NOT reset sessionsRemaining
    // to the full cardSessions value — the user may have already booked
    // sessions against it, and resetting would erase those bookings'
    // session-count impact (effectively granting free sessions).
    //
    // Returns the same success shape as a normal redemption so the
    // /redeem page shows a "Gift card applied!" toast. We use the
    // ACTUAL current sessionsRemaining (which reflects any bookings
    // already made) instead of resetting to cardSessions.
    if (redemption.userId === userId && redemption.status === "active") {
      return NextResponse.json({
        valid: true,
        code: redemption.code,
        creditAmount: redemption.creditAmount,
        cardTitle: redemption.orderItem.cardTitle,
        cardSessions: redemption.orderItem.cardSessions,
        sessionsRemaining: redemption.sessionsRemaining,
        status: "active",
        message: `This gift card is already on your account. You have ${redemption.sessionsRemaining} session${redemption.sessionsRemaining === 1 ? "" : "s"} remaining.`,
      });
    }

    // Apply the credit to the authenticated user's account.
    // CRITICAL #2: Use a conditional updateMany (atomic) to prevent
    // double-redemption race conditions. Only updates if status is
    // still "active" — if another request already redeemed it, the
    // count will be 0 and we return 409.
    //
    // For a normal gift card (recipient received the code via email and
    // is entering it on /redeem for the first time), we set:
    //   - userId to the current user (claims the card)
    //   - status to "redeemed" (marks the code as claimed)
    //   - sessionsRemaining to cardSessions (grants the full balance)
    const result = await db.redemption.updateMany({
      where: { id: redemption.id, status: "active" },
      data: {
        userId,
        status: "redeemed",
        redeemedAt: new Date(),
        sessionsRemaining: redemption.orderItem.cardSessions,
      },
    });

    if (result.count === 0) {
      // Another request redeemed it between our read and write
      return NextResponse.json(
        { error: "This gift card has already been redeemed" },
        { status: 409 },
      );
    }

    return NextResponse.json({
      valid: true,
      code: redemption.code,
      creditAmount: redemption.creditAmount,
      cardTitle: redemption.orderItem.cardTitle,
      cardSessions: redemption.orderItem.cardSessions,
      status: "redeemed",
      message: `Gift card redeemed! ₦${redemption.creditAmount.toLocaleString()} credit applied to your account.`,
    });
  } catch (error) {
    console.error("Redemption error:", error);
    return NextResponse.json(
      { error: "Failed to validate redemption code" },
      { status: 500 },
    );
  }
}

// ============ GET /api/redeem — Check code status (auth required) ============
// HIGH #3: Previously unauthenticated — anyone could enumerate codes.
// Now requires a valid session. Used by the UI to check code validity
// before showing the "Redeem" button.

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
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Code parameter is required" },
        { status: 400 },
      );
    }

    // Normalize the code: uppercase + strip all non-alphanumeric chars
    const normalizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const dashedCode = normalizedCode.replace(/(.{4})(?=.)/g, "$1-");

    const redemption = await db.redemption.findFirst({
      where: {
        OR: [
          { code: dashedCode },
          { code: normalizedCode },
        ],
      },
      include: {
        orderItem: true,
      },
    });

    if (!redemption) {
      return NextResponse.json(
        { valid: false, error: "Invalid code" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      valid: true,
      code: redemption.code,
      creditAmount: redemption.creditAmount,
      cardTitle: redemption.orderItem.cardTitle,
      cardSessions: redemption.orderItem.cardSessions,
      sessionsRemaining: redemption.sessionsRemaining,
      status: redemption.status,
    });
  } catch (error) {
    console.error("Code check error:", error);
    return NextResponse.json(
      { error: "Failed to check code" },
      { status: 500 },
    );
  }
}
