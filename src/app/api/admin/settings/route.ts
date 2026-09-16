import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/admin-auth";

// GET /api/admin/settings — Fetch all site settings (admin only)
// PATCH /api/admin/settings — Update site settings (admin only)
//
// Currently manages:
//   - bankName (e.g. "GTBank")
//   - accountName (e.g. "Tare Wellness Enterprise Ltd")
//   - accountNumber (e.g. "0123456789")
//
// Uses a simple key-value store (SiteSetting model). Each setting is
// upserted (created if doesn't exist, updated if it does).

// Keys that the admin can manage
const ALLOWED_KEYS = ["bankName", "accountName", "accountNumber", "whatsappNumber", "therapistName", "counselorSchedule"];

export async function GET(req: Request) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
    }
    if (!verifyAdminToken(req.headers.get("authorization"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await db.siteSetting.findMany();
    // Convert to a simple key-value object
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
    }
    if (!verifyAdminToken(req.headers.get("authorization"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    // body should be { bankName: "...", accountName: "...", accountNumber: "..." }
    const updates: Record<string, string> = {};
    for (const key of ALLOWED_KEYS) {
      if (body[key] !== undefined && typeof body[key] === "string") {
        updates[key] = body[key].trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid settings to update" }, { status: 400 });
    }

    // Upsert each setting
    for (const [key, value] of Object.entries(updates)) {
      await db.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    return NextResponse.json({
      success: true,
      updated: Object.keys(updates),
      message: "Bank details updated successfully.",
    });
  } catch (error) {
    console.error("Admin settings PATCH error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
