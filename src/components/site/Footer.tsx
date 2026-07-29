"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Instagram, Twitter, AtSign } from "lucide-react";

const SHOP_LINKS = [
  { label: "Gift Cards", href: "#gift-cards" },
  { label: "Redeem a Card", href: "#redeem" },
];

const RESOURCE_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Privacy Policy", href: "#privacy" },
  { label: "Terms & Conditions", href: "#terms" },
  { label: "FAQ", href: "#faq" },
];

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com", Icon: Instagram },
  { label: "X (Twitter)", href: "https://x.com", Icon: Twitter },
  { label: "Email", href: "mailto:hello@bewelltare.com", Icon: AtSign },
];

export default function Footer() {
  return (
    <footer className="relative z-10 w-full px-5 pb-10 pt-14 sm:px-8 lg:px-12 lg:pt-20">
      <div className="mx-auto w-full max-w-7xl">
        {/* Four-column grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            className="sm:col-span-2 lg:col-span-1"
          >
            <Link
              href="/"
              className="inline-flex items-center"
              aria-label="BE WELL TARE home"
            >
              <Image
                src="/logo.png"
                alt="BE WELL TARE logo"
                width={80}
                height={80}
                className="h-20 w-20 object-contain drop-shadow-[0_6px_16px_rgba(61,0,46,0.3)]"
              />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-maroon/85">
              Promoting emotional wellness through thoughtful digital gifting
              and professional support.
            </p>

            {/* Socials */}
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blush text-maroon transition-all duration-200 hover:scale-110 hover:bg-white active:scale-95"
                >
                  <Icon className="h-4 w-4" strokeWidth={2.5} />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Shop column */}
          <motion.nav
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            aria-label="Shop"
          >
            <h3 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-maroon">
              Shop
            </h3>
            <ul className="mt-4 space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-maroon/85 underline-offset-4 transition-colors hover:text-maroon hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>

          {/* Resources column */}
          <motion.nav
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            aria-label="Resources"
          >
            <h3 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-maroon">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-maroon/85 underline-offset-4 transition-colors hover:text-maroon hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>

          {/* Stay in the loop column */}
          <motion.nav
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            aria-label="Stay in the loop"
          >
            <h3 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-maroon">
              Stay in the Loop
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="#contact"
                  className="text-sm text-maroon/85 underline-offset-4 transition-colors hover:text-maroon hover:underline"
                >
                  Contact Us
                </Link>
              </li>
            </ul>

            {/* Optional mini newsletter */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-6 flex w-full max-w-xs items-center gap-2"
            >
              <input
                type="email"
                aria-label="Email address"
                placeholder="Your email"
                className="h-11 w-full rounded-full border border-maroon/20 bg-white/30 px-4 text-sm text-maroon placeholder:text-maroon/55 focus:border-maroon/50 focus:outline-none focus:ring-2 focus:ring-maroon/30"
              />
              <button
                type="submit"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-maroon px-4 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] hover:bg-maroon-700 active:scale-95"
              >
                Join
              </button>
            </form>
          </motion.nav>
        </div>

        {/* Thin divider */}
        <div className="mt-12 border-t border-maroon/20 lg:mt-16" />

        {/* Copyright */}
        <p className="mt-6 text-center text-xs text-maroon/80 sm:text-sm">
          © 2026 TARE. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
