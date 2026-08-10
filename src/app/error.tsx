"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#C7B2E2]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-[#E8B6D5]/20 blur-3xl"
      />

      <div className="relative mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_8px_30px_rgba(78,0,48,0.10)]">
        <span className="font-fraunces text-2xl font-bold text-[#F10897]">!</span>
      </div>

      <h2 className="mt-6 font-fraunces text-3xl font-extrabold text-[#4E0030] sm:text-4xl">
        Something went wrong
      </h2>

      <p className="mt-3 max-w-md font-sans text-sm leading-relaxed text-[#4E0030]/70 sm:text-base">
        An unexpected error occurred. Don&apos;t worry — your data is safe. Try
        again, or head back to the homepage.
      </p>

      {error.digest && (
        <p className="mt-2 font-mono text-[11px] text-[#4E0030]/40">
          Error ID: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#F10897] px-7 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(78,0,48,0.25)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#d4007d] active:scale-95"
        >
          <RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-180" strokeWidth={2.5} />
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white border-[0.3px] border-[#F10897] px-7 py-3.5 font-sans text-sm font-semibold text-[#F10897] shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#E8B6D5]/15 active:scale-95"
        >
          <Home className="h-4 w-4" strokeWidth={2.5} />
          Go Home
        </Link>
      </div>
    </main>
  );
}
