import { db } from "@/lib/db";

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed gift card types
  const cardTypes = [
    {
      slug: "one",
      title: "One Session",
      sessions: 1,
      price: 25000,
      gradient: "from-[#E8D5F2] via-[#F5E3F0] to-[#FBD7E3]",
      description: "A single, unhurried session. Perfect for a first step or a moment of release when life gets loud.",
      tag: "Flexible",
    },
    {
      slug: "two",
      title: "Two Sessions",
      sessions: 2,
      price: 40000,
      gradient: "from-[#FFE0C2] via-[#FFD1DC] to-[#FDC4D6]",
      description: "Two sessions to settle in, go deeper, and start building the rhythm of care that actually sticks.",
      tag: "Momentum",
    },
    {
      slug: "three",
      title: "Three Sessions",
      sessions: 3,
      price: 75000,
      gradient: "from-[#D6C7F2] via-[#E0CBF0] to-[#F0CFE6]",
      description: "Three sessions for a real arc — name it, sit with it, and leave with something you can actually carry.",
      tag: "Ongoing Care",
    },
  ];

  for (const card of cardTypes) {
    const existing = await db.giftCardType.findUnique({ where: { slug: card.slug } });
    if (!existing) {
      await db.giftCardType.create({ data: card });
      console.log(`  ✅ Created gift card: ${card.title}`);
    } else {
      console.log(`  ⏭️  Already exists: ${card.title}`);
    }
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
