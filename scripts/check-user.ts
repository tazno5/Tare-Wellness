import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 3 });
  console.log('Most recent 3 users:');
  for (const u of users) {
    console.log(`  - id=${u.id} | email=${u.email} | name=${u.name} | createdAt=${u.createdAt.toISOString()}`);
  }
}
main().finally(() => prisma.$disconnect());
