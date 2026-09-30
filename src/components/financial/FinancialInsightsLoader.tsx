"use client";

import { useEffect, useState } from "react";
import {
  generateFinancialInsights,
  type FinancialInsight,
} from "@/lib/financial-insights";

import {
  getExpenses,
  type Expense,
} from "@/lib/expenses";

import {
  getBudgets,
  type BudgetMap,
} from "@/lib/budgets";

import {
  getRecurringExpenses,
  type RecurringExpense,
} from "@/lib/recurring-expenses";

import FinancialInsights from "./FinancialInsights";

type FinancialProfile = {
  monthlyIncome: number;
  essentialExpenses: number;
  otherFixedExpenses: number;
  emiAmount: number;
  currentSavings: number;
  currentInvestments: number;
  currentEmergencyFund?: number;
  monthlySavingsTarget?: number;
  currency: "INR" | "AED";
};

type Props = {
  profile: FinancialProfile;
  uid: string;
  limit?: number;
};

export default function FinancialInsightsLoader({
  profile,
  uid,
  limit = 6,
}: Props) {
  const [insights, setInsights] =
    useState<FinancialInsight[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadInsights() {
      try {
        setLoading(true);

        const [
          expenses,
          budgets,
          recurringExpenses,
        ] = await Promise.all([
          getExpenses(uid),
          getBudgets(uid),
          getRecurringExpenses(uid),
        ]);

        if (cancelled) return;

        const generated =
          generateFinancialInsights({
            profile,
            expenses: expenses as Expense[],
            budgets: budgets as BudgetMap,
            recurringExpenses:
              recurringExpenses as RecurringExpense[],
          });

        setInsights(generated);
      } catch (error) {
        console.error(
          "Failed to generate financial insights:",
          error
        );

        if (!cancelled) {
          setInsights([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInsights();

    return () => {
      cancelled = true;
    };
  }, [uid, profile]);

  if (loading) {
    return (
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-5 w-40 rounded bg-neutral-200" />

          <div className="mt-2 h-7 w-64 rounded bg-neutral-200" />

          <div className="mt-6 space-y-3">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-24 rounded-2xl bg-neutral-100"
                />
              )
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <FinancialInsights
      insights={insights}
      limit={limit}
    />
  );
}