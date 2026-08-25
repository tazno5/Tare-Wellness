"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Minus, Plus, ArrowRight, Loader2 } from "lucide-react";
import { useStore, type CartItem } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

type GiftCard = {
  id: string;
  title: string;
  sessionCount: number;
  price: string;
  priceValue: number;
  tag: string;
  badge: string;
  description: string;
  gradient: string;
};

// Fallback cards used while fetching from API / if fetch fails
const FALLBACK_CARDS: GiftCard[] = [
  { id: "one", title: "Seed — One Session", sessionCount: 1, price: "₦20,000", priceValue: 20000, tag: "Flexible", badge: "START HERE", description: "One session. All theirs.", gradient: "from-[#E8D5F2] via-[#F5E3F0] to-[#FBD7E3]" },
  { id: "two", title: "Root — Two Sessions", sessionCount: 2, price: "₦39,000", priceValue: 39000, tag: "Momentum", badge: "MOST LOVED", description: "Two sessions. Or split it — give one away.", gradient: "from-[#FFE0C2] via-[#FFD1DC] to-[#FDC4D6]" },
  { id: "three", title: "Grove — Three Sessions", sessionCount: 3, price: "₦57,000", priceValue: 57000, tag: "Ongoing Care", badge: "FULLY THEIRS", description: "Three sessions of steady care.", gradient: "from-[#D6C7F2] via-[#E0CBF0] to-[#F0CFE6]" },
];

const FILTERS = ["All Cards", "Seed", "Root", "Grove"] as const;
type FilterLabel = (typeof FILTERS)[number];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function GiftCardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center font-sans text-maroon">
          Loading…
        </div>
      }
    >
      <GiftCardPageContent />
    </Suspense>
  );
}

function GiftCardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { cart, totalQty, totalPrice, setCart, clearCart, clearRecipients } = useStore();
  const [activeFilter, setActiveFilter] = useState<FilterLabel | null>(null);
  const [cards, setCards] = useState<GiftCard[]>(FALLBACK_CARDS);
  const [loading, setLoading] = useState(true);

  // Reset cart + recipients on every mount — the gift-cards page is always a fresh start.
  // Demo codes and redemption state are intentionally preserved (recipient's redeem flow).
  // Runs once on mount (empty dep array) so it doesn't loop when the store updates.
  useEffect(() => {
    clearCart();
    clearRecipients();
    // If ?fresh=1 is in the URL (from "Send Another Gift"), clean it so refresh doesn't show stale query
    if (searchParams.get("fresh") === "1") {
      router.replace("/gift-cards");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch gift card types from the API
  useEffect(() => {
    fetch("/api/gift-cards")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: GiftCard[] = data.map((c: { slug: string; title: string; sessions: number; price: number; gradient: string; description: string; tag: string }) => ({
            id: c.slug,
            title: c.title,
            sessionCount: c.sessions,
            price: `₦${c.price.toLocaleString()}`,
            priceValue: c.price,
            tag: c.tag,
            badge: c.slug === "one" ? "START HERE" : c.slug === "two" ? "MOST LOVED" : "FULLY THEIRS",
            description: c.description,
            gradient: c.gradient,
          }));
          setCards(mapped);
        }
      })
      .catch(() => {
        // Use fallback cards if API fails
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.body.style.setProperty("--page-gradient-from", "#FFF5EE");
    document.body.style.setProperty("--page-gradient-to", "#FFF5EE");
    return () => {
      document.body.style.removeProperty("--page-gradient-from");
      document.body.style.removeProperty("--page-gradient-to");
    };
  }, []);

  const getQty = (cardId: string) => cart.find((c) => c.cardId === cardId)?.qty ?? 0;

  const increment = (card: GiftCard) => {
    const newCart = [...cart];
    const existing = newCart.find((c) => c.cardId === card.id);
    if (existing) existing.qty += 1;
    else newCart.push({ cardId: card.id, title: card.title, price: card.priceValue, sessions: card.sessionCount, gradient: card.gradient, qty: 1 });
    setCart(newCart);
  };
  const decrement = (cardId: string) => {
    setCart(cart.map((c) => c.cardId === cardId ? { ...c, qty: Math.max(0, c.qty - 1) } : c).filter((c) => c.qty > 0));
  };

  const filteredCards =
    !activeFilter || activeFilter === "All Cards"
      ? cards
      : activeFilter === "Seed"
        ? cards.filter((c) => c.id === "one")
        : activeFilter === "Root"
          ? cards.filter((c) => c.id === "two")
          : activeFilter === "Grove"
            ? cards.filter((c) => c.id === "three")
            : cards;

  const handleProceed = () => {
    if (totalQty === 0) return;
    const cartItems: CartItem[] = cards.filter((c) => getQty(c.id) > 0).map((c) => ({ cardId: c.id, title: c.title, price: c.priceValue, sessions: c.sessionCount, gradient: c.gradient, qty: getQty(c.id) }));
    setCart(cartItems);
    const recipients = cartItems.flatMap((item) => Array.from({ length: item.qty }, (_, i) => ({ uid: `${item.cardId}-${i}-${Math.random().toString(36).slice(2, 7)}`, cardId: item.cardId, name: "", email: "", occasion: "Just Because", deliveryMode: "now" as const, note: "", confirmed: false })));
    clearRecipients();
    useStore.setState({ recipients });
    const cartStr = cartItems.map((c) => `${c.cardId}:${c.qty}`).join(",");
    router.push(`/recipient-details?cart=${encodeURIComponent(cartStr)}&total=${totalPrice}`);
  };

  return (
    <main className="relative flex flex-1 flex-col overflow-x-hidden">
      {/* ============ HERO ============ */}
      <section className="relative w-full overflow-hidden px-5 pb-12 pt-10 sm:px-8 sm:pb-16 lg:px-12 lg:pt-16">
        {/* Decorative soft blooms */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#B5E1C3]/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-32 h-72 w-72 rounded-full bg-[#E8B6D5]/20 blur-3xl"
        />

        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          {/* Top pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-[0_4px_15px_rgba(78, 0, 48, 0.08)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-maroon" strokeWidth={2.5} />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-maroon sm:text-xs">
              The Gift of Wellness
            </span>
          </motion.div>

          {/* Headline — Fraunces, "a moment of peace" italic */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight bg-gradient-to-r from-[#2750D8] to-[#90AAFF] bg-clip-text text-transparent sm:text-5xl lg:text-6xl"
          >
            Send care in the form of{" "}
            <span className="italic font-semibold">a moment of peace</span>.
          </motion.h1>

          {/* Subtitle — Plus Jakarta Sans, 16-18px (no "therapy") */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-xl font-sans text-[16px] leading-relaxed text-maroon/85 sm:text-[18px]"
          >
            Tare gift cards provide access to premium sessions, curated wellness
            experiences.
          </motion.p>

          {/* Hero image — centered, drop shadow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-10 aspect-[534/500] w-full max-w-md sm:max-w-lg lg:max-w-xl"
          >
            {/* Watercolor liquid morphing background layer (z-1) */}
            <div aria-hidden className="absolute inset-0 z-[1] overflow-hidden rounded-[3rem]">
              <div className="absolute inset-0 animate-watercolor-morph">
                <div className="absolute left-[10%] top-[15%] h-[50%] w-[50%] rounded-full bg-[#C7B2E2]/40 blur-3xl animate-blob-1" />
                <div className="absolute right-[5%] top-[20%] h-[45%] w-[45%] rounded-full bg-[#B5E1C3]/35 blur-3xl animate-blob-2" />
                <div className="absolute left-[20%] bottom-[10%] h-[40%] w-[40%] rounded-full bg-[#BCE1F0]/35 blur-3xl animate-blob-3" />
                <div className="absolute right-[15%] bottom-[15%] h-[35%] w-[35%] rounded-full bg-[#E8B6D5]/30 blur-3xl animate-blob-4" />
              </div>
            </div>
            <Image
              src="/hero-giftcards.png"
              alt="Couple exchanging a pink TARE physical gift card"
              fill
              priority
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 500px, 576px"
              className="hero-card-glow relative z-[3] animate-float-slow object-contain transition-all duration-500 ease-out hover:scale-[1.02] hover:drop-shadow-[0_0_30px_rgba(219,39,119,0.35)]"
            />
            {/* Micro-interaction overlays — GPU-accelerated CSS animations */}
            {/* 1. Steam wisps rising from pizza area (top-right of image) */}
            <div aria-hidden className="pointer-events-none absolute right-[20%] top-[15%] h-[30%] w-[12%]">
              <span className="absolute left-[30%] bottom-0 h-8 w-1.5 rounded-full bg-white/40 blur-sm animate-steam-1" />
              <span className="absolute left-[55%] bottom-0 h-10 w-1.5 rounded-full bg-white/30 blur-sm animate-steam-2" />
              <span className="absolute left-[10%] bottom-0 h-6 w-1 rounded-full bg-white/35 blur-sm animate-steam-3" />
            </div>
            {/* 2. Phone screen shimmer sweep */}
            <div aria-hidden className="pointer-events-none absolute right-[8%] top-[30%] h-[25%] w-[18%] overflow-hidden rounded-lg">
              <span className="absolute inset-0 bg-gradient-to-br from-transparent via-white/30 to-transparent animate-shimmer-sweep" />
            </div>
            {/* 3. Envelope edge shimmer */}
            <div aria-hidden className="pointer-events-none absolute right-[35%] top-[55%] h-[8%] w-[20%]">
              <span className="absolute inset-0 rounded animate-envelope-shimmer" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FILTER PILLS ============ */}
      <section className="relative w-full px-5 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-2 sm:gap-3">
          {FILTERS.map((label) => {
            const active = (activeFilter ?? "All Cards") === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setActiveFilter(active && label === "All Cards" ? null : label)}
                className={`rounded-full px-4 py-2 font-sans text-xs font-semibold transition-all duration-200 sm:text-sm ${
                  active
                    ? "bg-[#4E0030] text-white shadow-md"
                    : "bg-white/80 text-maroon hover:bg-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ============ GIFT CARD GRID (3 cards only) ============ */}
      <section className="relative w-full px-5 pb-32 pt-10 sm:px-8 lg:px-12 lg:pt-14">
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            key={activeFilter ?? "all"}
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
          >
            {filteredCards.map((card) => {
              const qty = getQty(card.id);
              return (
                <motion.article
                  key={card.id}
                  variants={itemUp}
                  className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_10px_40px_rgba(78, 0, 48, 0.12)] transition-transform duration-300 hover:-translate-y-1"
                >
                  {/* Top pastel graphic */}
                  <div
                    className={`relative flex h-36 flex-col items-center justify-center bg-gradient-to-br ${card.gradient} px-6 py-6 sm:h-40`}
                  >
                    {/* Badge pill — top-right corner */}
                    {card.badge && (
                      <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-[#F10897] px-2.5 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-white shadow-sm sm:text-[10px]">
                        {card.badge}
                      </span>
                    )}
                    <span className="font-fraunces text-lg font-bold text-maroon sm:text-xl">
                      Tare Gift Card
                    </span>
                    <span className="mt-1 font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-maroon/70 sm:text-xs">
                      {card.sessionCount} {card.sessionCount === 1 ? "Session" : "Sessions"}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-sans text-lg font-bold text-maroon sm:text-xl">
                      {card.title}
                    </h3>

                    {/* Pills */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-blush px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#F10897] sm:text-[11px]">
                        {card.sessionCount} Session{card.sessionCount === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-blush px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-[#F10897] sm:text-[11px]">
                        {card.tag}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="mt-4 font-sans text-sm leading-relaxed text-maroon/75">
                      {card.description}
                    </p>

                    {/* Footer: price + quantity selector */}
                    <div className="mt-6 flex items-center justify-between gap-3 pt-2">
                      <span className="font-sans text-xl font-extrabold text-maroon sm:text-2xl">
                        {card.price}
                      </span>

                      {/* Quantity selector */}
                      <div className="flex items-center gap-1 rounded-full bg-blush p-1">
                        <button
                          type="button"
                          aria-label={`Decrease ${card.title} quantity`}
                          onClick={() => decrement(card.id)}
                          disabled={qty === 0}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#F10897] shadow-sm transition-all duration-200 hover:bg-white/80 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                        <span
                          className="min-w-[2rem] text-center font-sans text-sm font-bold text-maroon tabular-nums"
                          aria-live="polite"
                        >
                          {qty}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${card.title} quantity`}
                          onClick={() => increment(card)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F10897] text-white shadow-sm transition-all duration-200 hover:bg-[#d4007d] active:scale-90"
                        >
                          <Plus className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ============ MASTER CONFIRMATION BUTTON (sticky bottom) ============ */}
      <AnimatePresence>
        {totalQty > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-5 pb-5 sm:pb-7"
          >
            <button
              type="button"
              onClick={handleProceed}
              className="group inline-flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-[#F10897] px-6 py-4 font-sans text-sm font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#d4007d] active:scale-95 sm:text-base"
            >
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white/20 px-2 text-xs font-bold tabular-nums">
                  {totalQty}
                </span>
                Proceed to Recipient Details
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="font-bold tabular-nums">
                  ₦{totalPrice.toLocaleString()}
                </span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
