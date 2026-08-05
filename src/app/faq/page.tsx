"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Search,
  Mail,
  MessageCircle,
  Phone,
  Gift,
  ArrowRight,
  HelpCircle,
  Headphones,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Category =
  | "Gift Cards"
  | "Delivery"
  | "Booking"
  | "Payments";

type QA = { q: string; a: string; category: Category };

const QUESTIONS: QA[] = [
  {
    q: "How do therapy gift cards work?",
    a: "You purchase a Tare gift card for one, two, or three sessions. We email it to your recipient with your personalized note. They enter the code on our redeem page to unlock session credit, then book a time that fits their life — no expiration, no pressure.",
    category: "Gift Cards",
  },
  {
    q: "How do I redeem my gift card?",
    a: "Head to the Redeem page, type in the 16-character code from your gift email (we'll auto-format it as you type), and tap Redeem. Your credit appears instantly and you can book a session right away.",
    category: "Gift Cards",
  },
  {
    q: "Do Tare gift cards expire?",
    a: "Never. Your gift card has no expiration date. Redeem it tomorrow, next month, or whenever the moment feels right — the credit stays yours.",
    category: "Gift Cards",
  },
  {
    q: "Can I buy a gift card for someone outside my country?",
    a: "Yes. Gift cards are delivered by email and can be redeemed from anywhere. Sessions are scheduled in your recipient's local time zone, so the booking page adapts automatically.",
    category: "Gift Cards",
  },
  {
    q: "When will my recipient receive the gift card?",
    a: "Instantly. The moment your payment is confirmed, we send their personalized gift card straight to their inbox — usually within 60 seconds.",
    category: "Delivery",
  },
  {
    q: "Can I schedule delivery for a specific date?",
    a: "Absolutely. On the recipient details page, choose 'Schedule' and pick a date. We'll hold your gift and send it on the morning of your chosen day.",
    category: "Delivery",
  },
  {
    q: "What if the gift email doesn't arrive?",
    a: "First, have them check spam and promotions folders. If it's still missing, reach out to our care team with your order number and we'll resend it within minutes.",
    category: "Delivery",
  },
  {
    q: "Can I add a personal message to the gift card?",
    a: "Yes — and we hope you do. On the recipient details page, you'll find a note field. Your message appears on the gift card itself, in their email, and on the redemption page.",
    category: "Delivery",
  },
  {
    q: "How do I book a session after redeeming?",
    a: "Once your credit is unlocked, head to the Book a Session page. Pick a session type, choose a date and time that works for you, and tap Confirm. You'll get a confirmation number and a video link by email.",
    category: "Booking",
  },
  {
    q: "Can I reschedule my session?",
    a: "Yes — up to 24 hours before your appointment, with no penalty. Just reply to your confirmation email or visit your booking page and pick a new time.",
    category: "Booking",
  },
  {
    q: "What if I need to cancel?",
    a: "Life happens. Cancel up to 24 hours in advance and your credit returns to your balance, ready to rebook whenever suits you. Cancellations within 24 hours may incur a small fee.",
    category: "Booking",
  },
  {
    q: "Which payment methods do you accept?",
    a: "We accept all major debit and credit cards, as well as direct bank transfers. Payments are processed securely with 256-bit encryption end-to-end.",
    category: "Payments",
  },
  {
    q: "Can I get a refund?",
    a: "Yes — within 14 days of purchase, as long as the gift card hasn't been redeemed. Reach out to our care team and we'll handle it gently, no questions asked.",
    category: "Payments",
  },
];

const CATEGORIES = ["All", "Gift Cards", "Delivery", "Booking", "Payments"] as const;
type Tab = (typeof CATEGORIES)[number];

const POPULAR = [
  {
    q: "How do therapy gift cards work?",
    a: "You buy a card, we email it to them with your note, they redeem the code and book a session whenever they're ready. No expiration, no pressure.",
    tag: "Most asked",
  },
  {
    q: "How do I redeem my gift card?",
    a: "Go to Redeem, type your 16-character code, tap Redeem. Your credit appears instantly — then book your session in a couple of taps.",
    tag: "Quick start",
  },
];

const SUPPORT = [
  {
    icon: <Mail className="h-5 w-5" strokeWidth={2.5} />,
    title: "Email",
    detail: "help@mindful.com",
    body: "We reply within a few hours, Mon–Fri.",
  },
  {
    icon: <MessageCircle className="h-5 w-5" strokeWidth={2.5} />,
    title: "Live Chat",
    detail: "Available in-app",
    body: "Real humans, ready when you are.",
  },
  {
    icon: <Phone className="h-5 w-5" strokeWidth={2.5} />,
    title: "Phone",
    detail: "1-800-MINDFUL",
    body: "Mon–Fri 9am–6pm EST.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemUp = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("All");

  // Set gradient — render + useEffect
  useMemo(() => {
    if (typeof document === "undefined") return;
    document.body.style.setProperty("--page-gradient-from", "#FFF5EE");
    document.body.style.setProperty("--page-gradient-to", "#FFF5EE");
  }, []);
  useEffect(() => {
    document.body.style.setProperty("--page-gradient-from", "#FFF5EE");
    document.body.style.setProperty("--page-gradient-to", "#FFF5EE");
    return () => {
      document.body.style.removeProperty("--page-gradient-from");
      document.body.style.removeProperty("--page-gradient-to");
    };
  }, []);

  const filtered = QUESTIONS.filter((qa) => {
    const matchesTab = activeTab === "All" || qa.category === activeTab;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      qa.q.toLowerCase().includes(q) ||
      qa.a.toLowerCase().includes(q);
    return matchesTab && matchesQuery;
  });

  return (
    <main className="relative flex flex-1 flex-col">
      {/* Decorative blooms */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#C7B2E2]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-[#E8B6D5]/20 blur-3xl"
      />

      {/* ============ HERO ============ */}
      <section className="relative w-full overflow-hidden px-5 pb-6 pt-6 sm:px-8 sm:pb-10 lg:px-12">
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-2 aspect-[534/500] w-full max-w-[260px] sm:max-w-[300px] lg:max-w-[340px]"
          >
            <div
              aria-hidden
              className="absolute inset-6 rounded-full bg-[#BCE1F0]/20 blur-2xl"
            />
            <Image
              src="/hero-faq.png"
              alt="A friendly whimsical creature with a question mark floating above its head, surrounded by soft glowing shapes"
              fill
              priority
              sizes="(max-width: 640px) 65vw, (max-width: 1024px) 300px, 340px"
              className="hero-shadow relative animate-float-slow object-contain"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-[0_4px_15px_rgba(78, 0, 48, 0.08)]"
          >
            <HelpCircle className="h-3.5 w-3.5 text-maroon" strokeWidth={2.5} />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-maroon sm:text-xs">
              Help Center
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight text-[#F10897] sm:text-5xl lg:text-6xl"
          >
            Questions? We&apos;re here to help!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-xl font-sans text-[15px] leading-relaxed text-maroon/85 sm:text-[17px]"
          >
            Search for an answer below, or reach out — we answer fast, and we
            answer kindly.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-6 w-full max-w-xl"
          >
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-maroon/40"
                strokeWidth={2.5}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What would you like help with?"
                aria-label="Search questions"
                className="h-14 w-full rounded-2xl border-2 border-maroon/10 bg-white pl-12 pr-4 font-sans text-base text-maroon placeholder:text-maroon/40 focus:border-[#F10897] focus:outline-none focus:ring-4 focus:ring-[#F10897]/20"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ POPULAR QUESTIONS ============ */}
      <section className="relative w-full px-5 pb-10 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-6xl text-center"
        >
          <h2 className="font-fraunces text-2xl font-bold text-maroon sm:text-3xl">
            Popular Questions
          </h2>
          <p className="mx-auto mt-2 max-w-md font-sans text-sm text-maroon/70">
            The two most-asked things, answered up front.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mt-6 grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6"
        >
          {POPULAR.map((p) => (
            <motion.article
              key={p.q}
              variants={itemUp}
              className="flex flex-col rounded-3xl bg-white/85 p-6 shadow-[0_10px_40px_rgba(78, 0, 48, 0.10)] backdrop-blur-sm sm:p-7"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blush text-[#F10897]">
                  <Gift className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <span className="inline-flex items-center rounded-full bg-[#F10897] px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                  {p.tag}
                </span>
              </div>
              <h3 className="mt-4 font-fraunces text-lg font-bold text-maroon">
                {p.q}
              </h3>
              <p className="mt-2 flex-1 font-sans text-sm leading-relaxed text-maroon/75">
                {p.a}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* ============ CATEGORY TABS + ACCORDION ============ */}
      <section className="relative w-full px-5 pb-10 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-3xl">
          {/* Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {CATEGORIES.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 font-sans text-xs font-semibold transition-all duration-200 sm:text-sm ${
                    active
                      ? "bg-[#4E0030] text-white shadow-md"
                      : "bg-white/80 text-maroon hover:bg-white"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Accordion */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + query}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mt-6 rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(78, 0, 48, 0.10)] backdrop-blur-sm sm:p-8"
            >
              {filtered.length === 0 ? (
                <div className="py-10 text-center">
                  <HelpCircle
                    className="mx-auto h-8 w-8 text-maroon/40"
                    strokeWidth={2}
                  />
                  <p className="mt-3 font-sans text-sm text-maroon/70">
                    No questions match that. Try another search or tab.
                  </p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {filtered.map((qa, i) => (
                    <AccordionItem
                      key={qa.q}
                      value={`item-${i}`}
                      className="border-maroon/10"
                    >
                      <AccordionTrigger className="font-sans text-sm font-bold text-maroon hover:no-underline">
                        <span className="flex items-center gap-2 text-left">
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blush px-1.5 font-sans text-[10px] font-extrabold text-[#F10897]">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>{qa.q}</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pl-8 font-sans text-sm leading-relaxed text-maroon/75">
                        {qa.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ============ STILL NEED HELP ============ */}
      <section className="relative w-full px-5 pb-10 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-6xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[#F10897] shadow-[0_4px_15px_rgba(78, 0, 48, 0.08)]">
            <Headphones className="h-3 w-3" strokeWidth={2.5} />
            Reach Us
          </div>
          <h2 className="mt-4 font-fraunces text-2xl font-bold text-maroon sm:text-3xl">
            Still Need Help?
          </h2>
          <p className="mx-auto mt-2 max-w-md font-sans text-sm text-maroon/70">
            Our care team is small, human, and quick to respond.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mt-6 grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3 lg:gap-6"
        >
          {SUPPORT.map((s) => (
            <motion.article
              key={s.title}
              variants={itemUp}
              className="flex flex-col items-center rounded-3xl bg-white/85 p-6 text-center shadow-[0_10px_40px_rgba(78, 0, 48, 0.10)] backdrop-blur-sm"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4E0030] text-white">
                {s.icon}
              </div>
              <h3 className="mt-4 font-fraunces text-lg font-bold text-maroon">
                {s.title}
              </h3>
              <p className="mt-1 font-sans text-sm font-bold text-[#F10897]">
                {s.detail}
              </p>
              <p className="mt-2 font-sans text-[12px] leading-relaxed text-maroon/70">
                {s.body}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* ============ BOTTOM CTA — dark gradient ============ */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <motion.article
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#4E0030] via-[#4E0030] to-[#F10897] p-6 text-center shadow-[0_18px_50px_rgba(78, 0, 48, 0.30)] sm:p-10"
        >
          {/* Decorative blooms */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-[#F10897]/40 blur-3xl"
          />

          <div className="relative">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
              <Gift className="h-7 w-7" strokeWidth={2} />
            </div>
            <h2 className="mt-4 font-fraunces text-3xl font-extrabold text-white sm:text-4xl">
              Ready to send a meaningful gift?
            </h2>
            <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-blush/90 sm:text-base">
              A Tare gift card is care, wrapped in intention. Most gifts arrive
              in under a minute.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/gift-cards"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 font-sans text-sm font-semibold text-[#4E0030] shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 sm:w-auto"
              >
                Browse Gift Cards
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.5}
                />
              </Link>
              <Link
                href="/contact-us"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/10 px-7 py-3.5 font-sans text-sm font-semibold text-white ring-1 ring-inset ring-white/30 transition-all duration-200 hover:bg-white/20 active:scale-95 sm:w-auto"
              >
                <Mail className="h-4 w-4" strokeWidth={2.5} />
                Contact Support
              </Link>
            </div>
          </div>
        </motion.article>
      </section>

      {/* Bottom helper */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <p className="mx-auto max-w-3xl text-center font-sans text-[11px] text-maroon/60">
          <Sparkles
            className="mr-1 inline h-3 w-3 align-text-bottom"
            strokeWidth={2.5}
          />
          Can&apos;t find what you&apos;re looking for? Email{" "}
          <a
            href="mailto:help@mindful.com"
            className="font-bold text-maroon underline-offset-2 hover:underline"
          >
            help@mindful.com
          </a>{" "}
          and we&apos;ll take it from there.
        </p>
      </section>
    </main>
  );
}
