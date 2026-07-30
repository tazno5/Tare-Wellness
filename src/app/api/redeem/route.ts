import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ============ POST /api/redeem — Validate + apply redemption code ============

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { code } = body as { code: string };

    if (!code || code.trim().length === 0) {
      return NextResponse.json(
        { error: "Redemption code is required" },
        { status: 400 },
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    // Find the redemption by code
    const redemption = await db.redemption.findUnique({
      where: { code: normalizedCode },
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

    // If user is logged in, apply the credit to their account
    let userId: string | null = null;
    if (session?.user) {
      userId = (session.user as { id: string }).id;

      await db.redemption.update({
        where: { id: redemption.id },
        data: {
          userId,
          status: "redeemed",
          redeemedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      valid: true,
      code: redemption.code,
      creditAmount: redemption.creditAmount,
      cardTitle: redemption.orderItem.cardTitle,
      cardSessions: redemption.orderItem.cardSessions,
      status: userId ? "redeemed" : "active",
      message: userId
        ? `Gift card redeemed! ₦${redemption.creditAmount.toLocaleString()} credit applied to your account.`
        : `Valid code! ₦${redemption.creditAmount.toLocaleString()} credit available — sign in to apply it to your account.`,
    });
  } catch (error) {
    console.error("Redemption error:", error);
    return NextResponse.json(
      { error: "Failed to validate redemption code" },
      { status: 500 },
    );
  }
}

// ============ GET /api/redeem — Check code status (no auth required) ============

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Code parameter is required" },
        { status: 400 },
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    const redemption = await db.redemption.findUnique({
      where: { code: normalizedCode },
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
