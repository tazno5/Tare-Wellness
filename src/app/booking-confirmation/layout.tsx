import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = PAGE_METADATA["booking-confirmation"];

export default function booking_confirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
