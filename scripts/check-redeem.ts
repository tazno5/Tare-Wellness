import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const r = await prisma.redemption.findFirst({
    where: { code: "8T6S-5SX2-DSDF-MQ6Z" },
    include: { orderItem: true, user: true },
  });
  if (!r) { console.log("Code not found"); return; }
  console.log("Redemption found:");
  console.log(`  code: ${r.code}`);
  console.log(`  status: ${r.status}`);
  console.log(`  userId: ${r.userId ?? 'null (not redeemed yet)'}`);
  console.log(`  user.email: ${r.user?.email ?? 'null'}`);
  console.log(`  creditAmount: ${r.creditAmount}`);
  console.log(`  sessionsRemaining: ${r.sessionsRemaining}`);
  console.log(`  sessionsUsed: ${r.sessionsUsed}`);
  console.log(`  redeemedAt: ${r.redeemedAt?.toISOString() ?? 'null'}`);
  console.log(`  orderItem.cardTitle: ${r.orderItem.cardTitle}`);
  console.log(`  orderItem.cardSessions: ${r.orderItem.cardSessions}`);
}
main().finally(() => prisma.$disconnect());
