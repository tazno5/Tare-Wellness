"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useStore } from "@/lib/store";

// ============================================================
// INACTIVITY AUTO-LOGOUT
// ============================================================
//
// Logs the user out after 30 minutes of inactivity (no mouse
// movement, no keyboard input, no scroll, no click).
//
// Also logs the user out when they close all tabs / the browser
// (via the `beforeunload` event — the Zustand store is persisted
// in localStorage, but the NextAuth JWT cookie is a session
// cookie that's deleted on browser close. When they reopen the
// browser, the cookie is gone → /api/auth/me returns null →
// we clear the Zustand store + redirect to /login).
//
// How it works:
//   1. On mount: start an inactivity timer (30 min)
//   2. On any user activity (mouse, keyboard, scroll, click):
//      reset the timer
//   3. If the timer fires (30 min of no activity):
//      - Call signOut() to clear the NextAuth session cookie
//      - Call logout() to clear the Zustand store
//      - Redirect to /login
//   4. On page visibility change (tab hidden → visible):
//      - Check how long the tab was hidden
//      - If > 30 min, log out immediately
//   5. On `beforeunload` (browser/tab close):
//      - The JWT cookie is already a session cookie (no maxAge set
//        on the cookie in auth.ts) → it's deleted automatically
//      - We don't need to do anything extra here — the cookie is
//        gone when they reopen the browser

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

export default function InactivityLogout() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

  useEffect(() => {
    if (!user) return; // Only run when logged in

    let inactivityTimer: ReturnType<typeof setTimeout>;
    let lastActivity = Date.now();

    const resetTimer = () => {
      lastActivity = Date.now();
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(async () => {
        // 30 minutes of inactivity → log out
        await signOut({ redirect: false });
        logout();
        router.push("/login");
      }, INACTIVITY_MS);
    };

    // Activity events that reset the timer
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Start the initial timer
    resetTimer();

    // Also check on tab visibility change (user switched away then back)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        // Tab became visible — check how long it was hidden
        const inactiveDuration = Date.now() - lastActivity;
        if (inactiveDuration >= INACTIVITY_MS) {
          // Was hidden for > 30 min → log out
          await signOut({ redirect: false });
          logout();
          router.push("/login");
        } else {
          // Was hidden for < 30 min → reset timer
          resetTimer();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, logout, router]);

  // Also verify the session is still valid on mount — if the JWT
  // cookie expired (browser was closed and reopened), /api/auth/me
  // returns null → clear the Zustand store + redirect to /login.
  useEffect(() => {
    if (!user) return; // Only check if the store says we're logged in

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data?.user) {
          // Session expired (cookie gone or JWT expired) — but Zustand
          // store still has the user. Clear it + redirect.
          logout();
          router.push("/login");
        }
      })
      .catch(() => {
        // Network error — don't log out on network errors
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  return null; // This component renders nothing
}
