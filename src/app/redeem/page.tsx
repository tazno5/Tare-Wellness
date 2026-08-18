"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Gift,
  Check,
  ArrowRight,
  User,
  Users,
  Users2,
  HeartHandshake,
  Compass,
  CalendarCheck,
  MessageCircle,
  ShieldCheck,
  Lock,
  Heart,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

const OPTIONS = [
  {
    id: "individual",
    title: "One-on-One",
    description:
      "Just you, and someone who listens.",
    icon: <User className="h-5 w-5" strokeWidth={2.5} />,
    duration: "50 minutes",
  },
  {
    id: "couples",
    title: "Together",
    description:
      "For two. One honest conversation.",
    icon: <Users className="h-5 w-5" strokeWidth={2.5} />,
    duration: "60 minutes",
  },
  {
    id: "family",
    title: "Family Circle",
    description:
      "The whole house. One guided talk.",
    icon: <Users2 className="h-5 w-5" strokeWidth={2.5} />,
    duration: "75 minutes",
  },
  {
    id: "wellness",
    title: "Wellness Coaching",
    description:
      "Real help for everyday stress.",
    icon: <HeartHandshake className="h-5 w-5" strokeWidth={2.5} />,
    duration: "30 minutes",
  },
];

const PATH_STEPS = [
  {
    title: "Redeem",
    body: "Enter your code to unlock your credit.",
    icon: <Gift className="h-4 w-4" strokeWidth={2.5} />,
  },
  {
    title: "Explore",
    body: "Browse sessions and find what fits.",
    icon: <Compass className="h-4 w-4" strokeWidth={2.5} />,
  },
  {
    title: "Schedule",
    body: "Pick a time that feels right for you.",
    icon: <CalendarCheck className="h-4 w-4" strokeWidth={2.5} />,
  },
  {
    title: "Connect",
    body: "Meet your wellness specialist and begin.",
    icon: <MessageCircle className="h-4 w-4" strokeWidth={2.5} />,
  },
];

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

export default function RedeemPage() {
  const { toast } = useToast();
  const { redemption, setRedemption, demoCodes } = useStore();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  // Auto-uppercase + format as XXXX-XXXX-XXXX-XXXX
  const handleCodeChange = (raw: string) => {
    const cleaned = raw
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join("-") ?? cleaned;
    setCode(formatted);
  };

  const rawCode = code.replace(/-/g, "");
  const isValid = rawCode.length === 16;

  const handleRedeem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) {
      toast({
        title: "Check your code",
        description: "A full gift card code is 16 characters.",
      });
      return;
    }
    setSubmitting(true);

    // 1. Check demo codes in Zustand/localStorage FIRST (for mock checkout codes)
    // MEDIUM #4: Demo codes only work in dev mode — prevents fake redemptions in production
    if (process.env.NODE_ENV !== "production") {
      const demoMatch = demoCodes.find(
        (dc) => dc.code.replace(/-/g, "") === rawCode,
      );

      if (demoMatch) {
        // Demo code found — validate locally without hitting the API
        setRedemption({
          code: demoMatch.code,
          creditBalance: demoMatch.creditAmount,
          redeemed: true,
        });

        toast({
          title: "Gift redeemed! (Demo mode)",
          description: `₦${demoMatch.creditAmount.toLocaleString()} credit applied — ${demoMatch.cardTitle}.`,
        });
        setSubmitting(false);
        return;
      }
    }

    // 2. No demo match — try the real API (for real backend-issued codes)
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: rawCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Differentiate error messages based on status code
        if (res.status === 404) {
          throw new Error("Code not found — check the code from your gift email and try again.");
        }
        if (res.status === 409) {
          throw new Error("This gift card has already been redeemed.");
        }
        if (res.status === 410) {
          throw new Error("This gift card has expired.");
        }
        throw new Error(data.error || "Invalid code");
      }

      setRedemption({
        code: data.code,
        creditBalance: data.creditAmount,
        redeemed: true,
      });

      toast({
        title: "Gift redeemed!",
        description: data.message || `₦${data.creditAmount.toLocaleString()} credit applied.`,
      });
    } catch (error) {
      toast({
        title: "Could not redeem",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* ============ HERO + CODE ENTRY ============ */}
      <section className="relative w-full overflow-hidden px-5 pb-10 pt-6 sm:px-8 sm:pb-14 lg:px-12">
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-[0_4px_15px_rgba(78, 0, 48, 0.08)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-maroon" strokeWidth={2.5} />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-maroon sm:text-xs">
              Redeem Your Gift
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight bg-gradient-to-r from-[#2750D8] to-[#90AAFF] bg-clip-text text-transparent sm:text-5xl lg:text-6xl"
          >
            You&apos;ve received a gift of care!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-xl font-sans text-[15px] leading-relaxed text-maroon/85 sm:text-[17px]"
          >
            Enter the code from your gift email below to unlock your session
            credit.
          </motion.p>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-6 aspect-[534/500] w-full max-w-[260px] sm:max-w-[300px] lg:max-w-[340px]"
          >
            <div
              aria-hidden
              className="absolute inset-6 rounded-full bg-[#BCE1F0]/20 blur-2xl"
            />
            <Image
              src="/hero-redeem.png"
              alt="A whimsical creature unwrapping a glowing gift box as light spills out"
              fill
              priority
              sizes="(max-width: 640px) 65vw, (max-width: 1024px) 300px, 340px"
              className="hero-shadow relative animate-float-slow object-contain"
            />
          </motion.div>

          {/* Code entry form */}
          <motion.form
            onSubmit={handleRedeem}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-8 w-full max-w-md"
          >
            <label
              htmlFor="redeem-code"
              className="block text-left font-sans text-xs font-bold uppercase tracking-[0.14em] text-maroon/70"
            >
              Gift Card Code <span className="text-[#F10897]">*</span>
            </label>
            <div className="relative mt-2">
              <input
                id="redeem-code"
                type="text"
                required
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                aria-invalid={!isValid && code.length > 0}
                className="h-14 w-full rounded-2xl border-2 border-maroon/15 bg-white px-4 pr-12 font-mono text-base font-bold tracking-[0.15em] text-maroon placeholder:text-maroon/30 focus:border-[#F10897] focus:outline-none focus:ring-4 focus:ring-[#F10897]/20 sm:text-lg"
              />
              {isValid && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#F10897] text-white"
                >
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </motion.span>
              )}
            </div>

            {/* Morphing CTA — 10px gap (mt-[10px]) between input and button */}
            <div className="mt-[10px]">
              <AnimatePresence mode="wait">
                {redemption.redeemed ? (
                  <motion.div
                    key="book"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Link
                      href="/book-session"
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F10897] px-6 py-4 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(241,8,151,0.35)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#d4007d] active:scale-95 sm:text-base"
                    >
                      Book a Session
                      <ArrowRight
                        className="h-5 w-5 transition-transform group-hover:translate-x-1"
                        strokeWidth={2.5}
                      />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.button
                    key="redeem"
                    type="submit"
                    disabled={submitting || !isValid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F10897] px-6 py-4 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(78, 0, 48, 0.25)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#d4007d] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Redeeming…
                      </>
                    ) : (
                      <>
                        <Gift className="h-5 w-5" strokeWidth={2.5} />
                        Redeem Gift
                      </>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.form>

          {/* Success banner */}
          <AnimatePresence>
            {redemption.redeemed && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 w-full max-w-md overflow-hidden rounded-2xl border border-[#F10897]/30 bg-white/85 p-4 shadow-[0_8px_30px_rgba(78, 0, 48, 0.10)] backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F10897] text-white">
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <p className="font-sans text-sm font-bold text-maroon">
                      Your gift is unlocked
                    </p>
                    <p className="font-sans text-xs text-maroon/70">
                      Credit balance:{" "}
                      <span className="font-bold text-[#F10897]">
                        ₦{redemption.creditBalance.toLocaleString()}
                      </span>{" "}
                      · Code ending{" "}
                      <span className="font-mono">
                        …{redemption.code.slice(-4)}
                      </span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ============ YOUR OPTIONS ============ */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto w-full max-w-6xl text-center"
        >
          <h2 className="font-fraunces text-3xl font-extrabold text-maroon sm:text-4xl">
            Your Options
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-sans text-sm text-maroon/70 sm:text-base">
            Pick whatever feels right. You can change your mind later — this is
            your time.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mt-8 grid w-full max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {OPTIONS.map((opt) => (
            <motion.article
              key={opt.id}
              variants={itemUp}
              className="group flex flex-col rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(78, 0, 48, 0.10)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 sm:p-6"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blush text-[#F10897] transition-colors group-hover:bg-[#F10897] group-hover:text-white">
                {opt.icon}
              </div>
              <h3 className="mt-4 font-fraunces text-xl font-bold text-maroon">
                {opt.title}
              </h3>
              <p className="mt-2 flex-1 font-sans text-sm leading-relaxed text-maroon/75">
                {opt.description}
              </p>
              <span className="mt-4 inline-flex w-fit items-center rounded-full bg-blush px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#F10897]">
                {opt.duration}
              </span>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* ============ YOUR PATH TO WELLNESS ============ */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="font-fraunces text-3xl font-extrabold text-maroon sm:text-4xl">
              Your Path to Wellness
            </h2>
            <p className="mx-auto mt-3 max-w-xl font-sans text-sm text-maroon/70 sm:text-base">
              Four gentle steps. No rush, no pressure — just care, your way.
            </p>
          </motion.div>

          <motion.ol
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="mx-auto mt-8 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
          >
            {PATH_STEPS.map((step, i) => (
              <motion.li
                key={step.title}
                variants={itemUp}
                className="relative rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(78, 0, 48, 0.10)] backdrop-blur-sm sm:p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F10897] text-white">
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
                {i < PATH_STEPS.length - 1 && (
                  <ArrowRight
                    className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-maroon/30 lg:block"
                    strokeWidth={2.5}
                  />
                )}
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* ============ SAFE & SUPPORTIVE TRUST BANNER ============ */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl bg-[#4E0030] p-6 text-white shadow-[0_14px_40px_rgba(78, 0, 48, 0.30)] sm:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <ShieldCheck className="h-7 w-7 text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-fraunces text-2xl font-bold text-white sm:text-3xl">
                Safe and Supportive
              </h2>
              <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-blush/85 sm:text-base">
                Every professional on Tare is licensed, vetted, and committed to
                holding space with care. Whatever you bring, you&apos;ll be met
                with kindness — never judgment.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {[
                  { icon: <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />, label: "Private & confidential" },
                  { icon: <Heart className="h-3.5 w-3.5" strokeWidth={2.5} />, label: "Trauma-informed" },
                  { icon: <Check className="h-3.5 w-3.5" strokeWidth={2.5} />, label: "Licensed professionals" },
                ].map((b) => (
                  <span
                    key={b.label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white"
                  >
                    {b.icon}
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============ BOTTOM CTA ============ */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-3 text-center">
          <p className="font-sans text-sm text-maroon/70">
            {redemption.redeemed
              ? "Ready when you are."
              : "Don't have a code yet?"}
          </p>
          {redemption.redeemed ? (
            <Link
              href="/book-session"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#F10897] px-7 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(78, 0, 48, 0.25)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#d4007d] active:scale-95"
            >
              Book a Session
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                strokeWidth={2.5}
              />
            </Link>
          ) : (
            <Link
              href="/gift-cards"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white border-[0.3px] border-[#F10897] px-7 py-3.5 font-sans text-sm font-semibold text-[#F10897] shadow-[0_8px_24px_rgba(78, 0, 48, 0.12)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#E8B6D5]/15 active:scale-95"
            >
              <Gift className="h-4 w-4" strokeWidth={2.5} />
              Send a Gift Card
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
