import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";
import { faqPageLd } from "@/lib/structured-data";

export const metadata: Metadata = PAGE_METADATA["faq"];

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* FAQ structured data — enables FAQ rich snippets in Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageLd) }}
      />
      {children}
    </>
  );
}
