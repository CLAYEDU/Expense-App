"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BellRing, Sparkles, ShieldAlert } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { getFinancialProfile } from "@/lib/financial-profile";
import type { FinancialProfile } from "@/types/finance";
import { getExpenses, type Expense } from "@/lib/expenses";
import { getBudgets, DEFAULT_BUDGETS, type BudgetMap } from "@/lib/budgets";
import {
  generateRecommendations,
  type Recommendation,
} from "@/lib/recommendations";
import { RecommendationCard } from "@/components/financial/RecommendationCard";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<BudgetMap>(DEFAULT_BUDGETS);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (authLoading) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const financialProfile = await getFinancialProfile(user.uid);

        if (!financialProfile) {
          router.replace("/setup");
          return;
        }

        const [userExpenses, userBudgets] = await Promise.all([
          getExpenses(user.uid),
          getBudgets(user.uid),
        ]);

        setProfile(financialProfile as FinancialProfile);
        setExpenses(userExpenses);
        setBudgets(userBudgets);
      } catch (error) {
        console.error("Failed to load financial insights:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!profile) return;

    const generated = generateRecommendations({
      expenses,
      budgets,
      monthlyIncome: profile.monthlyIncome ?? 0,
      essentialExpenses: profile.essentialExpenses ?? 0,
      otherFixedExpenses: profile.recurringExpenses ?? 0,
      emiAmount: profile.monthlyEmi ?? 0,
      currentSavings: profile.currentSavings ?? 0,
      currentEmergencyFund: profile.emergencyFund ?? 0,
      currency: profile.currency,
    });

    setRecommendations(generated);
  }, [profile, expenses, budgets]);

  const warningCount = useMemo(
    () => recommendations.filter((item) => item.type === "warning").length,
    [recommendations]
  );

  // Loading State with Apple Glass Skeleton
  if (authLoading || loading) {
    return (
      <main className="relative min-h-screen bg-[#edf2ee] p-6 text-neutral-900 overflow-hidden">
        {/* Living Mesh Background */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-24 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-emerald-400/40 via-teal-300/30 to-emerald-200/20 blur-[130px]" />
          <div className="absolute top-[28%] -left-32 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-teal-400/35 via-emerald-300/30 to-cyan-300/25 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="h-9 w-48 animate-pulse rounded-2xl bg-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-xl" />

          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-[32px] border border-white/80 bg-white/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl"
              />
            ))}
          </div>
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
        {/* Soft Cyan Depth Aura (Bottom-Right) */}
        <div className="absolute -bottom-36 right-[15%] h-[580px] w-[580px] rounded-full bg-gradient-to-t from-cyan-300/35 via-emerald-200/30 to-transparent blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-white/85 bg-white/70 px-4 py-2.5 text-xs font-bold text-neutral-800 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:bg-white hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.08)] active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        {/* ================= HEADER ================= */}
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-600/30">
              <BellRing className="h-6 w-6" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/70 px-3 py-0.5 text-[11px] font-bold text-emerald-800 shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xl">
                <Sparkles size={12} className="text-emerald-600 animate-pulse" />
                <span>Automated Pulse</span>
              </div>

              <h1 className="mt-1 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
                Financial Insights
              </h1>

              <p className="mt-0.5 text-xs sm:text-sm text-neutral-500">
                Actionable observations and automated runway alerts derived from your real spending data.
              </p>
            </div>
          </div>
        </header>

        {/* ================= ALERT SUMMARY PILL ================= */}
        <div className="overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:shadow-[0_25px_50px_-10px_rgba(16,185,129,0.12)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800 shadow-sm">
                <ShieldAlert size={16} />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-neutral-700">
                Active Critical Warnings
              </span>
            </div>

            <span
              className={`rounded-full px-3.5 py-1 text-xs font-black shadow-xs ${
                warningCount > 0
                  ? "border border-amber-300/80 bg-amber-500/20 text-amber-900"
                  : "border border-emerald-300/80 bg-emerald-500/20 text-emerald-900"
              }`}
            >
              {warningCount} {warningCount === 1 ? "Alert" : "Alerts"}
            </span>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-neutral-500">
            These automated observations update dynamically as new cash transactions, budget caps, and emergency reserve funds are recorded.
          </p>
        </div>

        {/* ================= RECOMMENDATIONS LIST ================= */}
        <section className="mt-6 space-y-4">
          {recommendations.length === 0 ? (
            <div className="rounded-[36px] border border-dashed border-white/90 bg-white/40 p-12 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 text-neutral-400 shadow-sm">
                <BellRing className="h-7 w-7" />
              </div>

              <h2 className="mt-4 font-black text-neutral-900">
                No active notifications
              </h2>

              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-neutral-500">
                Start adding daily expenses or setting monthly category limits and personalized financial intelligence will appear here.
              </p>
            </div>
          ) : (
            recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-1 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.09)]"
              >
                <RecommendationCard recommendation={recommendation} />
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}