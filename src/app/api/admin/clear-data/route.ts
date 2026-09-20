import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/admin-auth";

// POST /api/admin/clear-data
//
// Clears ALL test data from the database: bookings, redemptions, order
// items, orders, and users. This resets the system to a clean state
// (like a fresh install) while keeping the gift card types (Seed, Root,
// Grove) and site settings (bank details, counselor schedule, etc.).
//
// Auth: requires ADMIN_SECRET Bearer token.
// Body: { confirm: "DELETE ALL DATA" } — must match exactly to prevent
// accidental triggering.

export async function POST(req: Request) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Admin not configured. Set ADMIN_SECRET env var." },
        { status: 503 },
      );
    }

    if (!verifyAdminToken(req.headers.get("authorization"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { confirm } = body as { confirm?: string };

    if (confirm !== "DELETE ALL DATA") {
      return NextResponse.json(
        { error: 'Confirmation required. Send { confirm: "DELETE ALL DATA" }.' },
        { status: 400 },
      );
    }

    // Delete in the correct order to respect foreign key constraints:
    // 1. Bookings (reference redemptions + users)
    // 2. Redemptions (reference order items + users)
    // 3. Order Items (reference orders + gift card types)
    // 4. Orders (reference users)
    // 5. Accounts (reference users)
    // 6. Sessions (reference users)
    // 7. Users
    //
    // Gift card types and site settings are NOT deleted — they're
    // the catalog + config, not test data.

    const results = {
      bookings: 0,
      redemptions: 0,
      orderItems: 0,
      orders: 0,
      accounts: 0,
      sessions: 0,
      users: 0,
    };

    // Use a transaction so partial failures don't leave inconsistent state
    await db.$transaction(async (tx) => {
      results.bookings = await tx.booking.deleteMany({});
      results.bookings = results.bookings.count;

      results.redemptions = await tx.redemption.deleteMany({});
      results.redemptions = results.redemptions.count;

      results.orderItems = await tx.orderItem.deleteMany({});
      results.orderItems = results.orderItems.count;

      results.orders = await tx.order.deleteMany({});
      results.orders = results.orders.count;

      // Delete NextAuth accounts + sessions (if they exist)
      try {
        results.accounts = (await tx.account.deleteMany({})).count;
      } catch {
        // Table might not exist in all deployments
      }
      try {
        results.sessions = (await tx.session.deleteMany({})).count;
      } catch {
        // Table might not exist in all deployments
      }

      results.users = await tx.user.deleteMany({});
      results.users = results.users.count;
    });

    return NextResponse.json({
      success: true,
      message: "All test data cleared. The system is now clean.",
      deleted: results,
    });
  } catch (error) {
    console.error("Clear data error:", error);
    return NextResponse.json(
      {
        error: "Failed to clear data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
