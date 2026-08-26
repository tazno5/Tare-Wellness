"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, redemption } = useStore();
  // Read callbackUrl from query — fall back to home. Validate it's a relative
  // path to avoid open-redirect issues.
  const rawCallback = searchParams.get("callbackUrl") || "/";
  const callbackUrl = rawCallback.startsWith("/");
  if (!rawCallback.startsWith("/")) {
    console.warn("Invalid callbackUrl, ignoring:", rawCallback);
  }
  const safeCallbackUrl = callbackUrl ? rawCallback : "/";
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", password: "" });

  if (typeof document !== "undefined") {
    document.body.style.setProperty("--page-gradient-from", "#FFF5EE");
    document.body.style.setProperty("--page-gradient-to", "#FFF5EE");
  }
  useEffect(() => {
    document.body.style.setProperty("--page-gradient-from", "#FFF5EE");
    document.body.style.setProperty("--page-gradient-to", "#FFF5EE");
  }, []);

  // Redirect if already logged in — respect callbackUrl
  useEffect(() => {
    if (user) router.replace(safeCallbackUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signup") {
        // Call register API to create the user, then sign in via NextAuth
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create account");

        // Sign in via NextAuth so the session cookie is set
        const result = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
          callbackUrl: safeCallbackUrl,
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        // Sync to Zustand store
        login({ id: data.id, name: data.name, email: data.email });
        toast({ title: "Account created!", description: `Welcome to Tare Wellness, ${form.name}!` });
      } else {
        // NextAuth credentials sign-in — sets the JWT session cookie
        const result = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
          callbackUrl: safeCallbackUrl,
        });

        if (result?.error) {
          throw new Error("Invalid email or password");
        }

        // Fetch the session to sync user info into Zustand
        try {
          const userRes = await fetch("/api/auth/me", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            if (userData?.user) {
              login({
                id: userData.user.id,
                name: userData.user.name ?? form.email.split("@")[0],
                email: userData.user.email ?? form.email,
              });
            } else {
              // Session not set but signIn didn't error — fall back to form data
              login({ id: `user-${Date.now()}`, name: form.email.split("@")[0], email: form.email });
            }
          } else {
            login({ id: `user-${Date.now()}`, name: form.email.split("@")[0], email: form.email });
          }
        } catch {
          login({ id: `user-${Date.now()}`, name: form.email.split("@")[0], email: form.email });
        }

        toast({ title: "Welcome back!", description: `Signed in as ${form.email}` });
      }

      router.push(safeCallbackUrl);
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex flex-1 flex-col">
      <section className="relative w-full overflow-hidden px-5 pb-16 pt-6 sm:px-8 sm:pt-8 lg:px-12 lg:pt-10">
        <div aria-hidden className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#B5E1C3]/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 top-32 h-72 w-72 rounded-full bg-[#E8B6D5]/20 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-md flex-col items-center">
          {/* Hero image — floats bare, no card wrapper */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto aspect-square w-full max-w-[180px] sm:max-w-[200px]"
          >
            <Image
              src="/hero-login.png"
              alt="Man wearing black t-shirt holding TARE Be Well gift card"
              fill
              priority
              sizes="(max-width: 640px) 80vw, 200px"
              className="relative animate-float-slow object-contain transition-all duration-500 ease-out hover:scale-[1.02] hover:drop-shadow-[0_0_30px_rgba(219,39,119,0.35)]"
            />
          </motion.div>

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 w-full rounded-3xl bg-white p-6 shadow-[0_15px_50px_rgba(78, 0, 48, 0.15)] sm:p-8"
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

            <h1 className="mt-6 font-fraunces text-2xl font-bold bg-gradient-to-r from-[#2750D8] to-[#90AAFF] bg-clip-text text-transparent sm:text-3xl">
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F10897] px-7 py-4 font-sans text-sm font-semibold text-white shadow-[0_10px_30px_rgba(78, 0, 48, 0.25)] transition-all duration-200 hover:scale-[1.01] hover:bg-[#d4007d] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
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
              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#FFF5EE] p-3">
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
