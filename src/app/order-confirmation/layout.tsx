import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = PAGE_METADATA["order-confirmation"];

export default function order_confirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
