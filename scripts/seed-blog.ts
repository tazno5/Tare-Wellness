// Seed sample blog posts + newsletter posts for the /blog hub.
// Run with: bunx tsx --env-file=.env scripts/seed-blog.ts
import { db } from "@/lib/db";

const POSTS = [
  {
    title: "Welcome to the Tare Wellness Journal",
    slug: "welcome-to-tare-wellness-journal",
    excerpt:
      "Why we built Tare, what we believe about rest, and what you can expect from this little corner of the internet.",
    category: "ARTICLE",
    author: "Tare Team",
    coverImage: "/hero-home.png",
    readTime: "4 min read",
    content: `# Welcome to the Tare Wellness Journal

We built Tare because we wanted to give people in Nigeria an easier way to send care — not just gifts, but *permission to rest*.

## Why we started

A gift card sounds transactional. But when someone opens an email that says *"someone thought you deserved a massage this week"* — that's not a transaction. That's a hand on a shoulder.

## What we believe

- Rest is not a luxury. It's maintenance.
- A thoughtful gift is one that gives the receiver a choice.
- Wellness looks different on everyone. So our gift cards don't lock you into one thing.

## What to expect here

This journal will be a quiet, slow stream of essays, practitioner spotlights, and the occasional newsletter about new sessions and offerings. No noise. Just care.

— **The Tare Team**
`,
  },
  {
    title: "Five Small Ways to Rest This Week",
    slug: "five-small-ways-to-rest-this-week",
    excerpt:
      "You don't need a weekend retreat to reset. Here are five small, almost-free things you can do in the next seven days.",
    category: "ARTICLE",
    author: "Tare Team",
    coverImage: "/hero-faq.png",
    readTime: "5 min read",
    content: `# Five Small Ways to Rest This Week

We tend to think of rest as a thing we *earn* after we've been productive enough. But rest isn't a reward. It's the soil that lets everything else grow.

## 1. Take the long way home

Once this week, walk an extra ten minutes. Without your phone. You'll be surprised how much thinking gets done when nothing's asking for your attention.

## 2. Drink water before coffee

It sounds small. But the first thing your body wants in the morning is water, not caffeine. Try it for three days.

## 3. Cancel one thing

Look at your week. There's something on the calendar you're dreading purely out of obligation. Cancel it. The world will keep turning.

## 4. Book the session

You've been thinking about a massage, a therapy session, a yoga class for weeks. **Just book it.** This is literally what Tare gift cards are for.

## 5. Go to bed an hour earlier

Everything else on this list is easier when you've slept. Start here.

— **The Tare Team**
`,
  },
  {
    title: "October Newsletter — New Sessions & a Hello from Our Practitioners",
    slug: "october-newsletter-new-sessions",
    excerpt:
      "What's new on Tare this month, plus three practitioners you should know about.",
    category: "NEWSLETTER",
    author: "Tare Team",
    coverImage: "/hero-how-it-works.png",
    readTime: "3 min read",
    content: `# October Newsletter

Hello, friends. A quick note from the Tare kitchen.

## New this month

We've added three new session types — **deep tissue massage**, **breathwork**, and **couples therapy**. All three are bookable right now with any Tare gift card.

## Three practitioners to know

### Adaeze, Massage Therapist (Lagos)

Adaeze has been doing bodywork for eight years and specializes in shoulders and necks — the parts of us that carry the day.

### Femi, Breathwork Coach (Remote)

Femi runs 30-minute sessions over video. He says: "you don't have to do anything right. You just have to breathe."

### Chioma, Therapist (Abuja)

Chioma works with young adults navigating transitions — new jobs, new cities, new relationships. Gentle, warm, and very good.

## A small thank you

To everyone who's sent a Tare gift card this month: thank you. You've put a few hundred people in front of practitioners they wouldn't have found otherwise. That's the whole point.

See you next month.

— **The Tare Team**
`,
  },
  {
    title: "How to Buy a Gift Card for Someone Who 'Has Everything'",
    slug: "gift-card-for-someone-who-has-everything",
    excerpt:
      "The hardest people to buy for are the easiest to disappoint. Here's how to think about it.",
    category: "ARTICLE",
    author: "Tare Team",
    coverImage: "/hero-giftcards.png",
    readTime: "4 min read",
    content: `# How to Buy a Gift Card for Someone Who 'Has Everything'

We all have one — the person in our life who, when you ask what they want for their birthday, says *"oh, nothing, I'm fine."*

## The trick: give them permission, not a thing

People who "have everything" usually don't have one specific thing: *permission to slow down.* A wellness gift card is a way of saying: I see how hard you're carrying everything, and I want you to put it down for an hour.

## Why a Tare card, specifically

Generic gift cards put the burden of choice on the recipient — they have to know what they want, find a shop, decide. A Tare card narrows the choice to one good question: *what kind of care do you need today?*

## What to write in the card

A line is enough. Something like:

> "I know you don't ask for much. So I asked for you. Take this — whenever you need it."

— **The Tare Team**
`,
  },
  {
    title: "September Newsletter — Behind the Scenes at Tare",
    slug: "september-newsletter-behind-the-scenes",
    excerpt:
      "A quick look at what we've been building, what we've been learning, and what's coming next.",
    category: "NEWSLETTER",
    author: "Tare Team",
    coverImage: "/hero-book-session.png",
    readTime: "3 min read",
    content: `# September Newsletter — Behind the Scenes at Tare

A short one this month. Here's where we are.

## What we built

The website is faster, the redemption flow is simpler, and we added a "How It Works" page that explains the whole thing in two minutes.

## What we learned

You all really, really like the *Three Sessions* gift card. About 60% of all gift cards sold this month were that one. We hear you.

## What's coming

- New session types in October (massage, breathwork, therapy)
- A loyalty programme for repeat senders — still cooking
- A small blog. Yes, this one. Welcome.

— **The Tare Team**
`,
  },
  {
    title: "What 'Wellness' Actually Means in Nigeria Right Now",
    slug: "what-wellness-means-in-nigeria-right-now",
    excerpt:
      "Wellness isn't a foreign idea — it's just been called other things for a long time. Here's what we're seeing.",
    category: "ARTICLE",
    author: "Tare Team",
    coverImage: "/hero-redeem.png",
    readTime: "6 min read",
    content: `# What 'Wellness' Actually Means in Nigeria Right Now

Wellness, as a word, has been borrowed and bent by a lot of industries. So let's be clear about what we mean.

## It's not a green smoothie

Wellness, for us, is just *the things you do to keep yourself well.* That's it. Therapy is wellness. A massage is wellness. Calling your grandmother is wellness. Saying no to a meeting is wellness.

## It's not new here

Our grandmothers had *ariro* (calabash baths), *ogwu oji* (herbal tonics), long walks to the farm, and silence at dawn. We didn't invent rest. We're just trying to make it easier to access.

## What's actually changing

What's new is *access.* You can now book a therapist in Abuja from a kitchen in Port Harcourt. You can send a friend in Lagos a massage without knowing which massage place is good. The care was always there. The infrastructure wasn't.

## What we want to be

A small bridge. Nothing more. The care is yours. We just help it move.

— **The Tare Team**
`,
  },
];

async function seedBlog() {
  console.log("🌱 Seeding blog posts...");

  for (const post of POSTS) {
    const existing = await db.post.findUnique({ where: { slug: post.slug } });
    if (existing) {
      console.log(`  ↪ existing: ${post.slug}`);
      continue;
    }
    await db.post.create({
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        author: post.author,
        coverImage: post.coverImage,
        readTime: post.readTime,
        publishedAt: new Date(),
        isPublished: true,
      },
    });
    console.log(`  ✅ created: ${post.slug}`);
  }

  console.log("✅ Done.");
}

seedBlog()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
