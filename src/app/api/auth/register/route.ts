import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

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

    // Send welcome email via /api/email/welcome (best-effort, fire-and-forget).
    // Same pattern as the gift card email send in /api/orders — we don't
    // await this and we don't fail the signup if it errors. The endpoint
    // catches its own errors and returns 200 either way.
    //
    // We use an absolute URL derived from the request so this works in
    // production, preview deploys, and local dev (where the Next.js server
    // is at http://localhost:3000).
    const origin = new URL(req.url || "http://localhost:3000").origin;
    fetch(`${origin}/api/email/welcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: user.name, email: user.email }),
    }).catch(() => {
      // Swallow — best-effort. The endpoint handles its own errors.
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
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}
