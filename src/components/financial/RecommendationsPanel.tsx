"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  PiggyBank,
  Target,
  Info,
  ArrowRight,
} from "lucide-react";

import type { Expense } from "@/lib/expenses";
import type { BudgetMap } from "@/lib/budgets";
import type { FinancialProfile } from "@/types/finance";

// ============================================================================
// Types
// ============================================================================

export type RecommendationType =
  | "warning"
  | "positive"
  | "saving"
  | "planning"
  | "info";

export type Recommendation = {
  id: string;
  type: RecommendationType;
  title: string;
  message: string;
  category?: string;
  priority: number;
};

// ============================================================================
// Engine: generateRecommendations
// ============================================================================

function getCurrentMonthExpenses(expenses: Expense[]) {
  const now = new Date();

  return expenses.filter((expense) => {
    const date = new Date(`${expense.date}T00:00:00`);
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });
}

export function generateRecommendations({
  expenses = [],
  budgets = {},
  monthlyIncome = 0,
  essentialExpenses = 0,
  otherFixedExpenses = 0,
  emiAmount = 0,
  currentSavings = 0,
  currentEmergencyFund = 0,
  currency = "INR",
}: {
  expenses?: Expense[];
  budgets?: BudgetMap | Record<string, number>;
  monthlyIncome?: number;
  essentialExpenses?: number;
  otherFixedExpenses?: number;
  emiAmount?: number;
  currentSavings?: number;
  currentEmergencyFund?: number;
  currency?: "INR" | "AED";
}): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const monthExpenses = getCurrentMonthExpenses(expenses);

  const categoryTotals: Record<string, number> = {};
  for (const expense of monthExpenses) {
    categoryTotals[expense.category] =
      (categoryTotals[expense.category] || 0) + expense.amount;
  }

  const formatMoney = (amount: number) =>
    `${currency === "INR" ? "₹" : "AED "}${amount.toLocaleString(
      currency === "INR" ? "en-IN" : "en-AE",
      { maximumFractionDigits: 0 }
    )}`;

  // 1. Category Budget Analysis
  (Object.entries(budgets) as [string, number][]).forEach(([category, rawBudget]) => {
    const budget = Number(rawBudget) || 0;
    if (budget <= 0) return;

    const actual = categoryTotals[category] || 0;
    const percentage = (actual / budget) * 100;

    if (percentage >= 100) {
      const exceeded = actual - budget;
      recommendations.push({
        id: `budget-over-${category}`,
        type: "warning",
        title: `${category} is over budget`,
        message: `You've spent ${formatMoney(actual)} against a planned ${formatMoney(
          budget
        )}. That's ${formatMoney(exceeded)} above your monthly plan.`,
        category,
        priority: 100,
      });
    } else if (percentage >= 90) {
      recommendations.push({
        id: `budget-near-${category}`,
        type: "warning",
        title: `${category} is close to its limit`,
        message: `You've used ${Math.round(percentage)}% of your ${formatMoney(
          budget
        )} monthly plan. There is about ${formatMoney(budget - actual)} remaining.`,
        category,
        priority: 80,
      });
    } else if (percentage >= 80) {
      recommendations.push({
        id: `budget-watch-${category}`,
        type: "info",
        title: `Watch your ${category} spending`,
        message: `You've used ${Math.round(percentage)}% of your planned ${formatMoney(budget)}.`,
        category,
        priority: 60,
      });
    } else if (actual > 0 && percentage <= 70) {
      recommendations.push({
        id: `budget-positive-${category}`,
        type: "positive",
        title: `${category} is within plan`,
        message: `Your spending is currently below your planned monthly amount.`,
        category,
        priority: 30,
      });
    }
  });

  // 2. Monthly Cash Flow & Deficit/Surplus
  const totalVariableExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const plannedCommitments = essentialExpenses + otherFixedExpenses + emiAmount;
  const totalUsed = plannedCommitments + totalVariableExpenses;
  const remaining = monthlyIncome - totalUsed;

  if (monthlyIncome > 0) {
    if (remaining < 0) {
      recommendations.push({
        id: "monthly-deficit",
        type: "warning",
        title: "Planned spending exceeds income",
        message: `Your total monthly commitments and expenses are about ${formatMoney(
          Math.abs(remaining)
        )} above income. Review flexible spending to balance.`,
        priority: 110,
      });
    } else if (remaining > monthlyIncome * 0.2) {
      recommendations.push({
        id: "healthy-surplus",
        type: "positive",
        title: "Healthy monthly surplus",
        message: `Around ${formatMoney(
          remaining
        )} remains after planned commitments and current spending.`,
        priority: 70,
      });
    } else if (remaining > 0) {
      recommendations.push({
        id: "positive-surplus",
        type: "positive",
        title: "Within planned income",
        message: `You have approximately ${formatMoney(
          remaining
        )} remaining based on your current plan and spending.`,
        priority: 50,
      });
    }
  }

  // 3. EMI
  if (emiAmount > 0 && monthlyIncome > 0) {
    const emiPercentage = (emiAmount / monthlyIncome) * 100;
    recommendations.push({
      id: "emi-awareness",
      type: "info",
      title: "Keep EMI reserved",
      message: `Your EMI is ${formatMoney(emiAmount)} (${Math.round(
        emiPercentage
      )}% of income). Ensure this is reserved before discretionary spends.`,
      priority: 55,
    });
  }

  // 4. Emergency Fund
  const monthlyCoreCommitments = essentialExpenses + otherFixedExpenses + emiAmount;
  const emergencyTarget = monthlyCoreCommitments * 6;
  const existingEmergencyFund = currentEmergencyFund > 0 ? currentEmergencyFund : currentSavings;

  if (monthlyCoreCommitments > 0 && existingEmergencyFund < emergencyTarget) {
    const gap = emergencyTarget - existingEmergencyFund;
    recommendations.push({
      id: "emergency-fund",
      type: "saving",
      title: "Build emergency reserve",
      message: `A 6-month safety net is ${formatMoney(emergencyTarget)}. Available reserve has a gap of ${formatMoney(gap)}.`,
      priority: 75,
    });
  } else if (monthlyCoreCommitments > 0 && existingEmergencyFund >= emergencyTarget) {
    recommendations.push({
      id: "emergency-fund-covered",
      type: "positive",
      title: "Emergency reserve on track",
      message: "Your safety fund covers 6+ months of core commitments.",
      priority: 65,
    });
  }

  // 5. Long-term Planning
  if (remaining > 0 && remaining >= monthlyIncome * 0.1) {
    recommendations.push({
      id: "long-term-planning",
      type: "planning",
      title: "Consider strategic investments",
      message: `With ${formatMoney(remaining)} monthly surplus, consider regular SIPs or growth assets.`,
      priority: 45,
    });
  }

  return recommendations.sort((a, b) => b.priority - a.priority);
}

// ============================================================================
// UI Component: RecommendationsPanel (Default Export)
// ============================================================================

interface RecommendationsPanelProps {
  recommendations?: Recommendation[];
  expenses?: Expense[];
  budgets?: BudgetMap;
  profile?: FinancialProfile | null;
  maxItems?: number;
}

export default function RecommendationsPanel({
  recommendations: propRecs,
  expenses = [],
  budgets = {} as BudgetMap,
  profile,
  maxItems = 3,
}: RecommendationsPanelProps) {
  // If recommendations were not provided directly, compute them from the passed props
  const list = useMemo(() => {
    if (propRecs && propRecs.length > 0) {
      return propRecs;
    }
    if (profile) {
      return generateRecommendations({
        expenses,
        budgets,
        monthlyIncome: profile.monthlyIncome ?? 0,
        essentialExpenses: profile.essentialExpenses ?? 0,
        otherFixedExpenses: profile.recurringExpenses ?? 0,
        emiAmount: profile.monthlyEmi ?? 0,
        currentSavings: profile.currentSavings ?? 0,
        currentEmergencyFund: profile.emergencyFund ?? 0,
        currency: profile.currency ?? "INR",
      });
    }
    return [];
  }, [propRecs, expenses, budgets, profile]);

  const displayed = list.slice(0, maxItems);

  const getIcon = (type: RecommendationType) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "positive":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "saving":
        return <PiggyBank className="h-4 w-4 text-blue-600" />;
      case "planning":
        return <Target className="h-4 w-4 text-purple-600" />;
      default:
        return <Info className="h-4 w-4 text-neutral-600" />;
    }
  };

  const getBadgeStyle = (type: RecommendationType) => {
    switch (type) {
      case "warning":
        return "bg-amber-50 text-amber-800 border-amber-200/60";
      case "positive":
        return "bg-emerald-50 text-emerald-800 border-emerald-200/60";
      case "saving":
        return "bg-blue-50 text-blue-800 border-blue-200/60";
      case "planning":
        return "bg-purple-50 text-purple-800 border-purple-200/60";
      default:
        return "bg-neutral-50 text-neutral-800 border-neutral-200/60";
    }
  };

  return (
    <div className="rounded-[28px] border border-[#e7e5df] bg-white p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 text-sm sm:text-base">
              Financial Insights
            </h3>
            <p className="text-[11px] text-neutral-400">
              Personalized guidance based on your activity
            </p>
          </div>
        </div>

        <Link
          href="/notifications"
          className="flex items-center gap-1 text-xs font-semibold text-[#1f5c4a] hover:text-[#173d32] transition"
        >
          View all
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Body List */}
      <div className="mt-4 space-y-3">
        {displayed.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-400">
            No alerts or recommendations at this time.
          </div>
        ) : (
          displayed.map((rec) => (
            <div
              key={rec.id}
              className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-[#fafaf8] p-3.5 transition hover:border-neutral-200"
            >
              <div className="mt-0.5 rounded-xl bg-white p-1.5 shadow-xs shrink-0 border border-neutral-200/60">
                {getIcon(rec.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-neutral-900 truncate">
                    {rec.title}
                  </h4>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${getBadgeStyle(
                      rec.type
                    )}`}
                  >
                    {rec.category || rec.type}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 line-clamp-2">
                  {rec.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Named export as well for flexibility
export { RecommendationsPanel };