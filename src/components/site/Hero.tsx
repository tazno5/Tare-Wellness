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
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#C7B2E2]/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#BCE1F0]/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-1/3 top-1/4 h-2 w-2 rounded-full bg-white/60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/4 top-1/2 h-1.5 w-1.5 rounded-full bg-[#E8B6D5]"
      />

      {/* Centered layout — image on top, text below */}
      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center">
        {/* Hero image — centered, full illustration visible */}
        <motion.div
          variants={itemImage}
          initial="hidden"
          animate="show"
          className="relative aspect-square w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[560px]"
        >
          {/* Watercolor liquid morphing background layer (z-1) */}
          <div aria-hidden className="absolute inset-0 z-[1] overflow-hidden rounded-[3rem]">
            <div className="absolute inset-0 animate-watercolor-morph">
              <div className="absolute left-[10%] top-[15%] h-[50%] w-[50%] rounded-full bg-[#C7B2E2]/40 blur-3xl animate-blob-1" />
              <div className="absolute right-[5%] top-[20%] h-[45%] w-[45%] rounded-full bg-[#B5E1C3]/35 blur-3xl animate-blob-2" />
              <div className="absolute left-[20%] bottom-[10%] h-[40%] w-[40%] rounded-full bg-[#BCE1F0]/35 blur-3xl animate-blob-3" />
              <div className="absolute right-[15%] bottom-[15%] h-[35%] w-[35%] rounded-full bg-[#E8B6D5]/30 blur-3xl animate-blob-4" />
            </div>
          </div>
          {/* Foreground image layer (z-3, static) */}
          <div
            aria-hidden
            className="absolute inset-6 z-[2] rounded-full bg-white/10 blur-2xl"
          />
          <Image
            src="/hero-home.png"
            alt="A Black couple back-to-back using holographic TARE Wellness phones, surrounded by a vibrant watercolor splash"
            fill
            priority
            quality={95}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 480px, 560px"
            className="hero-shadow relative z-[3] animate-float-slow object-contain"
          />
        </motion.div>

        {/* Text content — below the image */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-8 flex flex-col items-center text-center"
        >
          {/* Headline — Fraunces serif */}
          <motion.h1
            variants={itemUp}
            className="font-fraunces text-5xl font-extrabold leading-[1.02] tracking-tight bg-gradient-to-r from-[#2750D8] to-[#90AAFF] bg-clip-text text-transparent sm:text-6xl lg:text-7xl xl:text-8xl"
          >
            Send Love
            <br />
            <span className="text-[#90AAFF]">They Can Feel</span>
          </motion.h1>

          {/* Body copy */}
          <motion.p
            variants={itemUp}
            className="mt-7 max-w-xl font-sans text-[18px] leading-relaxed text-[#4E0030]/80"
          >
            A gift card. A real session. Their pace, not yours.
          </motion.p>

          {/* Action buttons */}
          <motion.div
            variants={itemUp}
            className="mt-9 flex w-full flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
          >
            <Link
              href="/gift-cards"
              className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[#F10897] px-7 py-4 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(78, 0, 48, 0.25)] transition-all duration-200 hover:scale-[1.03] hover:bg-[#d4007d] active:scale-95 sm:text-base"
            >
              <Gift className="h-5 w-5 transition-transform group-hover:rotate-[-8deg]" strokeWidth={2.5} />
              Send a Gift Card
            </Link>
            <Link
              href="/redeem"
              className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-white border-[0.3px] border-[#F10897] px-7 py-4 font-sans text-sm font-semibold text-[#F10897] shadow-[0_8px_24px_rgba(78, 0, 48, 0.12)] transition-all duration-200 hover:scale-[1.03] hover:bg-[#E8B6D5]/15 active:scale-95 sm:text-base"
            >
              <CalendarDays className="h-5 w-5 transition-transform group-hover:scale-110" strokeWidth={2.5} />
              I Received a Gift{" "}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
