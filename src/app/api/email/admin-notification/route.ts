import { NextResponse } from "next/server";
import { BrevoClient } from "@getbrevo/brevo";
import { z } from "zod";

// POST /api/email/admin-notification — Send a notification email to the admin
// when a new pending order is created (bank transfer flow).
//
// Called automatically by /api/orders after creating a pending order.
// Fire-and-forget — doesn't fail the order if the email fails to send.
//
// The email goes to ADMIN_EMAIL env var (falls back to EMAIL_FROM address).
// If neither is set, the email is logged to console (dev fallback).

const schema = z.object({
  orderNumber: z.string(),
  buyerName: z.string(),
  buyerEmail: z.string(),
  totalAmount: z.number(),
  paymentMethod: z.string(),
  recipientCount: z.number(),
  recipientNames: z.array(z.string()),
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
  if (match) return { name: match[1].trim() || "Tare Wellness", email: match[2].trim() };
  return { name: "Tare Wellness", email: raw.trim() };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { orderNumber, buyerName, buyerEmail, totalAmount, paymentMethod, recipientCount, recipientNames } = parsed.data;
    // The DB stores amounts in Naira (not kobo) — totalAmount 39000 = ₦39,000.
  // Don't divide by 100.
  const amountNaira = totalAmount.toLocaleString();

    const adminRaw = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || "hello@tarewellness.com";
    const adminEmail = adminRaw.match(/<([^>]+)>/)?.[1] || adminRaw;

    const subject = `New Order ${orderNumber} - ${paymentMethod === "transfer" ? "Bank Transfer" : "Payment"} - \u20a6${amountNaira}`;
    const siteUrl = process.env.NEXTAUTH_URL || "https://www.tarewellness.com";

    // Email-safe HTML template: use a <table> instead of flexbox.
    // Flexbox does not render in Gmail, Outlook, and most mobile email
    // clients — the label and value get concatenated with zero spacing,
    // producing "AmountNGN 98,000" instead of "Amount:  ₦98,000".
    // A table with two <td> cells per row + padding gives reliable spacing
    // in every email client, plus we add a colon + non-breaking space
    // after each label so the separation is explicit even if the CSS
    // is stripped.
    //
    // Currency: use the Nigerian Naira sign (\u20a6) instead of "NGN" —
    // more professional + matches the admin dashboard's formatPrice().
    const paymentLabel = paymentMethod === "transfer" ? "Bank Transfer" : "Card";
    const paymentStatus = paymentMethod === "transfer" ? "AWAITING CONFIRMATION" : "Completed";
    const paymentColor = paymentMethod === "transfer" ? "#cc6600" : "#2d6e4f";

    const htmlContent = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #FFF5EE; padding: 40px 20px;">
        <div style="background: white; border-radius: 24px; padding: 40px;">
          <p style="font-family: 'Fraunces', serif; font-size: 13px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; color: #F10897; margin: 0 0 16px 0;">
            TARE - NEW ORDER
          </p>
          <h1 style="font-family: 'Fraunces', serif; color: #4E0030; font-size: 24px; margin: 0 0 24px 0;">
            Order ${orderNumber}
          </h1>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #FFF5EE; border-radius: 16px; margin-bottom: 20px;">
            <tbody>
              <tr>
                <td style="padding: 12px 20px; border-bottom: 1px solid rgba(78, 0, 48, 0.08);">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tbody>
                      <tr>
                        <td style="vertical-align: top; color: #4E0030; opacity: 0.6; font-size: 12px; font-weight: 600; padding-right: 16px; white-space: nowrap;">
                          Amount:&nbsp;
                        </td>
                        <td style="vertical-align: top; color: #4E0030; font-size: 16px; font-weight: bold; text-align: right;">
                          \u20a6${amountNaira}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 20px; border-bottom: 1px solid rgba(78, 0, 48, 0.08);">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tbody>
                      <tr>
                        <td style="vertical-align: top; color: #4E0030; opacity: 0.6; font-size: 12px; font-weight: 600; padding-right: 16px; white-space: nowrap;">
                          Buyer:&nbsp;
                        </td>
                        <td style="vertical-align: top; color: #4E0030; font-size: 14px; font-weight: bold; text-align: right;">
                          ${buyerName} &lt;${buyerEmail}&gt;
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 20px; border-bottom: 1px solid rgba(78, 0, 48, 0.08);">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tbody>
                      <tr>
                        <td style="vertical-align: top; color: #4E0030; opacity: 0.6; font-size: 12px; font-weight: 600; padding-right: 16px; white-space: nowrap;">
                          Payment:&nbsp;
                        </td>
                        <td style="vertical-align: top; color: ${paymentColor}; font-size: 14px; font-weight: bold; text-align: right;">
                          ${paymentLabel} &mdash; ${paymentStatus}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 20px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tbody>
                      <tr>
                        <td style="vertical-align: top; color: #4E0030; opacity: 0.6; font-size: 12px; font-weight: 600; padding-right: 16px; white-space: nowrap;">
                          Recipients:&nbsp;
                        </td>
                        <td style="vertical-align: top; color: #4E0030; font-size: 14px; font-weight: bold; text-align: right;">
                          ${recipientCount} (${recipientNames.join(", ")})
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
          ${paymentMethod === "transfer" ? `
            <div style="background: #FFE0C2; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #cc6600; font-size: 14px; font-weight: bold; margin: 0;">ACTION REQUIRED</p>
              <p style="color: #4E0030; opacity: 0.8; font-size: 13px; margin: 8px 0 0 0; line-height: 1.6;">
                Check your bank account for a transfer with narration <strong>${orderNumber}</strong>. Once confirmed, go to your <a href="${siteUrl}/admin" style="color: #F10897; font-weight: bold;">admin dashboard</a> &mdash; Orders tab &mdash; click "Confirm Transfer Received".
              </p>
            </div>
          ` : ""}
          <a href="${siteUrl}/admin" style="display: inline-block; background: #F10897; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Go to Admin Dashboard
          </a>
        </div>
        <p style="text-align: center; color: #4E0030; opacity: 0.5; font-size: 12px; margin-top: 24px;">
          &copy; 2026 Tare Wellness Enterprise Ltd. All rights reserved.
        </p>
      </div>
    `;

    const brevo = getBrevo();
    if (brevo) {
      try {
        const sender = parseSender();
        await brevo.transactionalEmails.sendTransacEmail({
          sender: { name: "Tare Admin Alerts", email: sender.email },
          to: [{ email: adminEmail }],
          subject,
          htmlContent,
          tags: ["admin-notification", "new-order"],
        });
        return NextResponse.json({ success: true, sentTo: adminEmail });
      } catch (sendError) {
        console.error("Brevo admin notification error:", sendError);
        return NextResponse.json({ success: true, warning: "Email send failed (best-effort)" });
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[DEV] Admin notification not sent - BREVO_API_KEY not set.");
      console.log(`   New order: ${orderNumber} - \u20a6${amountNaira} - ${paymentMethod}`);
    }

    return NextResponse.json({ success: true, message: "Logged to console (no provider)" });
  } catch (error) {
    console.error("Admin notification error:", error);
    return NextResponse.json({ success: true, warning: "Notification failed (best-effort)" });
  }
}
