"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BellRing } from "lucide-react";

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

  // Typed directly to the actual FinancialProfile model
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  // Initialized with DEFAULT_BUDGETS to satisfy Record<ExpenseCategory, number>
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

    // Correctly mapped to the fields in FinancialProfile
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
    () =>
      recommendations.filter((item) => item.type === "warning").length,
    [recommendations]
  );

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200" />

          <div className="mt-8 space-y-4">
            <div className="h-32 animate-pulse rounded-3xl bg-neutral-200" />
            <div className="h-32 animate-pulse rounded-3xl bg-neutral-200" />
            <div className="h-32 animate-pulse rounded-3xl bg-neutral-200" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white">
              <BellRing className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
                Financial insights
              </h1>

              <p className="mt-1 text-sm text-neutral-500">
                Helpful observations based on your current financial data.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-600">
              Current alerts
            </span>

            <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-800">
              {warningCount}
            </span>
          </div>

          <p className="mt-2 text-sm text-neutral-500">
            These insights update automatically as you add expenses, budgets
            and financial information.
          </p>
        </div>

        <section className="mt-6 space-y-4">
          {recommendations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-10 text-center">
              <BellRing className="mx-auto h-8 w-8 text-neutral-400" />

              <h2 className="mt-4 font-semibold text-neutral-900">
                No insights yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                Start adding expenses or setting monthly budgets and your
                financial insights will appear here.
              </p>
            </div>
          ) : (
            recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
              />
            ))
          )}
        </section>
      </div>
    </main>
  );
}