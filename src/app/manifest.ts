import type { MetadataRoute } from "next";

// Auto-generated manifest.json — served at /manifest.json
//
// Next.js 16 metadata route. Lets users "Add to Home Screen" on mobile.
// Improves mobile UX + small SEO boost (Google prefers PWAs).

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tarewellness.com";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tare Wellness",
    short_name: "Tare",
    description:
      "Send a Tare gift card. They pick a wellness session, take their time, and rest. NGN gift cards for therapy, wellness coaching, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF5EE",
    theme_color: "#F10897",
    orientation: "portrait-primary",
    scope: "/",
    lang: "en-NG",
    dir: "ltr",
    categories: ["wellness", "health", "shopping", "lifestyle"],
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Buy a Gift Card",
        short_name: "Buy",
        description: "Browse and purchase Tare wellness gift cards",
        url: "/gift-cards",
        icons: [{ src: "/logo.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Redeem a Gift Card",
        short_name: "Redeem",
        description: "Enter your gift card code to unlock your wellness credit",
        url: "/redeem",
        icons: [{ src: "/logo.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Book a Session",
        short_name: "Book",
        description: "Book a wellness session with a Tare provider",
        url: "/book-session",
        icons: [{ src: "/logo.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  };
}
