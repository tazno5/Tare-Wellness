"use client";

import { useState, useEffect, useRef } from "react";
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
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

// PostPurchaseAccountPrompt — MODAL shown on /order-confirmation after a guest
// completes checkout. Offers a quick path to create an account, with
// buyerEmail + buyerName pre-filled from the order they just placed.
//
// Why a modal (not a card):
//   - More attention-grabbing: the user just completed a checkout and is
//     landed on a confirmation page; a modal forces a deliberate decision
//     (sign up or skip) before they continue browsing.
//   - Dismissible in 3 ways: click the backdrop, click the X button, or
//     press ESC — matches the standard modal pattern users expect.
//   - Dismissal is remembered per-order (localStorage) so revisiting the
//     same order URL doesn't re-show the modal.
//
// Why this exists (overall):
//   Guest checkout removes friction at the BUY moment (good for conversion),
//   but loses the customer profile (bad for marketing + re-engagement).
//   A post-purchase prompt recovers most of that data — happy buyers who
//   just had a frictionless experience are 5-10x more likely to sign up
//   than users who were forced to create an account before checkout.
//
// Display conditions (controlled by parent — /order-confirmation page):
//   1. The user is NOT currently logged in
//   2. The order has buyerEmail + buyerName (always true)
//   3. The order has userId === null (guest checkout, not logged-in user)
//
// The form is intentionally minimal:
//   - buyerEmail (pre-filled, read-only — they already typed it at checkout)
//   - buyerName (pre-filled, read-only)
//   - New password (the only thing they actually have to enter)
//
// On submit: POST /api/auth/register, then signIn via NextAuth, then update
// the local Zustand store. The order they just placed stays associated
// with their email — they'll see it under /account?tab=orders.

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
  const [modalOpen, setModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Per-order dismissal (so re-visiting a different order still shows it)
  const dismissKey = `${DISMISS_KEY_PREFIX}${orderNumber}`;

  // Open the modal after a short delay on mount (so it doesn't feel like
  // a popup ad — gives the user time to see the order confirmation first).
  // 800ms is enough time for the page to render + for the user to register
  // that they're on the confirmation page, without being so long that they
  // start scrolling past the order details.
  useEffect(() => {
    // Don't open if previously dismissed for this order
    if (typeof window !== "undefined" && localStorage.getItem(dismissKey)) {
      setDismissed(true);
      return;
    }
    const timer = setTimeout(() => {
      setModalOpen(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [dismissKey]);

  // Lock body scroll while modal is open + handle ESC to close
  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        handleDismiss();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEsc);
    };
  }, [modalOpen, submitting]);

  // Auto-close the modal after success state shows for 3 seconds
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => {
      setModalOpen(false);
      // After modal closes, mark as dismissed so it doesn't reopen
      setTimeout(() => handleDismiss(), 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [done]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(dismissKey, "1");
    }
    setModalOpen(false);
    // Wait for the exit animation to finish before marking as dismissed
    setTimeout(() => setDismissed(true), 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if they clicked on the backdrop itself, not the modal content
    if (e.target === e.currentTarget && !submitting) {
      handleDismiss();
    }
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
          handleDismiss();
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

  // Don't render anything if dismissed (modal already closed + not coming back)
  if (dismissed) return null;

  return (
    <AnimatePresence>
      {modalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          aria-modal="true"
          role="dialog"
          aria-labelledby="post-purchase-modal-title"
          onClick={handleBackdropClick}
        >
          {/* Backdrop — click to dismiss (matches the user's request:
              "Once the user fills the form or proceeds as guest, it'll disappear") */}
          <div
            aria-hidden
            className="absolute inset-0 bg-maroon/50 backdrop-blur-sm"
          />

          {/* Modal panel */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(78,0,48,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Soft pink accent — top corner */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-magenta/12 blur-3xl"
            />

            {/* X dismiss button — top right */}
            {!done && (
              <button
                type="button"
                onClick={handleDismiss}
                disabled={submitting}
                className="absolute right-4 top-4 z-20 rounded-full p-1.5 text-maroon/40 transition-colors hover:bg-maroon/5 hover:text-maroon disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            )}

            <AnimatePresence mode="wait">
              {done ? (
                // ── Success state ──
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className="relative p-7 sm:p-8"
                >
                  <div className="flex flex-col items-center gap-3 text-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
                      className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-magenta text-white shadow-[0_8px_24px_rgba(241,8,151,0.35)]"
                    >
                      <Check className="h-7 w-7" strokeWidth={3} />
                    </motion.div>
                    <h3
                      id="post-purchase-modal-title"
                      className="font-serif text-2xl font-semibold text-maroon"
                    >
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
                  <div className="flex items-start gap-3 pr-8">
                    <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-magenta/10 text-magenta">
                      <Sparkles className="h-5 w-5" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h3
                        id="post-purchase-modal-title"
                        className="font-serif text-xl font-semibold text-maroon sm:text-2xl"
                      >
                        Save this order in 30 seconds
                      </h3>
                      <p className="mt-1 text-sm text-maroon/70">
                        Create a password to save your order history, track gift
                        deliveries, and check out faster next time. No spam, ever.
                      </p>
                    </div>
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
                          tabIndex={-1}
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
                          tabIndex={-1}
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
                      Use 6+ characters. You&apos;ll use this email + password to sign in next time.
                    </p>

                    {/* CTA row */}
                    <div className="mt-5 flex flex-col gap-2.5">
                      <button
                        type="submit"
                        disabled={submitting || password.length < 6}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-magenta px-6 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_8px_24px_rgba(241,8,151,0.30)] transition-all hover:scale-[1.01] hover:bg-magenta-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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
                      <button
                        type="button"
                        onClick={handleDismiss}
                        disabled={submitting}
                        className="font-sans text-xs font-medium text-maroon/55 underline-offset-2 transition-colors hover:text-maroon hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        No thanks, I&apos;ll just browse as guest
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
