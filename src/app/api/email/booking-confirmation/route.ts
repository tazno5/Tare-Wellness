import { NextResponse } from "next/server";
import { BrevoClient } from "@getbrevo/brevo";
import { db } from "@/lib/db";

// ============ POST /api/email/booking-confirmation ============
//
// Sends a transactional booking confirmation email to the user who just
// booked a session. Called fire-and-forget from /api/bookings immediately
// after the booking record is created.
//
// Email contains:
//   - Booking details (Date, Time, Session Type, Therapist)
//   - Unique Booking Reference (BK-2026-XXXXXX)
//   - Updated Session Balance on the gift card used
//
// Email provider: Brevo (https://brevo.com)
// Requires BREVO_API_KEY in env. Falls back to console.log in dev so the
// app works without a real email provider.
//
// Sender must be a verified Brevo sender (https://app.brevo.com/settings/senders)
// configured via EMAIL_FROM env var: "Display Name <email@domain.com>".

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

export async function POST(req: Request) {
  try {
    // NOTE: We intentionally do NOT call checkRateLimit() here.
    //
    // This endpoint is called server-to-server from /api/bookings after a
    // booking is created — the IP is the Vercel function's own IP, not the
    // user's, so rate-limiting on IP is meaningless. Worse, the bookings
    // route fire-and-forgets this call with `.catch(() => {})`, so if the
    // rate limit hit (429), the booking confirmation email would silently
    // disappear and the user would never know.
    //
    // The bookings route itself has its own rate limit (5 bookings per
    // minute per user IP). That's the right place to limit — not here.

    const body = await req.json();
    const {
      bookingId,
      sessionsRemainingAfter,
      sessionsUsedAfter,
      cardTitle,
      cardSessionsTotal,
    } = body as {
      bookingId?: string;
      sessionsRemainingAfter?: number;
      sessionsUsedAfter?: number;
      cardTitle?: string;
      cardSessionsTotal?: number;
    };

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 },
      );
    }

    // Fetch the booking with user + redemption info for the email
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        redemption: { include: { orderItem: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 },
      );
    }

    if (!booking.user) {
      return NextResponse.json(
        { error: "Booking has no associated user" },
        { status: 404 },
      );
    }

    // Format the date nicely (e.g., "Monday, October 14, 2026")
    const sessionDate = new Date(booking.scheduledDate);
    const formattedDate = sessionDate.toLocaleDateString("en-NG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Use the values passed in from the bookings route (race-free) or
    // fall back to fetching from the redemption record.
    const sessionsRemaining =
      typeof sessionsRemainingAfter === "number"
        ? sessionsRemainingAfter
        : booking.redemption?.sessionsRemaining ?? 0;
    const sessionsUsed =
      typeof sessionsUsedAfter === "number"
        ? sessionsUsedAfter
        : booking.redemption?.sessionsUsed ?? 0;
    const resolvedCardTitle =
      cardTitle || booking.redemption?.orderItem?.cardTitle || "your gift card";
    const totalSessions =
      typeof cardSessionsTotal === "number"
        ? cardSessionsTotal
        : booking.redemption?.orderItem?.cardSessions || sessionsUsed + sessionsRemaining;

    // Build the email
    const safeName = escapeHtml(booking.user.name);
    const safeBookingNumber = escapeHtml(booking.bookingNumber);
    const safeSessionTitle = escapeHtml(booking.sessionTitle);
    const safeTherapistName = escapeHtml(booking.therapistName);
    const safeCardTitle = escapeHtml(resolvedCardTitle);

    const emailSubject = `Booking confirmed — ${safeSessionTitle} on ${formattedDate}`;

    // Session balance line — adapts to tier automatically:
    //   1-session card after booking: "0 sessions remaining on your card"
    //   2-session card after booking: "1 session remaining on your card"
    //   3-session card after booking: "2 sessions remaining on your card"
    // Grammar handled: "1 session" vs "N sessions".
    const sessionWord = sessionsRemaining === 1 ? "session" : "sessions";
    const balanceLine =
      sessionsRemaining > 0
        ? `You have <strong>${sessionsRemaining} ${sessionWord}</strong> remaining on ${safeCardTitle}.`
        : `You've used all ${totalSessions} session${totalSessions === 1 ? "" : "s"} on ${safeCardTitle}. Book another gift card to schedule more sessions.`;

    const emailHtml = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #FFF5EE; padding: 40px 20px;">
        <div style="background: white; border-radius: 24px; padding: 40px;">
          <h1 style="font-family: 'Fraunces', serif; color: #4E0030; font-size: 28px; margin: 0 0 8px 0;">
            Your session is booked!
          </h1>
          <p style="color: #4E0030; opacity: 0.7; font-size: 14px; margin: 0 0 24px 0;">
            Hi ${safeName}, here's your booking confirmation.
          </p>

          <div style="background: #FFF5EE; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #4E0030; opacity: 0.7; margin: 0 0 8px 0;">
              Booking Reference
            </p>
            <p style="font-family: monospace; font-size: 20px; font-weight: bold; color: #4E0030; letter-spacing: 2px; margin: 0;">
              ${safeBookingNumber}
            </p>
          </div>

          <div style="background: linear-gradient(135deg, #D6C7F2, #E0CBF0, #F0CFE6); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <p style="font-family: 'Fraunces', serif; font-weight: bold; color: #4E0030; font-size: 20px; margin: 0;">
              ${safeSessionTitle}
            </p>
            <p style="color: #4E0030; opacity: 0.75; font-size: 13px; margin: 4px 0 0 0;">
              ${formattedDate} at ${escapeHtml(booking.scheduledTime)} · ${booking.durationMinutes} minutes
            </p>
            <p style="color: #4E0030; opacity: 0.75; font-size: 13px; margin: 8px 0 0 0;">
              with ${safeTherapistName}
            </p>
          </div>

          <div style="background: #FFF5EE; border: 2px dashed #F10897; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #4E0030; opacity: 0.7; margin: 0 0 8px 0;">
              Session Balance
            </p>
            <p style="font-size: 15px; color: #4E0030; margin: 0;">
              ${balanceLine}
            </p>
            <p style="font-size: 12px; color: #4E0030; opacity: 0.6; margin: 8px 0 0 0;">
              ${sessionsUsed} of ${totalSessions} session${totalSessions === 1 ? "" : "s"} used on this card.
            </p>
          </div>

          <a href="https://tarewellness.com/account?tab=bookings" style="display: inline-block; background: #F10897; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px;">
            View My Bookings
          </a>

          <p style="color: #4E0030; opacity: 0.5; font-size: 11px; margin-top: 24px;">
            Plans change. Reschedule up to 24 hours before, free.
          </p>
        </div>

        <p style="text-align: center; color: #4E0030; opacity: 0.5; font-size: 12px; margin-top: 24px;">
          © 2026 Tare Wellness Enterprise Ltd. All rights reserved.
        </p>
      </div>
    `;

    // Send via Brevo if configured, otherwise log to console (dev mode)
    const brevo = getBrevo();

    if (brevo) {
      try {
        const sender = parseSender();
        const response = await brevo.transactionalEmails.sendTransacEmail({
          sender: { name: sender.name, email: sender.email },
          to: [{ email: booking.user.email }],
          subject: emailSubject,
          htmlContent: emailHtml,
          tags: ["booking-confirmation", "transactional"],
        });

        return NextResponse.json({
          success: true,
          sentTo: booking.user.email,
          bookingId: booking.id,
          emailId: response?.messageId ?? null,
          message: "Booking confirmation email sent via Brevo",
        });
      } catch (sendError) {
        console.error("Brevo send exception (booking-confirmation):", sendError);
        // Best-effort — don't fail, just report the warning
        return NextResponse.json({
          success: true,
          sentTo: booking.user.email,
          bookingId: booking.id,
          emailId: null,
          warning: "Failed to send via Brevo — see server logs",
          message: "Email send failed (best-effort)",
        });
      }
    }

    // Dev fallback — no BREVO_API_KEY configured. Log to console.
    if (process.env.NODE_ENV !== "production") {
      console.log("📧 [DEV] Booking confirmation email not sent — BREVO_API_KEY not set.");
      console.log(`   To: ${booking.user.email}`);
      console.log(`   Subject: ${emailSubject}`);
      console.log(`   Booking: ${booking.bookingNumber}`);
      console.log(`   Session: ${booking.sessionTitle} on ${formattedDate} at ${booking.scheduledTime}`);
      console.log(`   Balance: ${sessionsRemaining} session${sessionsRemaining === 1 ? "" : "s"} remaining on ${resolvedCardTitle}`);
    }

    return NextResponse.json({
      success: true,
      sentTo: booking.user.email,
      bookingId: booking.id,
      emailId: null,
      message: "Email logged to console (no provider configured)",
    });
  } catch (error) {
    console.error("Booking confirmation email error:", error);
    return NextResponse.json(
      { error: "Failed to send booking confirmation email" },
      { status: 500 },
    );
  }
}
