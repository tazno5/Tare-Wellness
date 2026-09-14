import type { Metadata } from "next";

// Shared SEO metadata for each page on Tare Wellness.
//
// Each page gets a unique title + description so Google indexes them
// for different search queries. Titles use the "%s | Tare Wellness"
// template from the root layout — so we only specify the prefix here.
//
// All URLs are derived from NEXT_PUBLIC_SITE_URL (set on Vercel) so
// they work correctly in production, preview deploys, and local dev.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tarewellness.com";

export const PAGE_METADATA: Record<string, Metadata> = {
  "gift-cards": {
    title: "Gift Cards",
    description:
      "Browse Tare wellness gift cards. Choose 1, 2, or 3 sessions. Send instantly or schedule for later. NGN pricing — perfect for therapy, wellness coaching, and mental health support.",
    alternates: { canonical: `${SITE_URL}/gift-cards` },
    openGraph: {
      title: "Tare Wellness Gift Cards",
      description: "Send a wellness gift card in Nigeria. 1, 2, or 3 sessions — delivered instantly.",
      url: `${SITE_URL}/gift-cards`,
    },
  },

  "redeem": {
    title: "Redeem Your Gift Card",
    description:
      "Enter your Tare gift card code to unlock your wellness session credit. Redeem in seconds — book your session whenever you're ready.",
    alternates: { canonical: `${SITE_URL}/redeem` },
    openGraph: {
      title: "Redeem Your Tare Gift Card",
      description: "Enter your code to unlock your wellness session credit.",
      url: `${SITE_URL}/redeem`,
    },
  },

  "book-session": {
    title: "Book a Wellness Session",
    description:
      "Book your wellness session with a Tare provider. Choose individual, couples, family, or wellness coaching. Pick a date and time that works for you.",
    alternates: { canonical: `${SITE_URL}/book-session` },
    openGraph: {
      title: "Book a Wellness Session | Tare",
      description: "Individual, couples, family, or wellness coaching sessions in Nigeria.",
      url: `${SITE_URL}/book-session`,
    },
  },

  "booking-confirmation": {
    title: "Booking Confirmation",
    description: "Your Tare wellness session is booked. Find your booking details here.",
    alternates: { canonical: `${SITE_URL}/booking-confirmation` },
    robots: { index: false, follow: false }, // private page — don't index
  },

  "cart-review": {
    title: "Review Your Order",
    description: "Review your Tare gift card order before checkout.",
    alternates: { canonical: `${SITE_URL}/cart-review` },
    robots: { index: false, follow: false }, // private page — don't index
  },

  "checkout": {
    title: "Checkout",
    description: "Secure checkout for your Tare wellness gift card. Pay with card via Paystack or bank transfer.",
    alternates: { canonical: `${SITE_URL}/checkout` },
    robots: { index: false, follow: false }, // private page — don't index
  },

  "order-confirmation": {
    title: "Order Confirmation",
    description: "Your Tare gift card order is confirmed. Find your redemption codes here.",
    alternates: { canonical: `${SITE_URL}/order-confirmation` },
    robots: { index: false, follow: false }, // private page — don't index
  },

  "recipient-details": {
    title: "Recipient Details",
    description: "Add the recipient details for your Tare gift card.",
    alternates: { canonical: `${SITE_URL}/recipient-details` },
    robots: { index: false, follow: false }, // private page — don't index
  },

  "how-it-works": {
    title: "How It Works",
    description:
      "How Tare Wellness works: pick a gift card, send it instantly, recipient redeems for a real wellness session. Simple, thoughtful, NGN-priced.",
    alternates: { canonical: `${SITE_URL}/how-it-works` },
    openGraph: {
      title: "How Tare Wellness Works",
      description: "Pick a gift card, send it instantly, recipient books a real wellness session.",
      url: `${SITE_URL}/how-it-works`,
    },
  },

  "faq": {
    title: "FAQ",
    description:
      "Frequently asked questions about Tare Wellness gift cards, redemption, bookings, payments, and more. Everything you need to know before sending a gift.",
    alternates: { canonical: `${SITE_URL}/faq` },
    openGraph: {
      title: "Tare Wellness FAQ",
      description: "Answers to common questions about Tare gift cards and bookings.",
      url: `${SITE_URL}/faq`,
    },
  },

  "contact-us": {
    title: "Contact Us",
    description:
      "Get in touch with the Tare Wellness team. Questions about gift cards, bookings, or our service? We respond within 24 hours.",
    alternates: { canonical: `${SITE_URL}/contact-us` },
    openGraph: {
      title: "Contact Tare Wellness",
      description: "Questions about gift cards or bookings? Reach out — we respond within 24 hours.",
      url: `${SITE_URL}/contact-us`,
    },
  },

  "privacy-policy": {
    title: "Privacy Policy",
    description:
      "Tare Wellness Privacy Policy. How we collect, use, and protect your personal data in accordance with the Nigeria Data Protection Act (NDPA) 2023.",
    alternates: { canonical: `${SITE_URL}/privacy-policy` },
    openGraph: {
      title: "Privacy Policy | Tare Wellness",
      description: "How we handle your personal data — NDPA 2023 compliant.",
      url: `${SITE_URL}/privacy-policy`,
    },
  },

  "terms-and-conditions": {
    title: "Terms & Conditions",
    description:
      "Tare Wellness Terms & Conditions. The agreement between Tare Wellness Enterprise Ltd and our users for gift card purchases and wellness session bookings.",
    alternates: { canonical: `${SITE_URL}/terms-and-conditions` },
    openGraph: {
      title: "Terms & Conditions | Tare Wellness",
      description: "Our terms of service for gift card purchases and bookings.",
      url: `${SITE_URL}/terms-and-conditions`,
    },
  },

  "login": {
    title: "Sign In",
    description: "Sign in to your Tare Wellness account to send gift cards, redeem codes, and book sessions.",
    alternates: { canonical: `${SITE_URL}/login` },
    robots: { index: false, follow: true }, // don't index login page
  },

  "account": {
    title: "My Account",
    description: "Manage your Tare Wellness account — view orders, bookings, and personal data.",
    alternates: { canonical: `${SITE_URL}/account` },
    robots: { index: false, follow: false }, // private page — don't index
  },

  "admin": {
    title: "Admin",
    description: "Tare Wellness admin dashboard.",
    alternates: { canonical: `${SITE_URL}/admin` },
    robots: { index: false, follow: false }, // private page — don't index
  },
};

// Helper to get metadata for a page by its key
export function getPageMetadata(key: keyof typeof PAGE_METADATA): Metadata {
  return PAGE_METADATA[key];
}
