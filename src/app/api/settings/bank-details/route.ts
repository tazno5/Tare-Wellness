import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/settings/bank-details — Fetch bank details for the checkout page
//
// Public endpoint (no auth required) — returns the bank details that
// the admin has configured via /api/admin/settings. If no settings are
// configured yet, returns default placeholder values so the checkout
// page always has something to display.
//
// Used by:
//   - /checkout page (BankTransferBlock component)
//   - /order-confirmation page (BankTransferInstructions component)

const DEFAULTS = {
  bankName: "Tare Bank",
  accountName: "Tare Wellness Enterprise Ltd",
  accountNumber: "0000000000",
  whatsappNumber: "2349036530892",
  therapistName: "Your Provider",
};

const DEFAULT_SCHEDULE = {
  monday: ["3:00 PM", "4:00 PM"],
  tuesday: ["1:00 PM", "2:00 PM"],
  wednesday: ["3:00 PM", "4:00 PM"],
  thursday: ["1:00 PM", "2:00 PM"],
  friday: ["3:00 PM", "4:00 PM"],
  saturday: ["5:00 PM"],
  sunday: [] as string[],
};

export async function GET() {
  try {
    // Wrap SiteSetting query in try-catch — if the Prisma client on
    // Vercel doesn't have the SiteSetting model (not regenerated after
    // db push), fall back to defaults so the page still renders.
    let settings: { key: string; value: string }[] = [];
    try {
      settings = await db.siteSetting.findMany({
        where: {
          key: { in: ["bankName", "accountName", "accountNumber", "whatsappNumber", "therapistName", "counselorSchedule"] },
        },
      });
    } catch {
      // Use defaults
    }

    const result: Record<string, string> = { ...DEFAULTS };
    let counselorSchedule = DEFAULT_SCHEDULE;
    for (const s of settings) {
      if (s.key === "counselorSchedule") {
        try {
          counselorSchedule = JSON.parse(s.value);
        } catch {
          // Keep default if JSON is invalid
        }
      } else {
        result[s.key] = s.value;
      }
    }

    return NextResponse.json({
      bankName: result.bankName,
      accountName: result.accountName,
      accountNumber: result.accountNumber,
      whatsappNumber: result.whatsappNumber,
      therapistName: result.therapistName,
      counselorSchedule,
    });
  } catch (error) {
    console.error("Bank details fetch error:", error);
    // Return defaults on error so the page still renders
    return NextResponse.json(DEFAULTS);
  }
}
