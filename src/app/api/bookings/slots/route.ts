import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ============ GET /api/bookings/slots?date=YYYY-MM-DD ============
//
// Returns the list of already-booked time slots for a given date.
// Used by /book-session to visually disable already-taken time slots
// in the time picker, so users immediately see which times are taken
// before attempting to confirm their session.
//
// Query params:
//   date: YYYY-MM-DD (required) — the calendar date the user picked.
//
// Returns: { bookedTimes: string[] } — e.g. ["10:00 AM", "1:00 PM"]
//
// Auth: required. We only return booked times (not who booked them or
// any other booking details) so there's no privacy leak — the user
// just learns "this slot is taken". The booked times come from ALL
// users (not just the current user) because the therapist's schedule
// is shared across everyone — if Alice books 10am, Bob can't also
// book 10am.
//
// Only "confirmed" bookings count — cancelled / no-show bookings don't
// block the slot.

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json(
        { error: "date query parameter is required (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    // Parse the date and build a range that covers the whole calendar day
    // in UTC. Bookings are stored with scheduledDate as a DateTime, and we
    // want to match any booking whose scheduledDate falls on the same
    // calendar day as the user's selected date.
    //
    // The client sends "YYYY-MM-DD" (e.g. "2026-10-15"). We construct:
    //   start = 2026-10-15T00:00:00.000Z
    //   end   = 2026-10-15T23:59:59.999Z
    // and query for bookings where scheduledDate is between start and end.
    //
    // Note: this is a UTC interpretation of the date. The client-side
    // /book-session page sends the date in the user's local timezone
    // (Africa/Lagos) via toISOString() after constructing a Date from the
    // selected calendar day. For the purpose of slot-blocking, we
    // match on the same calendar day the user picked — any timezone
    // drift would be at most a few hours and would only affect edge
    // cases around midnight.
    const startOfDay = new Date(`${dateParam}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateParam}T23:59:59.999Z`);

    if (isNaN(startOfDay.getTime()) || isNaN(endOfDay.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 },
      );
    }

    const bookings = await db.booking.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: "confirmed",
      },
      select: {
        scheduledTime: true,
      },
    });

    // Dedupe (shouldn't be duplicates, but defensive) + sort for a stable
    // response. Return as a Set→array to remove any duplicates.
    const bookedTimes = Array.from(
      new Set(bookings.map((b) => b.scheduledTime)),
    ).sort();

    return NextResponse.json({ bookedTimes });
  } catch (error) {
    console.error("Failed to fetch booked slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch booked slots" },
      { status: 500 },
    );
  }
}
