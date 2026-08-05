"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Instagram, Twitter, AtSign } from "lucide-react";

const SHOP_LINKS = [
  { label: "Gift Cards", href: "/gift-cards" },
  { label: "Redeem a Card", href: "/redeem" },
];

const RESOURCE_LINKS = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/faq" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "FAQ", href: "/faq" },
];

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com", Icon: Instagram },
  { label: "X (Twitter)", href: "https://x.com", Icon: Twitter },
  { label: "Email", href: "mailto:tarebewell@gmail.com", Icon: AtSign },
];

export default function Footer() {
  return (
    <footer className="relative z-10 w-full bg-transparent px-5 pb-10 pt-14 sm:px-8 lg:px-12 lg:pt-20">
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
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
              aria-label="Tare home"
            >
              <Image
                src="/logo.png"
                alt="Tare logo"
                width={80}
                height={80}
                className="h-20 w-20 object-contain drop-shadow-[0_6px_16px_rgba(78, 0, 48, 0.3)]"
              />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-maroon/85">
              Tare means love in Ijaw.
              <br />
              This is how we send it.
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#F10897] shadow-sm transition-all duration-200 hover:scale-110 hover:bg-[#E8B6D5]/15 active:scale-95"
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
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#4E0030]/85 underline-offset-4 transition-colors hover:text-maroon hover:underline"
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
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#4E0030]/85 underline-offset-4 transition-colors hover:text-maroon hover:underline"
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
                  href="/contact-us"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#4E0030]/85 underline-offset-4 transition-colors hover:text-maroon hover:underline"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </motion.nav>
        </div>

        {/* Thin divider */}
        <div className="mt-12 border-t border-maroon/20 lg:mt-16" />

        {/* Copyright */}
        <p className="mt-6 text-center text-xs text-[#4E0030]/80 sm:text-sm">
          © 2026 Tare Wellness Enterprise Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
