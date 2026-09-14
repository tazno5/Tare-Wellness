import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = PAGE_METADATA["recipient-details"];

export default function recipient_detailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
