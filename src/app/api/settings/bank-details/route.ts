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

export async function GET() {
  try {
    const settings = await db.siteSetting.findMany({
      where: {
        key: { in: ["bankName", "accountName", "accountNumber", "whatsappNumber", "therapistName"] },
      },
    });

    // Convert to a key-value object, falling back to defaults
    const result: Record<string, string> = { ...DEFAULTS };
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return NextResponse.json({
      bankName: result.bankName,
      accountName: result.accountName,
      accountNumber: result.accountNumber,
      whatsappNumber: result.whatsappNumber,
      therapistName: result.therapistName,
    });
  } catch (error) {
    console.error("Bank details fetch error:", error);
    // Return defaults on error so the page still renders
    return NextResponse.json(DEFAULTS);
  }
}
