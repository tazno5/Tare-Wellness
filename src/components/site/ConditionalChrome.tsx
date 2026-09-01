"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";

/**
 * Conditionally renders the site Navbar + Footer.
 *
 * Hides them on:
 *   - /admin (admin login + dashboard should look like an isolated "lock screen")
 *
 * On all other routes, the marketing Navbar + Footer are rendered normally.
 */
export default function ConditionalChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    // Minimal chrome for admin — no marketing nav, no footer
    return (
      <>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col pt-[112px]">
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </>
  );
}
