import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { sendWelcomeEmail } from "@/lib/welcome-email";

// POST /api/email/welcome — Send welcome email to a newly-registered user.
//
// This endpoint is kept for backward compat / manual testing, but the
// /api/auth/register route now calls sendWelcomeEmail() directly
// (instead of fetching this endpoint internally) to avoid Vercel's
// internal DNS resolution issues.
//
// You can still call this endpoint manually to test welcome email sends:
//   curl -X POST https://tarewellness.com/api/email/welcome \
//     -H "Content-Type: application/json" \
//     -d '{"name":"Test","email":"test@example.com"}'

export async function POST(req: Request) {
  try {
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
