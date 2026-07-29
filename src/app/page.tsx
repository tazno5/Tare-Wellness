import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import Footer from "@/components/site/Footer";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col bg-magenta">
      {/* Subtle grain / vignette overlay so the magenta feels alive, not flat */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(61,0,46,0.5) 0, transparent 50%)",
        }}
      />

      <Navbar />

      <div className="relative z-10 flex flex-1 flex-col">
        <Hero />
      </div>

      <Footer />
    </main>
  );
}
