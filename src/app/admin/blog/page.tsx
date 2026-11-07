"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Lock, ArrowLeft,
  FileText, Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: "ARTICLE" | "NEWSLETTER";
  author: string;
  coverImage: string | null;
  publishedAt: string;
  isPublished: boolean;
  readTime: string | null;
  updatedAt: string;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return iso; }
}

export default function AdminBlogListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [secret, setSecret] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const token = () => localStorage.getItem("tare-admin-secret");

  const fetchPosts = useCallback(async () => {
    const t = token();
    if (!t) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/blog", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) {
        localStorage.removeItem("tare-admin-secret");
        setAuthed(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to load posts");
      const data = (await res.json()) as Post[];
      setPosts(data);
      setAuthed(true);
    } catch {
      toast({ title: "Couldn't load posts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const t = localStorage.getItem("tare-admin-secret");
    if (t) fetchPosts();
    else setLoading(false);
  }, [fetchPosts]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    try {
      const res = await fetch("/api/admin/blog", {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (res.status === 401) {
        toast({ title: "Invalid admin secret", variant: "destructive" });
        return;
      }
      if (!res.ok) {
        toast({ title: "Admin not configured", variant: "destructive" });
        return;
      }
      localStorage.setItem("tare-admin-secret", secret);
      setAuthed(true);
      const data = (await res.json()) as Post[];
      setPosts(data);
      toast({ title: "Admin access granted" });
    } catch {
      toast({ title: "Connection failed", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("tare-admin-secret");
    setAuthed(false);
    setPosts([]);
  };

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/blog/${slug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete");
      }
      setPosts((prev) => prev.filter((p) => p.slug !== slug));
      toast({ title: "Post deleted", description: `"${title}" was removed.` });
    } catch (err) {
      toast({
        title: "Couldn't delete",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  const togglePublish = async (post: Post) => {
    const next = !post.isPublished;
    try {
      const res = await fetch(`/api/blog/${post.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ isPublished: next }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setPosts((prev) =>
        prev.map((p) => (p.slug === post.slug ? { ...p, isPublished: next } : p)),
      );
      toast({
        title: next ? "Post published" : "Post unpublished",
        description: post.title,
      });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-blush px-5 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_8px_40px_rgba(78,0,48,0.08)] ring-1 ring-maroon/5"
        >
          <div className="mb-6 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-magenta/10 text-magenta">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="mt-4 font-serif text-2xl font-semibold text-maroon">
              Blog Admin
            </h1>
            <p className="mt-1 text-sm text-maroon/65">
              Enter your admin secret to manage blog posts.
            </p>
          </div>
          <form onSubmit={handleAuth} className="space-y-3">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Admin secret"
              autoFocus
              required
              className="h-12 w-full rounded-full border border-maroon/15 bg-white px-5 text-base text-maroon placeholder:text-maroon/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-magenta/40"
            />
            <button
              type="submit"
              disabled={checking || !secret}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-magenta px-6 text-sm font-semibold text-white shadow-[0_4px_18px_rgba(241,8,151,0.30)] transition-all hover:bg-magenta-600 disabled:opacity-60"
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {checking ? "Checking…" : "Unlock Admin"}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-maroon/45">
            The admin secret is set in your environment variables.
          </p>
          <div className="mt-4 text-center">
            <Link href="/blog" className="text-xs font-semibold text-maroon/65 hover:text-magenta">
              ← Back to public blog
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-blush pt-24">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-magenta" />
          <p className="mt-4 text-sm text-maroon/65">Loading posts…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-blush pt-24 pb-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-maroon/55 hover:text-magenta"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to admin dashboard
            </Link>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-maroon">
              Blog posts
            </h1>
            <p className="mt-1 text-sm text-maroon/65">
              {posts.length} total · {posts.filter((p) => p.isPublished).length} published ·{" "}
              {posts.filter((p) => !p.isPublished).length} drafts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-maroon shadow-sm ring-1 ring-maroon/10 hover:text-magenta"
            >
              Log out
            </button>
            <Link
              href="/admin/blog/new"
              className="inline-flex items-center gap-2 rounded-full bg-magenta px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_18px_rgba(241,8,151,0.30)] transition-all hover:scale-[1.02] hover:bg-magenta-600"
            >
              <Plus className="h-4 w-4" />
              New post
            </Link>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-maroon/5">
            <FileText className="mx-auto h-10 w-10 text-maroon/30" />
            <h2 className="mt-4 font-serif text-xl text-maroon">No posts yet</h2>
            <p className="mt-1 text-sm text-maroon/65">
              Click "New post" to write your first story.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li
                key={post.id}
                className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-maroon/5 sm:flex-row sm:items-center"
              >
                <div
                  className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:flex ${
                    post.category === "NEWSLETTER"
                      ? "bg-magenta/10 text-magenta"
                      : "bg-maroon/8 text-maroon"
                  }`}
                >
                  {post.category === "NEWSLETTER" ? (
                    <Mail className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-maroon/55">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-[0.1em] ${
                        post.category === "NEWSLETTER"
                          ? "bg-magenta/15 text-magenta"
                          : "bg-maroon/10 text-maroon"
                      }`}
                    >
                      {post.category === "NEWSLETTER" ? "Newsletter" : "Article"}
                    </span>
                    {!post.isPublished && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold uppercase tracking-[0.1em] text-amber-700">
                        Draft
                      </span>
                    )}
                    <span>{formatDate(post.publishedAt)}</span>
                    {post.readTime && (
                      <>
                        <span className="text-maroon/30">·</span>
                        <span>{post.readTime}</span>
                      </>
                    )}
                  </div>
                  <h3 className="mt-1.5 font-serif text-lg font-semibold text-maroon">
                    {post.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-maroon/70">
                    {post.excerpt}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => togglePublish(post)}
                    title={post.isPublished ? "Unpublish" : "Publish"}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                      post.isPublished
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {post.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <Link
                    href={`/admin/blog/${post.slug}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-maroon/8 text-maroon hover:bg-maroon/15"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(post.slug, post.title)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
