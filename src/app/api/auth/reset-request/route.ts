import { NextResponse } from "next/server";
import { BrevoClient } from "@getbrevo/brevo";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

// POST /api/auth/reset-request — Request a password reset link
//
// Flow:
//   1. User enters their email on the /login page (forgot password mode)
//   2. This endpoint receives { email }
//   3. If a user exists with that email:
//      a. Generate a random reset token (32 bytes, hex-encoded)
//      b. Store it in the VerificationToken table with a 24-hour expiry
//      c. Send an email via Brevo with a link to /reset-password?token=...
//   4. Always return success (don't leak which emails are registered — security)
//
// The reset token is stored in the existing NextAuth VerificationToken model
// (no schema migration needed). The token is single-use — /api/auth/reset
// deletes it after a successful password change.
//
// NDPA 2023: This is a legitimate use of personal data (email address) under
// contract performance (Section 27(1)(b)) — necessary to provide the
// password reset service the user requested.

const resetSchema = z.object({
  email: z.string().email().max(500),
});

let _brevo: BrevoClient | null = null;
function getBrevo(): BrevoClient | null {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;
  if (!_brevo) _brevo = new BrevoClient({ apiKey });
  return _brevo;
}

function parseSender(): { name: string; email: string } {
  const raw = process.env.EMAIL_FROM || "Tare Wellness <hello@tarewellness.com>";
  const match = raw.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (match) {
    return { name: match[1].trim() || "Tare Wellness", email: match[2].trim() };
  }
  return { name: "Tare Wellness", email: raw.trim() };
}

function getSiteUrl(): string {
  const url = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return url.replace(/\/$/, "");
}

// Generate a random reset token (32 bytes → 64-char hex string)
function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export async function POST(req: Request) {
  try {
    // Rate limiting: 3 reset requests per minute per IP
    const { success } = await checkRateLimit(req, "reset-request");
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
        { error: "A valid email address is required" },
        { status: 400 },
      );
    }

    const { email } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Look up the user — if they don't exist, silently return success
    // (don't leak which emails are registered)
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Generate reset token
      const token = generateResetToken();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Delete any existing tokens for this email (avoid accumulating)
      await db.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      });

      // Store the new token
      await db.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token,
          expires,
        },
      });

      // Send the reset email via Brevo (best-effort — don't fail the request
      // if email sending fails; the user can request again)
      const brevo = getBrevo();
      if (brevo) {
        try {
          const sender = parseSender();
          const siteUrl = getSiteUrl();
          const resetLink = `${siteUrl}/reset-password?token=${token}`;

          const htmlContent = `
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #FFF5EE; padding: 40px 20px;">
              <div style="background: white; border-radius: 24px; padding: 40px; text-align: center;">
                <h1 style="font-family: 'Fraunces', serif; color: #4E0030; font-size: 24px; margin-bottom: 16px;">
                  Reset your Tare password
                </h1>
                <p style="color: #4E0030; opacity: 0.8; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                  We received a request to reset the password for your Tare Wellness account. Click the button below to choose a new password.
                </p>
                <a href="${resetLink}" style="display: inline-block; background: #F10897; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 24px;">
                  Reset My Password
                </a>
                <p style="color: #4E0030; opacity: 0.6; font-size: 13px; line-height: 1.6; margin-top: 24px;">
                  This link expires in 24 hours. If you didn't request this, you can safely ignore this email — your password won't change.
                </p>
                <p style="color: #4E0030; opacity: 0.5; font-size: 12px; margin-top: 24px;">
                  Or paste this link into your browser:<br />
                  <span style="font-family: monospace; word-break: break-all;">${resetLink}</span>
                </p>
              </div>
              <p style="text-align: center; color: #4E0030; opacity: 0.5; font-size: 12px; margin-top: 24px;">
                &copy; 2026 Tare Wellness Enterprise Ltd. All rights reserved.
              </p>
            </div>
          `;

          await brevo.transactionalEmails.sendTransacEmail({
            sender: { name: sender.name, email: sender.email },
            to: [{ email: normalizedEmail }],
            subject: "Reset your Tare password",
            htmlContent,
            tags: ["password-reset", "transactional"],
          });
        } catch (sendError) {
          console.error("Brevo send exception (password reset):", sendError);
          // Don't fail the request — the user can try again
        }
      } else {
        // Dev mode — no Brevo configured
        if (process.env.NODE_ENV !== "production") {
          console.log("📧 [DEV] Password reset email not sent — BREVO_API_KEY not set.");
          console.log(`   To: ${normalizedEmail}`);
          console.log(`   Reset link: ${getSiteUrl()}/reset-password?token=${token}`);
        }
      }
    }

    // Always return success — don't leak whether the email exists
    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, we've sent a reset link.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
