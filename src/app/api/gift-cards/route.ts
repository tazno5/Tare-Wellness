import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const cards = await db.giftCardType.findMany({
      where: { isActive: true },
      orderBy: { sessions: "asc" },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Failed to fetch gift cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch gift cards" },
      { status: 500 },
    );
  }
}
