import { NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/internal-auth";

// GET /api/email/diagnose — Diagnostic endpoint for email configuration.
// Checks whether the critical email env vars are set and returns a report.
// Requires internal auth (same as other email endpoints) to prevent
// leaking configuration details to the public.
//
// Usage from the server (e.g. via curl with the INTERNAL_API_SECRET):
//   curl -H "Authorization: Bearer <INTERNAL_API_SECRET>" \
//     https://tarewellness.com/api/email/diagnose
//
// Or from the browser (will get 401 unless INTERNAL_API_SECRET is not set
// and the request doesn't have a browser User-Agent).

export async function GET(req: Request) {
  // Auth check — same as other email endpoints
  if (!verifyInternalAuth(req)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    config: {
      BREVO_API_KEY: process.env.BREVO_API_KEY
        ? `✅ Set (${process.env.BREVO_API_KEY.slice(0, 6)}...${process.env.BREVO_API_KEY.slice(-4)})`
        : "❌ NOT SET — emails will not be sent. Add BREVO_API_KEY to Vercel env vars.",
      EMAIL_FROM: process.env.EMAIL_FROM
        ? `✅ Set (${process.env.EMAIL_FROM})`
        : "⚠️ Not set — using fallback 'Tare Wellness <hello@tarewellness.com>'. Make sure this address is a verified sender in Brevo.",
      INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET
        ? "✅ Set (internal email routes are protected)"
        : "⚠️ Not set — email routes use User-Agent fallback auth. Set INTERNAL_API_SECRET for proper security.",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL
        ? `✅ Set (${process.env.NEXTAUTH_URL})`
        : "⚠️ Not set — internal fetch may fail. Set NEXTAUTH_URL to your production domain.",
      VERCEL_URL: process.env.VERCEL_URL
        ? `✅ Set (${process.env.VERCEL_URL})`
        : "⚠️ Not set (expected in local dev)",
    },
    emailRoutes: {
      welcome: "POST /api/email/welcome — sends welcome email on signup (calls Brevo directly via sendWelcomeEmail helper)",
      send: "POST /api/email/send — sends gift card email to recipient (called via internalFetch from /api/orders)",
      adminNotification: "POST /api/email/admin-notification — sends admin notification on new order",
      bankTransferInstructions: "POST /api/email/bank-transfer-instructions — sends bank details to buyer",
      bookingConfirmation: "POST /api/email/booking-confirmation — sends booking confirmation email",
    },
    howEmailsAreSent: {
      signupWelcome: "Called directly from /api/auth/register → sendWelcomeEmail() → Brevo SDK (no internal fetch)",
      giftCardDelivery: "Called from /api/orders → internalFetch('/api/email/send') → Brevo SDK",
      adminNotification: "Called from /api/orders → internalFetch('/api/email/admin-notification') → Brevo SDK",
      bankTransfer: "Called from /api/orders → internalFetch('/api/email/bank-transfer-instructions') → Brevo SDK",
    },
    troubleshooting: [
      "If no emails are being sent, check BREVO_API_KEY first — it's the most common cause.",
      "If BREVO_API_KEY is set but emails still don't arrive, verify the sender email in Brevo: https://app.brevo.com/settings/senders",
      "If internal fetch is failing, check NEXTAUTH_URL — it should be your production domain (e.g. https://tarewellness.com)",
      "Vercel Runtime Logs will now show specific errors when email sends fail (previously they were silently swallowed).",
    ],
  };

  return NextResponse.json(report, { status: 200 });
}
