import { NextResponse } from "next/server";
import { BrevoClient } from "@getbrevo/brevo";
import { z } from "zod";
import { db } from "@/lib/db";

// POST /api/email/bank-transfer-instructions — Send bank transfer details
// to the buyer after they click "I've Made the Transfer"
//
// This email contains:
//   - The order number (TARE-XXXXXXXX) — used as transfer narration
//   - The total amount due
//   - The bank details (bank name, account name, account number)
//   - A link to the order confirmation page
//
// The buyer receives this email so they have a permanent record of the
// bank details + order reference, even if they close the browser tab.

const schema = z.object({
  orderNumber: z.string(),
  buyerName: z.string(),
  buyerEmail: z.string().email(),
  totalAmount: z.number(),
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

function getSiteUrl(): string {
  return (process.env.NEXTAUTH_URL || "https://www.tarewellness.com").replace(/\/$/, "");
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

export async function POST(req: Request) {
  try {
    if (!verifyInternalAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { orderNumber, buyerName, buyerEmail, totalAmount } = parsed.data;
    const amountNaira = totalAmount.toLocaleString();
    const safeBuyerName = escapeHtml(buyerName);
    const siteUrl = getSiteUrl();

    // Fetch bank details from SiteSetting (same as checkout page).
    // Wrapped in try-catch — if the Prisma client on Vercel doesn't
    // have the SiteSetting model yet (not regenerated after db push),
    // fall back to default values so the email still sends.
    let bankName = "Tare Bank";
    let accountName = "Tare Wellness";
    let accountNumber = "0000000000";
    try {
    if (!verifyInternalAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
      const settings = await db.siteSetting.findMany({
        where: { key: { in: ["bankName", "accountName", "accountNumber"] } },
      });
      bankName = settings.find((s) => s.key === "bankName")?.value || bankName;
      accountName = settings.find((s) => s.key === "accountName")?.value || accountName;
      accountNumber = settings.find((s) => s.key === "accountNumber")?.value || accountNumber;
    } catch (dbError) {
      console.error("SiteSetting fetch failed (using defaults):", dbError);
    }

    const subject = `Bank Transfer Instructions - Order ${orderNumber} - \u20a6${amountNaira}`;
    const htmlContent = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #FFF5EE; padding: 40px 20px;">
        <div style="background: #4E0030; border-radius: 24px 24px 0 0; padding: 32px; text-align: center;">
          <p style="font-family: 'Fraunces', serif; font-size: 13px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; color: #F10897; margin: 0;">
            TARE - BANK TRANSFER
          </p>
          <h1 style="font-family: 'Fraunces', serif; color: white; font-size: 22px; margin: 12px 0 0 0;">
            Complete your payment, ${safeBuyerName}
          </h1>
        </div>
        <div style="background: white; border-radius: 0 0 24px 24px; padding: 32px;">
          <p style="color: #4E0030; opacity: 0.8; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
            Thank you for your order! To complete your purchase, please make a bank transfer for the amount below using your order reference as the narration. Your gift card will be sent the moment we confirm your transfer.
          </p>
          <div style="background: #FFF5EE; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
            <p style="color: #4E0030; opacity: 0.6; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px 0;">Amount Due</p>
            <p style="color: #4E0030; font-size: 28px; font-weight: bold; margin: 0;">\u20a6${amountNaira}</p>
          </div>
          <div style="background: #FFF5EE; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
            <p style="color: #4E0030; opacity: 0.6; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px 0;">Bank Details</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tbody>
                <tr>
                  <td style="padding: 6px 0; border-bottom: 1px solid rgba(78, 0, 48, 0.06);">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tbody>
                        <tr>
                          <td style="vertical-align: top; color: #4E0030; opacity: 0.6; font-size: 14px; font-weight: 600; padding-right: 16px; white-space: nowrap;">Bank:&nbsp;</td>
                          <td style="vertical-align: top; color: #4E0030; font-size: 14px; font-weight: bold; text-align: right;">${escapeHtml(bankName)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; border-bottom: 1px solid rgba(78, 0, 48, 0.06);">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tbody>
                        <tr>
                          <td style="vertical-align: top; color: #4E0030; opacity: 0.6; font-size: 14px; font-weight: 600; padding-right: 16px; white-space: nowrap;">Account Name:&nbsp;</td>
                          <td style="vertical-align: top; color: #4E0030; font-size: 14px; font-weight: bold; text-align: right;">${escapeHtml(accountName)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tbody>
                        <tr>
                          <td style="vertical-align: top; color: #4E0030; opacity: 0.6; font-size: 14px; font-weight: 600; padding-right: 16px; white-space: nowrap;">Account Number:&nbsp;</td>
                          <td style="vertical-align: top; color: #4E0030; font-size: 14px; font-weight: bold; text-align: right; font-family: monospace;">${escapeHtml(accountNumber)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="background: #FCE4EC; border: 2px dashed #F10897; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #4E0030; opacity: 0.7; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Use as Transfer Narration / Memo</p>
            <p style="color: #4E0030; font-size: 18px; font-weight: bold; font-family: monospace; margin: 0; letter-spacing: 2px;">${orderNumber}</p>
            <p style="color: #4E0030; opacity: 0.6; font-size: 12px; margin: 8px 0 0 0; line-height: 1.5;">
              Use this reference as the narration on your bank transfer so we can match your payment to your order.
            </p>
          </div>
          <a href="${siteUrl}/order-confirmation?orderNumber=${orderNumber}&method=transfer" style="display: inline-block; background: #F10897; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 16px;">
            View Your Order
          </a>
          <p style="color: #4E0030; opacity: 0.6; font-size: 12px; margin: 16px 0 0 0; line-height: 1.5;">
            Once we confirm your transfer (usually within 1 business hour), your gift card emails will be sent to your recipients automatically. No transfer fee from your bank.
          </p>
        </div>
        <p style="text-align: center; color: #4E0030; opacity: 0.5; font-size: 12px; margin-top: 24px;">
          &copy; 2026 Tare Wellness Enterprise Ltd. All rights reserved.
        </p>
      </div>
    `;

    const brevo = getBrevo();
    if (brevo) {
      try {
    if (!verifyInternalAuth(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
        const sender = parseSender();
        await brevo.transactionalEmails.sendTransacEmail({
          sender: { name: sender.name, email: sender.email },
          to: [{ email: buyerEmail }],
          subject,
          htmlContent,
          tags: ["bank-transfer-instructions", "transactional"],
        });
        return NextResponse.json({ success: true, sentTo: buyerEmail });
      } catch (sendError) {
        console.error("Brevo bank transfer email error:", sendError);
        return NextResponse.json({ success: true, warning: "Email send failed (best-effort)" });
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[DEV] Bank transfer instructions email not sent - BREVO_API_KEY not set.");
      console.log(`   To: ${buyerEmail} | Order: ${orderNumber} | Amount: \u20a6${amountNaira}`);
    }

    return NextResponse.json({ success: true, message: "Logged to console (no provider)" });
  } catch (error) {
    console.error("Bank transfer instructions email error:", error);
    return NextResponse.json({ success: true, warning: "Email failed (best-effort)" });
  }
}
