import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== GiftCardType (seed) ===');
  const giftCardTypes = await prisma.giftCardType.findMany();
  console.log(`count: ${giftCardTypes.length}`);
  for (const t of giftCardTypes) {
    console.log(`  - ${t.slug} | ${t.title} | ${t.sessions} session(s) | ₦${(t.price/100).toLocaleString()} | tag=${t.tag} | active=${t.isActive}`);
  }

  console.log('\n=== Row counts ===');
  console.log(`  Users:       ${await prisma.user.count()}`);
  console.log(`  Orders:      ${await prisma.order.count()}`);
  console.log(`  Redemptions: ${await prisma.redemption.count()}`);
  console.log(`  Bookings:    ${await prisma.booking.count()}`);

  console.log('\n=== Recent orders (last 5) ===');
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      orderItems: { select: { id: true, cardTitle: true, recipientName: true, recipientEmail: true } },
      redemptions: { select: { id: true, code: true, status: true, sessionsRemaining: true } },
    },
  });
  for (const o of recentOrders) {
    console.log(`  • ${o.orderNumber} | status=${o.status} | ₦${(o.totalAmount/100).toLocaleString()} | buyer=${o.buyerEmail} | createdAt=${o.createdAt.toISOString()}`);
    for (const oi of o.orderItems) {
      console.log(`      item: card=${oi.cardTitle} recipient=${oi.recipientName} <${oi.recipientEmail}>`);
    }
    for (const r of o.redemptions) {
      console.log(`      redemption: code=${r.code} status=${r.status} sessionsRemaining=${r.sessionsRemaining}`);
    }
  }

  console.log('\n=== Recent bookings (last 5) ===');
  const recentBookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { user: { select: { email: true } } },
  });
  for (const b of recentBookings) {
    console.log(`  • ${b.bookingNumber} | user=${b.user?.email ?? 'orphaned'} | type=${b.sessionType} | title=${b.sessionTitle} | date=${b.scheduledDate.toISOString().slice(0,10)} ${b.scheduledTime} | status=${b.status}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
