import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Users in your Supabase DB ===');
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { orders: true, bookings: true, redemptions: true },
      },
    },
  });
  for (const u of users) {
    console.log(`  • ${u.email} | name="${u.name}" | role="${u.role}" | orders=${u._count.orders} | bookings=${u._count.bookings} | createdAt=${u.createdAt.toISOString().slice(0,10)}`);
  }
  console.log(`\nTotal: ${users.length} users`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
