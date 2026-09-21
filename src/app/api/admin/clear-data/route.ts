import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/admin-auth";

// GET /api/admin/clear-data
// Returns the confirmation phrase the admin must type to clear data.
// The phrase is set via CLEAR_DATA_PHRASE env var. Falls back to
// "DELETE ALL DATA" if not set.
export async function GET(req: Request) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
    }
    if (!verifyAdminToken(req.headers.get("authorization"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      phrase: process.env.CLEAR_DATA_PHRASE || "DELETE ALL DATA",
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/admin/clear-data
//
// Clears ALL test data from the database: bookings, redemptions, order
// items, orders, and users. This resets the system to a clean state
// (like a fresh install) while keeping the gift card types (Seed, Root,
// Grove) and site settings (bank details, counselor schedule, etc.).
//
// Auth: requires ADMIN_SECRET Bearer token.
// Body: { confirm: "<CLEAR_DATA_PHRASE>" } — must match the
// CLEAR_DATA_PHRASE env var to prevent accidental triggering.
// Set CLEAR_DATA_PHRASE in Vercel env vars to a random string.
// Falls back to "DELETE ALL DATA" if the env var is not set.

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

    // Use CLEAR_DATA_PHRASE env var if set, otherwise fall back to
    // "DELETE ALL DATA" for backward compatibility.
    const expectedPhrase = process.env.CLEAR_DATA_PHRASE || "DELETE ALL DATA";

    if (confirm !== expectedPhrase) {
      return NextResponse.json(
        { error: `Confirmation required. Type the exact phrase shown on the button.` },
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
      results.bookings = (await tx.booking.deleteMany({})).count;
      results.redemptions = (await tx.redemption.deleteMany({})).count;
      results.orderItems = (await tx.orderItem.deleteMany({})).count;
      results.orders = (await tx.order.deleteMany({})).count;

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

      results.users = (await tx.user.deleteMany({})).count;
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
