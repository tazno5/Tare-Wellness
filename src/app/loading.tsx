export default function Loading() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-0 rounded-full bg-[#C7B2E2]/30 blur-2xl"
        />
        <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_8px_30px_rgba(78,0,48,0.10)]">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#F10897]/30 border-t-[#F10897]" />
        </div>
      </div>
      <p className="mt-5 font-sans text-sm font-medium text-[#4E0030]/70">
        Loading…
      </p>
    </main>
  );
}
