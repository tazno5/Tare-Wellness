import { db } from "@/lib/db";

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed gift card types
  const cardTypes = [
    {
      slug: "one",
      title: "Seed — One Session",
      sessions: 1,
      price: 20000,
      gradient: "from-[#E8D5F2] via-[#F5E3F0] to-[#FBD7E3]",
      description: "One session. All theirs.",
      tag: "Flexible",
    },
    {
      slug: "two",
      title: "Root — Two Sessions",
      sessions: 2,
      price: 39000,
      gradient: "from-[#FFE0C2] via-[#FFD1DC] to-[#FDC4D6]",
      description: "Two sessions. Or split it — give one away.",
      tag: "Momentum",
    },
    {
      slug: "three",
      title: "Grove — Three Sessions",
      sessions: 3,
      price: 57000,
      gradient: "from-[#D6C7F2] via-[#E0CBF0] to-[#F0CFE6]",
      description: "Three sessions of steady care.",
      tag: "Ongoing Care",
    },
  ];

  for (const card of cardTypes) {
    await db.giftCardType.upsert({
      where: { slug: card.slug },
      update: card,
      create: card,
    });
    console.log(`  ✅ Upserted gift card: ${card.title}`);
  }

  console.log("✅ Seed complete!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
