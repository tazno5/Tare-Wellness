import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

// POST /api/newsletter/subscribe — add a user's email to the Subscriber table.
const subscribeSchema = z.object({
  email: z.string().email().max(500),
});

export async function POST(req: Request) {
  try {
    // Basic in-memory rate limit (5/min/IP). Dev-safe, no Redis needed.
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "anonymous";
    const key = `nl:${ip}`;
    const now = Date.now();
    const windowMs = 60_000;
    const maxPerWindow = 5;

    const rl = (globalThis as unknown as { __nlRl?: Map<string, { count: number; reset: number }> }).__nlRl ?? new Map<string, { count: number; reset: number }>();
    (globalThis as unknown as { __nlRl?: Map<string, { count: number; reset: number }> }).__nlRl = rl;

    const entry = rl.get(key);
    if (entry && now < entry.reset) {
      if (entry.count >= maxPerWindow) {
        return NextResponse.json(
          { error: "Too many requests. Please try again in a minute." },
          { status: 429 },
        );
      }
      entry.count += 1;
    } else {
      rl.set(key, { count: 1, reset: now + windowMs });
    }

    const body = await req.json();
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    // Upsert so duplicate emails don't throw — idempotent subscribe
    const subscriber = await db.subscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    return NextResponse.json({
      success: true,
      message: "You're on the list!",
      subscriberId: subscriber.id,
    });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 },
    );
  }
}
