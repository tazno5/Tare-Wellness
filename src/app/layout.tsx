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
  title: "Tare — Give Rest.",
  description:
    "Send a Tare gift card. They pick a session, take their time, and rest. That’s it.",
  keywords: [
    "Tare",
    "Tare Wellness",
    "gift card",
    "redeem",
    "wellness",
    "session",
    "rest",
  ],
  authors: [{ name: "Tare Wellness Enterprise Ltd" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "Tare — Give Rest.",
    description:
      "Send a Tare gift card. They pick a session, take their time, and rest. That’s it.",
    url: "https://tarewellness.example.com",
    siteName: "Tare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tare — Give Rest.",
    description:
      "Send a Tare gift card. They pick a session, take their time, and rest. That’s it.",
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
