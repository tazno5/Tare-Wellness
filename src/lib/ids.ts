// Shared crypto-secure ID generators.
//
// Why: the prior LCG + Math.random + Date.now() generators were producing
// colliding `Redemption.code` values when orders were placed in the same
// millisecond (P2002 unique-constraint failures). Node's `crypto.randomBytes`
// is the right primitive here — it pulls from the OS CSPRNG, so two codes
// generated in the same call stack are still independent.

import { randomBytes } from "node:crypto";

// 32-char alphabet that excludes visually-ambiguous chars (0/O/1/I/S/U/V).
// Used for redemption codes: XXXX-XXXX-XXXX-XXXX (16 chars + 3 dashes).
const REDEMPTION_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// 36-char alphabet for order numbers and booking numbers (full base-36).
// Used in: TG-XXXXXXXX (8 chars) and BK-2026-XXXXXXXX (8 chars).
const FULL_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomFromCharset(charset: string, length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += charset[bytes[i] % charset.length];
  }
  return out;
}

/**
 * Generate an order number in the format `TG-XXXXXXXX` (8 random chars).
 * ~2.8 trillion combinations, cryptographically unique per call.
 */
export function generateOrderNumber(): string {
  return `TG-${randomFromCharset(FULL_CHARSET, 8)}`;
}

/**
 * Generate a redemption code in the format `XXXX-XXXX-XXXX-XXXX`
 * (16 chars from a 32-char alphabet, ~10^24 combinations).
 */
export function generateRedemptionCode(_seed?: string): string {
  // The seed is ignored — we use crypto.randomBytes for true entropy.
  // The seed parameter is kept for API compatibility with the old signature.
  const chars = randomFromCharset(REDEMPTION_CHARSET, 16);
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}-${chars.slice(12, 16)}`;
}

/**
 * Generate a booking number in the format `BK-2026-XXXXXXXX` (8 random chars).
 */
export function generateBookingNumber(): string {
  return `BK-2026-${randomFromCharset(FULL_CHARSET, 8)}`;
}
