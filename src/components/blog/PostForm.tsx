"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Loader2, Upload, X, Eye } from "lucide-react";
import MarkdownEditor from "@/components/blog/MarkdownEditor";
import { useToast } from "@/hooks/use-toast";

// PostForm — shared between /admin/blog/new and /admin/blog/[slug]
export type PostFormData = {
  title: string;
  excerpt: string;
  content: string;
  category: "ARTICLE" | "NEWSLETTER";
  author: string;
  coverImage: string | null;
  readTime: string;
  isPublished: boolean;
  publishedAt: string;
  slug?: string;
};

export default function PostForm({
  initial,
  submitUrl,
  method,
  submitLabel,
  editMode = false,
}: {
  initial: PostFormData;
  submitUrl: string;
  method: "POST" | "PUT";
  submitLabel: string;
  editMode?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<PostFormData>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const token = () => localStorage.getItem("tare-admin-secret");

  const setField = <K extends keyof PostFormData>(key: K, val: PostFormData[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/blog/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setField("coverImage", data.url);
      toast({ title: "Image uploaded", description: data.url });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      toast({
        title: "Missing fields",
        description: "Title, excerpt, and content are required.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const publishedAtIso = form.publishedAt
        ? new Date(form.publishedAt).toISOString()
        : undefined;

      const payload: Record<string, unknown> = {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        category: form.category,
        author: form.author || "Tare Team",
        coverImage: form.coverImage,
        readTime: form.readTime || undefined,
        isPublished: asDraft ? false : form.isPublished,
        publishedAt: publishedAtIso,
      };
      if (editMode && form.slug) {
        payload.newSlug = form.slug;
      }

      const res = await fetch(submitUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");

      toast({
        title: asDraft ? "Draft saved" : "Post saved",
        description: form.title,
      });

      router.push("/admin/blog");
    } catch (err) {
      toast({
        title: "Couldn't save",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-maroon/70 hover:text-magenta"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all posts
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-maroon shadow-sm ring-1 ring-maroon/10 hover:text-magenta disabled:opacity-60"
          >
            Save as draft
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-magenta px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_18px_rgba(241,8,151,0.30)] transition-all hover:scale-[1.02] hover:bg-magenta-600 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {submitLabel}
          </button>
        </div>
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-maroon/5"
      >
        <label className="block text-xs font-bold uppercase tracking-[0.15em] text-maroon/55">
          Title
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
          placeholder="A headline that earns a click"
          maxLength={300}
          autoFocus={!editMode}
          className="mt-2 w-full rounded-xl border border-maroon/15 bg-white px-4 py-3 font-serif text-2xl font-semibold text-maroon placeholder:text-maroon/30 focus:outline-none focus:ring-2 focus:ring-magenta/40"
        />
        {editMode && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-maroon/55">
              Slug (URL)
            </label>
            <input
              type="text"
              value={form.slug || ""}
              onChange={(e) =>
                setField(
                  "slug",
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, ""),
                )
              }
              placeholder="my-post-slug"
              className="mt-1 w-full rounded-lg border border-maroon/15 bg-blush/30 px-3 py-2 font-mono text-sm text-maroon focus:outline-none focus:ring-2 focus:ring-magenta/40"
            />
            <p className="mt-1 text-xs text-maroon/45">
              Changing this will rename the post URL. Lowercase, no spaces.
            </p>
          </div>
        )}
      </motion.div>

      {/* Meta row: category, author, publishedAt */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-maroon/5">
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-maroon/55">
            Category
          </label>
          <div className="mt-3 inline-flex w-full rounded-full bg-blush/40 p-1">
            {(["ARTICLE", "NEWSLETTER"] as const).map((c) => {
              const active = form.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setField("category", c)}
                  className={`flex-1 rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
                    active
                      ? "bg-magenta text-white shadow-sm"
                      : "text-maroon/65 hover:text-maroon"
                  }`}
                >
                  {c === "NEWSLETTER" ? "Newsletter" : "Article"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-maroon/5">
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-maroon/55">
            Author
          </label>
          <input
            type="text"
            value={form.author}
            onChange={(e) => setField("author", e.target.value)}
            placeholder="Tare Team"
            maxLength={100}
            className="mt-2 w-full rounded-lg border border-maroon/15 bg-white px-3 py-2 text-sm text-maroon focus:outline-none focus:ring-2 focus:ring-magenta/40"
          />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-maroon/5">
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-maroon/55">
            Publish date
          </label>
          <input
            type="datetime-local"
            value={form.publishedAt}
            onChange={(e) => setField("publishedAt", e.target.value)}
            className="mt-2 w-full rounded-lg border border-maroon/15 bg-white px-3 py-2 text-sm text-maroon focus:outline-none focus:ring-2 focus:ring-magenta/40"
          />
        </div>
      </div>

      {/* Excerpt */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-maroon/5">
        <label className="block text-xs font-bold uppercase tracking-[0.15em] text-maroon/55">
          Excerpt
        </label>
        <textarea
          value={form.excerpt}
          onChange={(e) => setField("excerpt", e.target.value)}
          placeholder="A short summary shown in the post grid and at the top of the post."
          maxLength={500}
          rows={3}
          className="mt-2 w-full rounded-lg border border-maroon/15 bg-white px-3 py-2 text-sm leading-relaxed text-maroon focus:outline-none focus:ring-2 focus:ring-magenta/40"
        />
        <p className="mt-1 text-right text-xs text-maroon/45">
          {form.excerpt.length}/500
        </p>
      </div>

      {/* Cover image */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-maroon/5">
        <label className="block text-xs font-bold uppercase tracking-[0.15em] text-maroon/55">
          Cover image
        </label>
        <p className="mt-1 text-xs text-maroon/55">
          Optional. PNG, JPG, WebP, or GIF up to 5 MB.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative h-24 w-40 overflow-hidden rounded-xl bg-blush ring-1 ring-maroon/10">
            {form.coverImage ? (
              <>
                <img
                  src={form.coverImage}
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setField("coverImage", null)}
                  className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
                  aria-label="Remove cover image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-maroon/30">
                <Upload className="h-6 w-6" />
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            className="hidden"
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-full bg-maroon/8 px-4 py-2 text-sm font-semibold text-maroon hover:bg-maroon/15 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Uploading…" : "Upload image"}
            </button>
            <input
              type="text"
              value={form.coverImage || ""}
              onChange={(e) => setField("coverImage", e.target.value || null)}
              placeholder="…or paste an image URL (e.g. /hero-home.png)"
              className="rounded-lg border border-maroon/15 bg-white px-3 py-1.5 text-xs font-mono text-maroon focus:outline-none focus:ring-2 focus:ring-magenta/40"
            />
          </div>
        </div>
      </div>

      {/* Read time + publish toggle */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-maroon/5">
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-maroon/55">
            Read time
          </label>
          <input
            type="text"
            value={form.readTime}
            onChange={(e) => setField("readTime", e.target.value)}
            placeholder="Auto-estimated from content"
            maxLength={20}
            className="mt-2 w-full rounded-lg border border-maroon/15 bg-white px-3 py-2 text-sm text-maroon focus:outline-none focus:ring-2 focus:ring-magenta/40"
          />
          <p className="mt-1 text-xs text-maroon/45">
            Leave blank to auto-estimate from the content.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-maroon/5">
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-maroon/55">
            Published
          </label>
          <button
            type="button"
            onClick={() => setField("isPublished", !form.isPublished)}
            className={`mt-3 inline-flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
              form.isPublished ? "bg-magenta" : "bg-maroon/15"
            }`}
            aria-pressed={form.isPublished}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                form.isPublished ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <p className="mt-2 text-xs text-maroon/55">
            {form.isPublished
              ? "Visible on the public blog."
              : "Saved as draft — only admins can see it."}
          </p>
        </div>
      </div>

      {/* Content (markdown editor) */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-[0.15em] text-maroon/55">
          Content (markdown)
        </label>
        <p className="mt-1 text-xs text-maroon/55">
          Use ## for headings, **bold**, *italic*, &gt; for quotes, - for bullet lists.
        </p>
        <div className="mt-3">
          <MarkdownEditor
            value={form.content}
            onChange={(v) => setField("content", v)}
          />
        </div>
      </div>

      {/* Preview link to public post (edit mode only) */}
      {editMode && form.slug && form.isPublished && (
        <div className="rounded-2xl bg-blush/50 p-4 text-center">
          <Link
            href={`/blog/${form.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-magenta hover:underline"
          >
            <Eye className="h-4 w-4" />
            View this post on the public site →
          </Link>
        </div>
      )}
    </form>
  );
}
