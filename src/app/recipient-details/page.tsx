"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Gift,
  Mail,
  Clock,
  Sparkles,
  User,
  Send,
} from "lucide-react";
import { useStore, type RecipientData } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const CARD_LOOKUP: Record<
  string,
  { title: string; price: number; sessions: number; gradient: string }
> = {
  one: {
    title: "Seed — One Session",
    price: 20000,
    sessions: 1,
    gradient: "from-[#E8D5F2] via-[#F5E3F0] to-[#FBD7E3]",
  },
  two: {
    title: "Root — Two Sessions",
    price: 39000,
    sessions: 2,
    gradient: "from-[#FFE0C2] via-[#FFD1DC] to-[#FDC4D6]",
  },
  three: {
    title: "Grove — Three Sessions",
    price: 57000,
    sessions: 3,
    gradient: "from-[#D6C7F2] via-[#E0CBF0] to-[#F0CFE6]",
  },
};

const OCCASIONS = [
  "Just Because",
  "Birthday",
  "Anniversary",
  "Thank You",
  "Thinking of You",
  "Congratulations",
  "Get Well Soon",
  "New Beginnings",
];

const INSPIRATION_PILLS = [
  "You deserve rest.",
  "Take a moment for you.",
  "This is your time.",
  "Breathe. You've got this.",
  "Sending you peace.",
];

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
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
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

function RecipientDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { recipients, updateRecipient, confirmRecipient, deleteRecipient } =
    useStore();

  const [activeIndex, setActiveIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Wait for the persisted store to hydrate from localStorage before rendering.
  // This prevents a flash of the empty state (recipients: []) on hard refresh.
  useEffect(() => {
    // useStore.persist.hasHydrated() is true once the persisted state is loaded.
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    if (useStore.persist.hasHydrated()) setHydrated(true);
    return () => unsub();
  }, []);

  // Set the locked-in page gradient — both in render (useMemo) and useEffect for hydration safety
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

  // Safety: reset activeIndex to 0 if recipients list changes identity
  // (e.g., user went back to gift-cards and re-proceeded with a different cart).
  // This ensures we never point at a stale index.
  const recipientsKey = recipients.map((r) => r.uid).join(",");
  useEffect(() => {
    setActiveIndex(0);
  }, [recipientsKey]);

  // Cart string for forward navigation (preserve across flow)
  const cartParam = searchParams.get("cart") ?? "";
  const totalParam = searchParams.get("total") ?? "";
  const forwardQuery = useMemo(() => {
    const q = new URLSearchParams();
    if (cartParam) q.set("cart", cartParam);
    if (totalParam) q.set("total", totalParam);
    const r = recipients
      .map((r) => `${r.uid}:${r.cardId}:${r.name || "_"}:${r.email || "_"}`)
      .join(",");
    if (r) q.set("recipients", r);
    return q.toString();
  }, [cartParam, totalParam, recipients]);

  const allConfirmed =
    recipients.length > 0 && recipients.every((r) => r.confirmed);

  // Clamp the active slide index when the recipients list shrinks.
  // Derived during render so we never call setState inside an effect.
  const safeActiveIndex = Math.min(
    activeIndex,
    Math.max(0, recipients.length - 1),
  );
  const current = recipients[safeActiveIndex];

  const goToSlide = (next: number) => {
    if (next < 0 || next > recipients.length - 1) return;
    setActiveIndex(next);
  };

  const handleConfirm = (uid: string) => {
    // Read the LATEST state from the store to avoid stale closure issues.
    const currentRecipients = useStore.getState().recipients;
    const r = currentRecipients.find((x) => x.uid === uid);
    if (!r) return false;
    if (!r.name.trim() || !r.email.trim()) {
      toast({
        title: "Almost there",
        description: "Please add a name and email before confirming.",
      });
      return false;
    }
    confirmRecipient(uid);
    toast({
      title: "Details confirmed",
      description: `${r.name}'s gift is ready to send.`,
    });
    return true;
  };

  // "Next Recipient" — validates + confirms current, then advances to next slide.
  // Accepts fromIndex so each slide's button uses its own index.
  const handleNextRecipient = (fromIndex: number) => {
    const currentRecipients = useStore.getState().recipients;
    const r = currentRecipients[fromIndex];
    if (!r) return;
    const ok = handleConfirm(r.uid);
    if (!ok) return;
    const nextIdx = fromIndex + 1;
    if (nextIdx <= currentRecipients.length - 1) {
      setTimeout(() => goToSlide(nextIdx), 250);
    }
  };

  // "Confirm & Proceed" — validates + confirms the LAST recipient, then navigates to cart review.
  const handleConfirmAndProceed = (fromIndex: number) => {
    const currentRecipients = useStore.getState().recipients;
    const r = currentRecipients[fromIndex];
    if (!r) return;
    const ok = handleConfirm(r.uid);
    if (!ok) return;
    // After confirming the last recipient, all should be confirmed.
    // Use a tiny delay so the store update flushes before navigating.
    setTimeout(() => {
      const latest = useStore.getState().recipients;
      if (latest.length > 0 && latest.every((r) => r.confirmed)) {
        router.push(`/cart-review?${forwardQuery}`);
      } else {
        toast({
          title: "Almost there",
          description: "Some recipients still need confirmed details.",
        });
      }
    }, 100);
  };

  const handleDelete = (uid: string) => {
    deleteRecipient(uid);
    toast({
      title: "Recipient removed",
      description: "The gift summary has been updated.",
    });
  };

  const handleContinue = () => {
    if (!allConfirmed) {
      toast({
        title: "Confirm all recipients",
        description: "Each recipient needs confirmed details before review.",
      });
      return;
    }
    router.push(`/cart-review?${forwardQuery}`);
  };

  const formatPrice = (n: number) => `₦${n.toLocaleString()}`;

  return (
    <main className="relative flex flex-1 flex-col">
      {/* Decorative blooms */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-white/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-[#F10897]/20 blur-3xl"
      />

      {/* ============ HERO ============ */}
      <section className="relative w-full overflow-hidden px-5 pb-8 pt-6 sm:px-8 sm:pb-12 lg:px-12">
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-[0_4px_15px_rgba(44, 41, 46, 0.08)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-maroon" strokeWidth={2.5} />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-maroon sm:text-xs">
              Step 3 · Recipient Details
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight text-maroon sm:text-5xl lg:text-6xl"
          >
            Tell us who&apos;s receiving care.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-xl font-sans text-[15px] leading-relaxed text-maroon/85 sm:text-[17px]"
          >
            One slide per recipient. Add their name, choose the occasion, write
            a note if you like, and confirm.
          </motion.p>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-6 aspect-[534/500] w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[360px]"
          >
            <div
              aria-hidden
              className="absolute inset-6 rounded-full bg-white/30 blur-2xl"
            />
            <Image
              src="/hero-giftcards.png"
              alt="Two whimsical mushroom-cap creatures exchanging a gift, surrounded by glowing mushrooms and acorns"
              fill
              priority
              sizes="(max-width: 640px) 70vw, (max-width: 1024px) 320px, 360px"
              className="hero-shadow relative animate-float-slow object-contain"
            />
          </motion.div>

          {/* 5-step stepper */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 w-full max-w-3xl"
          >
            <Stepper steps={STEPS} active={2} />
          </motion.div>
        </div>
      </section>

      {/* ============ HYDRATION GUARD / EMPTY STATE ============ */}
      {!hydrated ? (
        <section className="relative w-full px-5 pb-32 pt-6 sm:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white/85 p-8 text-center shadow-[0_10px_40px_rgba(44, 41, 46, 0.10)] backdrop-blur-sm sm:p-12">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-blush text-maroon">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-maroon/30 border-t-maroon" />
            </div>
            <h2 className="mt-4 font-fraunces text-2xl font-bold text-maroon">
              Loading your gifts…
            </h2>
            <p className="mt-2 font-sans text-sm text-maroon/70">
              One moment while we gather your recipient details.
            </p>
          </div>
        </section>
      ) : recipients.length === 0 ? (
        <section className="relative w-full px-5 pb-32 pt-6 sm:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white/85 p-8 text-center shadow-[0_10px_40px_rgba(44, 41, 46, 0.10)] backdrop-blur-sm sm:p-12">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-blush text-maroon">
              <Gift className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h2 className="mt-4 font-fraunces text-2xl font-bold text-maroon">
              No recipients yet
            </h2>
            <p className="mt-2 font-sans text-sm text-maroon/70">
              Choose a gift card first — we&apos;ll create a recipient slide for
              every card in your cart.
            </p>
            <Link
              href="/gift-cards"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#2C292E] px-7 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(44, 41, 46, 0.25)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#1F1B22] active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
              Back to Gift Cards
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* ============ CAROUSEL FORM + PREVIEW ============ */}
          <section className="relative w-full px-5 pb-32 pt-2 sm:px-8 lg:px-12">
            <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
              {/* LEFT: Carousel form (locked width) */}
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="mx-auto flex w-full max-w-lg flex-col gap-4"
              >
                {/* Slide nav header */}
                <motion.div
                  variants={itemUp}
                  className="flex w-full items-center justify-between overflow-hidden rounded-2xl bg-white/80 p-3 shadow-[0_8px_30px_rgba(44, 41, 46, 0.08)] backdrop-blur-sm"
                >
                  <button
                    type="button"
                    onClick={() => goToSlide(safeActiveIndex - 1)}
                    disabled={safeActiveIndex === 0}
                    aria-label="Previous recipient"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blush text-maroon transition-all hover:bg-blush/70 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-maroon/70">
                      Recipient
                    </span>
                    <span className="font-fraunces text-base font-bold text-maroon">
                      {safeActiveIndex + 1}{" "}
                      <span className="text-maroon/50">/ {recipients.length}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToSlide(safeActiveIndex + 1)}
                    disabled={safeActiveIndex === recipients.length - 1}
                    aria-label="Next recipient"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blush text-maroon transition-all hover:bg-blush/70 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                  </button>
                </motion.div>

                {/* Dot indicators */}
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {recipients.map((r, i) => (
                    <button
                      key={r.uid}
                      type="button"
                      onClick={() => goToSlide(i)}
                      aria-label={`Go to recipient ${i + 1}`}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === safeActiveIndex
                          ? "w-7 bg-[#F10897]"
                          : r.confirmed
                            ? "w-2 bg-[#2C292E]/60"
                            : "w-2 bg-maroon/25"
                      }`}
                    />
                  ))}
                </div>

                {/* Slide content — CSS transform carousel track (locked dimensions) */}
                <div className="relative w-full min-h-[580px] overflow-hidden rounded-3xl sm:min-h-[560px]">
                  <div
                    className="flex transition-transform duration-[400ms] ease-in-out"
                    style={{
                      transform: `translateX(-${safeActiveIndex * 100}%)`,
                    }}
                  >
                    {recipients.map((r, i) => (
                      <div
                        key={r.uid}
                        className="w-full shrink-0"
                        aria-hidden={i !== safeActiveIndex}
                      >
                        <RecipientSlide
                          recipient={r}
                          recipientNumber={i + 1}
                          totalRecipients={recipients.length}
                          isFirst={i === 0}
                          isLast={i === recipients.length - 1}
                          onBack={() => goToSlide(i - 1)}
                          onNextRecipient={() => handleNextRecipient(i)}
                          onConfirmAndProceed={() => handleConfirmAndProceed(i)}
                          onUpdate={(patch) => updateRecipient(r.uid, patch)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* RIGHT: Preview + Gift summary */}
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-6"
              >
                {/* Live Card Preview */}
                <motion.div
                  variants={itemUp}
                  className="rounded-3xl bg-white/80 p-5 shadow-[0_10px_40px_rgba(44, 41, 46, 0.10)] backdrop-blur-sm sm:p-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-maroon/70">
                      Live Card Preview
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blush px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-maroon">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F10897] animate-pulse" />
                      Live
                    </span>
                  </div>

                  {current ? (
                    <div className="mt-4">
                      <div
                        className={`relative flex aspect-[5/3] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${
                          CARD_LOOKUP[current.cardId]?.gradient ??
                          "from-[#FFF5EE] to-[#F5E8DC]"
                        } p-5 shadow-[0_10px_30px_rgba(44, 41, 46, 0.18)]`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Image
                              src="/logo.png"
                              alt="Tare logo"
                              width={28}
                              height={28}
                              className="h-7 w-7 object-contain drop-shadow-[0_2px_4px_rgba(44, 41, 46, 0.2)]"
                            />
                            <div>
                              <p className="font-fraunces text-lg font-bold text-maroon sm:text-xl">
                                Tare Gift Card
                              </p>
                              <p className="mt-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-maroon/70">
                                {CARD_LOOKUP[current.cardId]?.title ?? "Gift"}
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full bg-white/70 px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-maroon">
                            {current.occasion}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-maroon/60">
                            For
                          </p>
                          <p className="font-fraunces text-xl font-bold text-maroon sm:text-2xl">
                            {current.name || "Their name"}
                          </p>
                          {current.note ? (
                            <p className="mt-1 max-w-[90%] font-fraunces text-xs italic text-maroon/80">
                              &ldquo;{current.note}&rdquo;
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="font-sans text-[10px] font-medium text-maroon/70">
                            {current.email || "they@example.com"}
                          </span>
                          <span className="font-sans text-base font-extrabold text-maroon">
                            {formatPrice(CARD_LOOKUP[current.cardId]?.price ?? 0)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 text-center font-sans text-xs text-maroon/60">
                        Updates instantly as you type.
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 font-sans text-sm text-maroon/60">
                      No recipient selected.
                    </p>
                  )}
                </motion.div>

                {/* Dark Gift Summary */}
                <motion.div
                  variants={itemUp}
                  className="rounded-3xl bg-[#2C292E] p-5 text-white shadow-[0_14px_40px_rgba(44, 41, 46, 0.30)] sm:p-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-blush">
                      Gift Summary
                    </h3>
                    <span className="rounded-full bg-white/15 px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                      {recipients.length}{" "}
                      {recipients.length === 1 ? "Gift" : "Gifts"}
                    </span>
                  </div>

                  <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                    {recipients.map((r, i) => {
                      const c = CARD_LOOKUP[r.cardId];
                      return (
                        <li
                          key={r.uid}
                          className={`flex items-center gap-3 rounded-2xl bg-white/10 p-3 transition-colors ${
                            i === safeActiveIndex ? "ring-2 ring-[#F10897]" : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => goToSlide(i)}
                            className="flex flex-1 items-center gap-3 text-left"
                            aria-label={`Edit ${r.name || "recipient"}`}
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${
                                c?.gradient ?? "from-[#FFF5EE] to-[#F5E8DC]"
                              } font-sans text-xs font-bold text-maroon`}
                            >
                              {(r.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-sans text-sm font-bold text-white">
                                {r.name || `Recipient ${i + 1}`}
                              </p>
                              <p className="truncate font-sans text-[11px] text-blush/80">
                                {c?.title ?? "Gift"} ·{" "}
                                {r.confirmed ? "Confirmed" : "Draft"}
                              </p>
                            </div>
                            {r.confirmed && (
                              <Check className="h-4 w-4 text-[#F10897]" strokeWidth={2.5} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.uid)}
                            aria-label={`Delete ${r.name || "recipient"}`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-[#F10897] active:scale-90"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-4">
                    <span className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-blush/80">
                      {allConfirmed ? "All confirmed" : "Confirm to continue"}
                    </span>
                    <span className="font-fraunces text-xl font-bold text-white">
                      {formatPrice(
                        recipients.reduce(
                          (sum, r) =>
                            sum + (CARD_LOOKUP[r.cardId]?.price ?? 0),
                          0,
                        ),
                      )}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* ============ BOTTOM NAV ============ */}
          <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <Link
                href="/gift-cards"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blush px-7 py-3.5 font-sans text-sm font-semibold text-maroon shadow-[0_8px_24px_rgba(44, 41, 46, 0.12)] transition-all duration-200 hover:scale-[1.02] hover:bg-blush-dark active:scale-95 sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
                Gift Card
              </Link>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!allConfirmed}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2C292E] px-7 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(44, 41, 46, 0.25)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#1F1B22] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Continue to Review
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

/* ============ Recipient Slide Form ============ */
function RecipientSlide({
  recipient,
  recipientNumber,
  totalRecipients,
  isFirst,
  isLast,
  onBack,
  onNextRecipient,
  onConfirmAndProceed,
  onUpdate,
}: {
  recipient: RecipientData;
  recipientNumber: number;
  totalRecipients: number;
  isFirst: boolean;
  isLast: boolean;
  onBack: () => void;
  onNextRecipient: () => void;
  onConfirmAndProceed: () => void;
  onUpdate: (patch: Partial<RecipientData>) => void;
}) {
  const isConfirmed = recipient.confirmed;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Form submit (Enter key) → same as the primary action button.
    // If last recipient → Confirm & Proceed, else → Next Recipient.
    if (isLast) {
      onConfirmAndProceed();
    } else {
      onNextRecipient();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-[560px] flex-col space-y-4 rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(44, 41, 46, 0.10)] backdrop-blur-sm sm:p-6"
    >
      {/* Recipient header — "Recipient X of Y" (fixed height to prevent jitter) */}
      <div className="flex h-12 w-full items-center justify-between overflow-hidden">
        <div className="inline-flex min-w-0 items-center gap-2">
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blush text-maroon">
            <User className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-maroon/60">
              Recipient {recipientNumber} of {totalRecipients}
            </span>
            <span className="truncate font-fraunces text-lg font-bold text-maroon">
              {recipient.name || "New Recipient"}
            </span>
          </div>
        </div>
        {isConfirmed && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#2C292E] px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            <Check className="h-3 w-3" strokeWidth={2.5} />
            Confirmed
          </span>
        )}
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor={`name-${recipient.uid}`}
          className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-maroon/70"
        >
          Recipient Name <span className="text-[#F10897]">*</span>
        </label>
        <input
          id={`name-${recipient.uid}`}
          type="text"
          required
          value={recipient.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="e.g. Adaobi Okafor"
          className="mt-2 h-12 w-full rounded-2xl border border-maroon/15 bg-white px-4 font-sans text-sm text-maroon placeholder:text-maroon/40 focus:border-[#F10897] focus:outline-none focus:ring-2 focus:ring-[#F10897]/30"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor={`email-${recipient.uid}`}
          className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-maroon/70"
        >
          Recipient Email <span className="text-[#F10897]">*</span>
        </label>
        <div className="relative mt-2">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-maroon/40" strokeWidth={2.5} />
          <input
            id={`email-${recipient.uid}`}
            type="email"
            required
            value={recipient.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            placeholder="they@example.com"
            className="h-12 w-full rounded-2xl border border-maroon/15 bg-white pl-11 pr-4 font-sans text-sm text-maroon placeholder:text-maroon/40 focus:border-[#F10897] focus:outline-none focus:ring-2 focus:ring-[#F10897]/30"
          />
        </div>
      </div>

      {/* Occasion */}
      <div>
        <label className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-maroon/70">
          Occasion
        </label>
        <Select
          value={recipient.occasion}
          onValueChange={(v) => onUpdate({ occasion: v })}
        >
          <SelectTrigger
            className="mt-2 h-12 w-full rounded-2xl border border-maroon/15 bg-white px-4 font-sans text-sm text-maroon focus:border-[#F10897] focus:ring-[#F10897]/30"
            aria-label="Occasion"
          >
            <SelectValue placeholder="Choose an occasion" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {OCCASIONS.map((o) => (
              <SelectItem key={o} value={o} className="font-sans text-sm">
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Delivery mode toggle */}
      <div className="flex items-center justify-between rounded-2xl border border-maroon/15 bg-blush/40 p-4">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-maroon shadow-sm">
            {recipient.deliveryMode === "now" ? (
              <Send className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <Clock className="h-4 w-4" strokeWidth={2.5} />
            )}
          </div>
          <div>
            <p className="font-sans text-sm font-bold text-maroon">
              {recipient.deliveryMode === "now"
                ? "Send immediately"
                : "Schedule for later"}
            </p>
            <p className="font-sans text-xs text-maroon/70">
              {recipient.deliveryMode === "now"
                ? "We'll email them as soon as you check out."
                : "Choose a delivery date at checkout."}
            </p>
          </div>
        </div>
        <Switch
          checked={recipient.deliveryMode === "schedule"}
          onCheckedChange={(checked) =>
            onUpdate({ deliveryMode: checked ? "schedule" : "now" })
          }
          aria-label="Toggle delivery mode"
          className="data-[state=checked]:bg-[#F10897] data-[state=unchecked]:bg-maroon/20"
        />
      </div>

      {/* Personal note */}
      <div>
        <label
          htmlFor={`note-${recipient.uid}`}
          className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-maroon/70"
        >
          Personal Note
        </label>
        <textarea
          id={`note-${recipient.uid}`}
          rows={3}
          value={recipient.note}
          onChange={(e) => onUpdate({ note: e.target.value })}
          placeholder="A word from you..."
          className="mt-2 w-full rounded-2xl border border-maroon/15 bg-white px-4 py-3 font-sans text-sm text-maroon placeholder:text-maroon/40 focus:border-[#F10897] focus:outline-none focus:ring-2 focus:ring-[#F10897]/30"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {INSPIRATION_PILLS.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => onUpdate({ note: pill })}
              className="rounded-full bg-blush px-3 py-1.5 font-sans text-[11px] font-semibold text-maroon transition-all hover:bg-blush-dark hover:scale-105 active:scale-95"
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Smart action buttons */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
        {/* Back button — secondary, only shown if not the first recipient */}
        {!isFirst ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blush px-5 py-3.5 font-sans text-sm font-semibold text-maroon transition-all duration-200 hover:bg-blush-dark active:scale-95 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
            Back
          </button>
        ) : null}

        {/* Primary action: "Next Recipient" or "Confirm & Proceed" */}
        {isLast ? (
          <button
            type="submit"
            className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#F10897] px-6 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(241,8,151,0.35)] transition-all duration-200 hover:scale-[1.01] hover:bg-[#d4007d] active:scale-95"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
            Confirm &amp; Proceed
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              strokeWidth={2.5}
            />
          </button>
        ) : (
          <button
            type="submit"
            className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#2C292E] px-6 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(44, 41, 46, 0.25)] transition-all duration-200 hover:scale-[1.01] hover:bg-[#1F1B22] active:scale-95"
          >
            {isConfirmed ? (
              <>
                <Check className="h-4 w-4" strokeWidth={2.5} />
                Next Recipient
              </>
            ) : (
              <>
                Next Recipient
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.5}
                />
              </>
            )}
          </button>
        )}
      </div>

      {/* Hint text — pinned to bottom with mt-auto so buttons stay aligned */}
      {!isLast && (
        <p className="mt-auto pt-2 text-center font-sans text-[11px] text-maroon/55">
          We&rsquo;ll save this recipient and move to the next one.
        </p>
      )}
      {isLast && (
        <p className="mt-auto pt-2 text-center font-sans text-[11px] text-maroon/55">
          This is the last recipient — confirm to review your order.
        </p>
      )}
    </form>
  );
}

/* ============ Stepper ============ */
function Stepper({
  steps,
  active,
}: {
  steps: { label: string; href: string }[];
  active: number;
}) {
  return (
    <ol className="flex items-start justify-between gap-1 rounded-2xl bg-white/70 p-3 shadow-[0_8px_30px_rgba(44, 41, 46, 0.08)] backdrop-blur-sm">
      {steps.map((step, i) => {
        const isDone = i < active;
        const isActive = i === active;
        return (
          <li
            key={step.label}
            className="relative flex flex-1 flex-col items-center gap-2 text-center"
          >
            {/* Connector line — absolute, centered on the circle's vertical center */}
            {i > 0 && (
              <span
                className={`absolute top-[13px] right-1/2 h-0.5 w-full ${
                  isDone || isActive ? "bg-[#F10897]" : "bg-maroon/15"
                }`}
                aria-hidden
              />
            )}
            {/* Circle (number/check) — centered above the label */}
            <span
              className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-sans text-[11px] font-bold leading-none transition-colors ${
                isActive
                  ? "bg-[#F10897] text-white shadow-[0_4px_12px_rgba(241,8,151,0.4)]"
                  : isDone
                    ? "bg-[#2C292E] text-white"
                    : "bg-maroon/10 text-maroon/60"
              }`}
            >
              {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
            </span>
            {/* Label — centered directly under the circle */}
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

export default function RecipientDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center font-sans text-maroon">
          Loading…
        </div>
      }
    >
      <RecipientDetailsContent />
    </Suspense>
  );
}
