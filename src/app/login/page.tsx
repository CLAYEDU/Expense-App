"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Sparkles } from "lucide-react";

import { loginUser, registerUser, loginWithGoogle } from "@/lib/auth";
import styles from "@/components/auth/AuthSlider.module.css";

export default function LoginPage() {
  const router = useRouter();

  // Mode: true = login ("sign-in"), false = register ("sign-up")
  const [isSignIn, setIsSignIn] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const [curtainActive, setCurtainActive] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

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

  // 1. Audio Reference
  const transitionAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 2. Pre-load audio on client mount
    if (typeof window !== "undefined") {
      const audio = new Audio("/usheey.mp3");
      audio.preload = "auto";
      audio.volume = 0.6; // Adjust volume level (0.0 to 1.0)
      transitionAudioRef.current = audio;
    }
  }, []);

  function playFunnySound() {
    if (transitionAudioRef.current) {
      // Reset playback to start in case user clicks quickly back-and-forth
      transitionAudioRef.current.currentTime = 0;
      transitionAudioRef.current.play().catch((err) => {
        // Silently catch autoplay errors if any
        console.debug("Audio play prevented:", err);
      });
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    
    // Check if viewport is mobile/tablet (< 768px)
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function toggleMode(targetSignIn: boolean) {
    if (isSignIn === targetSignIn || curtainActive) return;
    // 3. Play sound right as transition starts
    playFunnySound();

    if (isMobile) {
      // 1. Drop the green curtain down over the viewport
      setCurtainActive(true);

      // 2. Midway: swap the form and URL
      setTimeout(() => {
        setIsSignIn(targetSignIn);
        window.history.replaceState(null, "", targetSignIn ? "/login" : "/register");
      }, 380);

      // 3. Roll the curtain back up
      setTimeout(() => {
        setCurtainActive(false);
      }, 760);
    } else {
      // Desktop horizontal slide
      setIsSignIn(targetSignIn);
      window.history.replaceState(null, "", targetSignIn ? "/login" : "/register");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!isSignIn) {
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

  async function handleGoogleAuth() {
    setError("");
    setGoogleLoading(true);

    try {
      await loginWithGoogle();
      router.replace(isSignIn ? "/dashboard" : "/setup");
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError("Google authentication could not be completed.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  const containerStateClass = mounted
    ? isSignIn
      ? styles.isSignIn
      : styles.isSignUp
    : "";

  // -------------------------------------------------------------
  // REUSABLE FORM BLOCKS
  // -------------------------------------------------------------
  const renderSignUpForm = () => (
    <div className={styles.formWrapper}>
      <div className={`${styles.formCard} ${styles.formSignUp}`}>
        <div>
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#1f5c4a]">
            Start your journey
          </p>
          <h2 className="mt-0.5 text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Create account
          </h2>
        </div>

        <div className="mt-2.5 sm:mt-3">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#deddd7] bg-white px-3 sm:px-4 py-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50 active:scale-[0.99] disabled:opacity-60"
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

        <div className="relative my-2 sm:my-2.5 flex items-center justify-center">
          <div className="w-full border-t border-[#e7e5df]" />
          <span className="absolute bg-white px-2.5 text-[10px] uppercase tracking-wider text-[#999990]">
            or with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <label className="mb-0.5 block text-[11px] font-medium text-neutral-700">Email</label>
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
            <label className="mb-0.5 block text-[11px] font-medium text-neutral-700">Password</label>
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
            <label className="mb-0.5 block text-[11px] font-medium text-neutral-700">Confirm Password</label>
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

          {error && !isSignIn && (
            <div className="rounded-xl bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</div>
          )}

          <button
            disabled={loading || googleLoading || curtainActive}
            className="mt-1 w-full rounded-xl bg-[#173d32] py-2 text-xs font-semibold text-white transition hover:bg-[#205543] active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-2.5 text-center text-xs text-[#6f7069]">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => toggleMode(true)}
            className="font-semibold text-[#1f5c4a] hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );

  const renderSignInForm = () => (
    <div className={styles.formWrapper}>
      <div className={`${styles.formCard} ${styles.formSignIn}`}>
        <div className="mb-2.5 sm:mb-3">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#1f5c4a]">
            Welcome back
          </p>
          <h2 className="mt-0.5 text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Sign in
          </h2>
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={googleLoading || loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#deddd7] bg-white px-3 sm:px-4 py-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50 active:scale-[0.99] disabled:opacity-60"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <span>{googleLoading ? "Connecting..." : "Continue with Google"}</span>
        </button>

        <div className="relative my-2 sm:my-3 flex items-center justify-center">
          <div className="w-full border-t border-[#e7e5df]" />
          <span className="absolute bg-white px-2.5 text-[10px] uppercase tracking-wider text-[#999990]">
            or with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
          <div>
            <label className="mb-0.5 block text-[11px] font-medium text-neutral-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#deddd7] bg-[#fafaf8] px-3.5 py-1.5 sm:py-2 text-xs outline-none transition focus:border-[#1f5c4a] focus:ring-2 focus:ring-[#1f5c4a]/10"
            />
          </div>

          <div>
            <label className="mb-0.5 block text-[11px] font-medium text-neutral-700">Password</label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#deddd7] bg-[#fafaf8] px-3.5 py-1.5 sm:py-2 pr-10 text-xs outline-none transition focus:border-[#1f5c4a] focus:ring-2 focus:ring-[#1f5c4a]/10"
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

          {error && isSignIn && (
            <div className="rounded-xl bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</div>
          )}

          <button
            disabled={loading || googleLoading || curtainActive}
            className="mt-1 w-full rounded-xl bg-[#173d32] py-2 sm:py-2.5 text-xs font-semibold text-white transition hover:bg-[#205543] active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-3 sm:mt-4 text-center text-xs text-[#6f7069]">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => toggleMode(false)}
            className="font-semibold text-[#1f5c4a] hover:underline"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen w-full bg-[#f7f6f2] p-0 md:p-6 flex items-center justify-center overflow-x-hidden">
      <div className={`${styles.authBox} ${containerStateClass}`}>
        
        {/* ================= MOBILE CURTAIN DROPDOWN ================= */}
        <div
          className={`${styles.mobileCurtainOverlay} ${
            curtainActive ? styles.curtainActive : ""
          }`}
        />

        {/* ================= MOBILE TOP HEADER (LOGO + ONLY HEADING) ================= */}
        <div className={styles.mobileTopHeader}>
          {/* Logo Icon before Finora */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md text-emerald-200 border border-white/20 shadow-xs">
              <Sparkles size={16} />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Finora
            </span>
          </div>

          {/* Clean Main Heading */}
          {isSignIn ? (
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight mt-1">
              Understand your money. <br />
              <span className="text-emerald-200 font-medium">Plan your future.</span>
            </h1>
          ) : (
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight mt-1">
              Build your financial clarity. <br />
              <span className="text-emerald-200 font-medium">From day one.</span>
            </h1>
          )}
        </div>

        {/* ================= FORM LAYOUT ================= */}
        <div className={styles.authRow}>
          {/* 
            MOBILE: Renders strictly ONE form at a time.
            DESKTOP: Renders both side-by-side inside the 50/50 split container.
          */}
          {isMobile ? (
            <div className={styles.authCol}>
              {isSignIn ? renderSignInForm() : renderSignUpForm()}
            </div>
          ) : (
            <>
              {/* Left Column (Sign Up) */}
              <div className={`${styles.authCol} ${styles.authColSignUp}`}>
                {renderSignUpForm()}
              </div>

              {/* Right Column (Sign In) */}
              <div className={`${styles.authCol} ${styles.authColSignIn}`}>
                {renderSignInForm()}
              </div>
            </>
          )}
        </div>

        {/* ================= DESKTOP BRANDING / WELCOME TEXT OVERLAY ================= */}
        <div className={styles.contentRow}>
          {/* Sign In Greeting */}
          <div className="w-1/2 flex items-center justify-center">
            <div className={`${styles.textContent} ${styles.textSignIn}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Sparkles size={16} />
                </div>
                <span className="text-lg font-semibold tracking-tight">Finora</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-medium leading-tight">
                Understand your money. Plan your future.
              </h1>
              <p className="mt-3 text-xs leading-relaxed text-white/80">
                Track everyday expenses, understand your spending and build a financial plan around your actual situation.
              </p>
            </div>
          </div>

          {/* Sign Up Greeting */}
          <div className="w-1/2 flex items-center justify-center">
            <div className={`${styles.textContent} ${styles.textSignUp}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Sparkles size={16} />
                </div>
                <span className="text-lg font-semibold tracking-tight">Finora</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-medium leading-tight">
                Build your financial clarity from day one.
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-white/80">
                Finora connects your real-world income, recurring commitments, and emergency fund baselines into an automated cockpit.
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}