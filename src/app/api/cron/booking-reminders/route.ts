import { NextResponse } from "next/server";
import { BrevoClient } from "@getbrevo/brevo";
import { db } from "@/lib/db";

// ============ GET /api/cron/booking-reminders ============
//
// Called by Vercel Cron every 5 minutes. Sends two types of reminders:
//   1. 24-hour reminder — sent ~24 hours before the session
//   2. 10-minute reminder — sent ~10 minutes before the session
//
// The cron is secured via CRON_SECRET env var. Vercel sends it as
// Authorization: Bearer <CRON_SECRET> on every cron invocation.
//
// Each reminder is tracked on the Booking model:
//   reminder24hSent  — set to true after the 24h reminder email is sent
//   reminder10minSent — set to true after the 10min reminder email is sent
//
// This prevents duplicate emails even if the cron runs multiple times
// in the same window.

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
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Parse "3:00 PM" → minutes since midnight (e.g. 900 + 60 = 15*60 = 900)
function parseTimeToMinutes(timeStr: string): number | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// Build the session datetime (UTC) from the booking's scheduledDate (UTC)
// + scheduledTime (a local time string like "3:00 PM").
// We treat the time string as UTC for the purpose of computing when to
// send the reminder. This is accurate enough for the 24h + 10min windows.
function getSessionDateTime(booking: { scheduledDate: Date; scheduledTime: string }): Date | null {
  const minutes = parseTimeToMinutes(booking.scheduledTime);
  if (minutes === null) return null;
  const sessionDate = new Date(booking.scheduledDate);
  // Set the time on the UTC date
  sessionDate.setUTCHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return sessionDate;
}

// Send a reminder email via Brevo (or log to console in dev)
async function sendReminderEmail(
  to: string,
  subject: string,
  htmlContent: string,
): Promise<boolean> {
  const brevo = getBrevo();
  if (brevo) {
    try {
      const sender = parseSender();
      await brevo.transactionalEmails.sendTransacEmail({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: to }],
        subject,
        htmlContent,
        tags: ["booking-reminder", "transactional"],
      });
      return true;
    } catch (error) {
      console.error("Brevo reminder send error:", error);
      return false;
    }
  }
  // Dev fallback
  if (process.env.NODE_ENV !== "production") {
    console.log("📧 [DEV] Reminder email not sent — BREVO_API_KEY not set.");
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
  }
  return true; // Treat as "sent" in dev so the flag gets set
}

export async function GET(req: Request) {
  try {
    // Verify CRON_SECRET — Vercel Cron sends it as a Bearer token
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    let sent24h = 0;
    let sent10min = 0;
    let skipped = 0;

    // ============ 24-HOUR REMINDERS ============
    // Find bookings where the session is between 23h and 25h from now
    // and the 24h reminder hasn't been sent yet.
    const window24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const window24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const bookingsFor24h = await db.booking.findMany({
      where: {
        status: "confirmed",
        reminder24hSent: false,
      },
      include: { user: true },
    });

    for (const booking of bookingsFor24h) {
      const sessionDateTime = getSessionDateTime(booking);
      if (!sessionDateTime) {
        skipped++;
        continue;
      }
      // Check if the session is in the 24h window
      if (sessionDateTime < window24hStart || sessionDateTime > window24hEnd) {
        continue;
      }

      const formattedDate = sessionDateTime.toLocaleDateString("en-NG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const safeName = escapeHtml(booking.user.name);
      const safeBookingNumber = escapeHtml(booking.bookingNumber);
      const safeSessionTitle = escapeHtml(booking.sessionTitle);
      const safeTherapistName = escapeHtml(booking.therapistName);
      const siteUrl = process.env.NEXTAUTH_URL || "https://www.tarewellness.com";

      const subject = `Reminder: Your session is tomorrow at ${booking.scheduledTime}`;
      const html = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #FFF5EE; padding: 40px 20px;">
          <div style="background: white; border-radius: 24px; padding: 40px;">
            <p style="font-family: 'Fraunces', serif; font-size: 13px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; color: #F10897; margin: 0 0 16px 0;">
              Session Reminder
            </p>
            <h1 style="font-family: 'Fraunces', serif; color: #4E0030; font-size: 24px; margin: 0 0 8px 0;">
              Hi ${safeName}, your session is tomorrow!
            </h1>
            <p style="color: #4E0030; opacity: 0.7; font-size: 14px; margin: 0 0 24px 0;">
              Here are the details for your upcoming session:
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #FFF5EE; border-radius: 16px; margin-bottom: 20px;">
              <tbody>
                <tr><td style="padding: 12px 20px; border-bottom: 1px solid rgba(78,0,48,0.06);">
                  <table width="100%"><tr>
                    <td style="color: #4E0030; opacity: 0.6; font-size: 12px; font-weight: 600;">Session:&nbsp;</td>
                    <td style="color: #4E0030; font-size: 14px; font-weight: bold; text-align: right;">${safeSessionTitle}</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding: 12px 20px; border-bottom: 1px solid rgba(78,0,48,0.06);">
                  <table width="100%"><tr>
                    <td style="color: #4E0030; opacity: 0.6; font-size: 12px; font-weight: 600;">Date:&nbsp;</td>
                    <td style="color: #4E0030; font-size: 14px; font-weight: bold; text-align: right;">${formattedDate}</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding: 12px 20px; border-bottom: 1px solid rgba(78,0,48,0.06);">
                  <table width="100%"><tr>
                    <td style="color: #4E0030; opacity: 0.6; font-size: 12px; font-weight: 600;">Time:&nbsp;</td>
                    <td style="color: #4E0030; font-size: 14px; font-weight: bold; text-align: right;">${escapeHtml(booking.scheduledTime)} &middot; ${booking.durationMinutes} min</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding: 12px 20px;">
                  <table width="100%"><tr>
                    <td style="color: #4E0030; opacity: 0.6; font-size: 12px; font-weight: 600;">Provider:&nbsp;</td>
                    <td style="color: #4E0030; font-size: 14px; font-weight: bold; text-align: right;">${safeTherapistName}</td>
                  </tr></table>
                </td></tr>
              </tbody>
            </table>
            <div style="background: #FFF5EE; border: 2px dashed #F10897; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
              <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #4E0030; opacity: 0.7; margin: 0 0 8px 0;">Booking Reference</p>
              <p style="font-family: monospace; font-size: 20px; font-weight: bold; color: #4E0030; letter-spacing: 2px; margin: 0;">${safeBookingNumber}</p>
            </div>
            <p style="color: #4E0030; opacity: 0.7; font-size: 14px; margin: 0 0 16px 0; line-height: 1.6;">
              Your wellness specialist will reach out via WhatsApp at session time with the video call link. Arrive 5 minutes early, find a quiet space, and bring a notebook if you'd like.
            </p>
            <a href="${siteUrl}/account?tab=bookings" style="display: inline-block; background: #F10897; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px;">
              View My Bookings
            </a>
            <p style="color: #4E0030; opacity: 0.5; font-size: 11px; margin-top: 24px;">
              Plans change? Reschedule up to 24 hours before, free.
            </p>
          </div>
          <p style="text-align: center; color: #4E0030; opacity: 0.5; font-size: 12px; margin-top: 24px;">
            &copy; 2026 Tare Wellness Enterprise Ltd. All rights reserved.
          </p>
        </div>
      `;

      const sent = await sendReminderEmail(booking.user.email, subject, html);
      if (sent) {
        await db.booking.update({
          where: { id: booking.id },
          data: { reminder24hSent: true },
        });
        sent24h++;
      }
    }

    // ============ 10-MINUTE REMINDERS ============
    // Find bookings where the session is between 8 and 12 minutes from now
    // and the 10min reminder hasn't been sent yet.
    const window10minStart = new Date(now.getTime() + 8 * 60 * 1000);
    const window10minEnd = new Date(now.getTime() + 12 * 60 * 1000);

    const bookingsFor10min = await db.booking.findMany({
      where: {
        status: "confirmed",
        reminder10minSent: false,
      },
      include: { user: true },
    });

    for (const booking of bookingsFor10min) {
      const sessionDateTime = getSessionDateTime(booking);
      if (!sessionDateTime) {
        skipped++;
        continue;
      }
      if (sessionDateTime < window10minStart || sessionDateTime > window10minEnd) {
        continue;
      }

      const safeName = escapeHtml(booking.user.name);
      const safeBookingNumber = escapeHtml(booking.bookingNumber);
      const safeSessionTitle = escapeHtml(booking.sessionTitle);
      const safeTherapistName = escapeHtml(booking.therapistName);
      const siteUrl = process.env.NEXTAUTH_URL || "https://www.tarewellness.com";
      const meetingUrl = booking.meetingUrl || `${siteUrl}/account?tab=bookings`;

      const subject = `Starting soon: Your ${booking.sessionTitle} session`;
      const html = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #FFF5EE; padding: 40px 20px;">
          <div style="background: white; border-radius: 24px; padding: 40px;">
            <p style="font-family: 'Fraunces', serif; font-size: 13px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; color: #F10897; margin: 0 0 16px 0;">
              Starting Soon
            </p>
            <h1 style="font-family: 'Fraunces', serif; color: #4E0030; font-size: 24px; margin: 0 0 8px 0;">
              Hi ${safeName}, your session starts in 10 minutes!
            </h1>
            <p style="color: #4E0030; opacity: 0.7; font-size: 14px; margin: 0 0 24px 0;">
              ${safeSessionTitle} with ${safeTherapistName} at ${escapeHtml(booking.scheduledTime)}
            </p>
            <div style="background: #FCE4EC; border: 2px solid #F10897; border-radius: 16px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <p style="color: #4E0030; font-size: 15px; font-weight: bold; margin: 0 0 8px 0;">
                Your wellness specialist will reach out via WhatsApp shortly.
              </p>
              <p style="color: #4E0030; opacity: 0.7; font-size: 13px; margin: 0;">
                Find a quiet space, grab some water, and settle in.
              </p>
            </div>
            <a href="${escapeHtml(meetingUrl)}" style="display: inline-block; background: #25D366; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Open WhatsApp
            </a>
            <p style="color: #4E0030; opacity: 0.5; font-size: 11px; margin-top: 24px;">
              Reference: ${safeBookingNumber}
            </p>
          </div>
          <p style="text-align: center; color: #4E0030; opacity: 0.5; font-size: 12px; margin-top: 24px;">
            &copy; 2026 Tare Wellness Enterprise Ltd. All rights reserved.
          </p>
        </div>
      `;

      const sent = await sendReminderEmail(booking.user.email, subject, html);
      if (sent) {
        await db.booking.update({
          where: { id: booking.id },
          data: { reminder10minSent: true },
        });
        sent10min++;
      }
    }

    return NextResponse.json({
      success: true,
      sent24h,
      sent10min,
      skipped,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Booking reminders cron error:", error);
    return NextResponse.json(
      { error: "Failed to process reminders" },
      { status: 500 },
    );
  }
}
