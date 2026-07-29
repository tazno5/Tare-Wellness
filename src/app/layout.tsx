import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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

export const metadata: Metadata = {
  title: "BE WELL TARE — Share the Joy, Book a Session",
  description:
    "Give the gift of play or schedule your next unforgettable moment with Luma's bubbly new experience.",
  keywords: [
    "BE WELL TARE",
    "gift card",
    "redeem",
    "wellness",
    "session",
    "Luma",
  ],
  authors: [{ name: "BE WELL TARE" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "BE WELL TARE — Share the Joy, Book a Session",
    description:
      "Give the gift of play or schedule your next unforgettable moment with Luma's bubbly new experience.",
    url: "https://bewelltare.example.com",
    siteName: "BE WELL TARE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BE WELL TARE — Share the Joy, Book a Session",
    description:
      "Give the gift of play or schedule your next unforgettable moment with Luma's bubbly new experience.",
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
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
