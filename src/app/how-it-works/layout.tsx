import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = PAGE_METADATA["how-it-works"];

export default function how_it_worksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
