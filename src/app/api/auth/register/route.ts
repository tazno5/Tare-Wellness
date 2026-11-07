import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";
import { sendWelcomeEmail } from "@/lib/welcome-email";

// POST /api/auth/register — Create a new user account.
//
// Flow:
//   1. Rate-limit the request (3 signups per minute per IP)
//   2. Validate input (name, email, password ≥ 6 chars)
//   3. Reject if email already in use (409)
//   4. Hash password with bcrypt (12 rounds)
//   5. Create user in DB
//   6. Send welcome email via Brevo (best-effort, NEVER fails the signup)
//
// The welcome email send is fully isolated from the signup flow:
//   - It calls sendWelcomeEmail() directly (no internal HTTP fetch)
//   - The helper never throws — it returns a result object
//   - Even if Brevo is down or misconfigured, signup still succeeds
//
// This is the fix for the "Failed to create account" 500 error that was
// caused by `fetch(`${origin}/api/email/welcome`)` failing with ENOTFOUND
// on Vercel (clean-dory-xyz.vercel.app wasn't resolvable from inside the
// serverless function).
export async function POST(req: Request) {
  try {
    // Rate limiting: 3 registrations per minute per IP
    const { success } = await checkRateLimit(req, "register");
    if (!success) {
      return NextResponse.json(
        { error: "Too many sign-up attempts. Please wait a moment." },
        { status: 429 },
      );
    }

    const { name, email, password } = await req.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Send welcome email (best-effort, never throws).
    // We do NOT await this in production — fire it off and let it run.
    // The helper catches its own errors internally and returns a result,
    // so even if Brevo is down, signup succeeds.
    //
    // We do await it here for two reasons:
    //   1. We want errors to be logged (the helper does console.error on failure)
    //   2. The helper never throws, so awaiting it is safe and fast (~50ms typical)
    sendWelcomeEmail({ name: user.name, email: user.email })
      .then((result) => {
        if (result.warning) {
          console.warn("[signup] Welcome email warning:", result.warning);
        }
      })
      .catch(() => {
        // Defensive — the helper should never throw, but just in case
      });

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    // TEMPORARY DIAGNOSTIC MODE — return the actual error so we can see what's failing.
    // Once we've fixed the bug, we'll revert this back to the generic message.
    const errorDetail =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : typeof error === "string"
          ? error
          : "unknown error";
    return NextResponse.json(
      {
        error: "Failed to create account",
        // Diagnostic info (safe to expose briefly while debugging):
        detail: errorDetail,
        // Stack trace only in non-production:
        ...(process.env.NODE_ENV !== "production" && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 },
    );
  }
}
