// JSON-LD structured data components for SEO.
//
// These inject <script type="application/ld+json"> tags into the page
// so Google can render rich snippets in search results (stars, prices,
// FAQ accordions, breadcrumbs).
//
// Used by individual pages via the <JsonLd> component.

type Organization = {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description: string;
  email: string;
  sameAs: string[];
};

type Product = {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description: string;
  brand: { "@type": "Brand"; name: string };
  category: string;
  offers: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
    availability: string;
    url: string;
  }[];
};

type FAQPage = {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: { "@type": "Answer"; text: string };
  }[];
};

type BreadcrumbList = {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }[];
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tarewellness.com";

export const organizationLd: Organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Tare Wellness Enterprise Ltd",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    "Tare Wellness sends wellness gift cards in Nigeria — therapy, wellness coaching, and more. NGN-priced, delivered instantly.",
  email: "hello@tarewellness.com",
  sameAs: [
    "https://instagram.com",
    "https://x.com",
  ],
};

export const giftCardProductLd: Product[] = [
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Tare Gift Card — 1 Session (Seed)",
    description: "One wellness session gift card. The recipient books whenever they're ready.",
    brand: { "@type": "Brand", name: "Tare Wellness" },
    category: "Wellness Gift Card",
    offers: [
      {
        "@type": "Offer",
        price: "200.00",
        priceCurrency: "NGN",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/gift-cards`,
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Tare Gift Card — 2 Sessions (Root)",
    description: "Two wellness sessions. The recipient books whenever they're ready — or splits it with someone.",
    brand: { "@type": "Brand", name: "Tare Wellness" },
    category: "Wellness Gift Card",
    offers: [
      {
        "@type": "Offer",
        price: "390.00",
        priceCurrency: "NGN",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/gift-cards`,
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Tare Gift Card — 3 Sessions (Grove)",
    description: "Three wellness sessions of steady care. The recipient books whenever they're ready.",
    brand: { "@type": "Brand", name: "Tare Wellness" },
    category: "Wellness Gift Card",
    offers: [
      {
        "@type": "Offer",
        price: "570.00",
        priceCurrency: "NGN",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/gift-cards`,
      },
    ],
  },
];

export const faqPageLd: FAQPage = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does the recipient get their gift card?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "After your purchase, we send an email to the recipient with their redemption code and a link to redeem. They enter the code on /redeem to unlock their wellness session credit, then book a session whenever they're ready.",
      },
    },
    {
      "@type": "Question",
      name: "Does the gift card expire?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No — Tare gift cards have no expiration date. The recipient can redeem their code and book their session whenever they're ready, no pressure.",
      },
    },
    {
      "@type": "Question",
      name: "What payment methods do you accept?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We accept Visa, Mastercard, and Verve cards via Paystack, plus bank transfer. All card payments are processed securely by Paystack — your card details never touch our servers.",
      },
    },
    {
      "@type": "Question",
      name: "Can I send the gift card to multiple recipients?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — add multiple gift cards to your cart and specify a different recipient for each. Each recipient receives their own email with their own redemption code.",
      },
    },
    {
      "@type": "Question",
      name: "What types of wellness sessions are available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We offer individual therapy (50 min), couples sessions (60 min), family sessions (75 min), and wellness coaching check-ins (30 min). All sessions are conducted via WhatsApp video call.",
      },
    },
  ],
};

export function buildBreadcrumbLd(items: { name: string; path: string }[]): BreadcrumbList {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
