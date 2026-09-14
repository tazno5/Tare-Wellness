import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = PAGE_METADATA["admin"];

export default function adminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
