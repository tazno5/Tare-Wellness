import { NextResponse } from "next/server";
import { BrevoClient } from "@getbrevo/brevo";
import { checkRateLimit } from "@/lib/ratelimit";

// POST /api/email/welcome — Send welcome email to a newly-registered user.
// Called automatically after /api/auth/register creates the user.
//
// Email provider: Brevo (https://brevo.com)
// Requires BREVO_API_KEY in env. If not set, falls back to console.log
// so the app still works in dev without a real email provider.
//
// Sender email must be a verified sender in your Brevo account
// (https://app.brevo.com/settings/senders). Configure via EMAIL_FROM env
// var — format: "Display Name <email@domain.com>".

// Lazily instantiate the Brevo client so we don't crash on import
// when BREVO_API_KEY is missing (dev environments).
let _brevo: BrevoClient | null = null;
function getBrevo(): BrevoClient | null {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;
  if (!_brevo) _brevo = new BrevoClient({ apiKey });
  return _brevo;
}

// Parse "Display Name <email@domain.com>" format from EMAIL_FROM env var.
// Falls back to safe defaults if not set or malformed.
function parseSender(): { name: string; email: string } {
  const raw = process.env.EMAIL_FROM || "Tare Wellness <hello@tarewellness.com>";
  const match = raw.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (match) {
    return { name: match[1].trim() || "Tare Wellness", email: match[2].trim() };
  }
  return { name: "Tare Wellness", email: raw.trim() };
}

// HTML-escape user-provided content to prevent XSS in emails.
function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Build the public site URL from NEXTAUTH_URL (so links in the email point at
// the same origin users signed up on — prod, preview, or dev).
function getSiteUrl(): string {
  const url = process.env.NEXTAUTH_URL || "http://localhost:3000";
  // Strip trailing slash for clean concatenation
  return url.replace(/\/$/, "");
}

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

    const safeName = escapeHtml(name || email.split("@")[0]);
    const siteUrl = getSiteUrl();
    const subject = `Welcome to Tare, ${name || email.split("@")[0]}! 🌱`;
    const emailHtml = `
      <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #FFF5EE; padding: 40px 20px;">
        <div style="background: white; border-radius: 24px; padding: 40px; text-align: center;">
          <p style="font-family: 'Fraunces', Georgia, serif; font-size: 13px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; color: #F10897; margin: 0 0 16px 0;">
            TARE · BE WELL
          </p>
          <h1 style="font-family: 'Fraunces', Georgia, serif; color: #4E0030; font-size: 32px; margin: 0 0 12px 0; line-height: 1.15;">
            Welcome, ${safeName}.
          </h1>
          <p style="color: #4E0030; opacity: 0.8; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
            We're so glad you're here. Tare is a small way to share rest with the people you love — a gift card for a real wellness session, on their pace, not yours.
          </p>

          <div style="background: linear-gradient(135deg, #D6C7F2, #E0CBF0, #F0CFE6); border-radius: 20px; padding: 28px 24px; margin-bottom: 28px;">
            <p style="font-family: 'Fraunces', Georgia, serif; font-weight: bold; color: #4E0030; font-size: 18px; margin: 0 0 16px 0;">
              Here's what you can do now:
            </p>
            <p style="color: #4E0030; font-size: 14px; line-height: 1.7; margin: 0 0 10px 0; text-align: left;">
              <strong style="color: #F10897;">&bull;</strong> &nbsp;<strong>Send a gift card</strong> — choose 1, 2, or 3 sessions, add a personal note, and we'll deliver it instantly or on a date you pick.
            </p>
            <p style="color: #4E0030; font-size: 14px; line-height: 1.7; margin: 0 0 10px 0; text-align: left;">
              <strong style="color: #F10897;">&bull;</strong> &nbsp;<strong>Redeem a gift</strong> — if someone sent you a Tare gift card, enter your code to unlock your session credit.
            </p>
            <p style="color: #4E0030; font-size: 14px; line-height: 1.7; margin: 0; text-align: left;">
              <strong style="color: #F10897;">&bull;</strong> &nbsp;<strong>Book a session</strong> — pick a date and time that works for you, and we'll match you with a provider.
            </p>
          </div>

          <a href="${siteUrl}/gift-cards" style="display: inline-block; background: #F10897; color: white; padding: 16px 36px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 14px;">
            Send a Gift Card
          </a>
          <br />
          <a href="${siteUrl}/redeem" style="display: inline-block; background: white; color: #F10897; border: 1px solid #F10897; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 8px;">
            I Received a Gift
          </a>

          <p style="color: #4E0030; opacity: 0.6; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
            A real person is on the other side of this email — if you ever have a question, just reply.
          </p>
        </div>

        <p style="text-align: center; color: #4E0030; opacity: 0.5; font-size: 11px; margin-top: 24px;">
          &copy; 2026 Tare Wellness Enterprise Ltd. All rights reserved.<br />
          You received this email because you signed up at ${siteUrl}.
        </p>
      </div>
    `;

    // Send via Brevo if API key is configured, otherwise log to console
    const brevo = getBrevo();

    if (brevo) {
      try {
        const sender = parseSender();
        const response = await brevo.transactionalEmails.sendTransacEmail({
          sender: { name: sender.name, email: sender.email },
          to: [{ email }],
          subject,
          htmlContent: emailHtml,
          tags: ["welcome", "transactional"],
        });

        return NextResponse.json({
          success: true,
          sentTo: email,
          emailId: response?.messageId ?? null,
          message: "Welcome email sent via Brevo",
        });
      } catch (sendError) {
        console.error("Brevo send exception (welcome email):", sendError);
        // Best-effort: don't fail the signup if the welcome email fails
        return NextResponse.json({
          success: true,
          sentTo: email,
          emailId: null,
          warning: "Failed to send welcome email — signup still succeeded.",
          message: "Welcome email send failed (best-effort)",
        });
      }
    }

    // Dev fallback — no BREVO_API_KEY configured. Log to console.
    if (process.env.NODE_ENV !== "production") {
      console.log("📧 [DEV] Welcome email not sent — BREVO_API_KEY not set.");
      console.log(`   To: ${email}`);
      console.log(`   Subject: ${subject}`);
    }

    return NextResponse.json({
      success: true,
      sentTo: email,
      emailId: null,
      message: "Welcome email logged to console (no provider configured)",
    });
  } catch (error) {
    console.error("Welcome email send error:", error);
    return NextResponse.json(
      { error: "Failed to send welcome email" },
      { status: 500 },
    );
  }
}
