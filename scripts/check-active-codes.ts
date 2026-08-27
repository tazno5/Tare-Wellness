import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const codes = await prisma.redemption.findMany({
    where: { sessionsRemaining: { gt: 0 } },
    include: { orderItem: true, user: true },
    take: 5,
  });
  console.log(`Active codes with sessions remaining: ${codes.length}`);
  for (const c of codes) {
    console.log(`  - ${c.code} | user=${c.user?.email ?? 'unclaimed'} | remaining=${c.sessionsRemaining} | card=${c.orderItem.cardTitle}`);
  }
}
main().finally(() => prisma.$disconnect());
