import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = PAGE_METADATA["login"];

export default function loginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
