"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Copy, CalendarClock, Video, Bell, Leaf, MapPin, ArrowRight, Heart, Mail, MessageSquare, Sparkles, PartyPopper, Clock } from "lucide-react";
import { useStore } from "@/lib/store";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const NEXT_STEPS = [
  {
    icon: <Check className="h-5 w-5" strokeWidth={2.5} />,
    title: "Confirmation",
    body: "You'll receive an email receipt with all the details of your booking.",
  },
  {
    icon: <Bell className="h-5 w-5" strokeWidth={2.5} />,
    title: "Reminder",
    body: "We'll send a gentle reminder 24 hours and 10 minutes before your session.",
  },
  {
    icon: <Mail className="h-5 w-5" strokeWidth={2.5} />,
    title: "Preparation",
    body: "Find a quiet, private space. Have a notebook nearby if it helps you think.",
  },
  {
    icon: <MessageSquare className="h-5 w-5" strokeWidth={2.5} />,
    title: "Meeting",
    body: "Click the WhatsApp link 5 minutes early to settle in and say hello.",
  },
];

function formatDate(iso: string | null): string {
  if (!iso) return "Tuesday, February 17, 2026";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Tuesday, February 17, 2026";
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Tuesday, February 17, 2026";
  }
}

export default function BookingConfirmationPage() {
  const { booking } = useStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.body.style.setProperty("--page-gradient-from", "#FCE4EC");
    document.body.style.setProperty("--page-gradient-to", "#F10897");
  }, []);

  const meetingUrl = "https://wa.me/2349036530892";

  const formattedDate = booking.selectedDate
    ? formatDate(booking.selectedDate)
    : "Tuesday, February 17, 2026";

  const sessionLabel =
    booking.sessionTitle && booking.sessionTitle.length > 0
      ? booking.sessionTitle
      : "One-on-One";

  const sessionTime = booking.selectedTime || "10:30 AM";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback: do nothing
    }
  };

  return (
    <main className="relative flex flex-1 flex-col">
      {/* Decorative blooms */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-white/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-[#F10897]/20 blur-3xl"
      />

      {/* ============ HERO ============ */}
      <section className="relative w-full overflow-hidden px-5 pb-6 pt-6 sm:px-8 sm:pb-10 lg:px-12">
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-2 aspect-[1058/734] w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[420px]"
          >
            <div
              aria-hidden
              className="absolute inset-6 rounded-full bg-white/30 blur-2xl"
            />
            <Image
              src="/hero-booking-confirmation.png"
              alt="A serene whimsical creature resting beneath a glowing checkmark, surrounded by floating spores of light"
              fill
              priority
              sizes="(max-width: 640px) 70vw, (max-width: 1024px) 340px, 420px"
              className="hero-shadow relative animate-float-slow object-contain"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-[0_4px_15px_rgba(61,0,46,0.08)]"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#F10897] text-white">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-maroon sm:text-xs">
              Booking Confirmed
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight text-maroon sm:text-5xl lg:text-6xl"
          >
            Your journey is officially booked!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-xl font-sans text-[15px] leading-relaxed text-maroon/85 sm:text-[17px]"
          >
            Take a breath — the hard part is done. Here&apos;s everything you need
            to step into your session with ease.
          </motion.p>
        </div>
      </section>

      {/* ============ CONFIRMATION CARD ============ */}
      <section className="relative w-full px-5 pb-10 sm:px-8 lg:px-12">
        <motion.article
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_50px_rgba(61,0,46,0.15)]"
        >
          {/* Header strip */}
          <div className="flex flex-col gap-3 border-b border-maroon/10 bg-blush/40 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4E0030] text-white">
                <PartyPopper className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-maroon/60">
                  Confirmation No.
                </p>
                <p className="font-fraunces text-lg font-extrabold tracking-wide text-maroon sm:text-xl">
                  BK-2026-004821
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#F10897] px-3 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white">
              <Sparkles className="h-3 w-3" strokeWidth={2.5} />
              Saved to your account
            </span>
          </div>

          {/* Body — two columns */}
          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-2 lg:gap-8">
            {/* Left: Date & Time + Session Type */}
            <div className="flex flex-col gap-5">
              {/* Date & Time */}
              <div className="rounded-2xl border border-maroon/10 bg-blush/30 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-maroon/70">
                  <CalendarClock className="h-4 w-4" strokeWidth={2.5} />
                  <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em]">
                    Date &amp; Time
                  </span>
                </div>
                <p className="mt-2 font-fraunces text-base font-bold text-maroon sm:text-lg">
                  {formattedDate}
                </p>
                <p className="mt-1 font-sans text-sm font-bold text-[#F10897]">
                  {sessionTime}
                </p>
                <p className="mt-0.5 font-sans text-[11px] text-maroon/60">
                  West Africa Time (WAT)
                </p>
              </div>

              {/* Session Type */}
              <div className="rounded-2xl border border-maroon/10 bg-blush/30 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-maroon/70">
                  <Video className="h-4 w-4" strokeWidth={2.5} />
                  <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em]">
                    Session Type
                  </span>
                </div>
                <p className="mt-2 font-fraunces text-base font-bold text-maroon sm:text-lg">
                  {sessionLabel}
                </p>
                <p className="mt-1 font-sans text-sm text-maroon/75">
                  WhatsApp Session (45 Minutes)
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 font-sans text-[11px] text-maroon/60">
                  <Heart className="h-3 w-3" strokeWidth={2.5} />
                  With {booking.therapist || "Your Provider"}
                </p>
              </div>
            </div>

            {/* Right: Join via WhatsApp */}
            <div className="rounded-2xl border border-[#F10897]/20 bg-blush/60 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-maroon/70">
                <MessageSquare className="h-4 w-4" strokeWidth={2.5} />
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em]">
                  Join via WhatsApp
                </span>
              </div>
              <p className="mt-2 font-sans text-sm font-bold text-maroon">
                Your WhatsApp link
              </p>

              <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-[0_4px_15px_rgba(61,0,46,0.08)]">
                <code className="flex-1 truncate font-mono text-sm font-bold text-maroon">
                  {meetingUrl}
                </code>
                <a
                  href={meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open WhatsApp"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition-all hover:bg-[#1da851] active:scale-90"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy WhatsApp link"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4E0030] text-white transition-all hover:bg-[#3a0023] active:scale-90"
                >
                  {copied ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <Copy className="h-4 w-4" strokeWidth={2.5} />
                  )}
                </button>
              </div>

              <p className="mt-3 inline-flex items-start gap-1.5 font-sans text-[11px] leading-relaxed text-maroon/70">
                <Clock className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2.5} />
                Tap the link 5 minutes before your session to join the chat.
              </p>

              <div className="mt-4 rounded-xl bg-white/70 p-3">
                <p className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-maroon/70">
                  Quick tip
                </p>
                <p className="mt-1 font-sans text-[12px] leading-relaxed text-maroon/75">
                  Headphones help. A glass of water nearby helps more.
                </p>
              </div>
            </div>
          </div>
        </motion.article>
      </section>

      {/* ============ WHAT HAPPENS NEXT ============ */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-maroon shadow-[0_4px_15px_rgba(61,0,46,0.08)]">
            <Sparkles className="h-3 w-3" strokeWidth={2.5} />
            The path ahead
          </span>
          <h2 className="mt-4 font-fraunces text-3xl font-extrabold text-maroon sm:text-4xl">
            What Happens Next?
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-sans text-sm leading-relaxed text-maroon/70 sm:text-base">
            Four gentle steps between now and the moment your session begins.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mt-8 grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {NEXT_STEPS.map((step, i) => (
            <motion.article
              key={step.title}
              variants={itemUp}
              className="relative flex flex-col rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(61,0,46,0.10)] backdrop-blur-sm sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-[#F10897]/40 bg-blush/60 text-[#F10897]">
                  {step.icon}
                </div>
                <span className="font-fraunces text-3xl font-extrabold text-maroon/15">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-4 font-fraunces text-lg font-bold text-maroon">
                {step.title}
              </h3>
              <p className="mt-1.5 font-sans text-sm leading-relaxed text-maroon/75">
                {step.body}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* ============ BOTTOM CTA ============ */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-3 text-center">
          <p className="font-sans text-sm text-maroon/70">
            Want to share the moment or send another gift?
          </p>
          <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/gift-cards"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#4E0030] px-7 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(61,0,46,0.25)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#3a0023] active:scale-95 sm:w-auto"
            >
              <Sparkles className="h-4 w-4" strokeWidth={2.5} />
              Send a Gift Card
            </Link>
            <Link
              href="/redeem"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-blush px-7 py-3.5 font-sans text-sm font-semibold text-maroon shadow-[0_8px_24px_rgba(61,0,46,0.12)] transition-all duration-200 hover:scale-[1.02] hover:bg-blush-dark active:scale-95 sm:w-auto"
            >
              Redeem Another
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                strokeWidth={2.5}
              />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
