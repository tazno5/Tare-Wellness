"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import {
  Sparkles,
  Loader2,
  Check,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

// PostPurchaseAccountPrompt — shown on /order-confirmation after a guest
// completes checkout. Offers a quick path to create an account, with
// buyerEmail + buyerName pre-filled from the order they just placed.
//
// Why this exists:
//   Guest checkout removes friction at the BUY moment (good for conversion),
//   but loses the customer profile (bad for marketing + re-engagement).
//   A post-purchase prompt recovers most of that data — happy buyers who
//   just had a frictionless experience are 5-10x more likely to sign up
//   than users who were forced to create an account before checkout.
//
// Display conditions (all must be true):
//   1. The user is NOT currently logged in (no point showing it if they are)
//   2. The order has buyerEmail + buyerName (from the checkout form)
//   3. The user hasn't dismissed the prompt (state stored in localStorage
//      so we don't nag them on revisit)
//
// The form is intentionally minimal:
//   - buyerEmail (pre-filled, read-only — they already typed it at checkout)
//   - buyerName (pre-filled, read-only)
//   - New password (the only thing they actually have to enter)
//
// On submit: POST /api/auth/register, then signIn via NextAuth, then update
// the local Zustand store. The order they just placed stays associated
// with their email — they'll see it under /account?tab=orders.
//
// On dismiss: the prompt is hidden and a flag is set in localStorage so it
// doesn't reappear on future visits to this order confirmation page.

const DISMISS_KEY_PREFIX = "tare:post-purchase-prompt-dismissed:";

export default function PostPurchaseAccountPrompt({
  orderNumber,
  buyerEmail,
  buyerName,
}: {
  orderNumber: string;
  buyerEmail: string;
  buyerName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useStore();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Per-order dismissal (so re-visiting a different order still shows it)
  const dismissKey = `${DISMISS_KEY_PREFIX}${orderNumber}`;

  // Check localStorage on mount — if previously dismissed, don't show
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(dismissKey)) {
      setDismissed(true);
    }
  }, [dismissKey, setDismissed]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(dismissKey, "1");
    }
    setDismissed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6 || submitting || done) return;

    setSubmitting(true);
    try {
      // 1. Create the user via the register API
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: buyerName,
          email: buyerEmail,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data?.error || data?.detail || "Failed to create account";
        // Common case: email already in use (they may have an old account)
        if (
          errMsg.toLowerCase().includes("already exists") ||
          errMsg.toLowerCase().includes("in use")
        ) {
          toast({
            title: "You already have an account",
            description: "Try signing in with that email instead.",
          });
          // Route them to the login page so they can sign in
          router.push(`/login?callbackUrl=/order-confirmation?id=${orderNumber}`);
          return;
        }
        throw new Error(errMsg);
      }

      // 2. Sign in via NextAuth so the session cookie is set
      const result = await signIn("credentials", {
        email: buyerEmail,
        password,
        redirect: false,
        callbackUrl: `/order-confirmation?id=${orderNumber}`,
      });
      if (result?.error) {
        throw new Error(result.error);
      }

      // 3. Sync to Zustand store so the navbar UI updates immediately
      login({ id: data.id, name: data.name, email: data.email });

      setDone(true);
      // Auto-dismiss after success animation so the page returns to normal
      setTimeout(() => {
        handleDismiss();
      }, 4000);

      toast({
        title: "Account created!",
        description: `Welcome to Tare Wellness, ${buyerName.split(" ")[0]}. Your order is saved to your account.`,
      });
    } catch (err) {
      toast({
        title: "Couldn't create account",
        description: err instanceof Error ? err.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Hidden if: user dismissed, or already done
  if (dismissed) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-3xl"
      aria-label="Create an account"
    >
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-[0_12px_40px_rgba(78,0,48,0.10)] ring-1 ring-maroon/5">
        {/* Soft pink accent — top corner */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-magenta/12 blur-3xl"
        />

        <AnimatePresence mode="wait">
          {done ? (
            // ── Success state ──
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              className="relative p-7 sm:p-8"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-magenta text-white shadow-[0_8px_24px_rgba(241,8,151,0.35)]">
                  <Check className="h-6 w-6" strokeWidth={3} />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-maroon">
                  Account created — welcome!
                </h3>
                <p className="max-w-md text-sm text-maroon/70">
                  Your order <span className="font-mono text-maroon">{orderNumber}</span> is
                  saved to your account. You can find it anytime under{" "}
                  <Link
                    href="/account?tab=orders"
                    className="font-semibold text-magenta underline-offset-2 hover:underline"
                  >
                    My Orders
                  </Link>
                  .
                </p>
              </div>
            </motion.div>
          ) : (
            // ── Default state (the form) ──
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative p-6 sm:p-8"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-magenta/10 text-magenta">
                  <Sparkles className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-xl font-semibold text-maroon sm:text-2xl">
                    Save this order in 30 seconds
                  </h3>
                  <p className="mt-1 text-sm text-maroon/70">
                    Create a password to save your order history, track gift
                    deliveries, and check out faster next time. No spam, ever.
                  </p>
                </div>
                {/* Dismiss button */}
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="shrink-0 rounded-full p-1.5 text-maroon/40 transition-colors hover:bg-maroon/5 hover:text-maroon"
                  aria-label="Dismiss"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Pre-filled email + name (read-only) */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-maroon/55">
                    Your name
                  </label>
                  <div className="relative mt-1.5">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-maroon/40" strokeWidth={2.5} />
                    <input
                      type="text"
                      value={buyerName}
                      readOnly
                      className="h-11 w-full rounded-2xl border border-maroon/10 bg-blush/30 pl-10 pr-3 font-sans text-sm text-maroon/80 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-maroon/55">
                    Your email
                  </label>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-maroon/40" strokeWidth={2.5} />
                    <input
                      type="email"
                      value={buyerEmail}
                      readOnly
                      className="h-11 w-full rounded-2xl border border-maroon/10 bg-blush/30 pl-10 pr-3 font-sans text-sm text-maroon/80 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Password form — the only field they need to fill in */}
              <form onSubmit={handleSubmit} className="mt-4">
                <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-maroon/55">
                  Create a password <span className="text-magenta">*</span>
                </label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-maroon/40" strokeWidth={2.5} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    autoFocus
                    className="h-12 w-full rounded-2xl border border-maroon/15 bg-white pl-10 pr-12 font-sans text-sm text-maroon placeholder:text-maroon/40 focus:border-magenta focus:outline-none focus:ring-2 focus:ring-magenta/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-maroon/45 hover:text-maroon"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-maroon/50">
                  Use 6+ characters. You'll use this email + password to sign in next time.
                </p>

                {/* CTA row */}
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="font-sans text-xs font-medium text-maroon/55 underline-offset-2 hover:text-maroon hover:underline"
                  >
                    No thanks, I'll just browse as guest
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || password.length < 6}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-magenta px-6 py-3 font-sans text-sm font-semibold text-white shadow-[0_8px_24px_rgba(241,8,151,0.30)] transition-all hover:scale-[1.02] hover:bg-magenta-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                        <span>Creating account…</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                        <span>Create my account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
