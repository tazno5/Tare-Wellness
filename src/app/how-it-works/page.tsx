"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Sparkles,
  Gift,
  PenLine,
  Mail,
  Ticket,
  CalendarCheck,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
  Lock,
  BadgeCheck,
  Headphones,
  Clock,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

const TIMELINE = [
  {
    icon: <Gift className="h-5 w-5" strokeWidth={2.5} />,
    title: "Choose a Gift Card",
    body: "Pick a one, two, or three-session card. Whatever feels right for the person you're thinking of.",
  },
  {
    icon: <PenLine className="h-5 w-5" strokeWidth={2.5} />,
    title: "Personalize Your Gift",
    body: "Add their name, your note, and an occasion. We'll dress it up beautifully on their behalf.",
  },
  {
    icon: <Mail className="h-5 w-5" strokeWidth={2.5} />,
    title: "Deliver by Email",
    body: "Send it instantly or schedule it for the right moment. They'll get a keepsake they can reopen.",
  },
  {
    icon: <Ticket className="h-5 w-5" strokeWidth={2.5} />,
    title: "Redeem the Gift",
    body: "They enter their code on Tare and unlock session credit — no pressure, no expiration.",
  },
  {
    icon: <CalendarCheck className="h-5 w-5" strokeWidth={2.5} />,
    title: "Book a Session",
    body: "They choose a session type, pick a time that fits their life, and confirm with one tap.",
  },
  {
    icon: <HeartHandshake className="h-5 w-5" strokeWidth={2.5} />,
    title: "Begin the Journey",
    body: "They meet their therapist over video. The work begins — gently, on their own terms.",
  },
];

const FAQS = [
  {
    q: "Does the gift card expire?",
    a: "Never. Tare gift cards carry no expiration date. Your recipient can redeem it tomorrow, next month, or whenever the moment feels right.",
  },
  {
    q: "Can I choose a specific therapist?",
    a: "You gift the credit — they choose the therapist. We'll show them options based on what they need, and they decide who feels like the right fit.",
  },
  {
    q: "Is it completely confidential?",
    a: "Yes. What happens in their session stays between them and their therapist. You'll only know what they choose to share with you.",
  },
];

const QUALITY = [
  {
    icon: <Lock className="h-5 w-5" strokeWidth={2.5} />,
    title: "Secure Transactions",
    body: "256-bit encryption on every payment. Your details are protected end-to-end.",
  },
  {
    icon: <BadgeCheck className="h-5 w-5" strokeWidth={2.5} />,
    title: "Qualified Professionals",
    body: "Every therapist is licensed, vetted, and committed to trauma-informed care.",
  },
  {
    icon: <Mail className="h-5 w-5" strokeWidth={2.5} />,
    title: "Instant Delivery",
    body: "Gift cards land in their inbox the moment your payment is confirmed.",
  },
  {
    icon: <Headphones className="h-5 w-5" strokeWidth={2.5} />,
    title: "24/7 Support",
    body: "Real humans, ready when you need them. We answer fast, and we answer kindly.",
  },
];

export default function HowItWorksPage() {
  // Set gradient — render + useEffect
  useMemo(() => {
    if (typeof document === "undefined") return;
    document.body.style.setProperty("--page-gradient-from", "#FCE4EC");
    document.body.style.setProperty("--page-gradient-to", "#F10897");
  }, []);
  useEffect(() => {
    document.body.style.setProperty("--page-gradient-from", "#FCE4EC");
    document.body.style.setProperty("--page-gradient-to", "#F10897");
    return () => {
      document.body.style.removeProperty("--page-gradient-from");
      document.body.style.removeProperty("--page-gradient-to");
    };
  }, []);

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

      {/* ============ HERO (two-column) ============ */}
      <section className="relative w-full overflow-hidden px-5 pb-10 pt-6 sm:px-8 sm:pb-14 lg:px-12 lg:pt-10">
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 text-center lg:order-1 lg:text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-[0_4px_15px_rgba(61,0,46,0.08)]">
              <Sparkles className="h-3.5 w-3.5 text-maroon" strokeWidth={2.5} />
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-maroon sm:text-xs">
                How It Works
              </span>
            </div>

            <h1 className="mt-5 font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight text-maroon sm:text-5xl lg:text-6xl">
              Sending support is easier than you think
            </h1>

            <p className="mt-4 max-w-xl font-sans text-[15px] leading-relaxed text-maroon/85 sm:text-[17px] lg:max-w-md">
              From picking a card to the first session, the whole journey takes
              just a few minutes. Here&apos;s how care moves from you to them.
            </p>

            <div className="mt-6 flex justify-center lg:justify-start">
              <Link
                href="/gift-cards"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#4E0030] px-6 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(61,0,46,0.25)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#3a0023] active:scale-95"
              >
                Browse Gift Cards
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.5}
                />
              </Link>
            </div>
          </motion.div>

          {/* Right: hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative order-1 mx-auto aspect-[534/500] w-full max-w-[280px] sm:max-w-[340px] lg:order-2 lg:max-w-[440px]"
          >
            <div
              aria-hidden
              className="absolute inset-6 rounded-full bg-white/30 blur-2xl"
            />
            <Image
              src="/hero-how-it-works.png"
              alt="A whimsical creature holding a small glowing lantern, guiding a path of light through a soft landscape"
              fill
              priority
              sizes="(max-width: 640px) 70vw, (max-width: 1024px) 340px, 440px"
              className="hero-shadow relative animate-float-slow object-contain"
            />
          </motion.div>
        </div>
      </section>

      {/* ============ YOUR JOURNEY OF CARE TIMELINE ============ */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-6xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-maroon shadow-[0_4px_15px_rgba(61,0,46,0.08)]">
            <HeartHandshake className="h-3 w-3" strokeWidth={2.5} />
            Step by Step
          </span>
          <h2 className="mt-4 font-fraunces text-3xl font-extrabold text-maroon sm:text-4xl">
            Your Journey of Care
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-sans text-sm leading-relaxed text-maroon/70 sm:text-base">
            Six gentle steps. Most take less than a minute each.
          </p>
        </motion.div>

        <motion.ol
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="relative mx-auto mt-10 grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
        >
          {/* Connector line — visible on lg */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-[#F10897]/30 to-transparent lg:block"
          />

          {TIMELINE.map((step, i) => (
            <motion.li
              key={step.title}
              variants={itemUp}
              className="relative rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(61,0,46,0.10)] backdrop-blur-sm sm:p-6"
            >
              <div className="flex items-center gap-3">
                <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#4E0030] text-white shadow-[0_6px_18px_rgba(61,0,46,0.25)]">
                  {step.icon}
                  <span className="absolute -right-1 -top-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-[#F10897] px-1.5 font-sans text-[10px] font-extrabold text-white">
                    {i + 1}
                  </span>
                </div>
                <span className="font-fraunces text-2xl font-extrabold text-maroon/15">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-4 font-fraunces text-lg font-bold text-maroon">
                {step.title}
              </h3>
              <p className="mt-1.5 font-sans text-sm leading-relaxed text-maroon/75">
                {step.body}
              </p>
            </motion.li>
          ))}
        </motion.ol>
      </section>

      {/* ============ FAQ ============ */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto w-full max-w-3xl rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(61,0,46,0.10)] backdrop-blur-sm sm:p-8"
        >
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-blush px-4 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-maroon">
              <Sparkles className="h-3 w-3" strokeWidth={2.5} />
              Good to know
            </span>
            <h2 className="mt-4 font-fraunces text-2xl font-bold text-maroon sm:text-3xl">
              Questions you might have.
            </h2>
          </div>
          <Accordion type="single" collapsible className="mt-5">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`item-${i}`}
                className="border-maroon/10"
              >
                <AccordionTrigger className="font-sans text-sm font-bold text-maroon hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="font-sans text-sm leading-relaxed text-maroon/75">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>

      {/* ============ COMMITTED TO QUALITY ============ */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <motion.article
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white p-6 shadow-[0_18px_50px_rgba(61,0,46,0.15)] sm:p-8 lg:p-10"
        >
          {/* Watermark */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 select-none"
          >
            <ShieldCheck
              className="h-48 w-48 text-[#F10897]/8"
              strokeWidth={1}
            />
          </div>

          <div className="relative text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blush text-maroon">
              <ShieldCheck className="h-7 w-7" strokeWidth={2} />
            </div>
            <h2 className="mt-4 font-fraunces text-3xl font-extrabold text-maroon sm:text-4xl">
              Committed to Quality
            </h2>
            <p className="mx-auto mt-3 max-w-xl font-sans text-sm leading-relaxed text-maroon/75 sm:text-base">
              We hold ourselves to a higher standard — because trust is earned
              one detail at a time.
            </p>
          </div>

          <div className="relative mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {QUALITY.map((q) => (
              <div
                key={q.title}
                className="flex flex-col rounded-2xl bg-blush/40 p-5"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#F10897] shadow-[0_4px_15px_rgba(61,0,46,0.08)]">
                  {q.icon}
                </div>
                <h3 className="mt-3 font-fraunces text-base font-bold text-maroon">
                  {q.title}
                </h3>
                <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-maroon/75">
                  {q.body}
                </p>
              </div>
            ))}
          </div>

          <div className="relative mt-8 flex justify-center">
            <Link
              href="/gift-cards"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#4E0030] px-7 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(61,0,46,0.25)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#3a0023] active:scale-95"
            >
              Get Started Now
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                strokeWidth={2.5}
              />
            </Link>
          </div>

          <p className="relative mt-4 inline-flex w-full items-center justify-center gap-1.5 font-sans text-[11px] text-maroon/60">
            <Clock className="h-3 w-3" strokeWidth={2.5} />
            Most gifts are delivered in under 60 seconds.
          </p>
        </motion.article>
      </section>
    </main>
  );
}
