import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ============ GET /api/bookings/slots?date=YYYY-MM-DD | ?month=YYYY-MM ============
//
// Returns already-booked time slots.
//
// Two modes:
//   ?date=YYYY-MM-DD  → returns { bookedTimes: string[] } for that day
//   ?month=YYYY-MM    → returns { monthBookedTimes: { "YYYY-MM-DD": string[] } }
//                       for EVERY day in that month (keys with zero bookings
//                       are omitted to keep the response small)
//
// The month mode is used by /book-session to PRE-FETCH the entire month
// when the user navigates the calendar. This lets the calendar show
// which dates are fully booked (all available slots taken) BEFORE the
// user clicks on them — no flash of "all available" when a date is
// selected.
//
// Auth: required. Only returns booked times (not who booked them or
// any other booking details) — no privacy leak. Bookings from ALL
// users are included because the therapist's schedule is shared.
// Only "confirmed" bookings count — cancelled/no-show don't block.

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
    const monthParam = url.searchParams.get("month");

    if (!dateParam && !monthParam) {
      return NextResponse.json(
        { error: "date or month query parameter is required (YYYY-MM-DD or YYYY-MM)" },
        { status: 400 },
      );
    }

    // ---- MONTH MODE: return booked times for every day in the month ----
    if (monthParam) {
      // Parse "YYYY-MM" (e.g. "2026-10")
      const [yearStr, monthStr] = monthParam.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // JS months are 0-indexed

      if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
        return NextResponse.json(
          { error: "Invalid month format. Use YYYY-MM (e.g. 2026-10)." },
          { status: 400 },
        );
      }

      // Build a date range covering the entire month (in UTC)
      const monthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      const monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

      const bookings = await db.booking.findMany({
        where: {
          scheduledDate: {
            gte: monthStart,
            lte: monthEnd,
          },
          status: "confirmed",
        },
        select: {
          scheduledDate: true,
          scheduledTime: true,
        },
      });

      // Group by date string (YYYY-MM-DD) → array of booked times
      const monthBookedTimes: Record<string, string[]> = {};
      for (const b of bookings) {
        const d = b.scheduledDate;
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
        if (!monthBookedTimes[key]) monthBookedTimes[key] = [];
        monthBookedTimes[key].push(b.scheduledTime);
      }

      // Dedupe each day's times
      for (const key of Object.keys(monthBookedTimes)) {
        monthBookedTimes[key] = Array.from(new Set(monthBookedTimes[key])).sort();
      }

      return NextResponse.json({ monthBookedTimes });
    }

    // ---- DATE MODE: return booked times for a single date ----
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
