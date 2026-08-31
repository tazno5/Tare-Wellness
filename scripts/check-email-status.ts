import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check email send status across all order items in the DB
  const orderItems = await prisma.orderItem.findMany({
    select: {
      id: true,
      recipientEmail: true,
      recipientName: true,
      cardTitle: true,
      emailSent: true,
      emailSentAt: true,
      order: {
        select: {
          orderNumber: true,
          createdAt: true,
        },
      },
    },
    orderBy: { order: { createdAt: 'desc' } },
    take: 20,
  });

  console.log('=== Email send status across recent orders ===\n');
  const sent = orderItems.filter(oi => oi.emailSent);
  const notSent = orderItems.filter(oi => !oi.emailSent);

  console.log(`Sent: ${sent.length} / ${orderItems.length}`);
  console.log(`Not sent: ${notSent.length} / ${orderItems.length}`);

  console.log('\n--- Recent order items (last 20) ---');
  for (const oi of orderItems) {
    const status = oi.emailSent ? `✅ sent ${oi.emailSentAt?.toISOString().slice(0, 16).replace('T', ' ')}` : '❌ not sent';
    console.log(`  ${oi.order.orderNumber} | ${oi.order.createdAt.toISOString().slice(0, 10)} | ${status} | to=${oi.recipientEmail} | card=${oi.cardTitle}`);
  }

  // Try sending a test email to verify Brevo works
  console.log('\n=== Triggering test email send to verify Brevo ===\n');
  const firstUnsent = notSent[0];
  if (!firstUnsent) {
    console.log('No unsent order items found. All emails were sent.');
    return;
  }
  console.log(`Found unsent order item: ${firstUnsent.id}`);
  console.log(`Recipient: ${firstUnsent.recipientEmail}`);
  console.log(`Triggering POST /api/email/send with orderItemId: ${firstUnsent.id}\n`);

  // Boot a quick HTTP request to the dev server's /api/email/send
  // (Will fail if dev server isn't running — that's OK, just print the body for manual testing)
  const payload = JSON.stringify({ orderItemId: firstUnsent.id, force: true });
  console.log('curl command to send:');
  console.log(`  curl -X POST http://localhost:3000/api/email/send \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '${payload}'`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
