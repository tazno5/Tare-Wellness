"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Sparkles, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// NewsletterSubscribe — sleek, high-converting signup block.
// Used at the bottom of the /blog index page and at the end of every post.
export default function NewsletterSubscribe({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting || done) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Please check your email",
        description: "That doesn't look like a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Something went wrong");
      }

      setDone(true);
      toast({
        title: "You're on the list! ✨",
        description: "Watch your inbox — Tare newsletters are on the way.",
      });
      setEmail("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to subscribe";
      toast({
        title: "Couldn't subscribe",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (variant === "compact") {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        aria-label="Subscribe to the Tare newsletter"
      >
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting || done}
          aria-label="Email address"
          className="h-12 flex-1 rounded-full border-maroon/15 bg-white px-5 text-base text-maroon placeholder:text-maroon/40 shadow-sm focus-visible:ring-magenta/40"
        />
        <button
          type="submit"
          disabled={submitting || done}
          className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-magenta px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(241,8,151,0.35)] transition-all hover:scale-[1.02] hover:bg-magenta-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Subscribing…</span>
            </>
          ) : done ? (
            <>
              <Check className="h-4 w-4" />
              <span>You're on the list!</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>Subscribe to Newsletters</span>
            </>
          )}
        </button>
      </form>
    );
  }

  return (
    <section
      aria-label="Newsletter signup"
      className="relative overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_rgba(78,0,48,0.06)] ring-1 ring-maroon/5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-magenta/10 blur-3xl"
      />
      <div className="relative grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:p-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-magenta/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-magenta">
            <Mail className="h-3.5 w-3.5" />
            Tare Newsletter
          </div>
          <h3 className="mt-4 font-serif text-2xl font-semibold text-maroon sm:text-3xl">
            Slow letters about rest, care, and the people who make Tare possible.
          </h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-maroon/75 sm:text-base">
            One short email every few weeks. No noise, no spam, no rush. Just
            the occasional note about new sessions, practitioner spotlights,
            and small ways to take care.
          </p>
        </div>

        <div>
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-start gap-3 rounded-2xl bg-magenta/8 p-6 ring-1 ring-magenta/20"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-magenta text-white">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-maroon">You're on the list!</p>
                  <p className="mt-1 text-sm text-maroon/70">
                    Watch your inbox — the next Tare newsletter is on its way.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDone(false)}
                  className="mt-2 text-xs font-medium text-magenta underline-offset-4 hover:underline"
                >
                  Subscribe another email
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-3"
              >
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  aria-label="Email address"
                  className="h-14 rounded-full border-maroon/15 bg-white px-6 text-base text-maroon placeholder:text-maroon/40 shadow-sm focus-visible:ring-magenta/40"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-magenta px-6 text-base font-semibold text-white shadow-[0_8px_24px_rgba(241,8,151,0.35)] transition-all hover:scale-[1.01] hover:bg-magenta-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Subscribing…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 animate-pulse" />
                      <span>Subscribe to Newsletters</span>
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-maroon/55">
                  Unsubscribe anytime. We respect your inbox.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
