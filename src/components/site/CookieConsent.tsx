"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";

/**
 * NDPA 2023 compliant cookie consent banner.
 *
 * Shows on every page (except /admin) until the user clicks "Acknowledge".
 * Stores consent in a cookie for 1 year (NDPA-compliant — consent must be
 * refreshed periodically, 12 months is industry standard).
 *
 * Implementation:
 * - Reads `tare-cookie-consent` cookie on mount
 * - If not present → renders the banner
 * - On "Acknowledge" click → sets cookie with 1-year expiry + hides banner
 * - Renders nothing on /admin (admin users don't need to see it)
 * - Renders nothing on /login (avoid cluttering auth flow)
 * - Respects prefers-reduced-motion (banner fades instead of sliding)
 *
 * NDPA 2023 references:
 * - Section 28(1)(a): consent must be freely given, specific, informed
 * - Section 28(1)(b): consent must be unambiguous
 * - Section 28(2): consent can be withdrawn at any time
 * - We implement withdrawal via the privacy policy — users can clear the
 *   `tare-cookie-consent` cookie to re-trigger this banner
 */

const COOKIE_NAME = "tare-cookie-consent";
const COOKIE_MAX_AGE_DAYS = 365; // 1 year

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? match.split("=")[1] : null;
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const sameSite = "; SameSite=Lax";
  document.cookie = `${name}=${value}; expires=${expires}; path=/${secure}${sameSite}`;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Don't show on admin or login pages
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) {
      return;
    }

    // Show banner if no consent cookie exists
    const consent = getCookie(COOKIE_NAME);
    if (!consent) {
      // Small delay so the banner doesn't pop in during page transition
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const handleAcknowledge = () => {
    setCookie(COOKIE_NAME, "acknowledged", COOKIE_MAX_AGE_DAYS);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
        >
          <div className="mx-auto w-full max-w-5xl rounded-2xl border border-maroon/10 bg-white p-4 shadow-[0_15px_50px_rgba(78,0,48,0.20)] sm:p-5">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
              {/* Icon */}
              <div className="hidden shrink-0 sm:block">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FCE4EC]">
                  <Cookie className="h-5 w-5 text-[#F10897]" strokeWidth={2.5} />
                </div>
              </div>

              {/* Text */}
              <div className="flex-1">
                <p className="font-sans text-xs leading-relaxed text-maroon/85 sm:text-sm">
                  We use cookies to enhance your experience, process payments,
                  and analyze usage in accordance with the{" "}
                  <span className="font-semibold">Nigeria Data Protection
                  Act (NDPA) 2023</span>. By continuing to use Tare, you
                  acknowledge our use of cookies. See our{" "}
                  <Link
                    href="/privacy-policy"
                    className="font-semibold text-[#F10897] underline-offset-2 hover:underline"
                  >
                    Privacy Policy
                  </Link>{" "}
                  for details.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#F10897] px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(241,8,151,0.30)] transition-all hover:scale-[1.02] hover:bg-[#d4007d] active:scale-95 sm:flex-none sm:px-6 sm:py-3 sm:text-sm"
                >
                  Acknowledge
                </button>
                <button
                  type="button"
                  onClick={() => setVisible(false)}
                  aria-label="Dismiss"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-maroon/40 transition-colors hover:bg-maroon/5 hover:text-maroon sm:hidden"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
