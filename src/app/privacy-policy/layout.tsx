import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = PAGE_METADATA["privacy-policy"];

export default function privacy_policyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
