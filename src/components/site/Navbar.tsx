"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LogOut, Wallet, ChevronDown, ShoppingBag, Calendar, Gift } from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

const NAV_LINKS = [
  { label: "Gift Cards", href: "/gift-cards" },
  { label: "Redeem", href: "/redeem" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, redemption, cart, totalQty } = useStore();
  const { toast } = useToast();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close profile dropdown on route change
  useEffect(() => { setProfileOpen(false); }, [pathname]); // eslint-disable-line react-hooks/set-state-in-effect

  const isActive = (href: string) => {
    if (href.startsWith("#")) return false;
    if (href === "/gift-cards") return ["/gift-cards", "/recipient-details", "/cart-review", "/checkout", "/order-confirmation"].includes(pathname);
    if (href === "/redeem") return ["/redeem", "/book-session", "/booking-confirmation"].includes(pathname);
    if (href === "/how-it-works") return pathname === "/how-it-works";
    if (href === "/faq") return pathname === "/faq";
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const activeClass = (href: string) => {
    if (href === "/redeem" || href === "/how-it-works" || href === "/faq")
      return "relative font-sans text-sm font-semibold text-[#F20997] underline decoration-[#E8B6D5] decoration-2 underline-offset-4";
    return "relative font-sans text-sm font-semibold text-[#F10897] underline decoration-[#E8B6D5] decoration-2 underline-offset-4";
  };

  const handleLogout = async () => {
    // Sign out of NextAuth first — this clears the JWT session cookie.
    // Pass `redirect: false` so we control navigation ourselves.
    try {
      await signOut({ redirect: false });
    } catch {
      // Ignore signOut errors — we still want to clear local state below.
    }
    // Clear Zustand store so the client UI updates immediately.
    logout();
    setProfileOpen(false);
    toast({ title: "Signed out", description: "You've been logged out successfully." });
    router.push("/");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <div className="absolute inset-0 -z-10 backdrop-blur-md bg-transparent shadow-[0_8px_30px_rgba(0,0,0,0.12)]" />
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3 sm:px-8 sm:py-4 lg:px-12">
        <Link href="/" className="group inline-flex shrink-0 items-center" aria-label="Tare home">
          <Image src="/logo.png" alt="Tare logo" width={80} height={80} priority className="h-20 w-20 object-contain drop-shadow-[0_4px_10px_rgba(78, 0, 48, 0.25)] transition-transform duration-200 group-hover:scale-[1.04]" />
        </Link>
        <ul className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => { const active = isActive(link.href); return (
            <li key={link.label}>
              <Link href={link.href} target="_blank" rel="noopener noreferrer" className={active ? activeClass(link.href) : "relative font-sans text-sm font-medium text-maroon transition-colors hover:text-[#C7B2E2] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-[#C7B2E2] after:transition-all after:duration-300 hover:after:w-full"}>
                {link.label}
              </Link>
            </li>
          ); })}
        </ul>
        <div className="flex items-center gap-3">
          {/* Cart icon — shows item count badge, links to cart-review */}
          <Link
            href="/cart-review"
            aria-label={`Cart with ${totalQty} item${totalQty === 1 ? "" : "s"}`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-all hover:bg-white/25 active:scale-95"
          >
            <ShoppingBag className="h-5 w-5 text-maroon" strokeWidth={2.5} />
            {totalQty > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#F10897] px-1.5 font-sans text-[10px] font-bold text-white shadow-sm">
                {totalQty > 9 ? "9+" : totalQty}
              </span>
            )}
          </Link>

          {/* Auth state: Logged in → profile dropdown, Logged out → Login button */}
          {user ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/15 px-3 py-2 backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F10897] font-sans text-xs font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="font-sans text-sm font-medium text-maroon">{user.name.split(" ")[0]}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-maroon transition-transform ${profileOpen ? "rotate-180" : ""}`} strokeWidth={2.5} />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-[0_15px_50px_rgba(78, 0, 48, 0.20)]"
                  >
                    {/* User info */}
                    <div className="px-3 py-3 border-b border-maroon/10">
                      <p className="font-sans text-sm font-bold text-[#4E0030]">{user.name}</p>
                      <p className="font-sans text-xs text-[#4E0030]/55">{user.email}</p>
                    </div>
                    {/* Balance */}
                    {redemption.redeemed && redemption.creditBalance > 0 && (
                      <div className="mx-1 my-1 flex items-center gap-2 rounded-xl bg-[#FFF5EE] px-3 py-2">
                        <Wallet className="h-4 w-4 text-[#F10897]" strokeWidth={2.5} />
                        <span className="font-sans text-xs text-[#4E0030]/70">Balance:</span>
                        <span className="font-sans text-sm font-bold text-[#4E0030]">₦{redemption.creditBalance.toLocaleString()}</span>
                      </div>
                    )}
                    {/* Menu items */}
                    <Link href="/account" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-sans text-sm font-medium text-[#4E0030] transition-colors hover:bg-blush/40">
                      <User className="h-4 w-4" strokeWidth={2.5} />My Account
                    </Link>
                    <Link href="/account?tab=bookings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-sans text-sm font-medium text-[#4E0030] transition-colors hover:bg-blush/40">
                      <Calendar className="h-4 w-4" strokeWidth={2.5} />My Bookings
                    </Link>
                    <Link href="/account?tab=orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-sans text-sm font-medium text-[#4E0030] transition-colors hover:bg-blush/40">
                      <Gift className="h-4 w-4" strokeWidth={2.5} />My Orders
                    </Link>
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 font-sans text-sm font-medium text-[#4E0030] transition-colors hover:bg-blush/40">
                      <LogOut className="h-4 w-4" strokeWidth={2.5} />Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/login" className="hidden items-center justify-center gap-1.5 rounded-full bg-white border-[0.3px] border-[#F10897] px-4 py-2 font-sans text-sm font-semibold text-[#F10897] shadow-sm transition-all duration-200 hover:scale-[1.03] hover:bg-[#E8B6D5]/15 md:inline-flex">
              <User className="h-4 w-4 shrink-0" strokeWidth={2.5} /><span>Login</span>
            </Link>
          )}

          <Link href="/gift-cards" className="hidden items-center justify-center gap-2 rounded-full bg-[#F10897] px-5 py-2.5 font-sans text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.03] hover:bg-[#d4007d] active:scale-95 md:inline-flex"><span>Send a Gift</span></Link>

          <button type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-maroon/10 text-maroon transition-colors hover:bg-maroon/20 md:hidden">
            <Menu className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div key="mobile-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 bg-brand-gradient backdrop-blur-md md:hidden">
            <div className="flex items-center justify-between px-5 py-3 sm:px-8">
              <Link href="/" onClick={() => setOpen(false)} className="inline-flex shrink-0 items-center" aria-label="Tare home">
                <Image src="/logo.png" alt="Tare logo" width={80} height={80} className="h-20 w-20 object-contain drop-shadow-[0_4px_10px_rgba(78, 0, 48, 0.25)]" />
              </Link>
              <button type="button" aria-label="Close menu" aria-expanded={open} onClick={() => setOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-maroon/15 text-maroon transition-colors hover:bg-maroon/25">
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
            <motion.ul initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }} className="mt-4 flex flex-col gap-2 px-5 sm:px-8">
              {NAV_LINKS.map((link) => { const active = isActive(link.href); return (
                <motion.li key={link.label} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                  <Link href={link.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={active ? (link.href === "/redeem" || link.href === "/how-it-works" || link.href === "/faq" ? "block rounded-2xl px-4 py-3 font-fraunces text-3xl font-bold text-[#F20997] underline decoration-[#E8B6D5] decoration-2 underline-offset-4" : "block rounded-2xl px-4 py-3 font-fraunces text-3xl font-bold text-[#F10897] underline decoration-[#E8B6D5] decoration-2 underline-offset-4") : "block rounded-2xl px-4 py-3 font-fraunces text-3xl font-bold text-maroon transition-colors hover:bg-[#C7B2E2]/15"}>
                    {link.label}
                  </Link>
                </motion.li>
              ); })}
            </motion.ul>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="px-5 pt-6 space-y-3 sm:px-8">
              {/* Mobile cart link */}
              <Link href="/cart-review" onClick={() => setOpen(false)} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/15 px-6 py-3 font-sans text-sm font-semibold text-maroon backdrop-blur-sm transition-all hover:bg-white/25">
                <ShoppingBag className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                <span>Cart{totalQty > 0 ? ` (${totalQty})` : ""}</span>
              </Link>
              {user ? (
                <>
                  <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F10897] font-sans text-sm font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                    <div>
                      <p className="font-sans text-sm font-bold text-maroon">{user.name}</p>
                      {redemption.redeemed && redemption.creditBalance > 0 && (
                        <p className="font-sans text-xs text-maroon/60">Balance: ₦{redemption.creditBalance.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <Link href="/account" onClick={() => setOpen(false)} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white border-[0.3px] border-[#F10897] px-6 py-3 font-sans text-sm font-semibold text-[#F10897] shadow-sm transition-all hover:bg-[#E8B6D5]/15">
                    <User className="h-4 w-4 shrink-0" strokeWidth={2.5} /><span>My Account</span>
                  </Link>
                  <button onClick={() => { handleLogout(); setOpen(false); }} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white border-[0.3px] border-[#F10897] px-6 py-3 font-sans text-sm font-semibold text-[#F10897] shadow-sm transition-all hover:bg-[#E8B6D5]/15">
                    <LogOut className="h-4 w-4 shrink-0" strokeWidth={2.5} /><span>Sign Out</span>
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white border-[0.3px] border-[#F10897] px-6 py-4 font-sans text-base font-semibold text-[#F10897] shadow-sm transition-all hover:bg-[#E8B6D5]/15">
                  <User className="h-5 w-5 shrink-0" strokeWidth={2.5} /><span>Login / Sign Up</span>
                </Link>
              )}
              <Link href="/gift-cards" onClick={() => setOpen(false)} className="inline-flex w-full items-center justify-center rounded-full bg-[#F10897] px-6 py-4 font-sans text-base font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#d4007d] active:scale-95">Send a Gift</Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
