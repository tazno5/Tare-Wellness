"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, redemption } = useStore();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", password: "" });

  if (typeof document !== "undefined") {
    document.body.style.setProperty("--page-gradient-from", "#FCE4EC");
    document.body.style.setProperty("--page-gradient-to", "#F10897");
  }
  useEffect(() => {
    document.body.style.setProperty("--page-gradient-from", "#FCE4EC");
    document.body.style.setProperty("--page-gradient-to", "#F10897");
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call (replace with real backend later)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    login({
      id: `user-${Date.now()}`,
      name: mode === "signup" ? form.name : form.email.split("@")[0],
      email: form.email,
    });

    toast({
      title: mode === "login" ? "Welcome back!" : "Account created!",
      description: mode === "login"
        ? `Signed in as ${form.email}`
        : `Welcome to Tare Wellness, ${form.name}!`,
    });

    setIsLoading(false);
    router.push("/");
  };

  return (
    <main className="relative flex flex-1 flex-col">
      <section className="relative w-full overflow-hidden px-5 pb-16 pt-6 sm:px-8 sm:pt-8 lg:px-12 lg:pt-10">
        <div aria-hidden className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-white/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 top-32 h-72 w-72 rounded-full bg-[#F10897]/20 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-md flex-col items-center">
          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-square w-full max-w-[200px] sm:max-w-[240px]"
          >
            <div aria-hidden className="absolute inset-4 rounded-full bg-white/30 blur-2xl" />
            <Image
              src="/logo.png"
              alt="BE WELL TARE logo"
              fill
              priority
              sizes="(max-width: 640px) 80vw, 240px"
              className="hero-shadow relative animate-float-slow object-contain"
            />
          </motion.div>

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 w-full rounded-3xl bg-white p-6 shadow-[0_15px_50px_rgba(61,0,46,0.15)] sm:p-8"
          >
            {/* Tab toggle */}
            <div className="flex rounded-full bg-blush/40 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-full py-2.5 font-sans text-sm font-semibold transition-all duration-200 ${
                  mode === "login" ? "bg-white text-[#4E0030] shadow-sm" : "text-[#4E0030]/50"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-full py-2.5 font-sans text-sm font-semibold transition-all duration-200 ${
                  mode === "signup" ? "bg-white text-[#4E0030] shadow-sm" : "text-[#4E0030]/50"
                }`}
              >
                Sign Up
              </button>
            </div>

            <h1 className="mt-6 font-fraunces text-2xl font-bold text-[#4E0030] sm:text-3xl">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="mt-1.5 font-sans text-sm text-[#4E0030]/60">
              {mode === "login"
                ? "Sign in to access your gift cards and bookings."
                : "Join Tare Wellness to send and receive care."}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div>
                  <label htmlFor="name" className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-[#4E0030]/70">
                    Full Name
                  </label>
                  <div className="relative mt-2">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4E0030]/30" strokeWidth={2.5} />
                    <input
                      id="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Sarah Johnson"
                      className="h-12 w-full rounded-2xl border border-maroon/15 bg-white pl-11 pr-4 font-sans text-sm text-[#4E0030] placeholder:text-[#4E0030]/35 focus:border-[#F10897] focus:outline-none focus:ring-2 focus:ring-[#F10897]/30"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-[#4E0030]/70">
                  Email Address
                </label>
                <div className="relative mt-2">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4E0030]/30" strokeWidth={2.5} />
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-2xl border border-maroon/15 bg-white pl-11 pr-4 font-sans text-sm text-[#4E0030] placeholder:text-[#4E0030]/35 focus:border-[#F10897] focus:outline-none focus:ring-2 focus:ring-[#F10897]/30"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-[#4E0030]/70">
                  Password
                </label>
                <div className="relative mt-2">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4E0030]/30" strokeWidth={2.5} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
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

              {mode === "login" && (
                <div className="flex justify-end">
                  <button type="button" className="font-sans text-xs font-medium text-[#F10897] transition-colors hover:text-[#d4006f]">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#4E0030] px-7 py-4 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(61,0,46,0.25)] transition-all duration-200 hover:scale-[1.01] hover:bg-[#3a0023] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  <>
                    {mode === "login" ? "Sign In" : "Create Account"}
                    <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            {/* Balance hint if redeemed */}
            {redemption.redeemed && mode === "login" && (
              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#FCE4EC] p-3">
                <Check className="h-4 w-4 text-[#F10897]" strokeWidth={3} />
                <p className="font-sans text-xs text-[#4E0030]/70">
                  Gift card balance: <span className="font-bold text-[#4E0030]">₦{redemption.creditBalance.toLocaleString()}</span> — sign in to apply it to your account.
                </p>
              </div>
            )}

            <p className="mt-6 text-center font-sans text-xs text-[#4E0030]/50">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="font-bold text-[#F10897] transition-colors hover:text-[#d4006f]"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </motion.div>

          <Link
            href="/"
            className="mt-6 font-sans text-sm font-medium text-[#4E0030]/60 transition-colors hover:text-[#4E0030]"
          >
            ← Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
