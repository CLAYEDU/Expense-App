"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";

import {
  getFinancialProfile,
} from "@/lib/financial-profile";

import {
  getExpenses,
  Expense,
} from "@/lib/expenses";

import {
  getBudgets,
  BudgetMap,
} from "@/lib/budgets";

import {
  analyzeBudget,
  BudgetSummary,
} from "@/lib/budget-engine";

import BudgetEditor from "@/lib/BudgetEditor";

import BudgetComparison from "@/components/financial/BudgetComparison";

interface FinancialProfile {
  currency: "INR" | "AED";
}

export default function BudgetPage() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const router = useRouter();

  const [profile, setProfile] =
    useState<FinancialProfile | null>(null);

  const [budgets, setBudgets] =
    useState<BudgetMap | null>(null);

  const [summary, setSummary] =
    useState<BudgetSummary | null>(null);

  const [loading, setLoading] =
    useState(true);

  const loadData = useCallback(
    async () => {
      if (!user) return;

      try {
        setLoading(true);

        const [
          financialProfile,
          expenses,
          savedBudgets,
        ] = await Promise.all([
          getFinancialProfile(user.uid),
          getExpenses(user.uid),
          getBudgets(user.uid),
        ]);

        if (!financialProfile) {
          router.replace("/setup");
          return;
        }

        const typedProfile =
          financialProfile as FinancialProfile;

        setProfile(typedProfile);
        setBudgets(savedBudgets);

        const analysis =
          analyzeBudget(
            savedBudgets,
            expenses
          );

        setSummary(analysis);
      } catch (error) {
        console.error(
          "Budget loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    },
    [user, router]
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    loadData();
  }, [
    authLoading,
    user,
    router,
    loadData,
  ]);

  if (
    authLoading ||
    loading ||
    !profile ||
    !budgets ||
    !summary
  ) {
    return (
      <main className="min-h-screen bg-[#f7f6f2] p-6">
        <div className="mx-auto max-w-6xl">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200" />

          <div className="mt-8 h-96 animate-pulse rounded-3xl bg-neutral-200" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">
              Financial planning
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
              Monthly budget
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
              Set flexible spending targets and compare
              them with your actual expenses.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Back to dashboard
          </button>
        </header>

        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          <BudgetEditor
            uid={user!.uid}
            currency={profile.currency}
            initialBudgets={budgets}
            onSaved={loadData}
          />

          <BudgetComparison
            summary={summary}
            currency={profile.currency}
          />
        </div>
      </div>
    </main>
  );
}