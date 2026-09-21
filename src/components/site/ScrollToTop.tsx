"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// ============ ScrollToTop ============
//
// Automatically scrolls to the top of the page on every route change.
//
// By default, Next.js App Router doesn't reset scroll position when
// navigating between pages (unlike the Pages Router which had built-in
// scroll restoration). This means if you're scrolled down on /gift-cards
// and click a link to /redeem, the new page loads already scrolled
// down — looking broken.
//
// This component listens to pathname changes and scrolls to the top
// instantly on every navigation. It's mounted once in the root layout.

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top on every route change
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
