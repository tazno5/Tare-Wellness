import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = PAGE_METADATA["contact-us"];

export default function contact_usLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
