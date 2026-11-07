import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/admin-auth";

// GET /api/blog — public endpoint: fetch all published posts, sorted by publishedAt desc.
// Optional query: ?category=ARTICLE | ?category=NEWSLETTER
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where: { isPublished: boolean; category?: string } = {
      isPublished: true,
    };
    if (category === "ARTICLE" || category === "NEWSLETTER") {
      where.category = category;
    }

    const posts = await db.post.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        author: true,
        coverImage: true,
        publishedAt: true,
        readTime: true,
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 },
    );
  }
}

// ───────────────────────────────────────────────────────────────
// POST /api/blog — Create a new blog post (admin only)
// Body: { title, excerpt, content, category, author?, coverImage?, readTime?, isPublished?, publishedAt? }
// ───────────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(1).max(300),
  excerpt: z.string().min(1).max(500),
  content: z.string().min(1),
  category: z.enum(["ARTICLE", "NEWSLETTER"]).default("ARTICLE"),
  author: z.string().max(100).optional().default("Tare Team"),
  coverImage: z.string().max(500).optional().nullable(),
  readTime: z.string().max(20).optional().nullable(),
  isPublished: z.boolean().optional().default(true),
  publishedAt: z.string().optional(), // ISO date string
});

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "untitled";
  let n = 2;
  while (await db.post.findUnique({ where: { slug } })) {
    slug = `${base}-${n}`;
    n += 1;
    if (n > 999) {
      slug = `${base}-${Date.now().toString(36)}`;
      break;
    }
  }
  return slug;
}

export async function POST(req: Request) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
    }
    if (!verifyAdminToken(req.headers.get("authorization"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const baseSlug = slugify(data.title);
    const slug = await uniqueSlug(baseSlug);

    let readTime = data.readTime;
    if (!readTime) {
      const words = data.content.trim().split(/\s+/).length;
      const minutes = Math.max(1, Math.round(words / 200));
      readTime = `${minutes} min read`;
    }

    const post = await db.post.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        author: data.author,
        coverImage: data.coverImage,
        readTime,
        isPublished: data.isPublished,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
      },
    });

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    console.error("Blog create error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
