"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Target, SlidersHorizontal } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { getFinancialProfile } from "@/lib/financial-profile";
import { getExpenses, Expense } from "@/lib/expenses";
import { getBudgets, BudgetMap } from "@/lib/budgets";
import { analyzeBudget, BudgetSummary } from "@/lib/budget-engine";

import BudgetEditor from "@/lib/BudgetEditor";
import BudgetComparison from "@/components/financial/BudgetComparison";

interface FinancialProfile {
  currency: "INR" | "AED";
}

export default function BudgetPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [budgets, setBudgets] = useState<BudgetMap | null>(null);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const [financialProfile, expenses, savedBudgets] = await Promise.all([
        getFinancialProfile(user.uid),
        getExpenses(user.uid),
        getBudgets(user.uid),
      ]);

      if (!financialProfile) {
        router.replace("/setup");
        return;
      }

      const typedProfile = financialProfile as FinancialProfile;

      setProfile(typedProfile);
      setBudgets(savedBudgets);

      const analysis = analyzeBudget(savedBudgets, expenses);
      setSummary(analysis);
    } catch (error) {
      console.error("Budget loading error:", error);
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    loadData();
  }, [authLoading, user, router, loadData]);

  // Loading Skeleton wrapped in Apple Ambient Glass
  if (authLoading || loading || !profile || !budgets || !summary) {
    return (
      <main className="relative min-h-screen bg-[#edf2ee] p-6 text-neutral-900 overflow-hidden">
        {/* Living Mesh Background */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-24 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-emerald-400/40 via-teal-300/30 to-emerald-200/20 blur-[130px]" />
          <div className="absolute top-[28%] -left-32 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-teal-400/35 via-emerald-300/30 to-cyan-300/25 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="h-9 w-52 animate-pulse rounded-2xl bg-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-xl" />
          <div className="mt-8 h-96 animate-pulse rounded-[36px] border border-white/80 bg-white/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#edf2ee] text-neutral-900 antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* ================= APPLE AMBIENT LIVING AURORA BACKGROUND ================= */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Vibrant Emerald Aurora (Top-Right) */}
        <div className="absolute -top-36 -right-24 h-[620px] w-[620px] rounded-full bg-gradient-to-br from-emerald-400/50 via-teal-300/40 to-emerald-200/25 blur-[120px]" />
        {/* Electric Mint & Cyan Aurora (Left Edge) */}
        <div className="absolute top-[25%] -left-36 h-[650px] w-[650px] rounded-full bg-gradient-to-tr from-teal-400/40 via-emerald-300/35 to-cyan-300/30 blur-[140px]" />
        {/* Subtle Warm Violet/Teal Depth Aura (Bottom-Right) */}
        <div className="absolute -bottom-36 right-[15%] h-[580px] w-[580px] rounded-full bg-gradient-to-t from-cyan-300/35 via-emerald-200/30 to-transparent blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ================= TOP NAVIGATION / HEADER ================= */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/70 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xl">
              <Sparkles size={14} className="text-emerald-600 animate-pulse" />
              <span>Capital Calibration</span>
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
              Monthly Budget
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-neutral-500 max-w-xl leading-relaxed">
              Define targeted limits across spending categories and contrast against verified actual transaction flow.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/85 bg-white/70 px-5 py-3 text-xs font-bold text-neutral-800 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition-all duration-300 hover:bg-white hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.08)] active:scale-95 sm:self-auto"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>
        </header>

        {/* ================= LIQUID GLASS WORKSPACE GRID ================= */}
        <div className="grid gap-8 lg:grid-cols-[430px_1fr]">
          {/* Left Column: Budget Editor Wrapped in Liquid Glass */}
          <div className="overflow-hidden rounded-[36px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 sm:p-7 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:shadow-[0_25px_50px_-10px_rgba(16,185,129,0.12)]">
            <div className="mb-5 flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-800 shadow-sm">
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-neutral-900">
                    Category Allocations
                  </h2>
                  <p className="text-[11px] font-semibold text-neutral-400">
                    Adjust planned limits per stream
                  </p>
                </div>
              </div>
              <span className="rounded-xl border border-white/90 bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-900 shadow-xs">
                {profile.currency}
              </span>
            </div>

            <BudgetEditor
              uid={user!.uid}
              currency={profile.currency}
              initialBudgets={budgets}
              onSaved={loadData}
            />
          </div>

          {/* Right Column: Comparison Card Wrapped in Aqua Frost Glass */}
          <div className="overflow-hidden rounded-[36px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 sm:p-7 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:shadow-[0_25px_50px_-10px_rgba(6,182,212,0.12)]">
            <div className="mb-5 flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-800 shadow-sm">
                  <Target size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-neutral-900">
                    Variance & Real-Time Tracking
                  </h2>
                  <p className="text-[11px] font-semibold text-neutral-400">
                    Actual spending vs monthly caps
                  </p>
                </div>
              </div>
            </div>

            <BudgetComparison
              summary={summary}
              currency={profile.currency}
            />
          </div>
        </div>
      </div>
    </main>
  );
}