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
  const { user, logout, recipients, redemption, totalQty } = useStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) || "orders",
  );
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);

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

          {/* Balance + Cart quick stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            {redemption.redeemed && redemption.creditBalance > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-[0_4px_15px_rgba(78,0,48,0.08)]">
                <Wallet className="h-4 w-4 text-[#F10897]" strokeWidth={2.5} />
                <span className="font-sans text-xs font-medium text-[#4E0030]/70">Balance:</span>
                <span className="font-sans text-sm font-bold text-[#4E0030]">{formatPrice(redemption.creditBalance)}</span>
              </div>
            )}
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
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#F10897]" strokeWidth={2.5} />
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
  formatPrice,
  formatDate,
}: {
  bookings: Booking[] | null;
  loading: boolean;
  formatPrice: (n: number) => string;
  formatDate: (iso: string) => string;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#F10897]" strokeWidth={2.5} />
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-8 w-8 text-[#F10897]" strokeWidth={2} />}
        title="No bookings yet"
        body="Once you redeem a gift card and book a session, your upcoming and past sessions will appear here."
        cta={{ label: "Book a Session", href: "/book-session" }}
      />
    );
  }

  return (
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
                      Join
                    </p>
                    <p className="truncate font-sans text-xs font-semibold text-white">
                      Session link
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
