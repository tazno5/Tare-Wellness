import { BrevoClient } from "@getbrevo/brevo";
import { db } from "@/lib/db";

// Shared Brevo client + helpers — used by all email-sending functions.
// This avoids the internalFetch redirect issue entirely by calling
// Brevo's API directly from the same serverless function that creates
// the order/booking — no HTTP roundtrip to self, no redirect, no auth.

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

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function getSiteUrl(): string {
  return (process.env.NEXTAUTH_URL || "https://www.tarewellness.com").replace(/\/$/, "");
}

// ============ ADMIN NOTIFICATION EMAIL ============
// Called directly from /api/orders after creating an order.
// Never throws — returns a result object.

export async function sendAdminNotificationEmail(params: {
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  totalAmount: number;
  paymentMethod: string;
  recipientCount: number;
  recipientNames: string[];
}): Promise<{ success: boolean; message: string }> {
  try {
    const { orderNumber, buyerName, buyerEmail, totalAmount, paymentMethod, recipientCount, recipientNames } = params;
    const amountNaira = totalAmount.toLocaleString();
    const adminRaw = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || "hello@tarewellness.com";
    const adminEmail = adminRaw.match(/<([^>]+)>/)?.[1] || adminRaw;
    const siteUrl = getSiteUrl();

    const subject = `New Order ${orderNumber} - ${paymentMethod === "transfer" ? "Bank Transfer" : "Payment"} - ₦${amountNaira}`;
    const paymentLabel = paymentMethod === "transfer" ? "Bank Transfer" : "Card";
    const paymentStatus = paymentMethod === "transfer" ? "AWAITING CONFIRMATION" : "Completed";
    const paymentColor = paymentMethod === "transfer" ? "#cc6600" : "#2d6e4f";

    const html = `
      <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #FFF5EE; padding: 20px;">
        <div style="background: white; border-radius: 24px; padding: 32px;">
          <p style="font-size: 13px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; color: #F10897; margin: 0 0 16px 0;">TARE · ADMIN NOTIFICATION</p>
          <h1 style="font-family: 'Fraunces', Georgia, serif; color: #4E0030; font-size: 24px; margin: 0 0 20px 0;">New Order: ${escapeHtml(orderNumber)}</h1>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #4E0030;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 40%;">Buyer Name:</td><td style="padding: 8px 0;">${escapeHtml(buyerName)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Buyer Email:</td><td style="padding: 8px 0;">${escapeHtml(buyerEmail)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Total Amount:</td><td style="padding: 8px 0; font-weight: bold; color: #F10897;">₦${amountNaira}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Payment Method:</td><td style="padding: 8px 0;">${escapeHtml(paymentLabel)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td style="padding: 8px 0; color: ${paymentColor}; font-weight: bold;">${escapeHtml(paymentStatus)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Recipients:</td><td style="padding: 8px 0;">${recipientCount} (${escapeHtml(recipientNames.join(", "))})</td></tr>
          </table>
          <a href="${siteUrl}/admin" style="display: inline-block; background: #F10897; color: white; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 24px;">View in Admin Dashboard</a>
        </div>
      </div>`;

    const brevo = getBrevo();
    if (!brevo) {
      console.warn("📧 Admin notification NOT sent — BREVO_API_KEY is not set.");
      return { success: true, message: "BREVO_API_KEY not set" };
    }
    try {
      const sender = parseSender();
      await brevo.transactionalEmails.sendTransacEmail({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: adminEmail }],
        subject, htmlContent: html,
        tags: ["admin-notification", "transactional"],
      });
      return { success: true, message: "Admin notification sent" };
    } catch (err) {
      console.error("Brevo send exception (admin notification):", err);
      return { success: true, message: "Failed to send admin notification (best-effort)" };
    }
  } catch (err) {
    console.error("sendAdminNotificationEmail error:", err);
    return { success: true, message: "Failed (best-effort)" };
  }
}

// ============ BANK TRANSFER INSTRUCTIONS EMAIL ============
// Called directly from /api/orders for pending (bank transfer) orders.

export async function sendBankTransferInstructionsEmail(params: {
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  totalAmount: number;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { orderNumber, buyerName, buyerEmail, totalAmount } = params;
    const amountNaira = totalAmount.toLocaleString();
    const siteUrl = getSiteUrl();

    // Fetch bank details from SiteSetting
    const settings = await db.siteSetting.findMany();
    const getSetting = (key: string) => settings.find(s => s.key === key)?.value || "";
    const bankName = getSetting("bankName") || "GTBank";
    const accountName = getSetting("accountName") || "Tare Wellness Enterprise Ltd";
    const accountNumber = getSetting("accountNumber") || "0123456789";

    const subject = `Bank Transfer Instructions — Order ${orderNumber} — ₦${amountNaira}`;
    const html = `
      <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #FFF5EE; padding: 20px;">
        <div style="background: white; border-radius: 24px; padding: 32px;">
          <p style="font-size: 13px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; color: #F10897; margin: 0 0 16px 0;">TARE · BE WELL</p>
          <h1 style="font-family: 'Fraunces', Georgia, serif; color: #4E0030; font-size: 24px; margin: 0 0 12px 0;">Complete your payment, ${escapeHtml(buyerName)}.</h1>
          <p style="color: #4E0030; opacity: 0.8; font-size: 16px; margin: 0 0 24px 0;">Your order <strong>${escapeHtml(orderNumber)}</strong> is confirmed — just complete the bank transfer below.</p>
          <div style="background: #4E0030; border-radius: 20px; padding: 24px; color: white;">
            <p style="font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin: 0 0 4px 0;">Amount Due</p>
            <p style="font-family: 'Fraunces', Georgia, serif; font-size: 32px; font-weight: bold; margin: 0 0 20px 0;">₦${amountNaira}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.6);">Bank:</td><td style="padding: 6px 0; font-weight: bold;">${escapeHtml(bankName)}</td></tr>
              <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.6);">Account Name:</td><td style="padding: 6px 0; font-weight: bold;">${escapeHtml(accountName)}</td></tr>
              <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.6);">Account Number:</td><td style="padding: 6px 0; font-weight: bold; font-family: monospace; font-size: 18px;">${escapeHtml(accountNumber)}</td></tr>
              <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.6);">Reference:</td><td style="padding: 6px 0; font-weight: bold; font-family: monospace;">${escapeHtml(orderNumber)}</td></tr>
            </table>
          </div>
          <p style="color: #4E0030; opacity: 0.6; font-size: 13px; margin: 24px 0 0 0;">Once we confirm your transfer, your gift card will be sent to the recipient immediately.</p>
        </div>
      </div>`;

    const brevo = getBrevo();
    if (!brevo) {
      console.warn("📧 Bank transfer instructions NOT sent — BREVO_API_KEY is not set.");
      return { success: true, message: "BREVO_API_KEY not set" };
    }
    try {
      const sender = parseSender();
      await brevo.transactionalEmails.sendTransacEmail({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: buyerEmail, name: buyerName }],
        subject, htmlContent: html,
        tags: ["bank-transfer", "transactional"],
      });
      return { success: true, message: "Bank transfer instructions sent" };
    } catch (err) {
      console.error("Brevo send exception (bank transfer):", err);
      return { success: true, message: "Failed to send (best-effort)" };
    }
  } catch (err) {
    console.error("sendBankTransferInstructionsEmail error:", err);
    return { success: true, message: "Failed (best-effort)" };
  }
}

// ============ GIFT CARD DELIVERY EMAIL ============
// Called directly from /api/orders for completed (card payment) orders.
// Also can be called manually to resend.

export async function sendGiftCardEmail(orderItemId: string): Promise<{ success: boolean; message: string }> {
  try {
    const orderItem = await db.orderItem.findUnique({
      where: { id: orderItemId },
      include: { redemption: true, order: true },
    });
    if (!orderItem) return { success: false, message: "Order item not found" };
    if (!orderItem.redemption) return { success: false, message: "No redemption code" };

    const siteUrl = getSiteUrl();
    const subject = `You've received a Tare Wellness gift card! 🎁`;
    const html = `
      <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #FFF5EE; padding: 20px;">
        <div style="background: white; border-radius: 24px; padding: 32px;">
          <p style="font-size: 13px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; color: #F10897; margin: 0 0 16px 0;">TARE · BE WELL</p>
          <h1 style="font-family: 'Fraunces', Georgia, serif; color: #4E0030; font-size: 28px; margin: 0 0 12px 0;">You've received a gift! 🎁</h1>
          <p style="color: #4E0030; opacity: 0.8; font-size: 16px; margin: 0 0 24px 0;">Someone sent you a Tare Wellness gift card for ${escapeHtml(orderItem.cardTitle)}.</p>
          <div style="background: linear-gradient(135deg, #D6C7F2, #E0CBF0, #F0CFE6); border-radius: 20px; padding: 24px; text-align: center;">
            <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #4E0030; opacity: 0.6; margin: 0 0 8px 0;">Your Gift Card Code</p>
            <p style="font-family: monospace; font-size: 24px; font-weight: bold; color: #4E0030; letter-spacing: 2px; margin: 0;">${escapeHtml(orderItem.redemption.code)}</p>
          </div>
          <a href="${siteUrl}/redeem" style="display: inline-block; background: #F10897; color: white; padding: 16px 36px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 24px;">Redeem Your Gift</a>
        </div>
      </div>`;

    const brevo = getBrevo();
    if (!brevo) {
      console.warn("📧 Gift card email NOT sent — BREVO_API_KEY is not set.");
      return { success: true, message: "BREVO_API_KEY not set" };
    }
    try {
      const sender = parseSender();
      await brevo.transactionalEmails.sendTransacEmail({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: orderItem.recipientEmail, name: orderItem.recipientName }],
        subject, htmlContent: html,
        tags: ["gift-card", "transactional"],
      });
      // Mark email as sent
      await db.orderItem.update({
        where: { id: orderItemId },
        data: { emailSent: true, emailSentAt: new Date() },
      });
      return { success: true, message: "Gift card email sent" };
    } catch (err) {
      console.error("Brevo send exception (gift card):", err);
      return { success: true, message: "Failed to send (best-effort)" };
    }
  } catch (err) {
    console.error("sendGiftCardEmail error:", err);
    return { success: true, message: "Failed (best-effort)" };
  }
}

// ============ BOOKING CONFIRMATION EMAIL ============
// Called directly from /api/bookings after creating a booking.

export async function sendBookingConfirmationEmail(params: {
  bookingId: string;
  bookingNumber: string;
  userEmail: string;
  userName: string;
  sessionTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  therapistName: string;
  sessionsRemaining: number;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { bookingNumber, userEmail, userName, sessionTitle, scheduledDate, scheduledTime, therapistName, sessionsRemaining } = params;
    const siteUrl = getSiteUrl();
    const subject = `Booking Confirmed — ${bookingNumber} — ${sessionTitle}`;
    const html = `
      <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #FFF5EE; padding: 20px;">
        <div style="background: white; border-radius: 24px; padding: 32px;">
          <p style="font-size: 13px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; color: #F10897; margin: 0 0 16px 0;">TARE · BOOKING CONFIRMED</p>
          <h1 style="font-family: 'Fraunces', Georgia, serif; color: #4E0030; font-size: 24px; margin: 0 0 20px 0;">Your session is booked, ${escapeHtml(userName)}.</h1>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #4E0030;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 40%;">Booking Reference:</td><td style="padding: 8px 0; font-family: monospace;">${escapeHtml(bookingNumber)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Session Type:</td><td style="padding: 8px 0;">${escapeHtml(sessionTitle)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Date:</td><td style="padding: 8px 0;">${escapeHtml(scheduledDate)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Time:</td><td style="padding: 8px 0;">${escapeHtml(scheduledTime)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Provider:</td><td style="padding: 8px 0;">${escapeHtml(therapistName)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Sessions Remaining:</td><td style="padding: 8px 0; font-weight: bold; color: #F10897;">${sessionsRemaining}</td></tr>
          </table>
          <a href="${siteUrl}/account?tab=bookings" style="display: inline-block; background: #F10897; color: white; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 24px;">View My Bookings</a>
        </div>
      </div>`;

    const brevo = getBrevo();
    if (!brevo) {
      console.warn("📧 Booking confirmation NOT sent — BREVO_API_KEY is not set.");
      return { success: true, message: "BREVO_API_KEY not set" };
    }
    try {
      const sender = parseSender();
      await brevo.transactionalEmails.sendTransacEmail({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: userEmail, name: userName }],
        subject, htmlContent: html,
        tags: ["booking-confirmation", "transactional"],
      });
      return { success: true, message: "Booking confirmation sent" };
    } catch (err) {
      console.error("Brevo send exception (booking confirmation):", err);
      return { success: true, message: "Failed to send (best-effort)" };
    }
  } catch (err) {
    console.error("sendBookingConfirmationEmail error:", err);
    return { success: true, message: "Failed (best-effort)" };
  }
}
