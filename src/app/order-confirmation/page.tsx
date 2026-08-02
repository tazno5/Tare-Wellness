"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Sparkles,
  Gift,
  Copy,
  Check,
  Mail,
  CalendarHeart,
  CheckCircle2,
  PartyPopper,
  HelpCircle,
  Heart,
  ShieldCheck,
  Clock,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useStore } from "@/lib/store";
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

const FAQS = [
  {
    q: "When will my recipient receive the gift card?",
    a: "Immediately. The moment your payment is confirmed, we email their personalized gift card straight to their inbox — no waiting required.",
  },
  {
    q: "Does the gift card expire?",
    a: "Never. Tare gift cards carry no expiration date. They can redeem it on their schedule, whenever the moment feels right.",
  },
  {
    q: "Can I get a refund?",
    a: "Yes — within 14 days of purchase, as long as the gift card hasn't been redeemed. Reach out to our care team and we'll handle it gently.",
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

/* Seeded hash → deterministic redemption code per recipient.
   Produces XXXX-XXXX-XXXX-XXXX (alphanumeric, uppercase). */
function seededRedemptionCode(seed: string): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  const total = 16;
  const chunks: string[] = [];
  let combined = (h1 >>> 0).toString(2).padStart(32, "0") + (h2 >>> 0).toString(2).padStart(32, "0");
  // Ensure deterministic length by mixing
  while (combined.length < total * 6) {
    combined += combined;
  }
  for (let i = 0; i < total; i++) {
    const bits = combined.slice(i * 6, i * 6 + 6);
    const idx = parseInt(bits, 2) % alphabet.length;
    chunks.push(alphabet[idx]);
  }
  const s = chunks.join("");
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}`;
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { recipients, addDemoCode, clearDemoCodes, clearCart, clearRecipients } = useStore();
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [confirmIndex, setConfirmIndex] = useState(0);
  const [apiOrder, setApiOrder] = useState<null | {
    orderNumber: string;
    totalAmount: number;
    orderItems: {
      id: string;
      cardTitle: string;
      cardPrice: number;
      cardSessions: number;
      cardGradient: string;
      recipientName: string;
      recipientEmail: string;
      redemption: { code: string; creditAmount: number; status: string } | null;
    }[];
  }>(null);

  // Set gradient — render + useEffect
  useMemo(() => {
    if (typeof document === "undefined") return;
    document.body.style.setProperty("--page-gradient-from", "#FCE4EC");
    document.body.style.setProperty("--page-gradient-to", "#F10897");
  }, []);
  useEffect(() => {
    document.body.style.setProperty("--page-gradient-from", "#FCE4EC");
    document.body.style.setProperty("--page-gradient-to", "#F10897");
  });

  // Fetch real order data from API if we have an order ID
  const orderId = searchParams.get("id");
  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => { if (data) setApiOrder(data); })
        .catch(() => {}, []);
    }
  }, [orderId]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // If we have API order data, use it; otherwise fall back to URL params + store
  const receipts = useMemo(() => {
    // API data path
    if (apiOrder) {
      return apiOrder.orderItems.map((item, i) => ({
        uid: item.id,
        cardId: item.cardTitle.toLowerCase().includes("three") ? "three" : item.cardTitle.toLowerCase().includes("two") ? "two" : "one",
        name: item.recipientName,
        email: item.recipientEmail,
        code: item.redemption?.code ?? "PENDING",
        index: i,
        total: apiOrder.orderItems.length,
        price: item.cardPrice,
        sessions: item.cardSessions,
        gradient: item.cardGradient,
      }));
    }

    // Fallback: URL params + store (existing logic)
    const cartParam = searchParams.get("cart") ?? "";
    const rParam = searchParams.get("recipients") ?? "";

    const parsedCart = cartParam
      .split(",")
      .filter(Boolean)
      .map((s) => s.split(":"))
      .map(([id, qty]) => ({ id, qty: parseInt(qty, 10) || 0 }))
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
      }, []);

    const cartSource =
      parsedCart.length > 0
        ? parsedCart
        : useStore.getState().cart.map((c) => ({ id: c.cardId, qty: c.qty }));

    const recipientSource =
      parsedRecipients.length > 0
        ? parsedRecipients
        : recipients.map((r) => ({
            uid: r.uid,
            cardId: r.cardId,
            name: r.name,
            email: r.email,
          }));

    // Expand cart into individual cards, matched to recipients by cardId in order
    const expanded: {
      uid: string;
      cardId: string;
      name: string;
      email: string;
      code: string;
      index: number;
      total: number;
    }[] = [];

    let recipientQueue = [...recipientSource];
    cartSource.forEach((c) => {
      for (let i = 0; i < c.qty; i++) {
        const r = recipientQueue.shift() ?? {
          uid: `${c.id}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          cardId: c.id,
          name: "",
          email: "",
        };
        expanded.push({
          uid: r.uid,
          cardId: c.id,
          name: r.name,
          email: r.email,
          code: seededRedemptionCode(`${r.uid}-${c.id}-${i}`),
          index: expanded.length,
          total: 0, // filled after we know length
        });
      }
    });

    const total = expanded.length;
    return expanded.map((e) => ({ ...e, total }));
  }, [searchParams, recipients]);

  // Store demo codes in Zustand so the Redeem page can validate them
  useEffect(() => {
    if (!apiOrder && receipts.length > 0) {
      clearDemoCodes();
      receipts.forEach((r) => {
        const card = CARD_LOOKUP[r.cardId];
        if (card && r.code && r.code !== "PENDING") {
          addDemoCode({
            code: r.code,
            cardId: r.cardId,
            cardTitle: card.title,
            creditAmount: r.price ?? card.price,
            sessions: card.sessions,
          });
        }
      });
    }
  }, [receipts, apiOrder, addDemoCode, clearDemoCodes]);

  const orderTotal = apiOrder
    ? apiOrder.totalAmount
    : receipts.reduce((sum, r) => sum + (r.price ?? CARD_LOOKUP[r.cardId]?.price ?? 0), 0);

  const today = hasMounted
    ? new Date().toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Today";

  const handleCopy = async (code: string, uid: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedUid(uid);
      toast({
        title: "Code copied",
        description: "Share it carefully — this is the key to their gift.",
      }, []);
      setTimeout(() => setCopiedUid(null), 1800);
    } catch {
      toast({
        title: "Couldn't copy",
        description: "Select the code and copy manually.",
      }, []);
    }
  };

  const formatPrice = (n: number) => `₦${n.toLocaleString()}`;

  // "Send Another Gift" — reset the buyer's cart + recipients so they start fresh.
  // Demo codes and redemption state are intentionally preserved (recipient's redeem flow).
  const handleSendAnother = () => {
    clearCart();
    clearRecipients();
    router.push("/gift-cards?fresh=1");
  };

  return (
    <main className="relative flex flex-1 flex-col">
      {/* Decorative blooms */}
      <div aria-hidden className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-white/50 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-[#F10897]/20 blur-3xl" />

      {/* Empty state: no order data */}
      {receipts.length === 0 && !apiOrder ? (
        <section className="relative flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
            <Gift className="h-10 w-10 text-white" strokeWidth={2} />
          </div>
          <h2 className="font-fraunces text-3xl font-bold text-[#4E0030]">No order found</h2>
          <p className="mt-3 max-w-sm font-sans text-sm text-[#4E0030]/70">
            We couldn&apos;t find any order details. Try sending a gift card to get started.
          </p>
          <Link href="/gift-cards" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#4E0030] px-7 py-3.5 font-sans text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.03] hover:bg-[#3a0023]">
            Browse Gift Cards <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </section>
      ) : (
      <>

      {/* ============ HERO ============ */}
      <section className="relative w-full overflow-hidden px-5 pb-6 pt-6 sm:px-8 sm:pb-10 lg:px-12">
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_8px_30px_rgba(61, 0, 46, 0.15)]"
          >
            <PartyPopper className="h-6 w-6 text-[#F10897]" strokeWidth={2.5} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-[0_4px_15px_rgba(61, 0, 46, 0.08)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-maroon" strokeWidth={2.5} />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-maroon sm:text-xs">
              Order Confirmed
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 font-fraunces text-4xl font-extrabold leading-[1.05] tracking-tight text-maroon sm:text-5xl lg:text-6xl"
          >
            Your gift is on its way{" "}
            <span className="text-[#F10897]">&#10084;&#65039;</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-xl font-sans text-[15px] leading-relaxed text-maroon/85 sm:text-[17px]"
          >
            We&apos;ve emailed each recipient their gift card. Keep these
            receipts for your records.
          </motion.p>

          {/* Order number from API */}
          {apiOrder && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-3 font-sans text-sm font-bold text-[#F10897]"
            >
              Order #{apiOrder.orderNumber}
            </motion.p>
          )}

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-6 aspect-[534/500] w-full max-w-[260px] sm:max-w-[300px] lg:max-w-[340px]"
          >
            <div
              aria-hidden
              className="absolute inset-6 rounded-full bg-white/30 blur-2xl"
            />
            <Image
              src="/hero-confirmation.png"
              alt="A whimsical creature releasing a glowing envelope into the air, carried by tiny floating spores"
              fill
              priority
              sizes="(max-width: 640px) 65vw, (max-width: 1024px) 300px, 340px"
              className="hero-shadow relative animate-float-slow object-contain"
            />
          </motion.div>
        </div>
      </section>

      {/* ============ RECEIPT CARDS ============ */}
      <section className="relative w-full px-5 pb-10 sm:px-8 lg:px-12">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:gap-8"
        >
          {/* Receipt list */}
          <div className="flex flex-col gap-6">
            {receipts.map((r) => {
              const card = CARD_LOOKUP[r.cardId];
              return (
                <motion.article
                  key={r.uid}
                  variants={itemUp}
                  className="overflow-hidden rounded-3xl bg-white/85 shadow-[0_10px_40px_rgba(61, 0, 46, 0.10)] backdrop-blur-sm"
                >
                  {/* Receipt header */}
                  <div className="flex items-center justify-between border-b border-maroon/10 bg-blush/40 px-5 py-3 sm:px-6">
                    <h2 className="font-fraunces text-lg font-bold text-maroon">
                      Receipt
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4E0030] px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                      <Gift className="h-3 w-3" strokeWidth={2.5} />
                      Card {r.index + 1} of {r.total}
                    </span>
                  </div>

                  <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:p-6">
                    {/* Thumbnail */}
                    <div
                      className={`relative flex h-28 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${
                        card?.gradient ?? "from-[#FCE4EC] to-[#F8BBD0]"
                      } sm:w-36`}
                    >
                      <div className="text-center">
                        <p className="font-fraunces text-base font-bold text-maroon">
                          Tare
                        </p>
                        <p className="mt-0.5 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-maroon/70">
                          {card?.title ?? "Gift"}
                        </p>
                        <p className="mt-1 font-fraunces text-base font-extrabold text-maroon">
                          {formatPrice(card?.price ?? 0)}
                        </p>
                      </div>
                      <Gift
                        className="absolute right-2 top-2 h-4 w-4 text-maroon/40"
                        strokeWidth={2}
                      />
                    </div>

                    {/* Recipient info + code */}
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-3">
                        <InfoCell
                          label="Recipient"
                          value={r.name || "—"}
                          icon={<Heart className="h-3 w-3" strokeWidth={2.5} />}
                        />
                        <InfoCell
                          label="Email"
                          value={r.email || "—"}
                          icon={<Mail className="h-3 w-3" strokeWidth={2.5} />}
                        />
                        <InfoCell
                          label="Date"
                          value={today}
                          icon={<CalendarHeart className="h-3 w-3" strokeWidth={2.5} />}
                        />
                        <InfoCell
                          label="Status"
                          value="Delivered"
                          icon={<CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />}
                          accent
                        />
                      </div>

                      {/* Redemption code */}
                      <div className="rounded-2xl border border-maroon/15 bg-blush/30 p-3">
                        <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-maroon/60">
                          Redemption Code
                        </p>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <code className="font-mono text-base font-bold tracking-wider text-maroon sm:text-lg">
                            {r.code}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(r.code, r.uid)}
                            aria-label="Copy redemption code"
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-maroon shadow-sm transition-all hover:bg-[#F10897] hover:text-white active:scale-90"
                          >
                            {copiedUid === r.uid ? (
                              <Check className="h-4 w-4" strokeWidth={2.5} />
                            ) : (
                              <Copy className="h-4 w-4" strokeWidth={2.5} />
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="inline-flex items-center gap-1.5 font-sans text-[11px] text-maroon/60">
                        <Clock className="h-3 w-3" strokeWidth={2.5} />
                        No expiration — they redeem when ready.
                      </p>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {/* RIGHT: Order Total + Journey */}
          <div className="flex flex-col gap-6">
            {/* Order Total — dark */}
            <motion.article
              variants={itemUp}
              className="rounded-3xl bg-[#4E0030] p-5 text-white shadow-[0_14px_40px_rgba(61, 0, 46, 0.30)] sm:p-6"
            >
              <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-blush">
                Order Total
              </h2>
              <div className="mt-4 space-y-2 font-sans text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-blush/80">Gift Cards</span>
                  <span className="font-bold tabular-nums">
                    {receipts.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blush/80">Processing Fee</span>
                  <span className="rounded-full bg-[#F10897]/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[#F10897]">
                    Free
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-4">
                <span className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-blush/80">
                  Total Paid
                </span>
                <span className="font-fraunces text-2xl font-extrabold text-white">
                  {formatPrice(orderTotal)}
                </span>
              </div>
              <div className="mt-4 rounded-2xl bg-white/10 p-3">
                <p className="font-sans text-[11px] text-blush/70">
                  Payment method
                </p>
                <p className="mt-0.5 font-sans text-sm font-bold capitalize text-white">
                  {searchParams.get("method") ?? "card"}
                </p>
              </div>
            </motion.article>

            {/* Gift Journey */}
            <motion.article
              variants={itemUp}
              className="rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(61, 0, 46, 0.10)] backdrop-blur-sm sm:p-6"
            >
              <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-maroon/70">
                Gift Journey
              </h2>
              <ol className="mt-4 space-y-4">
                {[
                  {
                    icon: <Check className="h-3.5 w-3.5" strokeWidth={2.5} />,
                    title: "Purchased",
                    body: "Payment confirmed.",
                    done: true,
                  },
                  {
                    icon: <Mail className="h-3.5 w-3.5" strokeWidth={2.5} />,
                    title: "Email sent",
                    body: "Gift card delivered.",
                    done: true,
                  },
                  {
                    icon: <Gift className="h-3.5 w-3.5" strokeWidth={2.5} />,
                    title: "Redeemed",
                    body: "Awaiting their moment.",
                    done: false,
                  },
                  {
                    icon: <Heart className="h-3.5 w-3.5" strokeWidth={2.5} />,
                    title: "Session booked",
                    body: "Their pace, their choice.",
                    done: false,
                  },
                ].map((s, i) => (
                  <li key={s.title} className="flex items-start gap-3">
                    <div
                      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        s.done
                          ? "bg-[#4E0030] text-white"
                          : "bg-blush text-maroon/50"
                      }`}
                    >
                      {s.icon}
                      {i < 3 && (
                        <span
                          className={`absolute -bottom-4 left-1/2 h-3 w-px -translate-x-1/2 ${
                            s.done ? "bg-[#4E0030]/40" : "bg-maroon/15"
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-sans text-sm font-bold text-maroon">
                        {s.title}
                      </p>
                      <p className="font-sans text-xs text-maroon/60">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.article>

            {/* Trust pill */}
            <motion.div
              variants={itemUp}
              className="rounded-3xl bg-blush/60 p-4 text-center shadow-[0_6px_20px_rgba(61, 0, 46, 0.08)]"
            >
              <ShieldCheck className="mx-auto h-6 w-6 text-maroon" strokeWidth={2} />
              <p className="mt-2 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-maroon">
                Backed by our care promise
              </p>
              <p className="mt-1 font-sans text-[11px] text-maroon/70">
                If anything feels off, we&apos;ll make it right.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ============ WHAT YOUR RECIPIENT WILL RECEIVE (Merged Preview + Carousel) ============ */}
      <section className="relative w-full px-5 pb-10 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mx-auto w-full max-w-3xl"
        >
          {/* Section header */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-fraunces text-2xl font-bold text-maroon sm:text-3xl">
              What your recipient will receive
            </h2>
            {receipts.length > 1 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-maroon">
                <Gift className="h-3 w-3" strokeWidth={2.5} />
                {confirmIndex + 1} / {receipts.length}
              </span>
            )}
          </div>

          {/* Carousel window */}
          {receipts.length > 0 && (
            <>
              <div className="relative overflow-hidden rounded-3xl">
                <div
                  className="flex transition-transform duration-[400ms] ease-in-out"
                  style={{
                    transform: `translateX(-${confirmIndex * 100}%)`,
                  }}
                >
                  {receipts.map((r) => {
                    const card = CARD_LOOKUP[r.cardId];
                    const storeR = recipients.find((s) => s.uid === r.uid);
                    return (
                      <div
                        key={r.uid}
                        className="w-full shrink-0"
                        aria-hidden={
                          receipts[confirmIndex]?.uid !== r.uid
                        }
                      >
                        <OrderMergedCard
                          cardTitle={card?.title ?? "Gift"}
                          cardPrice={r.price ?? card?.price ?? 0}
                          cardSessions={card?.sessions ?? 1}
                          cardGradient={card?.gradient ?? "from-[#FCE4EC] to-[#F8BBD0]"}
                          cardTag={card?.tag ?? (card ? "Gift" : "")}
                          recipientName={r.name}
                          recipientEmail={r.email}
                          occasion={storeR?.occasion ?? "Just Because"}
                          deliveryMode={storeR?.deliveryMode ?? ("now" as const)}
                          note={storeR?.note ?? ""}
                          today={today}
                          code={r.code}
                          formatPrice={formatPrice}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation indicators */}
              {receipts.length > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmIndex(Math.max(0, confirmIndex - 1))}
                    disabled={confirmIndex === 0}
                    aria-label="Previous gift"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blush text-maroon transition-all hover:bg-blush-dark active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  <div className="flex items-center gap-1.5">
                    {receipts.map((r, i) => (
                      <button
                        key={r.uid}
                        type="button"
                        onClick={() => setConfirmIndex(i)}
                        aria-label={`Go to gift ${i + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          i === confirmIndex
                            ? "w-7 bg-[#F10897]"
                            : "w-2 bg-maroon/25 hover:bg-maroon/40"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmIndex(Math.min(receipts.length - 1, confirmIndex + 1))}
                    disabled={confirmIndex === receipts.length - 1}
                    aria-label="Next gift"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blush text-maroon transition-all hover:bg-blush-dark active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </section>

      {/* ============ COMMON QUESTIONS ============ */}
      <section className="relative w-full px-5 pb-10 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto w-full max-w-3xl rounded-3xl bg-white/85 p-5 shadow-[0_10px_40px_rgba(61, 0, 46, 0.10)] backdrop-blur-sm sm:p-8"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-maroon" strokeWidth={2.5} />
            <h2 className="font-fraunces text-2xl font-bold text-maroon sm:text-3xl">
              Common Questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="mt-4">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`item-${i}`}
                className="border-maroon/10"
              >
                <AccordionTrigger className="font-sans text-sm font-bold text-maroon hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="font-sans text-sm leading-relaxed text-maroon/75">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>

      {/* ============ BOTTOM NAV ============ */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleSendAnother}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#4E0030] px-7 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(61, 0, 46, 0.25)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#3a0023] active:scale-95 sm:w-auto"
          >
            <Gift className="h-4 w-4" strokeWidth={2.5} />
            Send Another Gift
          </button>
          <Link
            href="/redeem"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blush px-7 py-3.5 font-sans text-sm font-semibold text-maroon shadow-[0_8px_24px_rgba(61, 0, 46, 0.12)] transition-all duration-200 hover:scale-[1.02] hover:bg-blush-dark active:scale-95 sm:w-auto"
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            Redeem a Card
          </Link>
        </div>
      </section>
      </>
      )}
    </main>
  );
}

function InfoCell({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-blush/30 p-2.5">
      <div
        className={`flex items-center gap-1 ${
          accent ? "text-[#F10897]" : "text-maroon/60"
        }`}
      >
        {icon}
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>
      <p className="mt-1 truncate font-sans text-sm font-bold text-maroon">
        {value}
      </p>
    </div>
  );
}

/* ============ Order Merged Card — with dynamic gift code + Redeem button ============ */
function OrderMergedCard({
  cardTitle,
  cardPrice,
  cardSessions,
  cardGradient,
  cardTag,
  recipientName,
  recipientEmail,
  occasion,
  deliveryMode,
  note,
  today,
  code,
  formatPrice,
}: {
  cardTitle: string;
  cardPrice: number;
  cardSessions: number;
  cardGradient: string;
  cardTag: string;
  recipientName: string;
  recipientEmail: string;
  occasion: string;
  deliveryMode: "now" | "schedule";
  note: string;
  today: string;
  code: string;
  formatPrice: (n: number) => string;
}) {
  const hasNote = note && note.trim().length > 0;

  return (
    <div className="overflow-hidden rounded-3xl bg-white/85 shadow-[0_10px_40px_rgba(61, 0, 46, 0.10)] backdrop-blur-sm">
      {/* Card header — logo + package value */}
      <div
        className={`relative flex items-center justify-between bg-gradient-to-br ${cardGradient} px-5 py-4 sm:px-6`}
      >
        {/* Small Tare logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Tare logo"
            width={32}
            height={32}
            className="h-8 w-8 object-contain drop-shadow-[0_2px_6px_rgba(61,0,46,0.2)]"
          />
          <div>
            <p className="font-fraunces text-sm font-bold text-maroon">
              Tare Gift Card
            </p>
            {cardTag && (
              <p className="font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-maroon/70">
                {cardTag}
              </p>
            )}
          </div>
        </div>
        {/* Dynamic package value */}
        <div className="text-right">
          <p className="font-fraunces text-lg font-extrabold text-maroon sm:text-xl">
            {formatPrice(cardPrice)}
          </p>
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-maroon/70">
            {cardSessions} session{cardSessions === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 sm:p-6">
        {/* Package title */}
        <h3 className="font-fraunces text-xl font-bold text-maroon">
          {cardTitle}
        </h3>

        {/* Recipient details */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-blush/40 p-3">
            <div className="flex items-center gap-1.5 text-maroon/60">
              <Heart className="h-3 w-3" strokeWidth={2.5} />
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em]">
                Recipient
              </span>
            </div>
            <p className="mt-1.5 truncate font-sans text-sm font-bold text-maroon">
              {recipientName || "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-blush/40 p-3">
            <div className="flex items-center gap-1.5 text-maroon/60">
              <Mail className="h-3 w-3" strokeWidth={2.5} />
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em]">
                Email
              </span>
            </div>
            <p className="mt-1.5 truncate font-sans text-sm font-bold text-maroon">
              {recipientEmail || "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-blush/40 p-3">
            <div className="flex items-center gap-1.5 text-maroon/60">
              <CalendarHeart className="h-3 w-3" strokeWidth={2.5} />
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em]">
                Occasion
              </span>
            </div>
            <p className="mt-1.5 truncate font-sans text-sm font-bold text-maroon">
              {occasion}
            </p>
          </div>
          <div className="rounded-2xl bg-blush/40 p-3">
            <div className="flex items-center gap-1.5 text-maroon/60">
              <Clock className="h-3 w-3" strokeWidth={2.5} />
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em]">
                Delivery
              </span>
            </div>
            <p className="mt-1.5 truncate font-sans text-sm font-bold text-maroon">
              {deliveryMode === "now" ? "Sent" : today}
            </p>
          </div>
        </div>

        {/* Dynamic gift code */}
        <div className="mt-4 rounded-2xl border-2 border-dashed border-[#F10897]/50 bg-blush/30 p-4">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-maroon/60">
            Your Gift Code
          </p>
          <code className="mt-1 block font-mono text-lg font-bold tracking-wider text-maroon sm:text-xl">
            {code}
          </code>
        </div>

        {/* Personal message — CONDITIONAL */}
        {hasNote && (
          <div className="mt-4 rounded-2xl border-l-4 border-[#F10897] bg-blush/40 p-4">
            <p className="font-fraunces text-base italic leading-relaxed text-maroon">
              &ldquo;{note}&rdquo;
            </p>
            <p className="mt-2 font-sans text-xs font-bold uppercase tracking-[0.14em] text-maroon/60">
              — From you
            </p>
          </div>
        )}

        {/* Redeem button — links to /redeem */}
        <Link
          href="/redeem"
          className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F10897] px-6 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(241,8,151,0.35)] transition-all duration-200 hover:scale-[1.01] hover:bg-[#d4007d] active:scale-95"
        >
          <Gift className="h-4 w-4" strokeWidth={2.5} />
          Open My Gift
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            strokeWidth={2.5}
          />
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center font-sans text-maroon">
          Loading…
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
