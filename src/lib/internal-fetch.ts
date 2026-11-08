// Server-side fetch helper that automatically attaches the
// INTERNAL_API_SECRET as a Bearer token on every request.
//
// Use this instead of raw `fetch()` when calling internal API routes
// (e.g. /api/email/send, /api/email/booking-confirmation) from
// other server-side routes. This ensures the email routes' auth
// check passes — without it, setting INTERNAL_API_SECRET on Vercel
// would break all internal email sends.
//
// Usage:
//   import { internalFetch } from "@/lib/internal-fetch";
//   await internalFetch("/api/email/send", { method: "POST", body: ... });
//
// Falls back to plain fetch() if INTERNAL_API_SECRET is not set
// (dev environments without the secret configured).

export function internalFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const secret = process.env.INTERNAL_API_SECRET;
  const headers = new Headers(init.headers || {});

  // Attach the internal secret as a Bearer token
  if (secret) {
    headers.set("Authorization", `Bearer ${secret}`);
  }

  // Ensure Content-Type is set for POST requests
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Build the absolute URL. Priority:
  //   1. NEXTAUTH_URL (set on Vercel to the production domain — most reliable)
  //   2. VERCEL_URL (automatically set by Vercel for each deployment)
  //   3. localhost (dev)
  //
  // PREVIOUS BUG: the old code used a ternary that evaluated as
  //   (NEXTAUTH_URL || VERCEL_URL) ? `https://${VERCEL_URL}` : localhost
  // which ALWAYS used VERCEL_URL even when NEXTAUTH_URL was set, and
  // produced `https://undefined` when VERCEL_URL wasn't set but
  // NEXTAUTH_URL was. Fixed below to use proper if/else priority.
  let baseUrl: string;
  if (process.env.NEXTAUTH_URL) {
    baseUrl = process.env.NEXTAUTH_URL.replace(/\/$/, "");
  } else if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  } else {
    baseUrl = "http://localhost:3000";
  }

  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

  return fetch(fullUrl, { ...init, headers });
}
