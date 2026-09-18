import { NextResponse } from "next/server";
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

    // Check for scheduling conflicts
    // 1. User can't have two bookings at the same time
    const userConflict = await db.booking.findFirst({
      where: {
        userId,
        scheduledDate: bookingDate,
        scheduledTime,
        status: "confirmed",
      },
    });

    if (userConflict) {
      return NextResponse.json(
        { error: "You already have a booking at this time" },
        { status: 409 },
      );
    }

    // 2. Therapist can't have two bookings at the same time
    const therapistConflict = await db.booking.findFirst({
      where: {
        therapistName: resolvedTherapistName,
        scheduledDate: bookingDate,
        scheduledTime,
        status: "confirmed",
      },
    });

    if (therapistConflict) {
      return NextResponse.json(
        { error: "This time slot is already booked. Please choose another time." },
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

    fetch(`${baseUrl}/api/email/booking-confirmation`, {
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
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
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
