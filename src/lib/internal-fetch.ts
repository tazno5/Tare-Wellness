// Server-side fetch helper that automatically attaches the
// INTERNAL_API_SECRET as a Bearer token on every request.
//
// Use this instead of raw `fetch()` when calling internal API routes
// (e.g. /api/email/send, /api/email/booking-confirmation) from
// other server-side routes. This ensures the email routes' auth
// check passes — without it, setting INTERNAL_API_SECRET on Vercel
// would break all internal email sends.
//
// IMPORTANT: This helper follows redirects MANUALLY and re-attaches
// the Authorization header on each redirect. Node.js's built-in fetch
// follows redirects automatically but STRIPS the Authorization header
// on cross-origin redirects (e.g. tarewellness.com → www.tarewellness.com).
// Without manual redirect handling, all internal email calls that go
// through a redirect silently lose their auth → the email route returns
// 401 → the email never sends.
//
// Usage:
//   import { internalFetch } from "@/lib/internal-fetch";
//   await internalFetch("/api/email/send", { method: "POST", body: ... });
//
// Falls back to plain fetch() if INTERNAL_API_SECRET is not set
// (dev environments without the secret configured).

export async function internalFetch(
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
  let baseUrl: string;
  if (process.env.NEXTAUTH_URL) {
    baseUrl = process.env.NEXTAUTH_URL.replace(/\/$/, "");
  } else if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  } else {
    baseUrl = "http://localhost:3000";
  }

  let fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

  // Follow redirects MANUALLY (max 5) to preserve the Authorization header.
  // Node.js's built-in fetch follows redirects but strips Authorization
  // on cross-origin redirects (e.g. non-www → www). By handling redirects
  // ourselves, we can re-attach the Authorization header on each hop.
  const maxRedirects = 5;
  let response: Response;
  let currentInit: RequestInit = { ...init, headers };

  for (let i = 0; i <= maxRedirects; i++) {
    response = await fetch(fullUrl, currentInit);

    // If not a redirect (3xx), return the response
    if (response.status < 300 || response.status >= 400) {
      return response;
    }

    // Get the redirect Location
    const location = response.headers.get("location");
    if (!location) {
      return response; // No Location header — return as-is
    }

    // Resolve the redirect URL (might be relative)
    fullUrl = new URL(location, fullUrl).toString();

    // Re-attach the Authorization header for the next request
    // (Node.js fetch strips it on cross-origin redirects)
    const redirectHeaders = new Headers(init.headers || {});
    if (secret) {
      redirectHeaders.set("Authorization", `Bearer ${secret}`);
    }
    if (init.body && !redirectHeaders.has("Content-Type")) {
      redirectHeaders.set("Content-Type", "application/json");
    }
    // 308 preserves the method + body; 301/302/303 change POST to GET
    if (response.status === 308 || response.status === 307) {
      currentInit = { ...init, headers: redirectHeaders };
    } else {
      // 301/302/303 → follow with GET (no body) but keep auth
      currentInit = { method: "GET", headers: redirectHeaders };
    }
  }

  // Too many redirects — return the last response
  return response!;
}
