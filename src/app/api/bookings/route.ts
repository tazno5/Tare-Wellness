import { NextResponse } from "next/server";
import { internalFetch } from "@/lib/internal-fetch";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";
import { generateBookingNumber } from "@/lib/ids";

// ============ Validation (#4) ============

const createBookingSchema = z.object({
  sessionType: z.enum(["individual", "couples", "family", "wellness"]),
  sessionTitle: z.string().min(1).max(200),
  scheduledDate: z.string().min(1).max(100),
  scheduledTime: z.string().min(1).max(20),
  therapistName: z.string().max(200).optional().default("Dr. Sarah Thompson"),
  // Client requirement: every booking MUST be backed by a valid gift card.
  // Direct session purchase is intentionally disabled — users must buy a
  // gift card first (see /gift-cards) and redeem it before booking.
  redemptionCode: z.string().min(1).max(20),
});

// #3: Server-side session price lookup — never trust client-provided prices
const SESSION_PRICES: Record<string, { title: string; price: number; duration: number }> = {
  individual: { title: "One-on-One", price: 20000, duration: 50 },
  couples: { title: "Together", price: 30000, duration: 60 },
  family: { title: "Family Circle", price: 40000, duration: 75 },
  wellness: { title: "Wellness Coaching", price: 15000, duration: 30 },
};

// ============ POST /api/bookings — Create a booking ============

export async function POST(req: Request) {
  try {
    // Rate limiting: 5 bookings per minute per IP
    const { success } = await checkRateLimit(req, "bookings");
    if (!success) {
      return NextResponse.json(
        { error: "Too many booking requests. Please wait a moment." },
        { status: 429 },
      );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required to book a session" },
        { status: 401 },
      );
    }

    const userId = (session.user as { id: string }).id;

    // #4: Validate input with Zod
    const body = await req.json();
    const parseResult = createBookingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid booking data",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      sessionType,
      sessionTitle,
      scheduledDate,
      scheduledTime,
      therapistName: rawTherapistName,
      redemptionCode,
    } = parseResult.data;

    // #3: Look up session price from server-side config, not client
    const sessionConfig = SESSION_PRICES[sessionType];
    if (!sessionConfig) {
      return NextResponse.json(
        { error: "Invalid session type" },
        { status: 400 },
      );
    }
    const resolvedSessionPrice = sessionConfig.price;
    const resolvedSessionTitle = sessionConfig.title;
    const resolvedDuration = sessionConfig.duration;

    // Fetch therapist name from admin settings (falls back to "Your Provider")
    let resolvedTherapistName = rawTherapistName || "Your Provider";
    try {
      const therapistSetting = await db.siteSetting.findUnique({
        where: { key: "therapistName" },
      });
      if (therapistSetting?.value) {
        resolvedTherapistName = rawTherapistName || therapistSetting.value;
      }
    } catch {
      // Fall back to default — don't fail the booking
    }

    // Validate date is not in the past
    const bookingDate = new Date(scheduledDate);
    if (isNaN(bookingDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (bookingDate < now) {
      return NextResponse.json(
        { error: "Cannot book a session in the past" },
        { status: 400 },
      );
    }

    // ============ SERVER-SIDE RE-CHECK: OVERLAP-AWARE CONFLICT DETECTION ============
    // The client-side omission filter handles the common case, but we
    // re-check on the server right before creating the booking as a
    // safety net (in case another user grabbed the slot seconds earlier,
    // or the client data was stale).
    //
    // We check for OVERLAPS, not just exact time matches. Different
    // session types have different durations (30, 50, 60, 75 min), so
    // a 60-min booking at 10:00 AM blocks a 10:30 AM slot even though
    // the times aren't identical.
    //
    // Overlap = proposedStart < existingEnd && existingStart < proposedEnd
    // where proposedEnd = proposedStart + resolvedDuration
    // and existingEnd = existingStart + existingBooking.durationMinutes

    // Parse the proposed booking's time into minutes since midnight
    const parseTimeToMinutes = (timeStr: string): number | null => {
      const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!match) return null;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === "PM" && hours !== 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const proposedStart = parseTimeToMinutes(scheduledTime);
    const proposedEnd = proposedStart !== null ? proposedStart + resolvedDuration : null;

    if (proposedStart === null || proposedEnd === null) {
      return NextResponse.json(
        { error: "Invalid time format" },
        { status: 400 },
      );
    }

    // Fetch ALL confirmed bookings for the same date (for both this user
    // and the therapist) so we can check for overlaps
    const existingBookings = await db.booking.findMany({
      where: {
        scheduledDate: bookingDate,
        status: "confirmed",
        // Check both this user's bookings AND the therapist's bookings
        OR: [
          { userId },
          { therapistName: resolvedTherapistName },
        ],
      },
      select: {
        userId: true,
        scheduledTime: true,
        durationMinutes: true,
      },
    });

    // Check each existing booking for overlap
    for (const existing of existingBookings) {
      const existingStart = parseTimeToMinutes(existing.scheduledTime);
      if (existingStart === null) continue;
      const existingEnd = existingStart + existing.durationMinutes;
      const overlaps = proposedStart < existingEnd && existingStart < proposedEnd;
      if (!overlaps) continue;

      // Overlap detected — return the appropriate error message
      if (existing.userId === userId) {
        return NextResponse.json(
          {
            error: "You already have a booking that overlaps with this time. Please choose a different time.",
            conflictType: "user_overlap",
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        {
          error: "This time slot overlaps with an existing booking. Please choose a different time.",
          conflictType: "therapist_overlap",
        },
        { status: 409 },
      );
    }

    // Generate booking number (uses crypto.randomBytes — see src/lib/ids.ts)
    const bookingNumber = generateBookingNumber();

    // Generate meeting URL — points to WhatsApp contact for session coordination.
    // The wellness specialist uses WhatsApp to share the video call link at session time.
    // Fetch WhatsApp number from admin settings (falls back to default)
    let meetingUrl = "https://wa.me/2349036530892";
    try {
      const whatsappSetting = await db.siteSetting.findUnique({
        where: { key: "whatsappNumber" },
      });
      if (whatsappSetting?.value) {
        meetingUrl = `https://wa.me/${whatsappSetting.value}`;
      }
    } catch {
      // Fall back to default — don't fail the booking
    }

    // CRITICAL: Every booking MUST be backed by a valid gift card belonging
    // to the current user, with at least one session remaining. Zod already
    // rejected empty/missing codes (redemptionCode is required); here we
    // verify the code belongs to the user and decrement sessionsRemaining
    // atomically (conditional updateMany prevents race conditions).
    //
    // The decrement math is UNIVERSAL across all gift card tiers — works
    // identically for 1-session, 2-session, 3-session, or any future tier:
    //   sessionsRemaining starts at card.sessions (set when admin confirms payment)
    //   each booking decrements sessionsRemaining by 1, increments sessionsUsed by 1
    //   bookings are rejected once sessionsRemaining reaches 0
    let redemptionId: string | null = null;
    let updatedSessionsRemaining = 0; // for the confirmation email
    let updatedSessionsUsed = 0;     // for the confirmation email
    let cardTitleForEmail = "Gift Card";
    let cardSessionsForEmail = 0;     // total sessions on the card
    {
      // Normalize the code: uppercase + strip non-alphanumeric + try dashed format
      const normalizedCode = redemptionCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      const dashedCode = normalizedCode.replace(/(.{4})(?=.)/g, "$1-");

      const redemption = await db.redemption.findFirst({
        where: {
          OR: [
            { code: dashedCode },
            { code: normalizedCode },
          ],
        },
        include: { orderItem: true },
      });

      if (!redemption) {
        return NextResponse.json(
          { error: "Invalid redemption code — no gift card found with that code." },
          { status: 400 },
        );
      }

      // The redemption has no user attached yet — happens when:
      //   1. The gift card was bought for someone else (recipient must
      //      redeem the code on /redeem to attach it to their account)
      //   2. The buyer paid by bank transfer and admin hasn't confirmed
      //      payment yet (sessionsRemaining=0, status="active")
      if (!redemption.userId) {
        return NextResponse.json(
          {
            error:
              redemption.sessionsRemaining > 0
                ? "This gift card has not been redeemed yet. Visit /redeem to add it to your account."
                : "This gift card is not yet active. If you paid by bank transfer, your sessions unlock once payment is confirmed.",
          },
          { status: 403 },
        );
      }

      // Verify the redemption belongs to the current user
      if (redemption.userId !== userId) {
        return NextResponse.json(
          { error: "This gift card does not belong to your account." },
          { status: 403 },
        );
      }

      // Verify there are remaining sessions (universal check — applies to
      // every tier: 1-session, 2-session, 3-session, etc.)
      if (redemption.sessionsRemaining <= 0) {
        return NextResponse.json(
          {
            error: `No sessions remaining on this gift card. Total: ${redemption.orderItem.cardSessions}, Used: ${redemption.sessionsUsed}`,
          },
          { status: 409 },
        );
      }

      // Atomically decrement sessionsRemaining and increment sessionsUsed.
      // This is the universal ledger math: 1 booking = 1 session consumed,
      // regardless of card tier.
      const decremented = await db.redemption.updateMany({
        where: {
          id: redemption.id,
          sessionsRemaining: { gt: 0 },
        },
        data: {
          sessionsRemaining: { decrement: 1 },
          sessionsUsed: { increment: 1 },
        },
      });

      if (decremented.count === 0) {
        return NextResponse.json(
          { error: "No sessions remaining on this gift card" },
          { status: 409 },
        );
      }

      redemptionId = redemption.id;
      // Compute post-booking balance for the confirmation email
      updatedSessionsRemaining = redemption.sessionsRemaining - 1;
      updatedSessionsUsed = redemption.sessionsUsed + 1;
      cardTitleForEmail = redemption.orderItem?.cardTitle || "Gift Card";
      cardSessionsForEmail = redemption.orderItem?.cardSessions || 0;
    }

    // Create the booking — using server-side price (#3)
    const booking = await db.booking.create({
      data: {
        bookingNumber,
        userId,
        redemptionId,
        sessionType,
        sessionTitle: resolvedSessionTitle,
        sessionPrice: resolvedSessionPrice,
        therapistName: resolvedTherapistName,
        scheduledDate: bookingDate,
        scheduledTime,
        durationMinutes: resolvedDuration,
        status: "confirmed",
        meetingUrl,
      },
      include: {
        redemption: true,
      },
    });

    // ============ BOOKING CONFIRMATION EMAIL ============
    // Fire-and-forget: dispatch a transactional email to the user with
    // booking details, reference code, and updated session balance.
    // Best-effort — never blocks the booking response. The email endpoint
    // handles its own Brevo API + dev-mode console.log fallback.
    //
    // URL resolution: prefer NEXTAUTH_URL (set explicitly in Vercel env
    // vars to the production domain e.g. https://tarewellness.com). If
    // not set, fall back to VERCEL_URL (auto-set by Vercel on every
    // deployment, includes the deployment-specific subdomain like
    // xxx.vercel.app). If neither is set, use localhost (dev only).
    // Without a real URL, the server-to-server fetch silently fails —
    // caught by .catch() — and no email is sent.
    const baseUrl =
      (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith("http://localhost"))
        ? process.env.NEXTAUTH_URL
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000";

    internalFetch(`/api/email/booking-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: booking.id,
        // Pass the computed post-booking values so the email endpoint
        // doesn't have to re-fetch the redemption (cheaper + race-free).
        sessionsRemainingAfter: updatedSessionsRemaining,
        sessionsUsedAfter: updatedSessionsUsed,
        cardTitle: cardTitleForEmail,
        cardSessionsTotal: cardSessionsForEmail,
      }),
    }).catch(() => {
      // Swallow — best-effort, don't fail the booking
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Booking creation error:", error);

    // Prisma P2002 = unique constraint violation. The most common cause on
    // production is the Booking.redemptionId unique index — if the migration
    // `20260918160000_drop_booking_redemption_unique` hasn't run on the prod
    // DB yet (e.g. missing `prisma migrate deploy` in the build pipeline),
    // the second booking on a multi-session card will fail here with a P2002
    // on (redemptionId). Surface a clear, actionable error so the user knows
    // it's not their fault and the dev team can investigate.
    if (error?.code === "P2002") {
      const target = error.meta?.target as string[] | undefined;
      const fields = target?.join(", ") ?? "unknown field";
      return NextResponse.json(
        {
          error:
            fields.includes("redemptionId")
              ? "This gift card already has a booking linked to it. The database schema needs to be updated to allow multiple bookings per gift card — please contact support or run the latest Prisma migration."
              : `Duplicate value on field(s): ${fields}. Please try again.`,
          code: "P2002",
        },
        { status: 409 },
      );
    }

    // Prisma P2003 = foreign key constraint violation. Rare, but happens if
    // the redemption record was deleted between validation and booking.create.
    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "Gift card record not found. Please refresh the page and try again." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create booking",
        details:
          process.env.NODE_ENV !== "production"
            ? error?.message
            : undefined,
      },
      { status: 500 },
    );
  }
}

// ============ GET /api/bookings — List user's bookings ============

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = (session.user as { id: string }).id;

    const bookings = await db.booking.findMany({
      where: { userId },
      include: {
        redemption: {
          include: {
            orderItem: true,
          },
        },
      },
      orderBy: { scheduledDate: "desc" },
      take: 20,
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 },
    );
  }
}
