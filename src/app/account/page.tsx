"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Clock,
  Gift,
  CalendarCheck,
  Loader2,
  LogOut,
  Mail,
  Package,
  Settings as SettingsIcon,
  Sparkles,
  User as UserIcon,
  Users,
  Video,
  Wallet,
  ShoppingBag,
  CheckCircle2,
  Download,
  Trash2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "next-auth/react";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  orderItems: {
    id: string;
    cardTitle: string;
    cardPrice: number;
    cardSessions: number;
    recipientName: string;
    recipientEmail: string;
    redemption: { code: string; status: string; creditAmount: number } | null;
  }[];
};

type Booking = {
  id: string;
  bookingNumber: string;
  sessionType: string;
  sessionTitle: string;
  sessionPrice: number;
  therapistName: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  status: string;
  meetingUrl: string | null;
  redemption: { code: string; orderItem: { cardTitle: string } } | null;
};

// A gift card the user owns with sessions remaining. Fetched from
// /api/redemptions when the Bookings tab is active. This is the
// "Active Packages" / "My Gift Cards" tracker, now relocated from
// the Settings tab (where it never existed in code) to the Bookings
// tab so users can see their session balance right next to bookings.
type GiftCardAccount = {
  id: string;
  code: string;
  cardTitle: string;
  cardSessions: number;     // total sessions on the card (tier: 1, 2, 3, …)
  creditAmount: number;
  sessionsRemaining: number; // sessions left to book
  sessionsUsed: number;      // sessions already booked
  status: string;
  // True when the card is fully redeemed (sessionsRemaining === 0 AND
  // sessionsUsed === cardSessions). The UI renders exhausted cards in a
  // separate "Past Packages" section with a "Fully Redeemed" badge and a
  // disabled CTA — they're shown read-only for history, never hidden or
  // deleted from the DB.
  isExhausted: boolean;
  redeemedAt: string | null;
  createdAt: string;
};

type Tab = "orders" | "bookings" | "recipients" | "settings";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "orders", label: "Orders", icon: <Package className="h-4 w-4" strokeWidth={2.5} /> },
  { id: "bookings", label: "Bookings", icon: <Calendar className="h-4 w-4" strokeWidth={2.5} /> },
  { id: "recipients", label: "Recipients", icon: <Users className="h-4 w-4" strokeWidth={2.5} /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon className="h-4 w-4" strokeWidth={2.5} /> },
];

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, recipients, totalQty } = useStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) || "orders",
  );
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [giftCards, setGiftCards] = useState<GiftCardAccount[] | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingGiftCards, setLoadingGiftCards] = useState(false);

  // Set gradient
  useEffect(() => {
    document.body.style.setProperty("--page-gradient-from", "#FFF5EE");
    document.body.style.setProperty("--page-gradient-to", "#FFF5EE");
    return () => {
      document.body.style.removeProperty("--page-gradient-from");
      document.body.style.removeProperty("--page-gradient-to");
    };
  }, []);

  // Auth gate
  useEffect(() => {
    if (!user) router.replace("/login?callbackUrl=/account");
  }, [user, router]);

  // Update tab from URL when it changes
  useEffect(() => {
    const tab = searchParams.get("tab") as Tab;
    if (tab && ["orders", "bookings", "recipients", "settings"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Fetch orders when orders tab is active
  useEffect(() => {
    if (activeTab === "orders" && user && orders === null) {
      setLoadingOrders(true);
      fetch("/api/orders")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setOrders(Array.isArray(data) ? data : []))
        .catch(() => setOrders([]))
        .finally(() => setLoadingOrders(false));
    }
  }, [activeTab, user, orders]);

  // Fetch bookings when bookings tab is active
  useEffect(() => {
    if (activeTab === "bookings" && user && bookings === null) {
      setLoadingBookings(true);
      fetch("/api/bookings")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setBookings(Array.isArray(data) ? data : []))
        .catch(() => setBookings([]))
        .finally(() => setLoadingBookings(false));
    }
  }, [activeTab, user, bookings]);

  // Fetch gift cards (active packages) when bookings tab is active.
  // This replaces the old "Balance" badge at the top of the account
  // page (which used the unreliable Zustand store's single-redemption
  // state). The Bookings tab now owns session tracking — it shows
  // each gift card with total / used / remaining + a "Book Next Session"
  // button right next to the user's bookings.
  useEffect(() => {
    if (activeTab === "bookings" && user && giftCards === null) {
      setLoadingGiftCards(true);
      fetch("/api/redemptions")
        .then((r) => (r.ok ? r.json() : { cards: [] }))
        .then((data) => setGiftCards(Array.isArray(data.cards) ? data.cards : []))
        .catch(() => setGiftCards([]))
        .finally(() => setLoadingGiftCards(false));
    }
  }, [activeTab, user, giftCards]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.replace(`/account?${params.toString()}`);
  };

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
    } catch {}
    logout();
    toast({ title: "Signed out", description: "You've been logged out successfully." });
    router.push("/");
  };

  const formatPrice = (n: number) => `₦${n.toLocaleString()}`;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (!user) {
    return (
      <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#F10897]" strokeWidth={2.5} />
        <p className="mt-3 font-sans text-sm text-[#4E0030]/70">Loading your account…</p>
      </main>
    );
  }

  return (
    <main className="relative flex flex-1 flex-col overflow-x-hidden">
      {/* Decorative blooms */}
      <div aria-hidden className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#B5E1C3]/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-[#E8B6D5]/20 blur-3xl" />

      {/* HERO */}
      <section className="relative w-full overflow-hidden px-5 pb-6 pt-6 sm:px-8 sm:pb-10 lg:px-12">
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-[0_4px_15px_rgba(78, 0, 48, 0.08)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-maroon" strokeWidth={2.5} />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-maroon sm:text-xs">
              My Account
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#F10897] font-fraunces text-3xl font-bold text-white shadow-[0_10px_30px_rgba(78,0,48,0.25)]"
          >
            {user.name.charAt(0).toUpperCase()}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-4 font-fraunces text-3xl font-extrabold bg-gradient-to-r from-[#2750D8] to-[#90AAFF] bg-clip-text text-transparent sm:text-4xl"
          >
            Welcome back, {user.name.split(" ")[0]}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-2 font-sans text-sm text-[#4E0030]/70"
          >
            {user.email}
          </motion.p>

          {/* Cart quick stat — the gift-card balance badge used to live here
              but has been relocated to the Bookings tab where it belongs
              (next to session bookings). See BookingsTab > "My Gift Cards". */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            {totalQty > 0 && (
              <Link
                href="/cart-review"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-[0_4px_15px_rgba(78,0,48,0.08)] transition-all hover:scale-[1.02]"
              >
                <ShoppingBag className="h-4 w-4 text-[#F10897]" strokeWidth={2.5} />
                <span className="font-sans text-xs font-medium text-[#4E0030]/70">Cart:</span>
                <span className="font-sans text-sm font-bold text-[#4E0030]">{totalQty} item{totalQty === 1 ? "" : "s"}</span>
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* TABS + CONTENT */}
      <section className="relative w-full px-5 pb-12 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-5xl">
          {/* Tab bar */}
          <div className="flex gap-2 overflow-x-auto rounded-2xl bg-white/60 p-1.5 backdrop-blur-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 font-sans text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-[#F10897] text-white shadow-sm"
                    : "text-[#4E0030]/70 hover:bg-white hover:text-[#4E0030]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "orders" && (
                  <OrdersTab
                    orders={orders}
                    loading={loadingOrders}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                  />
                )}
                {activeTab === "bookings" && (
                  <BookingsTab
                    bookings={bookings}
                    loading={loadingBookings}
                    giftCards={giftCards}
                    loadingGiftCards={loadingGiftCards}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                  />
                )}
                {activeTab === "recipients" && (
                  <RecipientsTab recipients={recipients} formatPrice={formatPrice} />
                )}
                {activeTab === "settings" && (
                  <SettingsTab user={user} onSignOut={handleSignOut} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
    </main>
  );
}

// ============================================================
// ORDERS TAB
// ============================================================
function OrdersTab({
  orders,
  loading,
  formatPrice,
  formatDate,
}: {
  orders: Order[] | null;
  loading: boolean;
  formatPrice: (n: number) => string;
  formatDate: (iso: string) => string;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-[0_4px_15px_rgba(78,0,48,0.06)] sm:p-6">
            <div className="flex items-start justify-between border-b border-maroon/10 pb-4">
              <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse rounded-lg bg-maroon/10" />
                <div className="h-3 w-24 animate-pulse rounded-lg bg-maroon/10" />
              </div>
              <div className="space-y-2 text-right">
                <div className="h-6 w-20 animate-pulse rounded-lg bg-maroon/10" />
                <div className="h-4 w-16 animate-pulse rounded-full bg-maroon/10" />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="h-16 animate-pulse rounded-xl bg-[#FFF5EE]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-8 w-8 text-[#F10897]" strokeWidth={2} />}
        title="No orders yet"
        body="When you buy a gift card, it'll show up here with the redemption code and recipient details."
        cta={{ label: "Buy a Gift Card", href: "/gift-cards" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-2xl bg-white p-5 shadow-[0_4px_15px_rgba(78,0,48,0.06)] sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-maroon/10 pb-4">
            <div>
              <p className="font-fraunces text-lg font-bold text-[#4E0030]">
                {order.orderNumber}
              </p>
              <p className="mt-1 font-sans text-xs text-[#4E0030]/60">
                {formatDate(order.createdAt)} · {order.paymentMethod}
              </p>
            </div>
            <div className="text-right">
              <p className="font-fraunces text-xl font-bold text-[#F10897]">
                {formatPrice(order.totalAmount)}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#B5E1C3]/30 px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-wide text-[#2d6e4f]">
                <CheckCircle2 className="h-3 w-3" strokeWidth={3} />
                {order.status}
              </span>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {order.orderItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-[#FFF5EE] p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-sm font-bold text-[#4E0030]">
                    {item.cardTitle}
                  </p>
                  <p className="mt-0.5 font-sans text-xs text-[#4E0030]/70">
                    For {item.recipientName} · {item.recipientEmail}
                  </p>
                  {item.redemption && (
                    <p className="mt-1.5 inline-block rounded-md bg-white px-2 py-1 font-mono text-[11px] font-bold tracking-wider text-[#F10897]">
                      {item.redemption.code}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-sans text-sm font-bold text-[#4E0030]">
                    {formatPrice(item.cardPrice)}
                  </p>
                  {item.redemption && (
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wide ${
                        item.redemption.status === "redeemed"
                          ? "bg-[#E8B6D5]/30 text-[#7a1f5a]"
                          : "bg-[#B5E1C3]/30 text-[#2d6e4f]"
                      }`}
                    >
                      {item.redemption.status}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// BOOKINGS TAB
// ============================================================
function BookingsTab({
  bookings,
  loading,
  giftCards,
  loadingGiftCards,
  formatPrice,
  formatDate,
}: {
  bookings: Booking[] | null;
  loading: boolean;
  giftCards: GiftCardAccount[] | null;
  loadingGiftCards: boolean;
  formatPrice: (n: number) => string;
  formatDate: (iso: string) => string;
}) {
  if (loading || loadingGiftCards) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-[0_4px_15px_rgba(78,0,48,0.06)] sm:p-6">
            <div className="flex items-start justify-between border-b border-maroon/10 pb-4">
              <div className="space-y-2">
                <div className="h-5 w-40 animate-pulse rounded-lg bg-maroon/10" />
                <div className="h-3 w-28 animate-pulse rounded-lg bg-maroon/10" />
              </div>
              <div className="space-y-2 text-right">
                <div className="h-6 w-20 animate-pulse rounded-lg bg-maroon/10" />
                <div className="h-4 w-16 animate-pulse rounded-full bg-maroon/10" />
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="h-12 animate-pulse rounded-xl bg-[#FFF5EE]" />
              <div className="h-12 animate-pulse rounded-xl bg-[#FFF5EE]" />
              <div className="h-12 animate-pulse rounded-xl bg-[#FFF5EE]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============ MY GIFT CARDS / ACTIVE PACKAGES ============ */}
      {/* Active gift cards (sessionsRemaining > 0) — these can be booked
          against right now. Each card shows a 3-column ledger
          (Total / Used / Remaining), a progress bar, and a "Book Next
          Session" CTA. Universal across all tiers (1/2/3/N-session)
          because all values come straight from the DB. */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-fraunces text-lg font-bold text-[#4E0030] inline-flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#F10897]" strokeWidth={2.5} />
            My Gift Cards
          </h3>
          <Link
            href="/gift-cards"
            className="inline-flex items-center gap-1.5 rounded-full bg-white border-[0.3px] border-[#F10897] px-3 py-1.5 font-sans text-xs font-semibold text-[#F10897] transition-all hover:bg-[#E8B6D5]/15"
          >
            Buy another
            <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Split active vs exhausted. We never DELETE depleted cards —
            they stay in the DB permanently for booking history + foreign
            key relationships. The UI shows them in a separate "Past
            Packages" section below, in a read-only / disabled state. */}
        {(() => {
          const activeCards = (giftCards ?? []).filter((c) => !c.isExhausted);
          const exhaustedCards = (giftCards ?? []).filter((c) => c.isExhausted);

          if (giftCards === null) {
            return (
              <div className="rounded-2xl bg-white p-6 text-center shadow-[0_4px_15px_rgba(78,0,48,0.06)]">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#F10897]" strokeWidth={2.5} />
                <p className="mt-2 font-sans text-xs text-[#4E0030]/60">Loading…</p>
              </div>
            );
          }

          if (activeCards.length === 0 && exhaustedCards.length === 0) {
            return (
              <div className="rounded-2xl bg-white p-6 text-center shadow-[0_4px_15px_rgba(78,0,48,0.06)]">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF5EE]">
                  <Gift className="h-5 w-5 text-[#F10897]" strokeWidth={2.5} />
                </div>
                <p className="mt-3 font-sans text-sm font-bold text-[#4E0030]">
                  No active gift cards
                </p>
                <p className="mt-1 font-sans text-xs text-[#4E0030]/65">
                  Buy a gift card to unlock session bookings. Each booking consumes
                  one session from your card balance.
                </p>
                <Link
                  href="/gift-cards"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#F10897] px-5 py-2.5 font-sans text-xs font-semibold text-white transition-all hover:bg-[#d4007d]"
                >
                  <Gift className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Buy a Gift Card
                </Link>
              </div>
            );
          }

          return (
            <>
              {/* Active cards — render even if exhaustedCards is non-empty */}
              {activeCards.length > 0 && (
                <div className="space-y-3">
                  {activeCards.map((card) => {
                    const remaining = card.sessionsRemaining;
                    const used = card.sessionsUsed;
                    const total = card.cardSessions;
                    const usedPct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 100;
                    const sessionWord = remaining === 1 ? "session" : "sessions";

                    return (
                      <div
                        key={card.id}
                        className="rounded-2xl bg-white p-5 shadow-[0_4px_15px_rgba(78,0,48,0.06)] sm:p-6"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-maroon/10 pb-4">
                          <div className="min-w-0">
                            <p className="font-fraunces text-base font-bold text-[#4E0030]">
                              {card.cardTitle}
                            </p>
                            <p className="mt-0.5 font-sans text-[11px] text-[#4E0030]/60">
                              Code <span className="font-mono">{card.code}</span>
                              {card.redeemedAt && (
                                <> · Redeemed {formatDate(card.redeemedAt)}</>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-sans text-[10px] font-bold uppercase tracking-wide text-[#4E0030]/60">
                              Credit
                            </p>
                            <p className="font-fraunces text-lg font-bold text-[#F10897]">
                              {formatPrice(card.creditAmount)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl bg-[#FFF5EE] p-3">
                            <p className="font-sans text-[9px] font-bold uppercase tracking-[0.1em] text-[#4E0030]/60">
                              Total Sessions
                            </p>
                            <p className="mt-1 font-fraunces text-xl font-extrabold tabular-nums text-[#4E0030]">
                              {total}
                            </p>
                          </div>
                          <div className="rounded-xl bg-[#E8B6D5]/15 p-3">
                            <p className="font-sans text-[9px] font-bold uppercase tracking-[0.1em] text-[#7a1f5a]">
                              Used
                            </p>
                            <p className="mt-1 font-fraunces text-xl font-extrabold tabular-nums text-[#7a1f5a]">
                              {used}
                            </p>
                          </div>
                          <div className="rounded-xl bg-[#B5E1C3]/30 p-3">
                            <p className="font-sans text-[9px] font-bold uppercase tracking-[0.1em] text-[#2d6e4f]">
                              Remaining
                            </p>
                            <p className="mt-1 font-fraunces text-xl font-extrabold tabular-nums text-[#2d6e4f]">
                              {remaining}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#FFF5EE]">
                            <div
                              className="h-full rounded-full bg-[#F10897] transition-all duration-500"
                              style={{ width: `${usedPct}%` }}
                            />
                          </div>
                          <p className="mt-1.5 text-right font-sans text-[10px] text-[#4E0030]/55">
                            {usedPct}% used
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Link
                            href="/book-session"
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#F10897] px-4 py-2 font-sans text-xs font-semibold text-white transition-all hover:bg-[#d4007d]"
                          >
                            <Calendar className="h-3.5 w-3.5" strokeWidth={2.5} />
                            Book Next Session
                            <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                              {remaining} {sessionWord} left
                            </span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Past Packages — fully redeemed cards. Read-only.
                  These records are NEVER deleted from the DB. We render
                  them in a muted, disabled state so the user can see their
                  full gift card history and the bookings linked to each
                  card remain navigable via the Bookings list below. */}
              {exhaustedCards.length > 0 && (
                <div className="mt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-[#4E0030]/50" strokeWidth={2.5} />
                    <h4 className="font-fraunces text-sm font-bold uppercase tracking-[0.14em] text-[#4E0030]/60">
                      Past Packages · Fully Redeemed
                    </h4>
                    <span className="rounded-full bg-[#4E0030]/5 px-2 py-0.5 font-sans text-[10px] font-bold text-[#4E0030]/55">
                      {exhaustedCards.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {exhaustedCards.map((card) => {
                      const used = card.sessionsUsed;
                      const total = card.cardSessions;
                      // For exhausted cards the progress is always 100%.
                      const usedPct = 100;

                      return (
                        <div
                          key={card.id}
                          className="rounded-2xl bg-[#FFF5EE]/60 p-5 shadow-[0_2px_8px_rgba(78,0,48,0.04)] ring-1 ring-maroon/5 sm:p-6"
                          aria-label="Fully redeemed gift card — kept for history"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-maroon/10 pb-4">
                            <div className="min-w-0">
                              <p className="font-fraunces text-base font-bold text-[#4E0030]/70">
                                {card.cardTitle}
                              </p>
                              <p className="mt-0.5 font-sans text-[11px] text-[#4E0030]/50">
                                Code <span className="font-mono">{card.code}</span>
                                {card.redeemedAt && (
                                  <> · Redeemed {formatDate(card.redeemedAt)}</>
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#4E0030]/10 px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-[#4E0030]/65"
                                title="All sessions on this gift card have been used"
                              >
                                <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                                Fully Redeemed
                              </span>
                            </div>
                          </div>

                          {/* 3-column ledger — Same shape as active cards,
                              but in muted colors. Badge shows "Used: N | Available: 0". */}
                          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl bg-white/60 p-3">
                              <p className="font-sans text-[9px] font-bold uppercase tracking-[0.1em] text-[#4E0030]/50">
                                Total Sessions
                              </p>
                              <p className="mt-1 font-fraunces text-xl font-extrabold tabular-nums text-[#4E0030]/70">
                                {total}
                              </p>
                            </div>
                            <div className="rounded-xl bg-[#E8B6D5]/10 p-3">
                              <p className="font-sans text-[9px] font-bold uppercase tracking-[0.1em] text-[#7a1f5a]/80">
                                Used
                              </p>
                              <p className="mt-1 font-fraunces text-xl font-extrabold tabular-nums text-[#7a1f5a]">
                                {used}
                              </p>
                            </div>
                            <div className="rounded-xl bg-white/60 p-3">
                              <p className="font-sans text-[9px] font-bold uppercase tracking-[0.1em] text-[#4E0030]/50">
                                Available
                              </p>
                              <p className="mt-1 font-fraunces text-xl font-extrabold tabular-nums text-[#4E0030]/50">
                                0
                              </p>
                            </div>
                          </div>

                          {/* Progress bar — full bar, muted color */}
                          <div className="mt-3">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                              <div
                                className="h-full rounded-full bg-[#4E0030]/40"
                                style={{ width: `${usedPct}%` }}
                              />
                            </div>
                            <p className="mt-1.5 text-right font-sans text-[10px] text-[#4E0030]/45">
                              {usedPct}% used
                            </p>
                          </div>

                          {/* CTA: disabled "Fully Redeemed" button + a
                              subtle "Buy Another" link. */}
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled
                              aria-disabled="true"
                              title="All sessions on this gift card have been used"
                              className="inline-flex items-center gap-1.5 rounded-full bg-[#4E0030]/10 px-4 py-2 font-sans text-xs font-semibold text-[#4E0030]/50 cursor-not-allowed"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                              Fully Redeemed
                            </button>
                            <Link
                              href="/gift-cards"
                              className="inline-flex items-center gap-1.5 rounded-full bg-white border-2 border-[#F10897]/40 px-4 py-2 font-sans text-xs font-semibold text-[#F10897]/80 transition-all hover:bg-[#E8B6D5]/15 hover:border-[#F10897]"
                            >
                              <Gift className="h-3.5 w-3.5" strokeWidth={2.5} />
                              Buy Another Gift Card
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* ============ BOOKINGS LIST ============ */}
      <div>
        <h3 className="mb-3 font-fraunces text-lg font-bold text-[#4E0030] inline-flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#F10897]" strokeWidth={2.5} />
          Session Bookings
        </h3>

        {bookings === null || bookings.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-8 w-8 text-[#F10897]" strokeWidth={2} />}
            title="No bookings yet"
            body="Once you redeem a gift card and book a session, your upcoming and past sessions will appear here."
            cta={{ label: "Book a Session", href: "/book-session" }}
          />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const sessionDate = new Date(booking.scheduledDate);
              const isUpcoming = sessionDate.getTime() > Date.now();
              return (
                <div
                  key={booking.id}
                  className="rounded-2xl bg-white p-5 shadow-[0_4px_15px_rgba(78,0,48,0.06)] sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-maroon/10 pb-4">
                    <div>
                      <p className="font-fraunces text-lg font-bold text-[#4E0030]">
                        {booking.sessionTitle}
                      </p>
                      <p className="mt-1 font-sans text-xs text-[#4E0030]/60">
                        {booking.bookingNumber} · {booking.therapistName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-fraunces text-xl font-bold text-[#F10897]">
                        {formatPrice(booking.sessionPrice)}
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wide ${
                          isUpcoming
                            ? "bg-[#B5E1C3]/30 text-[#2d6e4f]"
                            : "bg-[#E8B6D5]/30 text-[#7a1f5a]"
                        }`}
                      >
                        {isUpcoming ? "Upcoming" : "Past"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-2 rounded-xl bg-[#FFF5EE] p-3">
                      <Calendar className="h-4 w-4 shrink-0 text-[#F10897]" strokeWidth={2.5} />
                      <div className="min-w-0">
                        <p className="font-sans text-[10px] font-bold uppercase tracking-wide text-[#4E0030]/60">
                          Date
                        </p>
                        <p className="truncate font-sans text-xs font-semibold text-[#4E0030]">
                          {formatDate(booking.scheduledDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-[#FFF5EE] p-3">
                      <Clock className="h-4 w-4 shrink-0 text-[#F10897]" strokeWidth={2.5} />
                      <div className="min-w-0">
                        <p className="font-sans text-[10px] font-bold uppercase tracking-wide text-[#4E0030]/60">
                          Time
                        </p>
                        <p className="truncate font-sans text-xs font-semibold text-[#4E0030]">
                          {booking.scheduledTime} · {booking.durationMinutes} min
                        </p>
                      </div>
                    </div>
                    {booking.meetingUrl && (
                      <a
                        href={booking.meetingUrl.startsWith("http") ? booking.meetingUrl : `https://${booking.meetingUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl bg-[#F10897] p-3 transition-all hover:bg-[#d4007d]"
                      >
                        <Video className="h-4 w-4 shrink-0 text-white" strokeWidth={2.5} />
                        <div className="min-w-0">
                          <p className="font-sans text-[10px] font-bold uppercase tracking-wide text-white/80">
                            Join Session
                          </p>
                          <p className="truncate font-sans text-xs font-semibold text-white">
                            via WhatsApp
                          </p>
                        </div>
                      </a>
                    )}
                  </div>

                  {booking.redemption && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#FFF5EE] p-3">
                      <Gift className="h-4 w-4 shrink-0 text-[#F10897]" strokeWidth={2.5} />
                      <p className="font-sans text-xs text-[#4E0030]/70">
                        Paid with gift card from <span className="font-semibold text-[#4E0030]">{booking.redemption.orderItem.cardTitle}</span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// RECIPIENTS TAB
// ============================================================
function RecipientsTab({
  recipients,
}: {
  recipients: { uid: string; cardId: string; name: string; email: string; occasion: string; note: string; confirmed: boolean }[];
  formatPrice: (n: number) => string;
}) {
  if (recipients.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8 text-[#F10897]" strokeWidth={2} />}
        title="No saved recipients"
        body="When you start a gift card order, the recipient details will be saved here so you can reuse them next time."
        cta={{ label: "Send a Gift Card", href: "/gift-cards" }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {recipients.map((r) => (
        <div
          key={r.uid}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-[0_4px_15px_rgba(78,0,48,0.06)]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F10897] font-sans text-sm font-bold text-white">
              {r.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-sans text-sm font-bold text-[#4E0030]">
                {r.name || "Unnamed recipient"}
              </p>
              <p className="truncate font-sans text-xs text-[#4E0030]/60">
                {r.email || "No email"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#FFF5EE] px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-wide text-[#4E0030]/70">
              {r.occasion || "Just Because"}
            </span>
            <Link
              href="/gift-cards"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#F10897] px-3 py-1.5 font-sans text-xs font-semibold text-white transition-all hover:bg-[#d4007d]"
            >
              Send Again
              <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// SETTINGS TAB
// ============================================================
function SettingsTab({
  user,
  onSignOut,
}: {
  user: { id: string; name: string; email: string };
  onSignOut: () => void;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Fetch the user's gift card redemptions for the "My Gift Cards" section
  type GiftCardData = {
    id: string;
    code: string;
    status: string;
    creditAmount: number;
    sessionsRemaining: number;
    sessionsUsed: number;
    orderItem: { cardTitle: string; cardSessions: number; cardPrice: number; cardGradient: string };
  };
  const [giftCards, setGiftCards] = useState<GiftCardData[] | null>(null);

  useEffect(() => {
    fetch("/api/account/redemptions")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setGiftCards(data))
      .catch(() => setGiftCards([]));
  }, []);

  const formatPrice = (n: number) => `₦${n.toLocaleString()}`;

  // Download user's data as JSON
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Export failed");
      }
      // Trigger browser download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Extract filename from Content-Disposition header, fallback to default
      const disposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      a.download = filenameMatch?.[1] || "tare-wellness-data-export.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Data exported",
        description: "Your personal data has been downloaded as a JSON file.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Delete the user's account permanently
  const handleDelete = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast({
        title: "Type DELETE to confirm",
        description: 'You must type "DELETE" in the confirmation field to proceed.',
        variant: "destructive",
      });
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: deleteConfirmText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Deletion failed");
      }
      toast({
        title: "Account deleted",
        description: "Your personal data has been permanently removed.",
      });
      // Sign out + redirect to home
      await signOut({ redirect: false });
      onSignOut();
      router.push("/");
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "Please try again or contact privacy@tarewellness.com.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-[0_4px_15px_rgba(78,0,48,0.06)] sm:p-6">
        <h3 className="font-fraunces text-lg font-bold text-[#4E0030]">Profile</h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-[#FFF5EE] p-3">
            <UserIcon className="h-4 w-4 shrink-0 text-[#F10897]" strokeWidth={2.5} />
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[10px] font-bold uppercase tracking-wide text-[#4E0030]/60">
                Name
              </p>
              <p className="truncate font-sans text-sm font-semibold text-[#4E0030]">
                {user.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-[#FFF5EE] p-3">
            <Mail className="h-4 w-4 shrink-0 text-[#F10897]" strokeWidth={2.5} />
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[10px] font-bold uppercase tracking-wide text-[#4E0030]/60">
                Email
              </p>
              <p className="truncate font-sans text-sm font-semibold text-[#4E0030]">
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-[#FFF5EE] p-3">
            <SettingsIcon className="h-4 w-4 shrink-0 text-[#F10897]" strokeWidth={2.5} />
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[10px] font-bold uppercase tracking-wide text-[#4E0030]/60">
                User ID
              </p>
              <p className="truncate font-mono text-xs font-semibold text-[#4E0030]/70">
                {user.id}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-[0_4px_15px_rgba(78,0,48,0.06)] sm:p-6">
        <h3 className="font-fraunces text-lg font-bold text-[#4E0030]">Account</h3>
        <p className="mt-1 font-sans text-xs text-[#4E0030]/60">
          Manage your session and sign out.
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white border-[0.3px] border-[#F10897] px-5 py-2.5 font-sans text-sm font-semibold text-[#F10897] transition-all hover:bg-[#E8B6D5]/15"
        >
          <LogOut className="h-4 w-4" strokeWidth={2.5} />
          Sign Out
        </button>
      </div>

      {/* ============ MY GIFT CARDS ============ */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_4px_15px_rgba(78,0,48,0.06)] sm:p-6">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-[#F10897]" strokeWidth={2.5} />
          <h3 className="font-fraunces text-lg font-bold text-[#4E0030]">My Gift Cards</h3>
        </div>
        <p className="mt-1 font-sans text-xs text-[#4E0030]/60">
          Your redeemed gift cards with session tracking.
        </p>

        {!giftCards ? (
          <div className="mt-4 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#F10897]" strokeWidth={2.5} />
          </div>
        ) : giftCards.length === 0 ? (
          <div className="mt-4 rounded-xl bg-[#FFF5EE] p-4 text-center">
            <p className="font-sans text-xs text-[#4E0030]/60">
              No gift cards redeemed yet. When someone sends you a gift card, redeem it and it&apos;ll appear here.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {giftCards.map((gc) => {
              const total = gc.orderItem.cardSessions;
              const used = gc.sessionsUsed;
              const remaining = gc.sessionsRemaining;
              const hasBalance = remaining > 0;

              return (
                <div
                  key={gc.id}
                  className={`rounded-xl border p-4 ${
                    hasBalance
                      ? "border-[#F10897]/30 bg-[#FCE4EC]/30"
                      : "border-maroon/10 bg-[#FFF5EE]/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-sm font-bold text-[#4E0030]">
                        {gc.orderItem.cardTitle}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] font-bold tracking-wider text-[#F10897]">
                        {gc.code}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-wide ${
                      hasBalance
                        ? "bg-[#B5E1C3]/30 text-[#2d6e4f]"
                        : "bg-maroon/10 text-maroon/50"
                    }`}>
                      {hasBalance ? "Active" : "Fully Used"}
                    </span>
                  </div>

                  {/* Session tracking */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-white p-2">
                      <p className="font-sans text-[10px] font-bold uppercase tracking-wide text-[#4E0030]/50">Total</p>
                      <p className="font-fraunces text-lg font-bold text-[#4E0030]">{total}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2">
                      <p className="font-sans text-[10px] font-bold uppercase tracking-wide text-[#4E0030]/50">Used</p>
                      <p className="font-fraunces text-lg font-bold text-[#4E0030]">{used}</p>
                    </div>
                    <div className={`rounded-lg p-2 ${hasBalance ? "bg-[#B5E1C3]/20" : "bg-white"}`}>
                      <p className="font-sans text-[10px] font-bold uppercase tracking-wide text-[#4E0030]/50">Available</p>
                      <p className={`font-fraunces text-lg font-bold ${hasBalance ? "text-[#2d6e4f]" : "text-[#4E0030]/40"}`}>{remaining}</p>
                    </div>
                  </div>

                  {/* Book Next Session button */}
                  {hasBalance && (
                    <Link
                      href={`/book-session?code=${gc.code}`}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F10897] px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-[0.12em] text-white transition-all hover:bg-[#d4007d] active:scale-95"
                    >
                      <CalendarCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Book Next Session
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============ PRIVACY & DATA (NDPA 2023) ============ */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_4px_15px_rgba(78,0,48,0.06)] sm:p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#F10897]" strokeWidth={2.5} />
          <h3 className="font-fraunces text-lg font-bold text-[#4E0030]">Privacy &amp; Data</h3>
        </div>
        <p className="mt-1 font-sans text-xs text-[#4E0030]/60">
          Your rights under the Nigeria Data Protection Act (NDPA) 2023.
        </p>

        {/* Download my data */}
        <div className="mt-4 rounded-xl bg-[#FFF5EE] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-sans text-sm font-bold text-[#4E0030]">Download your data</p>
              <p className="mt-1 font-sans text-xs text-[#4E0030]/65">
                Get a JSON file with all the personal data we hold about you — orders, bookings, redemptions, and profile info.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white border-[0.3px] border-[#F10897] px-4 py-2 font-sans text-xs font-semibold text-[#F10897] transition-all hover:bg-[#E8B6D5]/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />Preparing...</>
              ) : (
                <><Download className="h-3.5 w-3.5" strokeWidth={2.5} />Download</>
              )}
            </button>
          </div>
        </div>

        {/* Delete account */}
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-sans text-sm font-bold text-red-700">
                <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />
                Delete account
              </p>
              <p className="mt-1 font-sans text-xs text-red-700/75">
                Permanently delete your account and all associated data — orders, bookings, redemptions. This cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 font-sans text-xs font-semibold text-white transition-all hover:bg-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
              Delete
            </button>
          </div>

          {/* Confirmation UI */}
          {showDeleteConfirm && (
            <div className="mt-4 rounded-lg bg-white p-4 ring-1 ring-red-200">
              <p className="font-sans text-xs font-bold text-red-700">⚠️ This action is permanent</p>
              <p className="mt-2 font-sans text-xs text-[#4E0030]/75">
                You will lose access to your account, all orders, all bookings, and all gift card redemptions. Type <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono font-bold text-red-700">DELETE</code> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="mt-3 h-10 w-full rounded-lg border-2 border-red-200 bg-white px-3 font-mono text-sm font-bold uppercase text-red-700 placeholder:font-sans placeholder:normal-case placeholder:font-normal placeholder:text-[#4E0030]/40 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || deleteConfirmText !== "DELETE"}
                  className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-5 py-2 font-sans text-xs font-bold uppercase tracking-[0.12em] text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />Deleting...</>
                  ) : (
                    <><Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />Permanently Delete</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#4E0030]/20 px-5 py-2 font-sans text-xs font-bold uppercase tracking-[0.12em] text-[#4E0030] transition-all hover:bg-[#FFF5EE]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 font-sans text-[11px] text-[#4E0030]/55">
          Questions about your data? Email <a href="mailto:privacy@tarewellness.com" className="font-semibold text-[#F10897] hover:underline">privacy@tarewellness.com</a> or read our <Link href="/privacy-policy" className="font-semibold text-[#F10897] hover:underline">Privacy Policy</Link>.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-[0_4px_15px_rgba(78,0,48,0.06)] sm:p-6">
        <h3 className="font-fraunces text-lg font-bold text-[#4E0030]">Need help?</h3>
        <p className="mt-1 font-sans text-xs text-[#4E0030]/60">
          Check our FAQ or get in touch.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF5EE] px-4 py-2 font-sans text-xs font-semibold text-[#4E0030] transition-all hover:bg-[#E8B6D5]/15"
          >
            FAQ
            <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
          </Link>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF5EE] px-4 py-2 font-sans text-xs font-semibold text-[#4E0030] transition-all hover:bg-[#E8B6D5]/15"
          >
            Contact Us
            <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EMPTY STATE (shared)
// ============================================================
function EmptyState({
  icon,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: { label: string; href: string };
}) {
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-[0_4px_15px_rgba(78,0,48,0.06)] sm:p-12">
      <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF5EE]">
        {icon}
      </div>
      <h3 className="mt-4 font-fraunces text-xl font-bold text-[#4E0030]">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm font-sans text-sm text-[#4E0030]/70">{body}</p>
      <Link
        href={cta.href}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#F10897] px-5 py-2.5 font-sans text-sm font-semibold text-white transition-all hover:bg-[#d4007d]"
      >
        {cta.label}
        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </Link>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#F10897]" strokeWidth={2.5} />
          <p className="mt-3 font-sans text-sm text-[#4E0030]/70">Loading your account…</p>
        </main>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
