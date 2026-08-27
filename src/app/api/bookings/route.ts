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
  redemptionCode: z.string().max(20).optional(),
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
    const resolvedTherapistName = rawTherapistName || "Dr. Sarah Thompson";

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
    const meetingUrl = "https://wa.me/2349036530892";

    // CRITICAL #3: If redemption code provided, verify it belongs to the user,
    // has remaining sessions, and decrement sessionsRemaining atomically.
    let redemptionId: string | null = null;
    if (redemptionCode) {
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
          { error: "Invalid redemption code" },
          { status: 400 },
        );
      }

      // Verify the redemption belongs to the current user
      if (redemption.userId !== userId) {
        return NextResponse.json(
          { error: "This gift card does not belong to your account" },
          { status: 403 },
        );
      }

      // Verify there are remaining sessions
      if (redemption.sessionsRemaining <= 0) {
        return NextResponse.json(
          {
            error: `No sessions remaining on this gift card. Total: ${redemption.orderItem.cardSessions}, Used: ${redemption.sessionsUsed}`,
          },
          { status: 409 },
        );
      }

      // Atomically decrement sessionsRemaining and increment sessionsUsed.
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
