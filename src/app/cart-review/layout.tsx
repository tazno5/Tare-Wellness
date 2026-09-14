import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = PAGE_METADATA["cart-review"];

export default function cart_reviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
