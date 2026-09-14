import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = PAGE_METADATA["account"];

export default function accountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
