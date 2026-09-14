import type { MetadataRoute } from "next";

// Auto-generated sitemap.xml — served at /sitemap.xml
//
// Next.js 16 metadata route. Lists all public pages we want Google to
// index. Private/authenticated pages (cart-review, checkout, account,
// admin, etc.) are excluded because they shouldn't be in search results.
//
// Generated at build time + at request time. Rebuild whenever you add
// a new public page.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tarewellness.com";

// Public pages we want Google to index
const PUBLIC_PAGES = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/gift-cards", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/how-it-works", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/redeem", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/book-session", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/contact-us", priority: 0.6, changeFrequency: "yearly" as const },
  { path: "/privacy-policy", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/terms-and-conditions", priority: 0.4, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
