/**
 * Clean up test data from the dev database.
 *
 * Keeps:
 *   - GiftCardType rows (these are seed data, not test data)
 *
 * Deletes (in dependency order to satisfy foreign keys):
 *   - Booking
 *   - Redemption
 *   - OrderItem
 *   - Order
 *   - User (all of them — test accounts only)
 *   - Account, Session, VerificationToken (NextAuth tables)
 *
 * Usage:
 *   node scripts/cleanup-dev-db.js            # delete everything except seed data
 *   node scripts/cleanup-dev-db.js --dry-run  # show counts without deleting
 */

const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

async function main() {
  // Count before
  const before = {
    users: await db.user.count(),
    accounts: await db.account.count(),
    sessions: await db.session.count(),
    verificationTokens: await db.verificationToken.count(),
    orders: await db.order.count(),
    orderItems: await db.orderItem.count(),
    redemptions: await db.redemption.count(),
    bookings: await db.booking.count(),
    giftCardTypes: await db.giftCardType.count(),
  };

  console.log("=== Dev DB cleanup ===");
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes)" : "DELETE"}`);
  console.log("Before:");
  Object.entries(before).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  if (dryRun) {
    console.log("\n(Dry run — no rows deleted. Re-run without --dry-run to actually delete.)");
    return;
  }

  // Delete in dependency order. Prisma's onDelete: Cascade handles most,
  // but we delete explicitly to be safe across both SQLite and PostgreSQL.

  console.log("\nDeleting...");

  // Bookings reference Users and Redemptions
  const bookingsDeleted = await db.booking.deleteMany({});
  console.log(`  bookings: ${bookingsDeleted.count} deleted`);

  // Redemptions reference OrderItems, Orders, Users
  const redemptionsDeleted = await db.redemption.deleteMany({});
  console.log(`  redemptions: ${redemptionsDeleted.count} deleted`);

  // OrderItems reference Orders and GiftCardTypes
  const orderItemsDeleted = await db.orderItem.deleteMany({});
  console.log(`  orderItems: ${orderItemsDeleted.count} deleted`);

  // Orders reference Users
  const ordersDeleted = await db.order.deleteMany({});
  console.log(`  orders: ${ordersDeleted.count} deleted`);

  // NextAuth tables (Account, Session reference Users)
  const sessionsDeleted = await db.session.deleteMany({});
  console.log(`  sessions: ${sessionsDeleted.count} deleted`);

  const accountsDeleted = await db.account.deleteMany({});
  console.log(`  accounts: ${accountsDeleted.count} deleted`);

  const tokensDeleted = await db.verificationToken.deleteMany({});
  console.log(`  verificationTokens: ${tokensDeleted.count} deleted`);

  // Finally, Users
  const usersDeleted = await db.user.deleteMany({});
  console.log(`  users: ${usersDeleted.count} deleted`);

  // Count after
  const after = {
    users: await db.user.count(),
    accounts: await db.account.count(),
    sessions: await db.session.count(),
    verificationTokens: await db.verificationToken.count(),
    orders: await db.order.count(),
    orderItems: await db.orderItem.count(),
    redemptions: await db.redemption.count(),
    bookings: await db.booking.count(),
    giftCardTypes: await db.giftCardType.count(),
  };
  console.log("\nAfter:");
  Object.entries(after).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log("\n✅ Cleanup complete. GiftCardType seed data preserved.");
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
