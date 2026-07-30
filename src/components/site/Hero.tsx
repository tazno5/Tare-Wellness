"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gift, CalendarDays } from "lucide-react";

// Framer Motion variants — soft fade-in + slight upward drift
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

const itemImage = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Hero() {
  return (
    <section
      id="how-it-works"
      className="relative w-full overflow-hidden px-5 pb-16 pt-6 sm:px-8 sm:pb-20 lg:px-12 lg:pb-28 lg:pt-8"
    >
      {/* Decorative blurred blooms in the background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blush/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-brand-to/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-1/3 top-1/4 h-2 w-2 rounded-full bg-white/60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/4 top-1/2 h-1.5 w-1.5 rounded-full bg-blush"
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-12">
        {/* LEFT: Content column */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="order-2 flex flex-col items-start lg:order-1"
        >
          {/* Headline — Fraunces serif */}
          <motion.h1
            variants={itemUp}
            className="font-fraunces text-5xl font-extrabold leading-[1.02] tracking-tight text-maroon sm:text-6xl lg:text-7xl xl:text-8xl"
          >
            Send Love
            <br />
            <span className="text-maroon-soft">They Can Feel</span>
          </motion.h1>

          {/* Body copy — Plus Jakarta Sans, exactly 18px */}
          <motion.p
            variants={itemUp}
            className="mt-7 max-w-xl font-sans text-[18px] leading-relaxed text-maroon/80"
          >
            A gift card. A real session. Their pace, not yours.
          </motion.p>

          {/* Action buttons */}
          <motion.div
            variants={itemUp}
            className="mt-9 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap"
          >
            <Link
              href="/gift-cards"
              className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[#4E0030] px-7 py-4 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(61,0,46,0.25)] transition-all duration-200 hover:scale-[1.03] hover:bg-[#3a0023] active:scale-95 sm:text-base"
            >
              <Gift className="h-5 w-5 transition-transform group-hover:rotate-[-8deg]" strokeWidth={2.5} />
              Send a Gift Card
            </Link>
            <Link
              href="/redeem"
              className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-blush px-7 py-4 font-sans text-sm font-semibold text-maroon shadow-[0_8px_24px_rgba(61,0,46,0.12)] transition-all duration-200 hover:scale-[1.03] hover:bg-blush-dark active:scale-95 sm:text-base"
            >
              <CalendarDays className="h-5 w-5 transition-transform group-hover:scale-110" strokeWidth={2.5} />
              I Received a Gift{" "}
            </Link>
          </motion.div>
        </motion.div>

        {/* RIGHT: Visual column */}
        <motion.div
          variants={itemImage}
          initial="hidden"
          animate="show"
          className="order-1 flex items-center justify-center lg:order-2"
        >
          <div className="relative aspect-square w-full max-w-[460px] sm:max-w-[520px] lg:max-w-[620px]">
            <div
              aria-hidden
              className="absolute inset-6 rounded-full bg-maroon/15 blur-2xl"
            />
            <Image
              src="/hero.png"
              alt="Two smurf-like woodland creatures with mushroom caps sitting together on a mossy log, holding glowing blue mushrooms and acorns"
              fill
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 520px, 620px"
              className="hero-shadow relative animate-float-slow object-contain"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
