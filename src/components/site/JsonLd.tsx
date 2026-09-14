// Client component that injects JSON-LD structured data into the page.
//
// Usage:
//   <JsonLd data={organizationLd} />
//   <JsonLd data={giftCardProductLd[0]} />
//
// Renders a <script type="application/ld+json"> tag in the body.
// Google reads this for rich snippets in search results.

export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
