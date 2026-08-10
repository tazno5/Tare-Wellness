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
    const existingBooking = await db.booking.findFirst({
      where: {
        userId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        status: "confirmed",
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "You already have a booking at this time" },
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

    // If redemption code provided, link it
    let redemptionId: string | null = null;
    if (redemptionCode) {
      const redemption = await db.redemption.findUnique({
        where: { code: redemptionCode.toUpperCase() },
      });

      if (redemption && redemption.status === "redeemed") {
        redemptionId = redemption.id;
      }
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
        therapistName: therapistName || "Dr. Sarah Thompson",
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
