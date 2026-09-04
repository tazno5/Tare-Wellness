import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ============ POST /api/account/delete — Delete the current user's account ============
//
// NDPA 2023 Section 30: Right to erasure ("right to be forgotten")
//
// What gets deleted:
//   - All Bookings (cascades from User)
//   - All Redemptions linked to the user
//   - All Orders placed by the user (and their OrderItems)
//   - All Sessions + Accounts (NextAuth tables)
//   - The User record itself
//
// What is KEPT (for legal retention — see privacy policy Retention section):
//   - GiftCardType rows (seed data, no personal info)
//   - Order records MAY be retained in anonymized form for 7 years
//     for tax/financial compliance (CAMA 2020). Currently we DELETE them
//     outright — but if a regulator asks, we have a documented reason
//     to switch to anonymization instead.
//
// This endpoint requires authentication. Only the account owner can
// delete their own account — there's no admin deletion via this route.
//
// The user must type "DELETE" in the confirmation field on the client
// side. We don't accept the request without that confirmation.

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = (session.user as { id: string }).id;

    // Parse body — require explicit confirmation
    const body = await req.json().catch(() => ({}));
    const { confirm } = body as { confirm?: string };

    if (confirm !== "DELETE") {
      return NextResponse.json(
        {
          error:
            'Confirmation required. Type "DELETE" in the confirmation field.',
        },
        { status: 400 },
      );
    }

    // Verify the user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 },
      );
    }

    // Fetch orders placed by this user (we'll delete order items + redemptions
    // manually because Prisma's cascade doesn't always work cleanly across
    // all relationships — safer to delete in dependency order)
    const userOrders = await db.order.findMany({
      where: { userId },
      select: { id: true },
    });
    const orderIds = userOrders.map((o) => o.id);

    // Delete in dependency order
    // 1. Bookings (reference userId + redemptionId)
    await db.booking.deleteMany({ where: { userId } });

    // 2. Redemptions linked to user OR linked to user's orders
    await db.redemption.deleteMany({
      where: {
        OR: [
          { userId },
          { orderId: { in: orderIds } },
        ],
      },
    });

    // 3. Order items for user's orders
    if (orderIds.length > 0) {
      await db.orderItem.deleteMany({
        where: { orderId: { in: orderIds } },
      });
    }

    // 4. Orders placed by user
    await db.order.deleteMany({ where: { userId } });

    // 5. NextAuth Session + Account tables
    await db.session.deleteMany({ where: { userId } });
    await db.account.deleteMany({ where: { userId } });

    // 6. Finally, the user record
    await db.user.delete({ where: { id: userId } });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully. All your personal data has been removed.",
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please try again or contact privacy@tarewellness.com." },
      { status: 500 },
    );
  }
}
