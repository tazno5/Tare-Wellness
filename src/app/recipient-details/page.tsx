"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";

const CARD_LOOKUP: Record<string, { title: string; price: number; sessions: number }> = {
  one: { title: "One Session", price: 25000, sessions: 1 },
  two: { title: "Two Sessions", price: 40000, sessions: 2 },
  three: { title: "Three Sessions", price: 75000, sessions: 3 },
};

function RecipientDetailsContent() {
  const searchParams = useSearchParams();

  // Derive cart + total directly from search params (no state needed)
  const { cart, total } = useMemo(() => {
    const cartParam = searchParams.get("cart") ?? "";
    const parsed = cartParam
      .split(",")
      .filter(Boolean)
      .map((s) => s.split(":"))
      .map(([id, qty]) => ({ id, qty: parseInt(qty, 10) || 0 }))
      .filter((c) => CARD_LOOKUP[c.id] && c.qty > 0);
    const computedTotal = parsed.reduce(
      (sum, c) => sum + (CARD_LOOKUP[c.id]?.price ?? 0) * c.qty,
      0,
    );
    return { cart: parsed, total: computedTotal };
  }, [searchParams]);

  // Set the page gradient via CSS variables (effect for side-effect only, no setState)
  usePageGradient();

  return (
    <main className="relative flex flex-1 flex-col">
      <section className="relative w-full px-5 pb-32 pt-10 sm:px-8 lg:px-12 lg:pt-16">
        <div className="mx-auto w-full max-w-3xl">
          {/* Back link */}
          <Link
            href="/gift-cards"
            className="inline-flex items-center gap-2 font-sans text-sm font-medium text-maroon/80 transition-colors hover:text-maroon"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
            Back to Gift Cards
          </Link>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight text-maroon sm:text-5xl lg:text-6xl"
          >
            Recipient Details
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-xl font-sans text-[16px] leading-relaxed text-maroon/85 sm:text-[18px]"
          >
            Tell us who&apos;s receiving this gift. We&apos;ll send them a
            personalized invitation the moment you check out.
          </motion.p>

          {/* Order summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 rounded-3xl bg-white/80 p-6 shadow-[0_10px_40px_rgba(61,0,46,0.10)] backdrop-blur-sm"
          >
            <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-maroon/70">
              Order Summary
            </h2>
            {cart.length === 0 ? (
              <p className="mt-3 font-sans text-sm text-maroon/70">
                Your cart is empty.{" "}
                <Link href="/gift-cards" className="underline">
                  Choose a gift card →
                </Link>
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-maroon/10">
                {cart.map((item) => {
                  const c = CARD_LOOKUP[item.id];
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between py-3 font-sans text-sm"
                    >
                      <span className="text-maroon">
                        {c.title}{" "}
                        <span className="text-maroon/60">× {item.qty}</span>
                      </span>
                      <span className="font-bold tabular-nums text-maroon">
                        ₦{(c.price * item.qty).toLocaleString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {cart.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-maroon/15 pt-4 font-sans">
                <span className="text-sm font-semibold uppercase tracking-[0.14em] text-maroon/70">
                  Total
                </span>
                <span className="text-2xl font-extrabold tabular-nums text-maroon">
                  ₦{total.toLocaleString()}
                </span>
              </div>
            )}
          </motion.div>

          {/* Recipient form (placeholder) */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={(e) => e.preventDefault()}
            className="mt-8 space-y-4"
          >
            <div>
              <label
                htmlFor="recipient-name"
                className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-maroon/70"
              >
                Recipient Name
              </label>
              <input
                id="recipient-name"
                type="text"
                placeholder="e.g. Adaobi Okafor"
                className="mt-2 h-12 w-full rounded-2xl border border-maroon/15 bg-white/80 px-4 font-sans text-sm text-maroon placeholder:text-maroon/40 focus:border-[#F10897] focus:outline-none focus:ring-2 focus:ring-[#F10897]/30"
              />
            </div>
            <div>
              <label
                htmlFor="recipient-email"
                className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-maroon/70"
              >
                Recipient Email
              </label>
              <input
                id="recipient-email"
                type="email"
                placeholder="they@example.com"
                className="mt-2 h-12 w-full rounded-2xl border border-maroon/15 bg-white/80 px-4 font-sans text-sm text-maroon placeholder:text-maroon/40 focus:border-[#F10897] focus:outline-none focus:ring-2 focus:ring-[#F10897]/30"
              />
            </div>
            <div>
              <label
                htmlFor="gift-message"
                className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-maroon/70"
              >
                Personal Note (optional)
              </label>
              <textarea
                id="gift-message"
                rows={3}
                placeholder="A word from you..."
                className="mt-2 w-full rounded-2xl border border-maroon/15 bg-white/80 px-4 py-3 font-sans text-sm text-maroon placeholder:text-maroon/40 focus:border-[#F10897] focus:outline-none focus:ring-2 focus:ring-[#F10897]/30"
              />
            </div>

            <button
              type="submit"
              disabled={cart.length === 0}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#4E0030] px-7 py-4 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(61,0,46,0.25)] transition-all duration-200 hover:scale-[1.01] hover:bg-[#3a0023] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
            >
              <Check className="h-5 w-5" strokeWidth={2.5} />
              Send Gift — ₦{total.toLocaleString()}
            </button>
          </motion.form>
        </div>
      </section>
    </main>
  );
}

// Small helper hook to set the gradient CSS variables for this page
function usePageGradient() {
  useMemo(() => {
    if (typeof document === "undefined") return;
    document.body.style.setProperty("--page-gradient-from", "#FCE4EC");
    document.body.style.setProperty("--page-gradient-to", "#F10897");
    // Note: cleanup happens when the gift-cards page's useEffect runs on next mount,
    // or on full route change. This is acceptable for the demo flow.
  }, []);
}

export default function RecipientDetailsPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center font-sans text-maroon">Loading…</div>}>
      <RecipientDetailsContent />
    </Suspense>
  );
}
