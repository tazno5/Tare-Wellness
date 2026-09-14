"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.setProperty("--page-gradient-from", "#FFF5EE");
    document.body.style.setProperty("--page-gradient-to", "#FFF5EE");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing reset token. Please use the link from your email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
        toast({
          title: "Password reset!",
          description: "You can now sign in with your new password.",
        });
        // Redirect to login after 3 seconds
        setTimeout(() => router.push("/login"), 3000);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to reset password. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex flex-1 flex-col">
      <section className="relative flex min-h-[calc(100vh-112px)] w-full items-center justify-center overflow-hidden px-5 py-10 sm:px-8 lg:px-12">
        <div aria-hidden className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#B5E1C3]/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-[#E8B6D5]/20 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md"
        >
          {/* Hero image — centered above the card */}
          <div className="mb-6 flex justify-center">
            <div className="relative aspect-square w-full max-w-[140px] sm:max-w-[180px]">
              <Image
                src="/hero-login.png"
                alt="Man wearing black t-shirt holding TARE Be Well gift card"
                fill
                priority
                sizes="(max-width: 640px) 140px, 180px"
                className="relative animate-float-slow object-contain transition-all duration-500 ease-out hover:scale-[1.02] hover:drop-shadow-[0_0_30px_rgba(219,39,119,0.35)]"
              />
            </div>
          </div>

          {/* Reset card */}
          <div className="overflow-hidden rounded-3xl bg-white p-6 shadow-[0_15px_50px_rgba(78, 0, 48, 0.15)] sm:p-8">
            {success ? (
              // Success state
              <div className="py-6 text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#B5E1C3]/40">
                  <CheckCircle2 className="h-7 w-7 text-[#2d6e4f]" strokeWidth={2.5} />
                </div>
                <h1 className="mt-4 font-fraunces text-2xl font-bold text-[#4E0030]">
                  Password reset!
                </h1>
                <p className="mt-2 font-sans text-sm text-[#4E0030]/70">
                  You can now sign in with your new password. Redirecting to login…
                </p>
                <Link
                  href="/login"
                  className="mt-5 inline-flex items-center gap-1.5 font-sans text-sm font-bold text-[#F10897] hover:underline"
                >
                  Go to sign in
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </Link>
              </div>
            ) : !token ? (
              // No token state
              <div className="py-6 text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                  <AlertCircle className="h-7 w-7 text-red-500" strokeWidth={2.5} />
                </div>
                <h1 className="mt-4 font-fraunces text-2xl font-bold text-[#4E0030]">
                  Invalid link
                </h1>
                <p className="mt-2 font-sans text-sm text-[#4E0030]/70">
                  This password reset link is missing a token. Please use the link from your email.
                </p>
                <Link
                  href="/login"
                  className="mt-5 inline-flex items-center gap-1.5 font-sans text-sm font-bold text-[#F10897] hover:underline"
                >
                  ← Back to login
                </Link>
              </div>
            ) : (
              // Form state
              <>
                <h1 className="text-center font-fraunces text-2xl font-bold bg-gradient-to-r from-[#2750D8] to-[#90AAFF] bg-clip-text text-transparent sm:text-3xl">
                  Reset Password
                </h1>
                <p className="mt-1.5 text-center font-sans text-sm text-[#4E0030]/60">
                  Choose a new password for your Tare account.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="password" className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-[#4E0030]/70">
                      New Password
                    </label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4E0030]/30" strokeWidth={2.5} />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 w-full rounded-2xl border border-maroon/15 bg-white pl-11 pr-11 font-sans text-sm text-[#4E0030] placeholder:text-[#4E0030]/35 focus:border-[#F10897] focus:outline-none focus:ring-2 focus:ring-[#F10897]/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4E0030]/30 transition-colors hover:text-[#4E0030]/60"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2.5} /> : <Eye className="h-4 w-4" strokeWidth={2.5} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-[#4E0030]/70">
                      Confirm Password
                    </label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4E0030]/30" strokeWidth={2.5} />
                      <input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 w-full rounded-2xl border border-maroon/15 bg-white pl-11 pr-4 font-sans text-sm text-[#4E0030] placeholder:text-[#4E0030]/35 focus:border-[#F10897] focus:outline-none focus:ring-2 focus:ring-[#F10897]/30"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-3">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-500" strokeWidth={2.5} />
                      <p className="font-sans text-xs text-red-600">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F10897] px-7 py-4 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(78, 0, 48, 0.25)] transition-all duration-200 hover:scale-[1.01] hover:bg-[#d4007d] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
                        Resetting...
                      </>
                    ) : (
                      <>
                        Reset Password
                        <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-5 text-center font-sans text-xs text-[#4E0030]/50">
                  <Link href="/login" className="font-bold text-[#F10897] hover:underline">
                    ← Back to login
                  </Link>
                </p>
              </>
            )}
          </div>
        </motion.div>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center px-5 py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#F10897]" strokeWidth={2.5} />
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
