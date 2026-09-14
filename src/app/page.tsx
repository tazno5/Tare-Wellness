import Hero from "@/components/site/Hero";
import JsonLd from "@/components/site/JsonLd";
import { organizationLd, giftCardProductLd } from "@/lib/structured-data";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col">
      {/* Structured data for Google rich snippets */}
      <JsonLd data={organizationLd} />
      {/* Each gift card type as a Product — enables price rich snippets */}
      {giftCardProductLd.map((product) => (
        <JsonLd key={product.name} data={product} />
      ))}

      {/* Subtle grain / vignette overlay so the gradient feels alive, not flat */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(78, 0, 48, 0.5) 0, transparent 50%)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col">
        <Hero />
      </div>
    </main>
  );
}
