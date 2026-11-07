import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// POST /api/admin/blog/upload — admin-only image upload for blog cover images.
// Receives multipart/form-data with a single `file` field (PNG, JPG, WebP, GIF).
// Saves to /public/blog-covers/<random>-<original-name>.<ext>
// Returns { url: "/blog-covers/<filename>" }

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const nameSchema = z.string().max(200);

export async function POST(req: Request) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
    }
    if (!verifyAdminToken(req.headers.get("authorization"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5 MB." },
        { status: 400 },
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Use PNG, JPG, WebP, or GIF.` },
        { status: 400 },
      );
    }

    const safeName = nameSchema.safeParse(file.name);
    if (!safeName.success) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, "");
    const random = crypto.randomBytes(8).toString("hex");
    const baseName = path.basename(file.name, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "cover";
    const filename = `${random}-${baseName}${ext}`;

    const dir = path.join(process.cwd(), "public", "blog-covers");
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buf);

    return NextResponse.json({
      success: true,
      url: `/blog-covers/${filename}`,
      filename,
      size: file.size,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
