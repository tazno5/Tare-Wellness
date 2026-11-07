"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";

export type BlogPostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: "ARTICLE" | "NEWSLETTER";
  author: string;
  coverImage: string | null;
  publishedAt: string;
  readTime: string | null;
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// BlogPostCard — pink badge for Newsletters, neutral/maroon badge for Articles.
export function BlogPostCard({ post, index = 0 }: { post: BlogPostSummary; index?: number }) {
  const isNewsletter = post.category === "NEWSLETTER";
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_rgba(78,0,48,0.06)] ring-1 ring-maroon/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_50px_rgba(78,0,48,0.10)]"
    >
      <Link
        href={`/blog/${post.slug}`}
        className="relative block aspect-[16/10] overflow-hidden"
        aria-label={post.title}
      >
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 360px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#FCE7F3] via-[#FFF5EE] to-[#F5E8DC]" />
        )}
        <span
          className={`absolute left-4 top-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] shadow-sm ${
            isNewsletter
              ? "bg-magenta text-white"
              : "bg-white text-maroon ring-1 ring-maroon/15"
          }`}
        >
          {isNewsletter ? "Newsletter" : "Article"}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-3 text-xs text-maroon/65">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(post.publishedAt)}
          </span>
          {post.readTime && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime}
            </span>
          )}
        </div>

        <h3 className="font-serif text-lg font-semibold leading-snug text-maroon">
          <Link
            href={`/blog/${post.slug}`}
            className="after:absolute after:inset-0 hover:text-magenta"
          >
            {post.title}
          </Link>
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed text-maroon/75">
          {post.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-maroon/55">
          <span>by {post.author}</span>
          <Link
            href={`/blog/${post.slug}`}
            className="font-semibold text-magenta opacity-80 transition-opacity hover:opacity-100"
          >
            Read →
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
