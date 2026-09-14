import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = PAGE_METADATA["redeem"];

export default function redeemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
