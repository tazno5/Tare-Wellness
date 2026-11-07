import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ============ GET /api/bookings/slots?date=YYYY-MM-DD | ?month=YYYY-MM ============
//
// Returns already-booked time slots.
//
// Two modes:
//   ?date=YYYY-MM-DD  → returns { bookedTimes: BookingSlot[] } for that day
//   ?month=YYYY-MM    → returns { monthBookedTimes: { "YYYY-MM-DD": BookingSlot[] } }
//                       for EVERY day in the month (keys with zero bookings
//                       are omitted to keep the response small)
//
// BookingSlot = { scheduledTime: string, durationMinutes: number, userId: string }
//
// Why we return durationMinutes:
//   Different session types have different durations (30, 50, 60, 75 min).
//   A 60-min booking at 10:00 AM blocks 10:00–11:00. A 30-min booking at
//   10:30 AM blocks 10:30–11:00. The client needs the duration to compute
//   overlaps — a slot at 10:30 AM is NOT available if there's a 60-min
//   booking at 10:00 AM (it would overlap).
//
// Why we return userId:
//   The client uses it to distinguish "your own booking" (show it as
//   "Your booking" + disable) from "someone else's booking" (show it as
//   "Booked" + disable). Both are unavailable, but the label differs so
//   the user understands why they can't book that slot.
//
// Auth: required. We only return booked times (not who booked them beyond
// the userId match) so there's no privacy leak. Bookings from ALL users
// are included because the therapist's schedule is shared.
// Only "confirmed" bookings count — cancelled/no-show don't block.

type BookingSlot = {
  scheduledTime: string;
  durationMinutes: number;
  userId: string;
};

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const currentUserId = (session.user as { id: string }).id;

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
      const [yearStr, monthStr] = monthParam.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // JS months are 0-indexed

      if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
        return NextResponse.json(
          { error: "Invalid month format. Use YYYY-MM (e.g. 2026-10)." },
          { status: 400 },
        );
      }

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
          durationMinutes: true,
          userId: true,
        },
      });

      // Group by date string (YYYY-MM-DD) → array of BookingSlot
      const monthBookedTimes: Record<string, BookingSlot[]> = {};
      for (const b of bookings) {
        const d = b.scheduledDate;
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
        if (!monthBookedTimes[key]) monthBookedTimes[key] = [];
        monthBookedTimes[key].push({
          scheduledTime: b.scheduledTime,
          durationMinutes: b.durationMinutes,
          userId: b.userId,
        });
      }

      return NextResponse.json({ monthBookedTimes, currentUserId });
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
        durationMinutes: true,
        userId: true,
      },
    });

    const bookedTimes: BookingSlot[] = bookings.map((b) => ({
      scheduledTime: b.scheduledTime,
      durationMinutes: b.durationMinutes,
      userId: b.userId,
    }));

    return NextResponse.json({ bookedTimes, currentUserId });
  } catch (error) {
    console.error("Failed to fetch booked slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch booked slots" },
      { status: 500 },
    );
  }
}
