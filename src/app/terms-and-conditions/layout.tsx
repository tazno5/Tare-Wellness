import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = PAGE_METADATA["terms-and-conditions"];

export default function terms_and_conditionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
