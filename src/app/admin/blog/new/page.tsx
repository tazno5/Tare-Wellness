"use client";

import { useEffect, useState } from "react";
import PostForm, { type PostFormData } from "@/components/blog/PostForm";
import { useRouter } from "next/navigation";

export default function NewPostPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("tare-admin-secret");
    if (!t) {
      router.replace("/admin/blog");
      return;
    }
    setReady(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, [router]);

  const initial: PostFormData = {
    title: "",
    excerpt: "",
    content: "",
    category: "ARTICLE",
    author: "Tare Team",
    coverImage: null,
    readTime: "",
    isPublished: true,
    publishedAt: new Date().toISOString().slice(0, 16),
    slug: undefined,
  };

  if (!ready) return null;

  return (
    <main className="min-h-screen bg-blush pt-24 pb-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <header className="mb-8">
          <h1 className="font-serif text-4xl font-semibold text-maroon">
            New post
          </h1>
          <p className="mt-1 text-sm text-maroon/65">
            Write a new article or newsletter for the Tare Wellness blog.
          </p>
        </header>
        <PostForm
          initial={initial}
          submitUrl="/api/blog"
          method="POST"
          submitLabel="Publish post"
          editMode={false}
        />
      </div>
    </main>
  );
}
