import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy-init — only creates the Redis client if env vars are set.
// If not configured, rate limiting is skipped (dev environments without Upstash).
let _ratelimiters: Record<string, Ratelimit> | null = null;

function getRatelimiters(): Record<string, Ratelimit> | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!_ratelimiters) {
    const redis = new Redis({ url, token });
    _ratelimiters = {
      // 5 order creations per minute per IP
      orders: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        prefix: "ratelimit:orders",
      }),
      // 10 redemption attempts per minute per IP
      redeem: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        prefix: "ratelimit:redeem",
      }),
      // 5 email sends per minute per IP
      email: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        prefix: "ratelimit:email",
      }),
      // 5 bookings per minute per IP
      bookings: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        prefix: "ratelimit:bookings",
      }),
      // 3 contact form submissions per minute per IP
      contact: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "1 m"),
        prefix: "ratelimit:contact",
      }),
      // 3 registrations per minute per IP
      register: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "1 m"),
        prefix: "ratelimit:register",
      }),
    };
  }
  return _ratelimiters;
}

/**
 * Check rate limit for a given key + endpoint.
 * Returns { success: boolean } — if false, the caller should return 429.
 *
 * Usage:
 *   const { success } = await checkRateLimit(req, "orders");
 *   if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */
export async function checkRateLimit(
  req: Request,
  endpoint: string,
): Promise<{ success: boolean; limit?: number; remaining?: number }> {
  const ratelimiters = getRatelimiters();
  if (!ratelimiters) {
    // No Upstash configured — skip rate limiting (dev mode)
    return { success: true };
  }

  const limiter = ratelimiters[endpoint];
  if (!limiter) {
    // Unknown endpoint — skip rate limiting
    return { success: true };
  }

  // Get IP from headers (Vercel provides x-forwarded-for)
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "anonymous";

  const result = await limiter.limit(ip);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
  };
}
