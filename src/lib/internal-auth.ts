// Internal auth helper for server-to-server API routes (email, cron, etc.)
// that should NOT be callable by the public.
//
// The caller passes INTERNAL_API_SECRET as a Bearer token. If the env var
// is not set, the route falls back to checking for a browser User-Agent
// header (browsers always send User-Agent; server-side fetch from Next.js
// does NOT by default).
//
// On Vercel, ALL requests (including server-to-server) have an
// x-forwarded-for header (set by the edge proxy), so we can't use that
// to distinguish browser vs server. The User-Agent check is the reliable
// signal: Node.js fetch doesn't send a User-Agent header by default,
// while browsers always send one containing "Mozilla".

export function verifyInternalAuth(req: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET;

  // If INTERNAL_API_SECRET is set, require it as a Bearer token
  if (secret) {
    const authHeader = req.headers.get("authorization");
    return authHeader === `Bearer ${secret}`;
  }

  // Fallback (when INTERNAL_API_SECRET is not set):
  // Reject requests that look like they came from a browser.
  // Browsers always send a User-Agent header containing "Mozilla".
  // Server-side fetch from Next.js does NOT send User-Agent by default.
  const userAgent = req.headers.get("user-agent");
  if (userAgent && /Mozilla|Chrome|Safari|Firefox|Edge|Opera/i.test(userAgent)) {
    return false; // Browser request — reject
  }

  // No browser User-Agent → likely a server-side fetch → allow
  // Warn in production if INTERNAL_API_SECRET isn't set
  if (process.env.NODE_ENV === "production") {
    console.warn("[SECURITY] INTERNAL_API_SECRET not set — email routes are using User-Agent fallback. Set INTERNAL_API_SECRET in Vercel env vars for proper security.");
  }
  return true;
}
