import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ============ POST /api/bookings — Create a booking ============

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required to book a session" },
        { status: 401 },
      );
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();

    const {
      sessionType,
      sessionTitle,
      sessionPrice,
      scheduledDate,
      scheduledTime,
      therapistName,
      redemptionCode,
    } = body as {
      sessionType: string;
      sessionTitle: string;
      sessionPrice: number;
      scheduledDate: string;
      scheduledTime: string;
      therapistName: string;
      redemptionCode?: string;
    };

    // Validate required fields
    if (!sessionType || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: "Session type, date, and time are required" },
        { status: 400 },
      );
    }

    // Check for scheduling conflicts
    // 1. User can't have two bookings at the same time
    const userConflict = await db.booking.findFirst({
      where: {
        userId,
        scheduledDate: new Date(scheduledDate),
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

    // 2. MEDIUM #5: Therapist can't have two bookings at the same time
    // (prevents double-booking the same therapist slot)
    const resolvedTherapistName = therapistName || "Dr. Sarah Thompson";
    const therapistConflict = await db.booking.findFirst({
      where: {
        therapistName: resolvedTherapistName,
        scheduledDate: new Date(scheduledDate),
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

    // Generate booking number — timestamp + random chars for uniqueness
    // (same pattern as generateOrderNumber in /api/orders/route.ts).
    // Old code used a deterministic sum that collided for same-user same-ms.
    const ts = Date.now().toString(36).toUpperCase().slice(-6);
    const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
    const bookingNumber = `BK-2026-${ts}${rand}`;

    // Generate meeting URL
    const meetingId = Math.random().toString(36).slice(2, 10);
    const meetingUrl = `meet.mindful.com/v/${meetingId}`;

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
      // Only succeeds if sessionsRemaining > 0 (prevents race condition).
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
        // Another booking consumed the last session between our read and write
        return NextResponse.json(
          { error: "No sessions remaining on this gift card" },
          { status: 409 },
        );
      }

      redemptionId = redemption.id;
    }

    // Create the booking
    const booking = await db.booking.create({
      data: {
        bookingNumber,
        userId,
        redemptionId,
        sessionType,
        sessionTitle,
        sessionPrice,
        therapistName: resolvedTherapistName,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        durationMinutes: 50,
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
