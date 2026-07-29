import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
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
        className={`${inter.variable} ${playfair.variable} antialiased bg-magenta text-maroon font-sans`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
