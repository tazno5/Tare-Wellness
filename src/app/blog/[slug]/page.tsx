"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Calendar, Clock, Copy, Check, Link2 } from "lucide-react";
import NewsletterSubscribe from "@/components/blog/NewsletterSubscribe";
import { BlogPostCard, type BlogPostSummary } from "@/components/blog/BlogPostCard";

type FullPost = BlogPostSummary & {
  content: string;
  isPublished: boolean;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [post, setPost] = useState<FullPost | null>(null);
  const [related, setRelated] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPageUrl(window.location.href); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    fetch(`/api/blog/${encodeURIComponent(slug)}`)
      .then(async (r) => {
        if (r.status === 404) {
          if (!cancelled) setNotFound(true);
          return null;
        }
        if (!r.ok) throw new Error("Failed to load post");
        return (await r.json()) as FullPost;
      })
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setPost(data);
          fetch("/api/blog")
            .then((r) => r.json())
            .then((all: BlogPostSummary[]) => {
              if (cancelled) return;
              const others = all.filter((p) => p.slug !== data.slug).slice(0, 3);
              setRelated(others);
            })
            .catch(() => {});
        }
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
  }, [slug]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = pageUrl || window.location.href;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${post?.title || "Tare Wellness post"} — ${pageUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleShareX = () => {
    const text = encodeURIComponent(`${post?.title || "Tare Wellness post"} — ${pageUrl}`);
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center pt-28">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-magenta/30 border-t-magenta" />
          <p className="mt-4 text-sm text-maroon/65">Loading story…</p>
        </div>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 pt-28">
        <div className="max-w-md rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-maroon/5">
          <h1 className="font-serif text-3xl font-semibold text-maroon">
            We couldn't find that story.
          </h1>
          <p className="mt-3 text-sm text-maroon/70">
            It may have been moved or unpublished. Try the blog index, or come
            back later.
          </p>
          <Link
            href="/blog"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-magenta px-5 py-2.5 text-sm font-semibold text-white hover:bg-magenta-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </main>
    );
  }

  const isNewsletter = post.category === "NEWSLETTER";

  return (
    <main className="relative min-h-screen pb-24 pt-28 sm:pt-32">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-magenta/8 blur-3xl" />
        <div className="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-[#C7B2E2]/12 blur-3xl" />
      </div>

      <article className="mx-auto w-full max-w-3xl px-5 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-wrap items-center gap-3 text-sm text-maroon/65"
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-semibold text-maroon transition-colors hover:text-magenta"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
          <span className="text-maroon/30">·</span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
              isNewsletter
                ? "bg-magenta text-white"
                : "bg-white text-maroon ring-1 ring-maroon/15"
            }`}
          >
            {isNewsletter ? "Newsletter" : "Article"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(post.publishedAt)}
          </span>
          {post.readTime && (
            <span className="inline-flex items-center gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime}
            </span>
          )}
        </motion.div>

        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="font-serif text-4xl font-semibold leading-[1.1] text-maroon sm:text-5xl lg:text-[3.25rem]">
            {post.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-maroon/75">
            {post.excerpt}
          </p>
          <div className="mt-5 text-sm text-maroon/55">by {post.author}</div>
        </motion.header>

        {post.coverImage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="relative mb-10 aspect-[16/9] overflow-hidden rounded-3xl shadow-[0_8px_40px_rgba(78,0,48,0.10)] ring-1 ring-maroon/5"
          >
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              unoptimized
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="blog-markdown font-serif text-maroon"
        >
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="mt-10 mb-4 font-serif text-3xl font-semibold text-maroon sm:text-4xl" {...props} />,
              h2: ({ node, ...props }) => <h2 className="mt-8 mb-3 font-serif text-2xl font-semibold text-maroon sm:text-3xl" {...props} />,
              h3: ({ node, ...props }) => <h3 className="mt-6 mb-2 font-serif text-xl font-semibold text-maroon sm:text-2xl" {...props} />,
              p: ({ node, ...props }) => <p className="my-4 text-base leading-[1.75] text-maroon/85 sm:text-lg" {...props} />,
              ul: ({ node, ...props }) => <ul className="my-4 space-y-2 pl-6 text-base text-maroon/85 sm:text-lg [list-style-type:disc]" {...props} />,
              ol: ({ node, ...props }) => <ol className="my-4 space-y-2 pl-6 text-base text-maroon/85 sm:text-lg [list-style-type:decimal]" {...props} />,
              li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
              a: ({ node, ...props }) => <a className="font-medium text-magenta underline underline-offset-2 hover:text-magenta-600" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-semibold text-maroon" {...props} />,
              em: ({ node, ...props }) => <em className="italic text-maroon/90" {...props} />,
              blockquote: ({ node, ...props }) => <blockquote className="my-6 border-l-4 border-magenta/40 pl-5 font-serif text-lg italic text-maroon/85 sm:text-xl" {...props} />,
              hr: ({ node, ...props }) => <hr className="my-8 border-maroon/15" {...props} />,
              code: ({ node, ...props }) => <code className="rounded bg-maroon/8 px-1.5 py-0.5 text-sm font-mono text-maroon" {...props} />,
            }}
          >
            {post.content}
          </ReactMarkdown>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-12 border-t border-maroon/15 pt-8"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-sans text-xs font-bold uppercase tracking-[0.15em] text-maroon/55">
              Share
            </span>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-maroon shadow-sm ring-1 ring-maroon/10 transition-all hover:scale-[1.02] hover:text-magenta active:scale-[0.98]"
              aria-label="Copy link"
            >
              {copied ? <Check className="h-4 w-4 text-magenta" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-maroon shadow-sm ring-1 ring-maroon/10 transition-all hover:scale-[1.02] hover:text-magenta active:scale-[0.98]"
              aria-label="Share on WhatsApp"
            >
              <Link2 className="h-4 w-4" />
              WhatsApp
            </button>
            <button
              onClick={handleShareX}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-maroon shadow-sm ring-1 ring-maroon/10 transition-all hover:scale-[1.02] hover:text-magenta active:scale-[0.98]"
              aria-label="Share on X"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X
            </button>
          </div>
        </motion.div>

        <div className="mt-12">
          <div className="rounded-3xl bg-white p-6 shadow-[0_8px_40px_rgba(78,0,48,0.06)] ring-1 ring-maroon/5 sm:p-8">
            <h3 className="font-serif text-xl font-semibold text-maroon">
              Get the next Tare newsletter
            </h3>
            <p className="mt-1 text-sm text-maroon/70">
              One short email every few weeks. No spam. Unsubscribe anytime.
            </p>
            <div className="mt-5">
              <NewsletterSubscribe variant="compact" />
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-2xl font-semibold text-maroon">
              Keep reading
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <BlogPostCard key={p.id} post={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
