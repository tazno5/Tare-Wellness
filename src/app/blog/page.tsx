"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ArrowRight, Loader2 } from "lucide-react";
import NewsletterSubscribe from "@/components/blog/NewsletterSubscribe";
import { BlogPostCard, type BlogPostSummary } from "@/components/blog/BlogPostCard";

type CategoryFilter = "ALL" | "ARTICLE" | "NEWSLETTER";

const TABS: { label: string; value: CategoryFilter }[] = [
  { label: "All Posts", value: "ALL" },
  { label: "Articles", value: "ARTICLE" },
  { label: "Newsletters", value: "NEWSLETTER" },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<CategoryFilter>("ALL");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("category");
    if (q === "ARTICLE" || q === "NEWSLETTER") setTab(q); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    fetch("/api/blog")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load posts");
        return (await r.json()) as BlogPostSummary[];
      })
      .then((data) => {
        if (cancelled) return;
        setPosts(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load posts");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (tab === "ALL") return posts;
    return posts.filter((p) => p.category === tab);
  }, [posts, tab]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <main className="relative min-h-screen pb-24 pt-28 sm:pt-32">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-magenta/8 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[#C7B2E2]/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#B5E1C3]/15 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <header className="mb-10 text-center sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-magenta/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-magenta"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-magenta" />
            Tare Journal
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 font-serif text-4xl font-semibold leading-[1.1] text-maroon sm:text-5xl lg:text-6xl"
          >
            Insights, Care & Stories
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-maroon/75 sm:text-lg"
          >
            Slow reads on rest, wellness, and the people who make Tare possible.
            Plus our monthly newsletters — short, honest, and never spammy.
          </motion.p>
        </header>

        <div className="mb-10 flex justify-center sm:mb-14">
          <div
            role="tablist"
            aria-label="Filter posts by category"
            className="inline-flex items-center gap-1 rounded-full bg-white p-1.5 shadow-[0_4px_20px_rgba(78,0,48,0.05)] ring-1 ring-maroon/5"
          >
            {TABS.map((t) => {
              const active = tab === t.value;
              return (
                <button
                  key={t.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.value)}
                  className={`relative inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-magenta text-white shadow-sm"
                      : "text-maroon/70 hover:text-maroon"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-maroon/60">
            <Loader2 className="h-8 w-8 animate-spin text-magenta" />
            <p className="mt-4 text-sm">Loading stories…</p>
          </div>
        )}

        {error && !loading && (
          <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-maroon/5">
            <p className="text-sm text-maroon/70">
              We couldn't load the posts right now. Please refresh the page, or
              try again in a moment.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-magenta px-5 py-2.5 text-sm font-semibold text-white hover:bg-magenta-600"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="mx-auto max-w-md rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-maroon/5">
            <p className="font-serif text-xl text-maroon">No posts in this category yet.</p>
            <p className="mt-2 text-sm text-maroon/65">
              Try another tab, or come back soon — we publish new stories every week.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {featured && (
                <motion.section
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55 }}
                  className="group relative mb-12 grid overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_rgba(78,0,48,0.08)] ring-1 ring-maroon/5 sm:mb-16 lg:grid-cols-[1.05fr_1fr]"
                >
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="relative aspect-[16/10] overflow-hidden lg:aspect-auto"
                    aria-label={featured.title}
                  >
                    {featured.coverImage ? (
                      <Image
                        src={featured.coverImage}
                        alt={featured.title}
                        fill
                        unoptimized
                        priority
                        sizes="(max-width: 1024px) 100vw, 55vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FCE7F3] via-[#FFF5EE] to-[#F5E8DC]" />
                    )}
                    <span
                      className={`absolute left-5 top-5 inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] shadow-sm ${
                        featured.category === "NEWSLETTER"
                          ? "bg-magenta text-white"
                          : "bg-white text-maroon ring-1 ring-maroon/15"
                      }`}
                    >
                      {featured.category === "NEWSLETTER" ? "Newsletter" : "Article"}
                    </span>
                  </Link>

                  <div className="flex flex-col justify-center gap-4 p-8 sm:p-10 lg:p-12">
                    <div className="flex items-center gap-4 text-xs text-maroon/65">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(featured.publishedAt)}
                      </span>
                      {featured.readTime && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {featured.readTime}
                        </span>
                      )}
                    </div>
                    <h2 className="font-serif text-3xl font-semibold leading-tight text-maroon sm:text-4xl">
                      <Link href={`/blog/${featured.slug}`} className="hover:text-magenta">
                        {featured.title}
                      </Link>
                    </h2>
                    <p className="text-base leading-relaxed text-maroon/75">
                      {featured.excerpt}
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <Link
                        href={`/blog/${featured.slug}`}
                        className="group inline-flex items-center gap-2 rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(241,8,151,0.30)] transition-all hover:scale-[1.02] hover:bg-magenta-600 active:scale-[0.98]"
                      >
                        Read Story
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                      <span className="text-xs text-maroon/55">by {featured.author}</span>
                    </div>
                  </div>
                </motion.section>
              )}

              {rest.length > 0 && (
                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                  {rest.map((post, i) => (
                    <BlogPostCard key={post.id} post={post} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        <div className="mt-16 sm:mt-20">
          <NewsletterSubscribe />
        </div>
      </div>
    </main>
  );
}
