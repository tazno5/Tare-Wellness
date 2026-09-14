import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

// POST /api/auth/reset — Complete a password reset
//
// Flow:
//   1. User clicks the reset link in their email → goes to /reset-password?token=...
//   2. /reset-password page shows a "new password" form
//   3. On submit, POSTs { token, password } here
//   4. We look up the VerificationToken by `token`
//   5. If found + not expired:
//      a. Find the user by identifier (email)
//      b. Hash the new password (bcrypt, 12 rounds)
//      c. Update user.password
//      d. Delete the VerificationToken (single-use)
//      e. Return success
//   6. If not found or expired: return error

const resetSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(6).max(200),
});

export async function POST(req: Request) {
  try {
    // Rate limiting: 5 resets per minute per IP
    const { success } = await checkRateLimit(req, "reset-password");
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parseResult = resetSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { token, password } = parseResult.data;

    // Look up the reset token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 },
      );
    }

    // Check if the token has expired
    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await db.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Find the user by the token's identifier (email)
    const userEmail = verificationToken.identifier;
    const user = await db.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      // Edge case: user was deleted after the reset was requested
      await db.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { error: "Account not found. Please contact support." },
        { status: 404 },
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the user's password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the reset token (single-use)
    await db.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json({
      success: true,
      message: "Your password has been reset. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again or contact support." },
      { status: 500 },
    );
  }
}
