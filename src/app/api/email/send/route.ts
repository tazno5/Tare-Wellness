import { NextResponse } from "next/server";
import { BrevoClient } from "@getbrevo/brevo";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

// POST /api/email/send — Send gift card email to recipient
// Called automatically after order creation, or manually to resend
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

// HIGH #4: HTML-escape user-provided content to prevent XSS in emails.
function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  try {
    // Rate limiting: 5 email sends per minute per IP
    const { success } = await checkRateLimit(req, "email");
    if (!success) {
      return NextResponse.json(
        { error: "Too many email requests. Please wait a moment." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const { orderItemId, force } = body as { orderItemId?: string; force?: boolean };

    if (!orderItemId) {
      return NextResponse.json(
        { error: "orderItemId is required" },
        { status: 400 },
      );
    }

    // Fetch the order item with redemption code
    const orderItem = await db.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        redemption: true,
        order: true,
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: "Order item not found" },
        { status: 404 },
      );
    }

    if (!orderItem.redemption) {
      return NextResponse.json(
        { error: "No redemption code found for this order item" },
        { status: 404 },
      );
    }

    // HIGH #1: Skip if email was already successfully sent (idempotency)
    // unless force=true is passed (for manual resend from the UI)
    if (orderItem.emailSent && !force) {
      return NextResponse.json({
        success: true,
        sentTo: orderItem.recipientEmail,
        orderItemId: orderItem.id,
        emailId: null,
        message: "Email was already sent previously — skipping",
      });
    }

    // Build the email content (HIGH #4: escape all user-provided content)
    const safeBuyerName = escapeHtml(orderItem.order.buyerName);
    const safePersonalNote = escapeHtml(orderItem.personalNote);
    const emailSubject = `You've received a Tare Gift Card from ${safeBuyerName}!`;
    const emailHtml = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #FFF5EE; padding: 40px 20px;">
        <div style="background: white; border-radius: 24px; padding: 40px; text-align: center;">
          <h1 style="font-family: 'Fraunces', serif; color: #4E0030; font-size: 28px; margin-bottom: 8px;">
            You've received a Tare Gift Card!
          </h1>
          <p style="color: #4E0030; opacity: 0.7; font-size: 14px; margin-bottom: 24px;">
            A moment of care from ${safeBuyerName}
          </p>

          <div style="background: linear-gradient(135deg, #D6C7F2, #E0CBF0, #F0CFE6); border-radius: 16px; padding: 32px; margin-bottom: 24px;">
            <p style="font-family: 'Fraunces', serif; font-weight: bold; color: #4E0030; font-size: 20px; margin: 0;">
              Tare Gift Card
            </p>
            <p style="color: #4E0030; opacity: 0.7; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 4px 0 0 0;">
              ${orderItem.cardSessions} Session${orderItem.cardSessions === 1 ? "" : "s"}
            </p>
            <p style="font-size: 32px; font-weight: bold; color: #4E0030; margin: 16px 0 0 0;">
              ₦${orderItem.cardPrice.toLocaleString()}
            </p>
          </div>

          ${safePersonalNote ? `
            <div style="background: #FFF5EE; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
              <p style="font-family: 'Fraunces', serif; font-style: italic; color: #4E0030; font-size: 15px; margin: 0;">
                "${safePersonalNote}"
              </p>
            </div>
          ` : ""}

          <div style="background: #FFF5EE; border: 2px dashed #F10897; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #4E0030; opacity: 0.7; margin: 0 0 8px 0;">
              Redemption Code
            </p>
            <p style="font-family: monospace; font-size: 20px; font-weight: bold; color: #4E0030; letter-spacing: 3px; margin: 0;">
              ${orderItem.redemption.code}
            </p>
          </div>

          <a href="https://tarewellness.com/redeem" style="display: inline-block; background: #F10897; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Redeem Now
          </a>

          <p style="color: #4E0030; opacity: 0.5; font-size: 11px; margin-top: 24px;">
            No expiration date · Redeemable anytime
          </p>
        </div>

        <p style="text-align: center; color: #4E0030; opacity: 0.5; font-size: 12px; margin-top: 24px;">
          © 2026 Tare Wellness Enterprise Ltd. All rights reserved.
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
          to: [{ email: orderItem.recipientEmail }],
          subject: emailSubject,
          htmlContent: emailHtml,
          tags: ["gift-card", "transactional"],
        });

        // HIGH #1: Mark email as sent in the DB (for retry tracking)
        await db.orderItem.update({
          where: { id: orderItem.id },
          data: {
            emailSent: true,
            emailSentAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          sentTo: orderItem.recipientEmail,
          orderItemId: orderItem.id,
          emailId: response?.messageId ?? null,
          message: "Email sent via Brevo",
        });
      } catch (sendError) {
        console.error("Brevo send exception:", sendError);
        // Don't mark emailSent = true — the retry cron can pick it up.
        return NextResponse.json({
          success: true,
          sentTo: orderItem.recipientEmail,
          orderItemId: orderItem.id,
          emailId: null,
          warning:
            "Failed to send email — recipient can still redeem via the code on this page.",
          message: "Email send failed (best-effort)",
        });
      }
    }

    // Dev fallback — no BREVO_API_KEY configured. Log to console.
    if (process.env.NODE_ENV !== "production") {
      console.log("📧 [DEV] Email not sent — BREVO_API_KEY not set.");
      console.log(`   To: ${orderItem.recipientEmail}`);
      console.log(`   Subject: ${emailSubject}`);
      console.log(`   Redemption code: ${orderItem.redemption.code}`);
    }

    return NextResponse.json({
      success: true,
      sentTo: orderItem.recipientEmail,
      orderItemId: orderItem.id,
      emailId: null,
      message: "Email logged to console (no provider configured)",
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
