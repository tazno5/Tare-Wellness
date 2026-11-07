import { NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/internal-auth";
import { checkRateLimit } from "@/lib/ratelimit";
import { sendWelcomeEmail } from "@/lib/welcome-email";

// POST /api/email/welcome — Send welcome email to a newly-registered user.
//
// This endpoint is kept for backward compat / manual testing. The
// /api/auth/register route now calls sendWelcomeEmail() directly (instead
// of fetching this endpoint internally) to avoid Vercel's internal DNS
// resolution issues that broke signup with HTTP 500.
//
// Authentication: requires an internal auth header (verifyInternalAuth)
// to prevent external abuse. The register route uses the shared helper
// directly, so it doesn't need this endpoint anymore — but if you want
// to test the email send manually via curl, you'll need to pass the
// INTERNAL_AUTH_TOKEN header.

export async function POST(req: Request) {
  try {
    // Internal auth — prevents external abuse
    if (!verifyInternalAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting: 5 welcome emails per minute per IP
    const { success } = await checkRateLimit(req, "welcome-email");
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const { name, email } = body as { name?: string; email?: string };

    if (!email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 },
      );
    }

    // Use the shared helper (never throws)
    const result = await sendWelcomeEmail({ name, email });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Welcome email send error:", error);
    return NextResponse.json(
      { error: "Failed to send welcome email" },
      { status: 500 },
    );
  }
}
