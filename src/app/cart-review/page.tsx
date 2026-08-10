"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Pencil,
  ShieldCheck,
  Lock,
  Heart,
  Mail,
  Gift,
  CalendarHeart,
  Sparkles,
  Check,
  Moon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

const CARD_LOOKUP: Record<
  string,
  { title: string; price: number; sessions: number; gradient: string; tag: string }
> = {
  one: {
    title: "Seed — One Session",
    price: 20000,
    sessions: 1,
    gradient: "from-[#E8D5F2] via-[#F5E3F0] to-[#FBD7E3]",
    tag: "Flexible",
  },
  two: {
    title: "Root — Two Sessions",
    price: 39000,
    sessions: 2,
    gradient: "from-[#FFE0C2] via-[#FFD1DC] to-[#FDC4D6]",
    tag: "Momentum",
  },
  three: {
    title: "Grove — Three Sessions",
    price: 57000,
    sessions: 3,
    gradient: "from-[#D6C7F2] via-[#E0CBF0] to-[#F0CFE6]",
    tag: "Ongoing Care",
  },
};

const STEPS = [
  { label: "Gift Card", href: "/gift-cards" },
  { label: "Details", href: "/recipient-details" },
  { label: "Recipient", href: "/recipient-details" },
  { label: "Review", href: "/cart-review" },
  { label: "Checkout", href: "/checkout" },
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

function CartReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { recipients, cart, user } = useStore();

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

  // Auth gate: hard-redirect logged-out users to /login with a callbackUrl
  useEffect(() => {
    if (!user) {
      router.replace("/login?callbackUrl=/cart-review");
    }
  }, [user, router]);

  // Parse cart + recipients from search params (fallback to store)
  const { cartItems, recipientRows } = useMemo(() => {
    const cartParam = searchParams.get("cart") ?? "";
    const rParam = searchParams.get("recipients") ?? "";

    const parsedCart = cartParam
      .split(",")
      .filter(Boolean)
      .map((s) => s.split(":"))
      .map(([id, qty]) => ({
        id,
        qty: parseInt(qty, 10) || 0,
      }))
      .filter((c) => CARD_LOOKUP[c.id] && c.qty > 0);

    const parsedRecipients = rParam
      .split(",")
      .filter(Boolean)
      .map((s) => {
        const [uid, cardId, name, email] = s.split(":");
        return {
          uid,
          cardId,
          name: name && name !== "_" ? name : "",
          email: email && email !== "_" ? email : "",
        };
      });

    return {
      cartItems:
        parsedCart.length > 0
          ? parsedCart
          : cart.map((c) => ({ id: c.cardId, qty: c.qty })),
      recipientRows:
        parsedRecipients.length > 0
          ? parsedRecipients
          : recipients.map((r) => ({
              uid: r.uid,
              cardId: r.cardId,
              name: r.name,
              email: r.email,
            })),
    };
  }, [searchParams, cart, recipients]);

  const giftCardValue = cartItems.reduce(
    (sum, c) => sum + (CARD_LOOKUP[c.id]?.price ?? 0) * c.qty,
    0,
  );
  const processingFee = 0;
  const total = giftCardValue + processingFee;

  const forwardQuery = useMemo(() => {
    const q = new URLSearchParams();
    const cartStr = cartItems.map((c) => `${c.id}:${c.qty}`).join(",");
    if (cartStr) q.set("cart", cartStr);
    q.set("total", String(total));
    const rStr = recipientRows
      .map((r) => `${r.uid}:${r.cardId}:${r.name || "_"}:${r.email || "_"}`)
      .join(",");
    if (rStr) q.set("recipients", rStr);
    return q.toString();
  }, [cartItems, recipientRows, total]);

  const handleCheckout = () => {
    if (recipientRows.length === 0) {
      toast({
        title: "Add a recipient first",
        description: "You need at least one recipient before checkout.",
      });
      return;
    }
    router.push(`/checkout?${forwardQuery}`);
  };

  const formatPrice = (n: number) => `₦${n.toLocaleString()}`;
  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="relative flex flex-1 flex-col">
      {/* Decorative blooms */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#B5E1C3]/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-[#E8B6D5]/20 blur-3xl"
      />

      {/* ============ AUTH GATE (fallback during redirect) ============ */}
      {!user ? (
        <section className="relative flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <Lock className="h-10 w-10 text-white" strokeWidth={2} />
          </div>
          <h2 className="font-fraunces text-3xl font-bold text-[#4E0030]">Sign in to review your cart</h2>
          <p className="mt-3 max-w-sm font-sans text-sm text-[#4E0030]/70">
            You&apos;ll need an account to review your recipients. Redirecting you to sign in…
          </p>
          <Link href="/login?callbackUrl=/cart-review" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F10897] px-7 py-3.5 font-sans text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.03] hover:bg-[#d4007d]">
            Sign In / Sign Up <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </section>
      ) : cartItems.length === 0 ? (
        <section className="relative flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <Gift className="h-10 w-10 text-white" strokeWidth={2} />
          </div>
          <h2 className="font-fraunces text-3xl font-bold text-[#4E0030]">Your cart is empty</h2>
          <p className="mt-3 max-w-sm font-sans text-sm text-[#4E0030]/70">
            Choose a gift card to start sending care to someone you love.
          </p>
          <Link href="/gift-cards" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F10897] px-7 py-3.5 font-sans text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.03] hover:bg-[#d4007d]">
            Browse Gift Cards <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </section>
      ) : (
      <>

      {/* ============ HERO ============ */}
      <section className="relative w-full overflow-hidden px-5 pb-6 pt-6 sm:px-8 sm:pb-10 lg:px-12">
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-[0_4px_15px_rgba(78, 0, 48, 0.08)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-maroon" strokeWidth={2.5} />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-maroon sm:text-xs">
              Step 4 · Review
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight text-[#F10897] sm:text-5xl lg:text-6xl"
          >
            Everything looks beautiful.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-xl font-sans text-[15px] leading-relaxed text-maroon/85 sm:text-[17px]"
          >
            One last look before you send care. Edit anything below, then
            continue to checkout.
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
              src="/hero-cart-review.png"
              alt="Whimsical creatures admiring a beautifully wrapped gift together"
              fill
              priority
              sizes="(max-width: 640px) 65vw, (max-width: 1024px) 300px, 340px"
              className="hero-shadow relative animate-float-slow object-contain"
            />
          </motion.div>

          {/* Stepper */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 w-full max-w-3xl"
          >
            <Stepper steps={STEPS} active={3} />
          </motion.div>
        </div>
      </section>

      {/* ============ ORDER SUMMARY + TRUST BADGES ============ */}
      <section className="relative w-full px-5 pb-10 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-3xl gap-6">
          {/* RIGHT column content (now full width) */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-6"
          >
            {/* Order Summary */}
            <motion.article
              variants={itemUp}
              className="rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(78, 0, 48, 0.10)] backdrop-blur-sm sm:p-6"
            >
              <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-maroon/70">
                Order Summary
              </h2>
              <ul className="mt-4 space-y-3 font-sans text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-maroon/80">Gift Card Value</span>
                  <span className="font-bold tabular-nums text-maroon">
                    {formatPrice(giftCardValue)}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-maroon/80">Processing Fee</span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#F10897]">
                    <span className="rounded-full bg-[#F10897]/10 px-2 py-0.5 text-xs uppercase tracking-wider">
                      Free
                    </span>
                  </span>
                </li>
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-maroon/15 pt-4">
                <span className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-maroon/70">
                  Total
                </span>
                <span className="font-fraunces text-2xl font-extrabold tabular-nums text-maroon">
                  {formatPrice(total)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F10897] px-6 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(78, 0, 48, 0.25)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#d4007d] active:scale-95"
              >
                Continue to Checkout
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.5}
                />
              </button>
            </motion.article>

            {/* Trust Badges */}
            <motion.div
              variants={itemUp}
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {[
                {
                  icon: <Lock className="h-4 w-4" strokeWidth={2.5} />,
                  title: "Secure Payment",
                  body: "256-bit encryption",
                },
                {
                  icon: <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />,
                  title: "Verified Professionals",
                  body: "Licensed & vetted",
                },
                {
                  icon: <Heart className="h-4 w-4" strokeWidth={2.5} />,
                  title: "Care First",
                  body: "No expiry, ever",
                },
              ].map((b) => (
                <div
                  key={b.title}
                  className="rounded-2xl bg-white/80 p-3 text-center shadow-[0_6px_20px_rgba(78, 0, 48, 0.08)] backdrop-blur-sm"
                >
                  <div className="mx-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-blush text-[#F10897]">
                    {b.icon}
                  </div>
                  <p className="mt-2 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-maroon">
                    {b.title}
                  </p>
                  <p className="mt-0.5 font-sans text-[10px] text-maroon/60">
                    {b.body}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* How It Reaches Them — dark card */}
            <motion.article
              variants={itemUp}
              className="rounded-3xl bg-[#4E0030] p-5 text-white shadow-[0_14px_40px_rgba(78, 0, 48, 0.30)] sm:p-6"
            >
              <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-blush">
                How It Reaches Them
              </h2>
              <ol className="mt-4 space-y-3">
                {[
                  {
                    icon: <Gift className="h-4 w-4" strokeWidth={2.5} />,
                    title: "Order placed",
                    body: "We process your payment securely.",
                  },
                  {
                    icon: <Mail className="h-4 w-4" strokeWidth={2.5} />,
                    title: "Email delivered",
                    body: "Their gift card lands in their inbox.",
                  },
                  {
                    icon: <Moon className="h-4 w-4" strokeWidth={2.5} />,
                    title: "They rest",
                    body: "Pick a session, at their own pace.",
                  },
                ].map((s, i) => (
                  <li key={s.title} className="flex items-start gap-3">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                      {s.icon}
                      {i < 2 && (
                        <span className="absolute -bottom-3 left-1/2 h-3 w-px -translate-x-1/2 bg-white/25" />
                      )}
                    </div>
                    <div>
                      <p className="font-sans text-sm font-bold text-white">
                        {s.title}
                      </p>
                      <p className="font-sans text-xs text-blush/80">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.article>
          </motion.div>
        </div>
      </section>


      {/* ============ BOTTOM NAV ============ */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <Link
            href="/recipient-details"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white border-[0.3px] border-[#F10897] px-7 py-3.5 font-sans text-sm font-semibold text-[#F10897] shadow-[0_8px_24px_rgba(78, 0, 48, 0.12)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#E8B6D5]/15 active:scale-95 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
            Recipient&apos;s Details
          </Link>
          <button
            type="button"
            onClick={handleCheckout}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F10897] px-7 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(78, 0, 48, 0.25)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#d4007d] active:scale-95 sm:w-auto"
          >
            Continue to Checkout
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              strokeWidth={2.5}
            />
          </button>
        </div>
      </section>
      </>
      )}
    </main>
  );
}

function DetailCell({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-blush/40 p-3">
      <div className="flex items-center gap-1.5 text-maroon/60">
        {icon}
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>
      <p
        className="mt-1.5 truncate font-sans text-sm font-bold text-maroon"
        suppressHydrationWarning
      >
        {value}
      </p>
    </div>
  );
}


function Stepper({
  steps,
  active,
}: {
  steps: { label: string; href: string }[];
  active: number;
}) {
  return (
    <ol className="flex items-start justify-between gap-1 rounded-2xl bg-white/70 p-3 shadow-[0_8px_30px_rgba(78, 0, 48, 0.08)] backdrop-blur-sm">
      {steps.map((step, i) => {
        const isDone = i < active;
        const isActive = i === active;
        return (
          <li
            key={step.label}
            className="relative flex flex-1 flex-col items-center gap-2 text-center"
          >
            {i > 0 && (
              <span
                className={`absolute top-[13px] right-1/2 h-0.5 w-full ${
                  isDone || isActive ? "bg-[#F10897]" : "bg-maroon/15"
                }`}
                aria-hidden
              />
            )}
            <span
              className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-sans text-[11px] font-bold leading-none transition-colors ${
                isActive
                  ? "bg-[#F10897] text-white shadow-[0_4px_12px_rgba(241,8,151,0.4)]"
                  : isDone
                    ? "bg-[#4E0030] text-white"
                    : "bg-maroon/10 text-maroon/60"
              }`}
            >
              {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
            </span>
            <span
              className={`font-sans text-[10px] font-bold uppercase leading-tight tracking-[0.1em] ${
                isActive
                  ? "text-[#F10897]"
                  : isDone
                    ? "text-maroon"
                    : "text-maroon/50"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function CartReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center font-sans text-maroon">
          Loading…
        </div>
      }
    >
      <CartReviewContent />
    </Suspense>
  );
}
