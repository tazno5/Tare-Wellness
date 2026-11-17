import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/settings/social-links — Public endpoint that returns social media
// links configured via /admin → Settings. Used by the Footer to display
// WhatsApp, Instagram, Threads, and Twitter links.
//
// Returns only the social link keys (whatsappLink, instagramLink, threadsLink,
// twitterLink) — not bank details or other admin-only settings.

const SOCIAL_KEYS = ["whatsappLink", "instagramLink", "threadsLink", "twitterLink"];

export async function GET() {
  try {
    const settings = await db.siteSetting.findMany({
      where: { key: { in: SOCIAL_KEYS } },
    });
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch social links:", error);
    return NextResponse.json({}, { status: 200 }); // Return empty on error — footer uses defaults
  }
}
