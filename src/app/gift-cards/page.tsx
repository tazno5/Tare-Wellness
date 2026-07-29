"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

type GiftCard = {
  id: string;
  title: string;
  sessionCount: number;
  price: string;
  tag: string;
  description: string;
  gradient: string; // tailwind gradient classes for the top graphic
};

const CARDS: GiftCard[] = [
  {
    id: "one",
    title: "One Therapy Session",
    sessionCount: 1,
    price: "₦25,000",
    tag: "Flexible",
    description:
      "A single, unhurried session. Perfect for a first step or a moment of release when life gets loud.",
    gradient: "from-[#E8D5F2] via-[#F5E3F0] to-[#FBD7E3]",
  },
  {
    id: "two",
    title: "Two Therapy Sessions",
    sessionCount: 2,
    price: "₦40,000",
    tag: "Momentum",
    description:
      "Two sessions to settle in, go deeper, and start building the rhythm of care that actually sticks.",
    gradient: "from-[#FFE0C2] via-[#FFD1DC] to-[#FDC4D6]",
  },
  {
    id: "three",
    title: "Three Therapy Sessions",
    sessionCount: 3,
    price: "₦75,000",
    tag: "Ongoing Care",
    description:
      "Three sessions for a real arc — name it, sit with it, and leave with something you can actually carry.",
    gradient: "from-[#D6C7F2] via-[#E0CBF0] to-[#F0CFE6]",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function GiftCardPage() {
  return (
    <main className="relative flex flex-1 flex-col bg-gradient-to-b from-[#FCE4EC] to-[#F10897]">
      {/* ============ HERO ============ */}
      <section className="relative w-full overflow-hidden px-5 pb-12 pt-10 sm:px-8 sm:pb-16 lg:px-12 lg:pt-16">
        {/* Decorative soft blooms */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-white/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-32 h-72 w-72 rounded-full bg-[#F10897]/20 blur-3xl"
        />

        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          {/* Top pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-[0_4px_15px_rgba(61,0,46,0.08)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-maroon" strokeWidth={2.5} />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-maroon sm:text-xs">
              The Gift of Wellness
            </span>
          </motion.div>

          {/* Headline — Fraunces, "a moment of peace" italic */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight text-maroon sm:text-5xl lg:text-6xl"
          >
            Send care in the form of{" "}
            <span className="italic font-semibold">a moment of peace</span>.
          </motion.h1>

          {/* Subtitle — Plus Jakarta Sans, 16-18px */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-xl font-sans text-[16px] leading-relaxed text-maroon/85 sm:text-[18px]"
          >
            Tare gift cards provide access to premium therapy sessions,
            curated wellness experiences, and a journey toward inner peace.
          </motion.p>

          {/* Hero image — centered, drop shadow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-10 aspect-[534/500] w-full max-w-md sm:max-w-lg lg:max-w-xl"
          >
            <div
              aria-hidden
              className="absolute inset-6 rounded-full bg-white/30 blur-2xl"
            />
            <Image
              src="/hero-giftcards.png"
              alt="Two whimsical mushroom-cap creatures exchanging a gift, surrounded by glowing mushrooms and acorns"
              fill
              priority
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 500px, 576px"
              className="hero-shadow relative animate-float-slow object-contain"
            />
          </motion.div>
        </div>
      </section>

      {/* ============ GIFT CARD GRID (3 cards only) ============ */}
      <section className="relative w-full px-5 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
          >
            {CARDS.map((card) => (
              <motion.article
                key={card.id}
                variants={itemUp}
                className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_10px_40px_rgba(61,0,46,0.12)] transition-transform duration-300 hover:-translate-y-1"
              >
                {/* Top pastel graphic */}
                <div
                  className={`relative flex h-36 flex-col items-center justify-center bg-gradient-to-br ${card.gradient} px-6 py-6 sm:h-40`}
                >
                  <span className="font-fraunces text-lg font-bold text-maroon sm:text-xl">
                    Tare Gift Card
                  </span>
                  <span className="mt-1 font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-maroon/70 sm:text-xs">
                    {card.sessionCount} {card.sessionCount === 1 ? "Session" : "Sessions"}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-sans text-lg font-bold text-maroon sm:text-xl">
                    {card.title}
                  </h3>

                  {/* Pills */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-blush px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-maroon sm:text-[11px]">
                      {card.sessionCount} Session{card.sessionCount === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-blush px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-maroon sm:text-[11px]">
                      {card.tag}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mt-4 font-sans text-sm leading-relaxed text-maroon/75">
                    {card.description}
                  </p>

                  {/* Footer: price + select */}
                  <div className="mt-6 flex items-center justify-between gap-3 pt-2">
                    <span className="font-sans text-xl font-extrabold text-maroon sm:text-2xl">
                      {card.price}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full bg-[#4E0030] px-6 py-2.5 font-sans text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.03] hover:bg-[#3a0023] active:scale-95"
                    >
                      Select
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
