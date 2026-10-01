"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Sparkles, Shield, ArrowUpRight } from "lucide-react";

import { loginUser, registerUser, loginWithGoogle } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  // Mode: "login" or "register"
  const [mode, setMode] = useState<"login" | "register">("login");

  // Track active flip direction independently
  const [flippingDirection, setFlippingDirection] = useState<"toRegister" | "toLogin" | null>(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function handleFlipTo(targetMode: "login" | "register") {
    if (flippingDirection || mode === targetMode) return;
    setError("");

    const direction = targetMode === "register" ? "toRegister" : "toLogin";
    setFlippingDirection(direction);

    // Swap content exactly at 90-degree perpendicular point (~375ms)
    setTimeout(() => {
      setMode(targetMode);
      window.history.replaceState(null, "", `/${targetMode}`);
    }, 375);

    // Complete the full 180-degree turn
    setTimeout(() => {
      setFlippingDirection(null);
    }, 750);
  }

  // Handle Form Submissions
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "register") {
      if (password.length < 6) {
        setError("Password must contain at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      setLoading(true);
      try {
        await registerUser(email.trim(), password);
        router.replace("/setup");
      } catch (err: any) {
        if (err?.code === "auth/email-already-in-use") {
          setError("An account already exists with this email.");
        } else if (err?.code === "auth/invalid-email") {
          setError("Please enter a valid email address.");
        } else {
          setError("Unable to create account. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        await loginUser(email.trim(), password);
        router.replace("/dashboard");
      } catch (err: any) {
        if (err?.code === "auth/invalid-credential") {
          setError("The email or password is incorrect.");
        } else {
          setError("Unable to sign in. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }
  }

  // Google OAuth
  async function handleGoogleAuth() {
    setError("");
    setGoogleLoading(true);

    try {
      await loginWithGoogle();
      router.replace(mode === "register" ? "/setup" : "/dashboard");
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError("Google authentication could not be completed.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  const isRegister = mode === "register";
  const isAnimating = flippingDirection !== null;

  return (
    <main className="min-h-screen w-full bg-[#f7f6f2] px-4 py-6 sm:px-6 sm:py-8 md:h-screen md:overflow-hidden md:py-6 flex items-center justify-center">
      {/* Outer Book Container: 
          - Mobile/Tablet: Vertical orientation with perspective 
          - Laptop/Desktop: Exact original horizontal book dimensions (h-[610px], max-w-4xl) */}
      <div className="relative w-full max-w-md md:max-w-4xl min-h-[640px] md:h-[610px] overflow-hidden rounded-[32px] border border-[#e7e5df] bg-white shadow-[0_25px_70px_rgba(0,0,0,0.08)] [perspective:2600px]">
        
        {/* ================= BACKGROUND SPREAD ================= */}
        <div className="flex flex-col md:grid h-full w-full md:grid-cols-2">
          
          {/* PANEL 1: 
              - Desktop Left / Mobile Top 
              - Green Cover on Login / Register Form on Register */}
          <div
            className={`p-6 sm:p-8 lg:p-10 flex flex-col justify-between transition-colors duration-500 ${
              isRegister
                ? "bg-[#fafaf8] text-neutral-800"
                : "bg-[#173d32] text-white border-b md:border-b-0 md:border-r border-[#123027]"
            }`}
          >
            {isRegister ? (
              <div className="h-full flex flex-col justify-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#1f5c4a]">
                    Start your journey
                  </p>
                  <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-neutral-900">
                    Create account
                  </h1>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={googleLoading || loading || isAnimating}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#deddd7] bg-white px-4 py-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50 active:scale-[0.99] disabled:opacity-60"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    <span>{googleLoading ? "Connecting..." : "Sign up with Google"}</span>
                  </button>
                </div>

                <div className="relative my-2.5 flex items-center justify-center">
                  <div className="w-full border-t border-[#e7e5df]" />
                  <span className="absolute bg-[#fafaf8] px-2.5 text-[10px] uppercase tracking-wider text-[#999990]">
                    or with email
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-700">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-[#deddd7] bg-white px-3.5 py-1.5 text-xs outline-none transition focus:border-[#1f5c4a] focus:ring-2 focus:ring-[#1f5c4a]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-700">Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        className="w-full rounded-xl border border-[#deddd7] bg-white px-3.5 py-1.5 pr-10 text-xs outline-none transition focus:border-[#1f5c4a] focus:ring-2 focus:ring-[#1f5c4a]/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-neutral-400 hover:text-neutral-700"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-700">Confirm Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="Repeat password"
                        className="w-full rounded-xl border border-[#deddd7] bg-white px-3.5 py-1.5 pr-10 text-xs outline-none transition focus:border-[#1f5c4a] focus:ring-2 focus:ring-[#1f5c4a]/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 text-neutral-400 hover:text-neutral-700"
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</div>
                  )}

                  <button
                    disabled={loading || googleLoading || isAnimating}
                    className="mt-1 w-full rounded-xl bg-[#173d32] py-2 text-xs font-semibold text-white transition hover:bg-[#205543] active:scale-[0.99] disabled:opacity-60"
                  >
                    {loading ? "Creating account..." : "Create account"}
                  </button>
                </form>

                <p className="mt-3 text-center text-xs text-[#6f7069]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleFlipTo("login")}
                    className="font-semibold text-[#1f5c4a] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            ) : (
              <>
                <div>
                  <div className="mb-4 md:mb-6 text-lg font-semibold tracking-tight">Finora</div>
                  <h1 className="max-w-xs text-2xl sm:text-3xl font-medium leading-tight lg:text-4xl">
                    Understand your money. Plan your future.
                  </h1>
                  <p className="mt-3 md:mt-4 max-w-xs text-xs sm:text-sm leading-relaxed text-white/70">
                    Track everyday expenses, understand your spending and build a financial plan around your actual situation.
                  </p>
                </div>
                <div className="mt-6 md:mt-0 flex items-center justify-between text-xs text-white/50">
                  <span>India • UAE</span>
                </div>
              </>
            )}
          </div>

          {/* PANEL 2: 
              - Desktop Right / Mobile Bottom 
              - Sign In Form on Login / Green Info Card on Register */}
          <div
            className={`p-6 sm:p-8 lg:p-10 flex flex-col justify-between transition-colors duration-500 ${
              isRegister
                ? "bg-[#173d32] text-white border-t md:border-t-0 md:border-l border-[#123027]"
                : "bg-white text-neutral-800"
            }`}
          >
            {isRegister ? (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                      <Sparkles size={16} />
                    </div>
                    <span className="text-lg font-semibold tracking-tight">Finora</span>
                  </div>

                  <h2 className="max-w-xs text-2xl sm:text-3xl font-medium leading-tight lg:text-4xl">
                    Build your financial clarity from day one.
                  </h2>

                  <p className="mt-3 md:mt-4 max-w-xs text-xs leading-relaxed text-white/70">
                    Finora connects your real-world income, recurring commitments, and emergency fund baselines into an automated cockpit.
                  </p>

                  <div className="mt-6 md:mt-8 space-y-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 backdrop-blur-sm border border-white/10">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300">
                        <Shield size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Bank-Grade Privacy</p>
                        <p className="text-[10px] text-white/60">Your private financial records stay encrypted.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 backdrop-blur-sm border border-white/10">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-400/20 text-teal-300">
                        <ArrowUpRight size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Smart Runway Engine</p>
                        <p className="text-[10px] text-white/60">3-month fund targets.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 md:mt-0 flex items-center justify-between text-xs text-white/50">
                  <span>India • UAE</span>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col justify-center">
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#1f5c4a]">
                    Welcome back
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
                    Sign in
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={googleLoading || loading || isAnimating}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#deddd7] bg-white px-4 py-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50 active:scale-[0.99] disabled:opacity-60"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>{googleLoading ? "Connecting..." : "Continue with Google"}</span>
                </button>

                <div className="relative my-3 flex items-center justify-center">
                  <div className="w-full border-t border-[#e7e5df]" />
                  <span className="absolute bg-white px-2.5 text-[10px] uppercase tracking-wider text-[#999990]">
                    or with email
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-700">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-[#deddd7] bg-[#fafaf8] px-3.5 py-2 text-xs outline-none transition focus:border-[#1f5c4a] focus:ring-2 focus:ring-[#1f5c4a]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-700">Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-[#deddd7] bg-[#fafaf8] px-3.5 py-2 pr-10 text-xs outline-none transition focus:border-[#1f5c4a] focus:ring-2 focus:ring-[#1f5c4a]/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-neutral-400 hover:text-neutral-700"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</div>
                  )}

                  <button
                    disabled={loading || googleLoading || isAnimating}
                    className="mt-1 w-full rounded-xl bg-[#173d32] py-2.5 text-xs font-semibold text-white transition hover:bg-[#205543] active:scale-[0.99] disabled:opacity-60"
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </form>

                <p className="mt-4 text-center text-xs text-[#6f7069]">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleFlipTo("register")}
                    className="font-semibold text-[#1f5c4a] hover:underline"
                  >
                    Create one
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================= 1. DESKTOP/LAPTOP HORIZONTAL 3D LEAF (md: and up) ================= */}
        {flippingDirection && (
          <div
            style={{
              transformOrigin:
                flippingDirection === "toRegister" ? "left center" : "right center",
              transformStyle: "preserve-3d",
            }}
            className={`pointer-events-none hidden md:block absolute top-0 bottom-0 z-30 h-full w-[50.5%] shadow-2xl ${
              flippingDirection === "toRegister"
                ? "left-1/2 -ml-[1px] animate-flip-left"
                : "left-0 -mr-[1px] animate-flip-right"
            }`}
          >
            <div
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              className="absolute inset-0 bg-[#fdfdfb] border border-[#e7e5df]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/5" />
            </div>

            <div
              style={{
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              className="absolute inset-0 bg-[#fafaf8] border border-[#e7e5df]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/10" />
            </div>
          </div>
        )}

        {/* ================= 2. MOBILE/TABLET VERTICAL 3D LEAF (< md) ================= */}
        {flippingDirection && (
          <div
            style={{
              transformOrigin:
                flippingDirection === "toRegister" ? "center bottom" : "center top",
              transformStyle: "preserve-3d",
            }}
            className={`pointer-events-none md:hidden absolute left-0 right-0 z-30 w-full h-[50.5%] shadow-2xl ${
              flippingDirection === "toRegister"
                ? "top-0 -mb-[1px] animate-flip-down"
                : "top-1/2 -mt-[1px] animate-flip-up"
            }`}
          >
            {/* Front face of vertical leaf */}
            <div
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              className="absolute inset-0 bg-[#fdfdfb] border border-[#e7e5df]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/5" />
            </div>

            {/* Back face of vertical leaf */}
            <div
              style={{
                transform: "rotateX(180deg)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              className="absolute inset-0 bg-[#fafaf8] border border-[#e7e5df]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10" />
            </div>
          </div>
        )}

      </div>
    </main>
  );
}