import { NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";

// POST /api/email/send — Send gift card email to recipient
// Called automatically after order creation, or manually to resend
//
// Email provider: Resend (https://resend.com)
// Requires RESEND_API_KEY in env. If not set, falls back to console.log
// so the app still works in dev without a real email provider.

// Lazily instantiate the Resend client so we don't crash on import
// when RESEND_API_KEY is missing (dev environments).
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

// Sender email — must be a verified domain in your Resend account.
// Override via env if you want to use a different sender.
const FROM_EMAIL =
  process.env.EMAIL_FROM || "Tare Wellness <hello@bewelltare.com>";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderItemId } = body as { orderItemId?: string };

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

    // Build the email content
    const emailSubject = `You've received a Tare Gift Card from ${orderItem.order.buyerName}!`;
    const emailHtml = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #FFF5EE; padding: 40px 20px;">
        <div style="background: white; border-radius: 24px; padding: 40px; text-align: center;">
          <h1 style="font-family: 'Fraunces', serif; color: #4E0030; font-size: 28px; margin-bottom: 8px;">
            You've received a Tare Gift Card!
          </h1>
          <p style="color: #4E0030; opacity: 0.7; font-size: 14px; margin-bottom: 24px;">
            A moment of care from ${orderItem.order.buyerName}
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

          ${orderItem.personalNote ? `
            <div style="background: #FFF5EE; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
              <p style="font-family: 'Fraunces', serif; font-style: italic; color: #4E0030; font-size: 15px; margin: 0;">
                "${orderItem.personalNote}"
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

          <a href="https://bewelltare.com/redeem" style="display: inline-block; background: #F10897; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px;">
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

    // Send via Resend if API key is configured, otherwise log to console
    // (so dev environments without RESEND_API_KEY still work).
    const resend = getResend();

    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: orderItem.recipientEmail,
          subject: emailSubject,
          html: emailHtml,
        });

        if (error) {
          console.error("Resend API error:", error);
          // Don't fail the order — email is best-effort. Return success
          // with a warning so the client can show the redemption code
          // even if the email didn't go through.
          return NextResponse.json({
            success: true,
            sentTo: orderItem.recipientEmail,
            orderItemId: orderItem.id,
            emailId: null,
            warning: "Email provider returned an error — recipient can still redeem via the code on this page.",
            message: "Email queued for delivery (with warnings)",
          });
        }

        return NextResponse.json({
          success: true,
          sentTo: orderItem.recipientEmail,
          orderItemId: orderItem.id,
          emailId: data?.id ?? null,
          message: "Email queued for delivery",
        });
      } catch (sendError) {
        console.error("Resend send exception:", sendError);
        return NextResponse.json({
          success: true,
          sentTo: orderItem.recipientEmail,
          orderItemId: orderItem.id,
          emailId: null,
          warning: "Failed to send email — recipient can still redeem via the code on this page.",
          message: "Email send failed (best-effort)",
        });
      }
    }

    // Dev fallback — no RESEND_API_KEY configured. Log to console so
    // developers can see the email content during local testing.
    if (process.env.NODE_ENV !== "production") {
      console.log("📧 [DEV] Email not sent — RESEND_API_KEY not set.");
      console.log(`   To: ${orderItem.recipientEmail}`);
      console.log(`   Subject: ${emailSubject}`);
      console.log(`   Redemption code: ${orderItem.redemption.code}`);
      console.log(`   Card: ${orderItem.cardTitle} — ₦${orderItem.cardPrice.toLocaleString()}`);
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
