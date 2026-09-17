"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

// ============================================================
// SESSION SYNC — Syncs the NextAuth session into Zustand on mount
// ============================================================
//
// The Zustand store no longer persists the `user` object to
// localStorage (removed from `partialize`). Instead, this component
// fetches the current session from /api/auth/me on every page load
// and populates the Zustand store with the user object.
//
// This means:
//   - When the JWT cookie expires (30 min inactivity or browser close),
//     /api/auth/me returns null → the store's user is set to null →
//     the user appears logged out immediately.
//   - When the user logs in, the login() function sets the user in
//     the store (in-memory only — not persisted).
//   - On page refresh, the store's user is null (not persisted), so
//     this component fetches the session and re-populates it.
//
// This component renders nothing (returns null).
// ============================================================

export default function SessionSync() {
  const user = useStore((s) => s.user);
  const login = useStore((s) => s.login);
  const logout = useStore((s) => s.logout);

  useEffect(() => {
    // Always check the session on mount — this handles:
    //   1. Page refresh (store.user is null because it's not persisted)
    //   2. Browser reopen (JWT cookie is gone → session is null → logout)
    //   3. JWT expired after 30 min inactivity (session is null → logout)
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          // Session is valid — populate the store
          login({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
          });
        } else {
          // Session is null (expired / not logged in) — if the store
          // still has a user (stale from before we removed it from
          // partialize), clear it
          if (user) {
            logout();
          }
        }
      })
      .catch(() => {
        // Network error — don't log out on network errors
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return null;
}
