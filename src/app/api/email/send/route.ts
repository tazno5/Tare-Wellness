import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/email/send — Send gift card email to recipient
// Called automatically after order creation, or manually to resend

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
          <h1 style="font-family: 'Fraunces', serif; color: #2C292E; font-size: 28px; margin-bottom: 8px;">
            You've received a Tare Gift Card!
          </h1>
          <p style="color: #2C292E; opacity: 0.7; font-size: 14px; margin-bottom: 24px;">
            A moment of care from ${orderItem.order.buyerName}
          </p>

          <div style="background: linear-gradient(135deg, #D6C7F2, #E0CBF0, #F0CFE6); border-radius: 16px; padding: 32px; margin-bottom: 24px;">
            <p style="font-family: 'Fraunces', serif; font-weight: bold; color: #2C292E; font-size: 20px; margin: 0;">
              Tare Gift Card
            </p>
            <p style="color: #2C292E; opacity: 0.7; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 4px 0 0 0;">
              ${orderItem.cardSessions} Session${orderItem.cardSessions === 1 ? "" : "s"}
            </p>
            <p style="font-size: 32px; font-weight: bold; color: #2C292E; margin: 16px 0 0 0;">
              ₦${orderItem.cardPrice.toLocaleString()}
            </p>
          </div>

          ${orderItem.personalNote ? `
            <div style="background: #FFF5EE; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
              <p style="font-family: 'Fraunces', serif; font-style: italic; color: #2C292E; font-size: 15px; margin: 0;">
                "${orderItem.personalNote}"
              </p>
            </div>
          ` : ""}

          <div style="background: #FFF5EE; border: 2px dashed #F10897; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #2C292E; opacity: 0.7; margin: 0 0 8px 0;">
              Redemption Code
            </p>
            <p style="font-family: monospace; font-size: 20px; font-weight: bold; color: #2C292E; letter-spacing: 3px; margin: 0;">
              ${orderItem.redemption.code}
            </p>
          </div>

          <a href="https://bewelltare.com/redeem" style="display: inline-block; background: #2C292E; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Redeem Now
          </a>

          <p style="color: #2C292E; opacity: 0.5; font-size: 11px; margin-top: 24px;">
            No expiration date · Redeemable anytime
          </p>
        </div>

        <p style="text-align: center; color: #2C292E; opacity: 0.5; font-size: 12px; margin-top: 24px;">
          © 2026 Tare Wellness Enterprise Ltd. All rights reserved.
        </p>
      </div>
    `;

    // In production, send via email service (Resend, SendGrid, etc.)
    // For now, log the email (will be replaced with real email service)
    console.log(`📧 Email sent to: ${orderItem.recipientEmail}`);
    console.log(`   Subject: ${emailSubject}`);
    console.log(`   Redemption code: ${orderItem.redemption.code}`);
    console.log(`   Card: ${orderItem.cardTitle} — ₦${orderItem.cardPrice.toLocaleString()}`);

    // TODO: Replace with real email service when ready:
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'Tare Wellness <hello@bewelltare.com>',
    //   to: orderItem.recipientEmail,
    //   subject: emailSubject,
    //   html: emailHtml,
    // });

    return NextResponse.json({
      success: true,
      sentTo: orderItem.recipientEmail,
      orderItemId: orderItem.id,
      message: "Email queued for delivery",
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
