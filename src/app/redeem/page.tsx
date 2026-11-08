"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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
  PartyPopper,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { CopyCodeButton } from "@/components/ui/copy-code-button";

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
  // useSearchParams requires a Suspense boundary in Next.js 13+.
  // We wrap the actual content in Suspense to avoid the build-time error
  // "useSearchParams() should be wrapped in a suspense boundary".
  return (
    <Suspense fallback={null}>
      <RedeemContent />
    </Suspense>
  );
}

function RedeemContent() {
  const { toast } = useToast();
  const { redemption, setRedemption, clearRedemption, demoCodes, user } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Auth gate REMOVED — guests can now see the /redeem page (and enter their
  // code) without being redirected to /login first. When they click Redeem
  // and they're not logged in, the API returns "Please sign in" — at that
  // point, we show a modal offering Sign In / Sign Up (with the code
  // pre-filled in the callbackUrl so they don't have to re-type it).

  // Reset the redemption state on mount so the page always starts fresh.
  //
  // Without this, a previous redemption (stored in the Zustand persist
  // middleware → localStorage) would carry over — the button would
  // show "Book a Session" + the success banner would say "Your gift is
  // unlocked" from the PREVIOUS code, not the current one. The user
  // would see the "already redeemed" state without having entered a
  // new code on this visit.
  //
  // With this reset:
  //   - Every visit to /redeem starts with the button saying "Redeem Gift"
  //   - The user enters a code + clicks "Redeem Gift"
  //   - Only after a successful redemption does the button morph to
  //     "Book a Session" + the success banner appears
  //   - If the user leaves and comes back, the state resets again
  //
  // Also: if there's a ?code= query param (e.g. when the user was sent
  // here from /login after signing in to redeem), pre-fill the code field
  // with it. They can then click "Redeem Gift" to actually apply it.
  // (We don't auto-submit because the user should see the code entered.)
  useEffect(() => {
    clearRedemption();
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      // Auto-format the code with dashes (XXXX-XXXX-XXXX-XXXX)
      const clean = codeFromUrl.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const formatted = clean.replace(/(.{4})(?=.)/g, "$1-");
      setCode(formatted);
    } else {
      setCode("");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        if (res.status === 401) {
          // Guest user trying to redeem — show the auth-required modal.
          // Routes them to /login with the code pre-filled in callbackUrl
          // so after they sign in/up they come back to /redeem and the
          // code is already entered (auto-submitted via the ?code= param).
          setShowAuthModal(true);
          setSubmitting(false);
          return;
        }
        if (res.status === 404) {
          throw new Error("Code not found — check the code from your gift email and try again.");
        }
        if (res.status === 409) {
          throw new Error("This gift card has already been redeemed.");
        }
        if (res.status === 410) {
          throw new Error("This gift card is no longer available.");
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
      const errMsg = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast({
        title: "Could not redeem",
        description: (
          <span>
            {errMsg}{" "}
            <a href="/contact-us" className="font-bold underline text-[#F10897]">
              Contact support
            </a>
          </span>
        ),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex flex-1 flex-col overflow-x-hidden">
      {/* Decorative blooms */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#C7B2E2]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-[#E8B6D5]/20 blur-3xl"
      />

      {/* ============ GUEST BANNER (shown when not logged in) ============ */}
      {!user ? (
        <div className="mx-auto mb-4 mt-2 flex w-full max-w-3xl items-center justify-between gap-3 rounded-2xl bg-[#FFF5EE] p-3 sm:p-4">
          <div className="flex items-center gap-2.5 text-xs text-[#4E0030]/80 sm:text-sm">
            <Lock className="h-4 w-4 shrink-0 text-[#F10897]" strokeWidth={2.5} />
            <span>
              <span className="font-semibold text-[#4E0030]">Viewing as guest.</span>{" "}
              <Link
                href="/login?callbackUrl=/redeem"
                className="font-bold text-[#F10897] underline-offset-2 hover:underline"
              >
                Sign in
              </Link>{" "}
              to redeem faster next time.
            </span>
          </div>
        </div>
      ) : null}

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
            className="relative mt-6 aspect-[534/500] w-full max-w-[260px] bg-transparent sm:max-w-[300px] lg:max-w-[340px]"
          >
          <Image
              src="/hero-redeem.png"
              alt="A whimsical creature unwrapping a glowing gift box as light spills out"
              fill
              priority
              sizes="(max-width: 640px) 65vw, (max-width: 1024px) 300px, 340px"
              className="relative animate-float-slow object-contain transition-all duration-500 ease-out hover:scale-[1.02] hover:drop-shadow-[0_0_30px_rgba(219,39,119,0.35)]"
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
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <PartyPopper className="h-5 w-5" strokeWidth={2.5} />
                        </motion.div>
                        "Redeem Gift"
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
                      <CopyCodeButton
                        code={redemption.code}
                        label="gift card code"
                        size={12}
                        className="ml-1 align-middle"
                      />
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

      {/* ============ AUTH-REQUIRED MODAL (shown when a guest submits a code) ============ */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            aria-modal="true"
            role="dialog"
            aria-labelledby="redeem-auth-modal-title"
            onClick={() => setShowAuthModal(false)}
          >
            <div
              aria-hidden
              className="absolute inset-0 bg-maroon/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgba(78,0,48,0.25)] sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* X dismiss button */}
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="absolute right-4 top-4 z-20 rounded-full p-1.5 text-maroon/40 transition-colors hover:bg-maroon/5 hover:text-maroon"
                aria-label="Close"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* Header */}
              <div className="flex items-start gap-3 pr-8">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-magenta/10 text-magenta">
                  <Lock className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3
                    id="redeem-auth-modal-title"
                    className="font-serif text-xl font-semibold text-maroon sm:text-2xl"
                  >
                    Sign in to redeem your gift
                  </h3>
                  <p className="mt-1 text-sm text-maroon/70">
                    Your gift card credit gets saved to your account so you can use
                    it across sessions — today, next week, whenever you&apos;re
                    ready. It takes 30 seconds.
                  </p>
                </div>
              </div>

              {/* Pre-filled code (read-only, so they know what they entered) */}
              {code && (
                <div className="mt-5">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-maroon/55">
                    Your code (saved for after you sign in)
                  </label>
                  <div className="relative mt-1.5">
                    <Gift className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-maroon/40" strokeWidth={2.5} />
                    <input
                      type="text"
                      value={code}
                      readOnly
                      tabIndex={-1}
                      className="h-11 w-full rounded-2xl border border-maroon/10 bg-blush/30 pl-10 pr-3 font-mono text-sm text-maroon/80 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* CTA buttons */}
              <div className="mt-6 flex flex-col gap-2.5">
                {/* Sign In (returning users) */}
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/redeem?code=${encodeURIComponent(code)}`)}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-magenta px-6 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_8px_24px_rgba(241,8,151,0.30)] transition-all hover:scale-[1.01] hover:bg-magenta-600 active:scale-[0.99]"
                >
                  Sign In
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </Link>
                {/* Sign Up (new users) */}
                <Link
                  href={`/login?signup=1&callbackUrl=${encodeURIComponent(`/redeem?code=${encodeURIComponent(code)}`)}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-sans text-sm font-semibold text-maroon shadow-sm ring-1 ring-maroon/15 transition-all hover:scale-[1.01] hover:text-magenta active:scale-[0.99]"
                >
                  Create an account
                </Link>
                {/* Dismiss */}
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="font-sans text-xs font-medium text-maroon/55 underline-offset-2 transition-colors hover:text-maroon hover:underline"
                >
                  Not now — I&apos;ll try later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
