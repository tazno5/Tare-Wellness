import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/admin-auth";
import { BrevoClient } from "@getbrevo/brevo";

// ============ POST /api/admin/clear-data ============
//
// Clears ALL test data from the database. The admin must type a
// secret confirmation phrase that is stored in the SiteSetting table
// under the key "clearDataPhrase". The phrase is NEVER returned by
// any API endpoint — the admin must know it or use the "Forgot Code?"
// flow to generate a new one (which is emailed to the admin address).
//
// If no "clearDataPhrase" exists in SiteSetting, falls back to
// CLEAR_DATA_PHRASE env var, then to "DELETE ALL DATA".
//
// Auth: requires ADMIN_SECRET Bearer token.

let _brevo: BrevoClient | null = null;
function getBrevo(): BrevoClient | null {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;
  if (!_brevo) _brevo = new BrevoClient({ apiKey });
  return _brevo;
}

function parseSender(): { name: string; email: string } {
  const raw = process.env.EMAIL_FROM || "Tare Wellness <hello@tarewellness.com>";
  const match = raw.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].trim() || "Tare Wellness", email: match[2].trim() };
  return { name: "Tare Wellness", email: raw.trim() };
}

// Get the expected confirmation phrase from DB, env, or default
async function getExpectedPhrase(): Promise<string> {
  // 1. Check SiteSetting table first
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: "clearDataPhrase" } });
    if (setting?.value) return setting.value;
  } catch {
    // Table might not exist — fall through to env
  }
  // 2. Fall back to env var
  return process.env.CLEAR_DATA_PHRASE || "DELETE ALL DATA";
}

export async function POST(req: Request) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Admin not configured. Set ADMIN_SECRET env var." },
        { status: 503 },
      );
    }

    if (!verifyAdminToken(req.headers.get("authorization"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { confirm } = body as { confirm?: string };

    const expectedPhrase = await getExpectedPhrase();

    if (!confirm || confirm !== expectedPhrase) {
      return NextResponse.json(
        { error: "Incorrect confirmation code. Please try again or click 'Forgot Code?' to reset." },
        { status: 400 },
      );
    }

    const results = {
      bookings: 0,
      redemptions: 0,
      orderItems: 0,
      orders: 0,
      accounts: 0,
      sessions: 0,
      users: 0,
    };

    await db.$transaction(async (tx) => {
      results.bookings = (await tx.booking.deleteMany({})).count;
      results.redemptions = (await tx.redemption.deleteMany({})).count;
      results.orderItems = (await tx.orderItem.deleteMany({})).count;
      results.orders = (await tx.order.deleteMany({})).count;
      try { results.accounts = (await tx.account.deleteMany({})).count; } catch {}
      try { results.sessions = (await tx.session.deleteMany({})).count; } catch {}
      results.users = (await tx.user.deleteMany({})).count;
    });

    return NextResponse.json({
      success: true,
      message: "All test data cleared. The system is now clean.",
      deleted: results,
    });
  } catch (error) {
    console.error("Clear data error:", error);
    return NextResponse.json(
      { error: "Failed to clear data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

// ============ PATCH /api/admin/clear-data ============
// "Forgot Code?" — generates a new random confirmation phrase, saves
// it to the SiteSetting table, and emails it to the admin email
// address (ADMIN_EMAIL or EMAIL_FROM). The phrase is NOT returned
// in the API response — it's only sent via email so anyone watching
// the network tab can't see it.

function generatePhrase(): string {
  // Generate a memorable-ish random phrase: 4 random hex chars + dash + 4 more
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) part1 += chars[Math.floor(Math.random() * chars.length)];
  for (let i = 0; i < 4; i++) part2 += chars[Math.floor(Math.random() * chars.length)];
  return `tare-${part1}-${part2}`;
}

export async function PATCH(req: Request) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Admin not configured. Set ADMIN_SECRET env var." },
        { status: 503 },
      );
    }

    if (!verifyAdminToken(req.headers.get("authorization"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate a new phrase
    const newPhrase = generatePhrase();

    // Save it to SiteSetting (upsert — create if not exists, update if exists)
    try {
      await db.siteSetting.upsert({
        where: { key: "clearDataPhrase" },
        update: { value: newPhrase },
        create: { key: "clearDataPhrase", value: newPhrase },
      });
    } catch {
      // If SiteSetting table doesn't exist, we can't save — fall back
      return NextResponse.json(
        { error: "Could not save new code to database. The SiteSetting table may not exist yet. Run prisma migrate deploy first." },
        { status: 500 },
      );
    }

    // Email the new phrase to the admin
    const adminRaw = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || "hello@tarewellness.com";
    const adminEmail = adminRaw.match(/<([^>]+)>/)?.[1] || adminRaw;

    const brevo = getBrevo();
    if (brevo) {
      try {
        const sender = parseSender();
        await brevo.transactionalEmails.sendTransacEmail({
          sender: { name: sender.name, email: sender.email },
          to: [{ email: adminEmail }],
          subject: "Your new Tare admin confirmation code",
          htmlContent: `
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 24px; padding: 40px; text-align: center;">
                <p style="font-family: 'Fraunces', serif; color: #4E0030; font-size: 22px; font-weight: bold; margin: 0 0 16px 0;">
                  Your new admin confirmation code
                </p>
                <div style="background: #FFF5EE; border: 2px dashed #F10897; border-radius: 16px; padding: 20px; margin: 16px 0;">
                  <p style="font-family: monospace; font-size: 24px; font-weight: bold; color: #4E0030; letter-spacing: 2px; margin: 0;">
                    ${newPhrase}
                  </p>
                </div>
                <p style="color: #4E0030; opacity: 0.7; font-size: 14px; margin: 0; line-height: 1.6;">
                  Use this code in the admin dashboard's Danger Zone to confirm clearing all data. Keep it private — anyone with this code can wipe the database.
                </p>
                <p style="color: #4E0030; opacity: 0.5; font-size: 12px; margin-top: 20px;">
                  If you didn't request this code, your admin secret may have been compromised. Change your ADMIN_SECRET env var on Vercel immediately.
                </p>
              </div>
            </div>
          `,
          tags: ["admin", "security", "clear-data-phrase"],
        });
      } catch (emailError) {
        console.error("Failed to email new phrase:", emailError);
        // Still succeed — the phrase is saved to DB, just the email failed
      }
    } else if (process.env.NODE_ENV !== "production") {
      console.log("📧 [DEV] New confirmation code not emailed — BREVO_API_KEY not set.");
      console.log(`   New code: ${newPhrase}`);
    }

    return NextResponse.json({
      success: true,
      message: "A new confirmation code has been generated and emailed to the admin address.",
    });
  } catch (error) {
    console.error("Regenerate phrase error:", error);
    return NextResponse.json(
      { error: "Failed to generate new code" },
      { status: 500 },
    );
  }
}
