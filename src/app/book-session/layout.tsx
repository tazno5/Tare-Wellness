import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = PAGE_METADATA["book-session"];

export default function book_sessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
