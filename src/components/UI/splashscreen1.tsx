"use client";

import { useEffect, useState } from "react";
import { Sparkles, WifiOff, RefreshCw } from "lucide-react";

interface SplashScreen1Props {
  /** Text hints that rotate while loading */
  steps?: string[];
  /** Milliseconds before showing the network slow warning (default: 5000ms) */
  slowThresholdMs?: number;
  /** Optional callback to retry data loading */
  onRetry?: () => void;
}

const DEFAULT_STEPS = [
  "Securing your financial space...",
  "Loading real-time pulse...",
  "Calculating safety buffers...",
  "Preparing your cockpit...",
];

export default function SplashScreen1({
  steps = DEFAULT_STEPS,
  slowThresholdMs = 5000,
  onRetry,
}: SplashScreen1Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSlow, setIsSlow] = useState(false);
  const [progress, setProgress] = useState(15);

  // Cycle through step messages
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % steps.length);
    }, 1400);

    return () => clearInterval(stepInterval);
  }, [steps.length]);

  // Smooth simulated progress bar (stays alive without stalling)
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Wait for real load to hit 100
        const delta = Math.floor(Math.random() * 10) + 5;
        return Math.min(prev + delta, 90);
      });
    }, 450);

    return () => clearInterval(progressInterval);
  }, []);

  // Detect slow network
  useEffect(() => {
    const slowTimer = setTimeout(() => {
      setIsSlow(true);
    }, slowThresholdMs);

    return () => clearTimeout(slowTimer);
  }, [slowThresholdMs]);

  return (
    <main className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d1311] px-6 text-white overflow-hidden select-none">
      {/* Ambient Radial Glows */}
      <div className="pointer-events-none absolute -top-40 right-1/4 h-[420px] w-[420px] rounded-full bg-emerald-500/15 blur-[140px] animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[420px] w-[420px] rounded-full bg-teal-500/10 blur-[140px]" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        {/* Animated Brand Emblem */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Radar ripple waves */}
          <div className="absolute h-24 w-24 rounded-3xl bg-emerald-500/15 animate-ping opacity-75" />
          <div className="absolute h-20 w-20 rounded-2xl bg-emerald-500/20 blur-sm" />

          {/* Core Icon Box */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500 via-teal-700 to-neutral-900 shadow-2xl shadow-emerald-500/30">
            <Sparkles size={28} className="text-white animate-spin [animation-duration:8s]" />
          </div>
        </div>

        {/* Brand Title */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight text-white">
            Finora
          </span>
        </div>

        {/* Dynamic Status Text */}
        <div className="h-8 mt-3 flex items-center justify-center">
          <p
              key={currentStepIndex}
              className="text-xs font-medium text-neutral-400 transition-opacity duration-300"
            >
              {steps[currentStepIndex]}
            </p>
        </div>

        {/* High-End Micro Progress Bar */}
        <div className="mt-6 w-full overflow-hidden rounded-full bg-neutral-900/80 p-0.5 border border-neutral-800/80 shadow-inner">
          <div
            className="h-1 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(52,211,153,0.7)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Slow Network Notification Overlay (Appears after threshold) */}
        {isSlow && (
          <div className="mt-8 flex w-full flex-col items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs backdrop-blur-md animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <WifiOff size={15} />
              <span>Slower connection detected</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Fetching financial records from the cloud is taking slightly longer than usual.
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 font-semibold text-amber-200 transition hover:bg-amber-400/20 active:scale-95"
              >
                <RefreshCw size={13} />
                Try Reconnecting
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer reassurance */}
      <div className="absolute bottom-6 text-center">
        <p className="text-[11px] font-medium text-neutral-600">
          Encrypted client session • Finora Engine
        </p>
      </div>
    </main>
  );
}