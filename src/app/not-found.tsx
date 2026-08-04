"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-20 sm:px-8 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <h1 className="font-fraunces text-7xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-8xl lg:text-9xl">
          404
        </h1>
        <h2 className="mt-4 font-fraunces text-2xl font-bold text-white sm:text-3xl">
          This page took a wellness break
        </h2>
        <p className="mx-auto mt-3 max-w-sm font-sans text-sm text-white/80 sm:text-base">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back to somewhere peaceful.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full bg-[#2C292E] px-7 py-3.5 font-sans text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.03] hover:bg-[#1F1B22] active:scale-95 sm:text-base"
          >
            <Home className="h-5 w-5" strokeWidth={2.5} />
            Back to Home
          </Link>
          <Link
            href="/gift-cards"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-sans text-sm font-semibold text-[#2C292E] shadow-lg transition-all duration-200 hover:scale-[1.03] hover:bg-blush active:scale-95 sm:text-base"
          >
            Browse Gift Cards
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
