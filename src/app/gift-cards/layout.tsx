import type { Metadata } from "next";
import { PAGE_METADATA } from "@/lib/seo";
import { giftCardProductLd } from "@/lib/structured-data";

export const metadata: Metadata = PAGE_METADATA["gift-cards"];

export default function GiftCardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Product structured data — enables price rich snippets in Google */}
      {giftCardProductLd.map((product) => (
        <script
          key={product.name}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }}
        />
      ))}
      {children}
    </>
  );
}
