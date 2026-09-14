// Server-side Paystack helpers.
//
// This module wraps the Paystack HTTP API for server-side use only.
// It must NEVER be imported by client components — it accesses
// PAYSTACK_SECRET_KEY which is a server-only env var.
//
// Docs: https://paystack.com/docs/payments/verify-payments/
//
// Flow (Paystack Inline — popup):
//   1. Client opens the Paystack popup via PaystackPop.setup({ key, email, amount, ref, callback })
//   2. User enters card details in the popup. On success, callback receives { reference, status, transaction }
//   3. Client POSTs to /api/orders with { ..., paymentMethod: "card", paystackReference: reference }
//   4. Server calls verifyTransaction(reference) below — calls Paystack's /transaction/verify endpoint
//   5. If verification returns status=success + amount matches + currency matches → create the order
//   6. If verification fails → return 400, don't create the order
//
// Test cards (use with pk_test_... keys):
//   4084 0840 8408 4081  →  successful charge
//   5060 6666 6666 6666  →  successful charge (Verve)
//   4084 0840 8408 4080  →  PIN verification failure
//   Test cards accept any future expiry + any CVV.

const PAYSTACK_BASE = "https://api.paystack.co";

export type PaystackVerificationResult = {
  verified: boolean;
  error?: string;
  data?: {
    reference: string;
    amount: number; // in kobo (smallest NGN unit)
    currency: string;
    status: string; // "success" | "failed" | "pending" | "abandoned"
    channel: string; // "card" | "bank" | "ussd" etc.
    customerEmail: string;
    customerName?: string;
    paidAt?: string;
    fees?: number;
  };
};

/**
 * Verify a Paystack transaction by its reference.
 *
 * Calls Paystack's GET /transaction/verify/:reference endpoint with the
 * secret key. Returns whether the transaction was successful, the amount
 * paid (in kobo), the currency, and the customer email.
 *
 * If the secret key is missing (e.g. dev environments), this function
 * returns verified=true with a "demo mode" note — so the app still works
 * in dev without a real Paystack account. In production, the secret key
 * MUST be set, and any verification failure will block the order.
 */
export async function verifyTransaction(
  reference: string,
): Promise<PaystackVerificationResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  // Demo mode — no secret key configured. Allow the order to proceed
  // so the app is testable in dev without a real Paystack account.
  // In production, the secret key MUST be set.
  if (!secretKey || secretKey === "sk_test_placeholder") {
    if (process.env.NODE_ENV === "production") {
      return {
        verified: false,
        error:
          "PAYSTACK_SECRET_KEY is not configured. Cannot verify payment in production.",
      };
    }
    // Dev mode — let it through
    return {
      verified: true,
      data: {
        reference,
        amount: 0, // unknown in demo mode — caller should skip amount check
        currency: "NGN",
        status: "success",
        channel: "card",
        customerEmail: "demo@example.com",
      },
    };
  }

  if (!reference || reference.length < 3) {
    return { verified: false, error: "Missing transaction reference" };
  }

  try {
    const res = await fetch(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        // Paystack's verify endpoint is read-only — safe to cache for 60s
        next: { revalidate: 60 },
      },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        verified: false,
        error: `Paystack verification HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const json = await res.json();

    // Paystack response shape: { status: boolean, message: string, data: {...} }
    if (!json?.status || !json?.data) {
      return {
        verified: false,
        error: json?.message || "Paystack returned an unexpected response",
      };
    }

    const data = json.data;

    return {
      verified: data.status === "success",
      data: {
        reference: data.reference,
        amount: data.amount, // in kobo
        currency: data.currency,
        status: data.status,
        channel: data.channel,
        customerEmail: data.customer?.email ?? "",
        customerName: data.customer?.first_name
          ? `${data.customer.first_name} ${data.customer.last_name ?? ""}`.trim()
          : undefined,
        paidAt: data.paid_at,
        fees: data.fees,
      },
      error: data.status === "success" ? undefined : `Transaction status: ${data.status}`,
    };
  } catch (err) {
    return {
      verified: false,
      error:
        err instanceof Error
          ? `Network error verifying payment: ${err.message}`
          : "Unknown error verifying payment",
    };
  }
}

/**
 * Generate a unique Paystack transaction reference.
 *
 * Format: `TARE-<timestamp-base36>-<random-6-chars>`
 * e.g. `TARE-LK4F3P-AB12CD`
 *
 * Passed to PaystackPop.setup({ ref }) on the client, then sent back to
 * /api/orders for verification.
 */
export function generatePaystackReference(): string {
  // Server-side import of node:crypto
  const { randomBytes } = require("node:crypto");
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `TARE-${ts}-${rand}`;
}
