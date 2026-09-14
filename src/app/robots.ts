import type { MetadataRoute } from "next";

// Auto-generated robots.txt — served at /robots.txt
//
// Next.js 16 metadata route. Tells search engine crawlers:
//   1. Which pages they CAN index (all public pages — allowed)
//   2. Which pages they CANNOT index (private/auth pages — disallowed)
//   3. Where the sitemap is (auto-referenced using NEXT_PUBLIC_SITE_URL)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tarewellness.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow all major search engines to crawl public pages
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/admin", "/account", "/cart-review", "/checkout", "/order-confirmation", "/booking-confirmation", "/recipient-details", "/login"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/admin", "/account", "/cart-review", "/checkout", "/order-confirmation", "/booking-confirmation", "/recipient-details", "/login"],
      },
      {
        userAgent: "Twitterbot",
        allow: "/",
        disallow: ["/api/", "/admin", "/account", "/cart-review", "/checkout", "/order-confirmation", "/booking-confirmation", "/recipient-details", "/login"],
      },
      {
        userAgent: "facebookexternalhit",
        allow: "/",
        disallow: ["/api/", "/admin", "/account", "/cart-review", "/checkout", "/order-confirmation", "/booking-confirmation", "/recipient-details", "/login"],
      },
      // Default rule for all other crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/account", "/cart-review", "/checkout", "/order-confirmation", "/booking-confirmation", "/recipient-details", "/login"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
