import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import ConditionalChrome from "@/components/site/ConditionalChrome";
import CookieConsent from "@/components/site/CookieConsent";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: "variable",
  axes: ["SOFT", "WONK", "opsz"],
});

// Keep Inter around for shadcn/ui defaults
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Site URL — used for canonical URLs, OpenGraph, sitemap, structured data.
// Override via NEXT_PUBLIC_SITE_URL env var (set on Vercel). Falls back to
// the production domain.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tarewellness.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Tare — Send Wellness Gift Cards in Nigeria",
    template: "%s | Tare Wellness",
  },
  description:
    "Send a Tare gift card. They pick a wellness session, take their time, and rest. NGN gift cards for therapy, wellness coaching, and more — delivered instantly.",
  keywords: [
    "Tare",
    "Tare Wellness",
    "wellness gift card",
    "gift card Nigeria",
    "therapy gift card",
    "wellness session",
    "redeem gift card",
    "send gift card Nigeria",
    "mental health Nigeria",
    "wellness coaching",
  ],
  authors: [{ name: "Tare Wellness Enterprise Ltd" }],
  creator: "Tare Wellness Enterprise Ltd",
  publisher: "Tare Wellness Enterprise Ltd",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Tare — Send Wellness Gift Cards in Nigeria",
    description:
      "Send a Tare gift card. They pick a wellness session, take their time, and rest. NGN gift cards for therapy, wellness coaching, and more.",
    url: SITE_URL,
    siteName: "Tare Wellness",
    type: "website",
    locale: "en_NG",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Tare Wellness logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tare — Send Wellness Gift Cards in Nigeria",
    description:
      "Send a Tare gift card. They pick a wellness session, take their time, and rest.",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${fraunces.variable} ${inter.variable} antialiased font-sans text-maroon`}
        style={{
          backgroundColor: "#FFF5EE",
          minHeight: "100vh",
        }}
      >
        <Providers>
          <ConditionalChrome>{children}</ConditionalChrome>
          <CookieConsent />
          <Toaster />
        </Providers>
        {/* Paystack Inline JS — loaded lazily so it doesn't block page render.
            Used by /checkout to open the Paystack popup for card payments.
            Safe to load on every page — it just defines window.PaystackPop. */}
        <Script
          src="https://js.paystack.co/v1/inline.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
