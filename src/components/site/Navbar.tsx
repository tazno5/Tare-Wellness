"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Gift Cards", href: "/gift-cards" },
  { label: "Redeem", href: "/redeem" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

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
      return "relative font-sans text-sm font-semibold text-[#F20997] underline decoration-[#F20997] decoration-2 underline-offset-4";
    return "relative font-sans text-sm font-semibold text-[#F10897] underline decoration-[#F10897] decoration-2 underline-offset-4";
  };

  const isTransparentRoute = ["/gift-cards", "/recipient-details", "/cart-review", "/checkout", "/order-confirmation", "/redeem", "/book-session", "/booking-confirmation", "/how-it-works", "/faq", "/privacy-policy", "/terms-and-conditions", "/contact-us"].includes(pathname);

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <div className={`absolute inset-0 -z-10 backdrop-blur-md ${isTransparentRoute ? "bg-transparent shadow-[0_8px_30px_rgba(0,0,0,0.12)]" : "bg-[#F10897]/60 shadow-[0_4px_25px_rgba(0,0,0,0.12)]"}`} />
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3 sm:px-8 sm:py-4 lg:px-12">
        <Link href="/" className="group inline-flex shrink-0 items-center" aria-label="BE WELL TARE home">
          <Image src="/logo.png" alt="BE WELL TARE logo" width={80} height={80} priority className="h-20 w-20 object-contain drop-shadow-[0_4px_10px_rgba(61,0,46,0.25)] transition-transform duration-200 group-hover:scale-[1.04]" />
        </Link>
        <ul className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => { const active = isActive(link.href); return (
            <li key={link.label}>
              <Link href={link.href} className={active ? activeClass(link.href) : "relative font-sans text-sm font-medium text-maroon transition-colors hover:text-maroon-700 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-maroon after:transition-all after:duration-300 hover:after:w-full"}>
                {link.label}
              </Link>
            </li>
          ); })}
        </ul>
        <div className="flex items-center gap-3">
          <Link href="/gift-cards" className="hidden items-center rounded-full bg-[#4E0030] px-5 py-2.5 font-sans text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.03] hover:bg-[#3a0023] active:scale-95 md:inline-flex">Send a Gift</Link>
          <button type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-maroon/10 text-maroon transition-colors hover:bg-maroon/20 md:hidden">
            <Menu className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div key="mobile-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 bg-brand-gradient backdrop-blur-md md:hidden">
            <div className="flex items-center justify-between px-5 py-3 sm:px-8">
              <Link href="/" onClick={() => setOpen(false)} className="inline-flex shrink-0 items-center" aria-label="BE WELL TARE home">
                <Image src="/logo.png" alt="BE WELL TARE logo" width={80} height={80} className="h-20 w-20 object-contain drop-shadow-[0_4px_10px_rgba(61,0,46,0.25)]" />
              </Link>
              <button type="button" aria-label="Close menu" aria-expanded={open} onClick={() => setOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-maroon/15 text-maroon transition-colors hover:bg-maroon/25">
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
            <motion.ul initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }} className="mt-4 flex flex-col gap-2 px-5 sm:px-8">
              {NAV_LINKS.map((link) => { const active = isActive(link.href); return (
                <motion.li key={link.label} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                  <Link href={link.href} onClick={() => setOpen(false)} className={active ? (link.href === "/redeem" || link.href === "/how-it-works" || link.href === "/faq" ? "block rounded-2xl px-4 py-3 font-fraunces text-3xl font-bold text-[#F20997] underline decoration-[#F20997] decoration-2 underline-offset-4" : "block rounded-2xl px-4 py-3 font-fraunces text-3xl font-bold text-[#F10897] underline decoration-[#F10897] decoration-2 underline-offset-4") : "block rounded-2xl px-4 py-3 font-fraunces text-3xl font-bold text-maroon transition-colors hover:bg-maroon/10"}>
                    {link.label}
                  </Link>
                </motion.li>
              ); })}
            </motion.ul>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="px-5 pt-6 sm:px-8">
              <Link href="/gift-cards" onClick={() => setOpen(false)} className="inline-flex w-full items-center justify-center rounded-full bg-[#4E0030] px-6 py-4 font-sans text-base font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#3a0023] active:scale-95">Send a Gift</Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
