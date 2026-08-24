import { NextResponse } from "next/server";

// Admin authentication utility — uses ADMIN_SECRET env var.
// The admin enters this secret on the /admin page, and it's stored
// in localStorage + sent as a Bearer token on every admin API request.

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export function checkAdminAuth(): NextResponse | null {
  if (!ADMIN_SECRET) {
    return NextResponse.json(
      { error: "Admin access is not configured. Set ADMIN_SECRET env var." },
      { status: 503 },
    );
  }
  return null; // No error — the actual token check happens in verifyAdminToken
}

export function verifyAdminToken(authHeader: string | null): boolean {
  if (!ADMIN_SECRET || !authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  return token === ADMIN_SECRET;
}
