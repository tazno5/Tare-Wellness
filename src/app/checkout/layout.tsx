import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = PAGE_METADATA["checkout"];

export default function checkoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
