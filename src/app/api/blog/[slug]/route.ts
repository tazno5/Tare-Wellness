import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/admin-auth";

// GET /api/blog/[slug] — fetch a single post by slug.
// Public: only returns published posts.
// Admin (with Bearer token): returns drafts too.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const post = await db.post.findUnique({ where: { slug } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (!post.isPublished) {
      const isAdmin =
        !!process.env.ADMIN_SECRET &&
        verifyAdminToken(req.headers.get("authorization"));
      if (!isAdmin) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 },
    );
  }
}

// ───────────────────────────────────────────────────────────────
// PUT /api/blog/[slug] — Update a post (admin only)
// ───────────────────────────────────────────────────────────────

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  excerpt: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  category: z.enum(["ARTICLE", "NEWSLETTER"]).optional(),
  author: z.string().max(100).optional(),
  coverImage: z.string().max(500).optional().nullable(),
  readTime: z.string().max(20).optional().nullable(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().optional(),
  newSlug: z.string().max(200).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
    }
    if (!verifyAdminToken(req.headers.get("authorization"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const existing = await db.post.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      );
    }
    const data = parsed.data;

    let finalSlug = slug;
    if (data.newSlug && data.newSlug !== slug) {
      const cleanSlug = data.newSlug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      if (!cleanSlug) {
        return NextResponse.json({ error: "Invalid new slug" }, { status: 400 });
      }
      const clash = await db.post.findUnique({ where: { slug: cleanSlug } });
      if (clash && clash.id !== existing.id) {
        return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
      }
      finalSlug = cleanSlug;
    }

    let readTime = data.readTime;
    if (data.content && readTime === undefined) {
      const words = data.content.trim().split(/\s+/).length;
      const minutes = Math.max(1, Math.round(words / 200));
      readTime = `${minutes} min read`;
    }

    const updated = await db.post.update({
      where: { slug },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(finalSlug !== slug && { slug: finalSlug }),
        ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.author !== undefined && { author: data.author }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(readTime !== undefined && { readTime: readTime }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
        ...(data.publishedAt !== undefined && {
          publishedAt: new Date(data.publishedAt),
        }),
      },
    });

    return NextResponse.json({ success: true, post: updated });
  } catch (error) {
    console.error("Blog update error:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

// ───────────────────────────────────────────────────────────────
// DELETE /api/blog/[slug] — Delete a post (admin only)
// ───────────────────────────────────────────────────────────────

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
    }
    if (!verifyAdminToken(req.headers.get("authorization"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const existing = await db.post.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await db.post.delete({ where: { slug } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blog delete error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
