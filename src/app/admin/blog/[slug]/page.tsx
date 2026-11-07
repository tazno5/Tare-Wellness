"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import PostForm, { type PostFormData } from "@/components/blog/PostForm";

export default function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostFormData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("tare-admin-secret");
    if (!t) {
      router.replace("/admin/blog");
      return;
    }
    let cancelled = false;
    fetch(`/api/blog/${slug}`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then(async (r) => {
        if (r.status === 404) {
          if (!cancelled) setNotFound(true);
          return null;
        }
        if (!r.ok) throw new Error("Failed to load post");
        return await r.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        const dt = data.publishedAt ? new Date(data.publishedAt) : new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const localDt = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
        setPost({
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          category: data.category,
          author: data.author,
          coverImage: data.coverImage,
          readTime: data.readTime || "",
          isPublished: data.isPublished,
          publishedAt: localDt,
          slug: data.slug,
        });
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-blush pt-24">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-magenta" />
          <p className="mt-4 text-sm text-maroon/65">Loading post…</p>
        </div>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-blush px-5 pt-24">
        <div className="max-w-md rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-maroon/5">
          <h1 className="font-serif text-2xl font-semibold text-maroon">
            We couldn't find that post.
          </h1>
          <p className="mt-3 text-sm text-maroon/70">
            It may have been deleted or moved.
          </p>
          <Link
            href="/admin/blog"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-magenta px-5 py-2.5 text-sm font-semibold text-white hover:bg-magenta-600"
          >
            Back to admin blog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-blush pt-24 pb-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <header className="mb-8">
          <h1 className="font-serif text-4xl font-semibold text-maroon">
            Edit post
          </h1>
          <p className="mt-1 text-sm text-maroon/65">
            Editing &ldquo;{post.title}&rdquo;
          </p>
        </header>
        <PostForm
          initial={post}
          submitUrl={`/api/blog/${slug}`}
          method="PUT"
          submitLabel="Save changes"
          editMode
        />
      </div>
    </main>
  );
}
