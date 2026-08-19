"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Package,
  Users,
  Calendar,
  TrendingUp,
  Lock,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Clock,
  Mail,
  AlertCircle,
  LogOut,
  Gift,
  Ticket,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Stats = {
  totalOrders: number;
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  pendingOrders: number;
  activeRedemptions: number;
  emailsNotSent: number;
};

type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  buyerName: string;
  buyerEmail: string;
  paymentMethod: string;
  createdAt: string;
  orderItems: {
    id: string;
    cardTitle: string;
    cardPrice: number;
    recipientName: string;
    recipientEmail: string;
    emailSent: boolean;
    redemption: { code: string; status: string } | null;
  }[];
};

type AdminBooking = {
  id: string;
  bookingNumber: string;
  sessionTitle: string;
  sessionPrice: number;
  therapistName: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  user: { name: string; email: string };
  redemption: { orderItem: { cardTitle: string } } | null;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { orders: number; bookings: number; redemptions: number };
};

type Tab = "overview" | "orders" | "bookings" | "users";

export default function AdminPage() {
  const { toast } = useToast();
  const [authed, setAuthed] = useState(false);
  const [secret, setSecret] = useState("");
  const [checking, setChecking] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tare-admin-secret");
    if (stored) {
      setSecret(stored);
      setAuthed(true);
    }
  }, []);

  const apiCall = useCallback(async (endpoint: string) => {
    const token = localStorage.getItem("tare-admin-secret");
    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      localStorage.removeItem("tare-admin-secret");
      setAuthed(false);
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error("Failed");
    return res.json();
  }, []);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    apiCall("/api/admin/stats")
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authed, apiCall]);

  useEffect(() => {
    if (!authed || activeTab !== "orders") return;
    if (orders) return;
    apiCall("/api/admin/orders").then(setOrders).catch(() => {});
  }, [authed, activeTab, orders, apiCall]);

  useEffect(() => {
    if (!authed || activeTab !== "bookings") return;
    if (bookings) return;
    apiCall("/api/admin/bookings").then(setBookings).catch(() => {});
  }, [authed, activeTab, bookings, apiCall]);

  useEffect(() => {
    if (!authed || activeTab !== "users") return;
    if (users) return;
    apiCall("/api/admin/users").then(setUsers).catch(() => {});
  }, [authed, activeTab, users, apiCall]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (res.status === 401) {
        toast({ title: "Invalid secret", description: "Check the ADMIN_SECRET env var.", variant: "destructive" });
        return;
      }
      if (!res.ok) {
        toast({ title: "Admin not configured", description: "Set ADMIN_SECRET in Vercel env vars.", variant: "destructive" });
        return;
      }
      localStorage.setItem("tare-admin-secret", secret);
      setAuthed(true);
      const data = await res.json();
      setStats(data);
      toast({ title: "Admin access granted" });
    } catch {
      toast({ title: "Connection failed", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("tare-admin-secret");
    setAuthed(false);
    setStats(null);
    setOrders(null);
    setBookings(null);
    setUsers(null);
  };

  const formatPrice = (n: number) => `₦${n.toLocaleString()}`;
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  if (!authed) {
    return (
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-x-hidden px-5 py-20">
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-white p-8 shadow-[0_15px_50px_rgba(78,0,48,0.15)]">
            <div className="text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#4E0030]">
                <Lock className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="mt-4 font-fraunces text-2xl font-bold text-[#4E0030]">Admin Dashboard</h1>
              <p className="mt-1 font-sans text-sm text-[#4E0030]/60">Enter your admin secret to continue</p>
            </div>
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <input
                type="password"
                required
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Admin secret"
                className="h-12 w-full rounded-2xl border border-maroon/15 bg-white px-4 font-mono text-sm text-maroon placeholder:text-maroon/30 focus:border-[#F10897] focus:outline-none focus:ring-2 focus:ring-[#F10897]/30"
              />
              <button
                type="submit"
                disabled={checking}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#4E0030] px-7 py-3.5 font-sans text-sm font-semibold text-white transition-all hover:bg-[#3a0024] active:scale-95 disabled:opacity-50"
              >
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {checking ? "Checking..." : "Unlock Dashboard"}
              </button>
            </form>
            <Link href="/" className="mt-4 block text-center font-sans text-xs text-[#4E0030]/50 hover:text-[#F10897]">← Back to site</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex flex-1 flex-col overflow-x-hidden px-5 py-8 sm:px-8 lg:px-12">
      {/* Header */}
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-fraunces text-2xl font-bold text-[#4E0030] sm:text-3xl">Admin Dashboard</h1>
            <p className="mt-1 font-sans text-xs text-[#4E0030]/60">Tare Wellness — Management Console</p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="inline-flex items-center gap-1.5 rounded-full bg-white border border-maroon/15 px-4 py-2 font-sans text-xs font-semibold text-[#4E0030] hover:bg-blush/20">
              View Site
            </Link>
            <button onClick={handleLogout} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-maroon/15 px-4 py-2 font-sans text-xs font-semibold text-[#F10897] hover:bg-[#E8B6D5]/15">
              <LogOut className="h-3.5 w-3.5" /> Exit
            </button>
          </div>
        </div>

        {/* Stats cards */}
        {loading && !stats ? (
          <div className="mt-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#F10897]" /></div>
        ) : stats ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Revenue" value={formatPrice(stats.totalRevenue)} color="bg-[#B5E1C3]/30" textColor="text-[#2d6e4f]" />
            <StatCard icon={<Package className="h-4 w-4" />} label="Orders" value={String(stats.totalOrders)} color="bg-[#C7B2E2]/30" textColor="text-[#4E0030]" />
            <StatCard icon={<Users className="h-4 w-4" />} label="Users" value={String(stats.totalUsers)} color="bg-[#BCE1F0]/30" textColor="text-[#1a4a6e]" />
            <StatCard icon={<Calendar className="h-4 w-4" />} label="Bookings" value={String(stats.totalBookings)} color="bg-[#E8B6D5]/30" textColor="text-[#7a1f5a]" />
          </div>
        ) : null}

        {/* Alert banners */}
        {stats && stats.pendingOrders > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#FFE0C2] p-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#cc6600]" />
            <p className="font-sans text-xs text-[#cc6600]">{stats.pendingOrders} pending order(s) awaiting bank transfer confirmation</p>
          </div>
        )}
        {stats && stats.emailsNotSent > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#FFD6D6] p-3">
            <Mail className="h-4 w-4 shrink-0 text-red-600" />
            <p className="font-sans text-xs text-red-600">{stats.emailsNotSent} gift card email(s) failed to send — recipients can still redeem via code</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto rounded-2xl bg-white/60 p-1.5">
          {([
            { id: "overview", label: "Overview", icon: <TrendingUp className="h-4 w-4" /> },
            { id: "orders", label: "Orders", icon: <Package className="h-4 w-4" /> },
            { id: "bookings", label: "Bookings", icon: <Calendar className="h-4 w-4" /> },
            { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
          ] as { id: Tab; label: string; icon: React.ReactNode }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 font-sans text-sm font-semibold transition-all ${
                activeTab === tab.id ? "bg-[#4E0030] text-white shadow-sm" : "text-[#4E0030]/70 hover:bg-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6 pb-12">
          {activeTab === "overview" && stats && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard icon={<Gift className="h-5 w-5" />} title="Active Gift Card Codes" value={String(stats.activeRedemptions)} subtitle="Codes not yet redeemed" />
                <InfoCard icon={<Ticket className="h-5 w-5" />} title="Pending Orders" value={String(stats.pendingOrders)} subtitle="Awaiting bank transfer" />
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-fraunces text-lg font-bold text-[#4E0030]">Quick Actions</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => setActiveTab("orders")} className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF5EE] px-4 py-2 font-sans text-xs font-semibold text-[#4E0030] hover:bg-blush/20">
                    <Package className="h-3.5 w-3.5" /> View All Orders
                  </button>
                  <button onClick={() => setActiveTab("bookings")} className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF5EE] px-4 py-2 font-sans text-xs font-semibold text-[#4E0030] hover:bg-blush/20">
                    <Calendar className="h-3.5 w-3.5" /> View All Bookings
                  </button>
                  <button onClick={() => setActiveTab("users")} className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF5EE] px-4 py-2 font-sans text-xs font-semibold text-[#4E0030] hover:bg-blush/20">
                    <Users className="h-3.5 w-3.5" /> View All Users
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-3">
              {!orders ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#F10897]" /></div>
              ) : orders.length === 0 ? (
                <EmptyState label="No orders yet" />
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-maroon/10 pb-3">
                      <div>
                        <p className="font-sans text-sm font-bold text-[#4E0030]">{order.orderNumber}</p>
                        <p className="font-sans text-xs text-[#4E0030]/60">{formatDate(order.createdAt)} · {order.buyerName} · {order.buyerEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-sans text-sm font-bold text-[#F10897]">{formatPrice(order.totalAmount)}</p>
                        <span className={`inline-block rounded-full px-2 py-0.5 font-sans text-[10px] font-bold uppercase ${
                          order.status === "completed" ? "bg-[#B5E1C3]/30 text-[#2d6e4f]" : "bg-[#FFE0C2] text-[#cc6600]"
                        }`}>{order.status}</span>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFF5EE] px-3 py-2">
                          <div>
                            <p className="font-sans text-xs font-bold text-[#4E0030]">{item.cardTitle}</p>
                            <p className="font-sans text-[11px] text-[#4E0030]/60">→ {item.recipientName} ({item.recipientEmail})</p>
                            {item.redemption && (
                              <p className="mt-1 font-mono text-[10px] font-bold tracking-wider text-[#F10897]">{item.redemption.code} · {item.redemption.status}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {item.emailSent ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#2d6e4f]"><CheckCircle2 className="h-3 w-3" /> Sent</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-red-400"><AlertCircle className="h-3 w-3" /> Not sent</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "bookings" && (
            <div className="space-y-3">
              {!bookings ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#F10897]" /></div>
              ) : bookings.length === 0 ? (
                <EmptyState label="No bookings yet" />
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-maroon/10 pb-3">
                      <div>
                        <p className="font-sans text-sm font-bold text-[#4E0030]">{b.sessionTitle}</p>
                        <p className="font-sans text-xs text-[#4E0030]/60">{b.bookingNumber} · {b.user.name} ({b.user.email})</p>
                      </div>
                      <div className="text-right">
                        <p className="font-sans text-sm font-bold text-[#F10897]">{formatPrice(b.sessionPrice)}</p>
                        <p className="font-sans text-xs text-[#4E0030]/60">{b.therapistName}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 font-sans text-xs">
                      <span className="inline-flex items-center gap-1 text-[#4E0030]/70"><Calendar className="h-3.5 w-3.5" /> {formatDate(b.scheduledDate)}</span>
                      <span className="inline-flex items-center gap-1 text-[#4E0030]/70"><Clock className="h-3.5 w-3.5" /> {b.scheduledTime}</span>
                      <span className={`rounded-full px-2 py-0.5 font-bold uppercase ${
                        new Date(b.scheduledDate) > new Date() ? "bg-[#B5E1C3]/30 text-[#2d6e4f]" : "bg-[#E8B6D5]/30 text-[#7a1f5a]"
                      }`}>{new Date(b.scheduledDate) > new Date() ? "Upcoming" : "Past"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-3">
              {!users ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#F10897]" /></div>
              ) : users.length === 0 ? (
                <EmptyState label="No users yet" />
              ) : (
                users.map((u) => (
                  <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F10897] font-sans text-sm font-bold text-white">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-sans text-sm font-bold text-[#4E0030]">{u.name}</p>
                        <p className="font-sans text-xs text-[#4E0030]/60">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 font-sans text-xs text-[#4E0030]/70">
                      <span className="inline-flex items-center gap-1"><Package className="h-3.5 w-3.5" /> {u._count.orders} orders</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {u._count.bookings} bookings</span>
                      <span className="inline-flex items-center gap-1"><Ticket className="h-3.5 w-3.5" /> {u._count.redemptions} codes</span>
                      <span className="text-[#4E0030]/40">{formatDate(u.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, color, textColor }: { icon: React.ReactNode; label: string; value: string; color: string; textColor: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${color} ${textColor}`}>{icon}</div>
      <p className="mt-2 font-fraunces text-xl font-bold text-[#4E0030]">{value}</p>
      <p className="font-sans text-xs text-[#4E0030]/60">{label}</p>
    </div>
  );
}

function InfoCard({ icon, title, value, subtitle }: { icon: React.ReactNode; title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF5EE] text-[#F10897]">{icon}</div>
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-wide text-[#4E0030]/60">{title}</p>
          <p className="font-fraunces text-2xl font-bold text-[#4E0030]">{value}</p>
          <p className="font-sans text-xs text-[#4E0030]/50">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
      <p className="font-sans text-sm text-[#4E0030]/50">{label}</p>
    </div>
  );
}
