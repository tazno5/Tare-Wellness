// Internal auth helper for server-to-server API routes (email, cron, etc.)
// that should NOT be callable by the public.
//
// These routes are called from OTHER server routes (e.g. /api/orders calls
// /api/email/send) or from GitHub Actions (e.g. /api/cron/booking-reminders).
// They should never be callable by an unauthenticated browser request.
//
// The caller passes INTERNAL_API_SECRET as a Bearer token. If the env var
// is not set, the route falls back to checking for a server-side origin
// (headers that only Next.js server-side fetch sets, not a browser).

export function verifyInternalAuth(req: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET;

  // If INTERNAL_API_SECRET is set, require it as a Bearer token
  if (secret) {
    const authHeader = req.headers.get("authorization");
    return authHeader === `Bearer ${secret}`;
  }

  // Fallback: check if the request came from the same server (not a browser)
  // by looking for the x-vercel-forwarded-for or x-forwarded-for header
  // which browsers always send but server-side fetch within the same
  // Next.js app doesn't. This is a weak check — set INTERNAL_API_SECRET
  // in production for proper security.
  const forwarded = req.headers.get("x-forwarded-for");
  const userAgent = req.headers.get("user-agent");

  // If there's a user-agent that looks like a browser, reject
  if (userAgent && /Mozilla|Chrome|Safari|Firefox|Edge/i.test(userAgent)) {
    return false;
  }

  // If there's a forwarded-for header (browser proxy), reject
  if (forwarded) {
    return false;
  }

  // Allow (likely a server-side fetch with no browser headers)
  return true;
}
