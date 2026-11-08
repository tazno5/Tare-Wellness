import { BrevoClient } from "@getbrevo/brevo";

// sendWelcomeEmail — sends a welcome email to a newly-registered user via Brevo.
//
// This is a SHARED helper used by both:
//   - /api/auth/register (inlined directly — register must not fail if this fails)
//   - /api/email/welcome (kept for backward compat / testing)
//
// IMPORTANT: This function NEVER throws. It always returns a result object.
// The signup flow depends on this — a welcome email failure must NOT prevent
// a user from being able to log in.
//
// Why this exists as a separate helper (instead of just using the
// /api/email/welcome endpoint via fetch): on Vercel, calling fetch() to your
// own internal API endpoint can fail with `ENOTFOUND` if the runtime can't
// resolve the deployment URL (e.g., clean-dory-xyz.vercel.app). Inlining the
// send logic here avoids that network roundtrip entirely.

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

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getSiteUrl(): string {
  const url = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export type SendWelcomeEmailResult = {
  success: boolean;
  sentTo: string;
  emailId: string | null;
  warning?: string;
  message: string;
};

export async function sendWelcomeEmail(params: {
  name?: string;
  email: string;
}): Promise<SendWelcomeEmailResult> {
  const { name, email } = params;

  if (!email) {
    return {
      success: false,
      sentTo: "",
      emailId: null,
      message: "sendWelcomeEmail: email is required",
    };
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

      return {
        success: true,
        sentTo: email,
        emailId: response?.messageId ?? null,
        message: "Welcome email sent via Brevo",
      };
    } catch (sendError) {
      // Best-effort: log the error but don't throw — signup must still succeed
      console.error("Brevo send exception (welcome email):", sendError);
      return {
        success: true, // signup still succeeds
        sentTo: email,
        emailId: null,
        warning: "Failed to send welcome email — signup still succeeded.",
        message: "Welcome email send failed (best-effort)",
      };
    }
  }

  // Dev fallback — no BREVO_API_KEY configured. Log to console.
  // Log in BOTH dev and production so Vercel Runtime Logs show the issue.
  console.warn(
    "📧 Welcome email NOT sent — BREVO_API_KEY is not set.",
    `   To: ${email}`,
    `   Subject: ${subject}`,
  );

  return {
    success: true,
    sentTo: email,
    emailId: null,
    warning: "BREVO_API_KEY not set — email was not sent. Set BREVO_API_KEY in your Vercel environment variables.",
    message: "Welcome email not sent (no email provider configured)",
  };
}
