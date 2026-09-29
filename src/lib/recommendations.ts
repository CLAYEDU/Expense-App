import type { Expense } from "@/lib/expenses";
import type { BudgetMap } from "@/lib/budgets";

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

export type SafeBudgetMap = Record<string, number>;

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
  expenses,
  budgets,
  monthlyIncome,
  essentialExpenses,
  otherFixedExpenses,
  emiAmount,
  currentSavings,
  currentEmergencyFund = 0,
  currency,
}: {
  expenses: Expense[];
  budgets: BudgetMap | SafeBudgetMap;
  monthlyIncome: number;
  essentialExpenses: number;
  otherFixedExpenses: number;
  emiAmount: number;
  currentSavings: number;
  currentEmergencyFund?: number;
  currency: "INR" | "AED";
}) {
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
      {
        maximumFractionDigits: 0,
      }
    )}`;

  // --------------------------------------------------
  // CATEGORY BUDGET ANALYSIS
  // --------------------------------------------------

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
        message: `You've spent ${formatMoney(
          actual
        )} against a planned ${formatMoney(
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
        message: `You've used ${Math.round(
          percentage
        )}% of your ${formatMoney(
          budget
        )} monthly plan. There is about ${formatMoney(
          budget - actual
        )} remaining.`,
        category,
        priority: 80,
      });
    } else if (percentage >= 80) {
      recommendations.push({
        id: `budget-watch-${category}`,
        type: "info",
        title: `Watch your ${category} spending`,
        message: `You've used ${Math.round(
          percentage
        )}% of your planned ${formatMoney(budget)}.`,
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

  // --------------------------------------------------
  // MONTHLY MONEY POSITION
  // --------------------------------------------------

  const totalVariableExpenses = monthExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const plannedCommitments =
    essentialExpenses + otherFixedExpenses + emiAmount;

  const totalUsed = plannedCommitments + totalVariableExpenses;

  const remaining = monthlyIncome - totalUsed;

  if (monthlyIncome > 0) {
    if (remaining < 0) {
      recommendations.push({
        id: "monthly-deficit",
        type: "warning",
        title: "Your planned spending is above your income",
        message: `Your current planned commitments and recorded spending are about ${formatMoney(
          Math.abs(remaining)
        )} above your monthly income. Reviewing flexible expenses may help bring the month back into balance.`,
        priority: 110,
      });
    } else if (remaining > monthlyIncome * 0.2) {
      recommendations.push({
        id: "healthy-surplus",
        type: "positive",
        title: "You currently have a healthy monthly surplus",
        message: `Around ${formatMoney(
          remaining
        )} remains after your planned commitments and recorded spending. Maintaining a similar surplus can strengthen your long-term financial position.`,
        priority: 70,
      });
    } else if (remaining > 0) {
      recommendations.push({
        id: "positive-surplus",
        type: "positive",
        title: "You are currently within your income",
        message: `You have approximately ${formatMoney(
          remaining
        )} remaining based on your current plan and recorded spending.`,
        priority: 50,
      });
    }
  }

  // --------------------------------------------------
  // EMI
  // --------------------------------------------------

  if (emiAmount > 0 && monthlyIncome > 0) {
    const emiPercentage = (emiAmount / monthlyIncome) * 100;

    recommendations.push({
      id: "emi-awareness",
      type: "info",
      title: "Keep your EMI in your monthly plan",
      message: `Your EMI is ${formatMoney(
        emiAmount
      )}, which is about ${Math.round(
        emiPercentage
      )}% of your monthly income. Keeping this amount reserved before flexible spending can make your monthly plan more predictable.`,
      priority: 55,
    });
  }

  // --------------------------------------------------
  // EMERGENCY FUND
  // --------------------------------------------------

  const monthlyCoreCommitments =
    essentialExpenses + otherFixedExpenses + emiAmount;

  const emergencyTarget = monthlyCoreCommitments * 6;

  const existingEmergencyFund =
    currentEmergencyFund > 0 ? currentEmergencyFund : currentSavings;

  if (
    monthlyCoreCommitments > 0 &&
    existingEmergencyFund < emergencyTarget
  ) {
    const gap = emergencyTarget - existingEmergencyFund;

    recommendations.push({
      id: "emergency-fund",
      type: "saving",
      title: "Build your emergency fund gradually",
      message: `Based on your current monthly commitments, a six-month emergency reserve would be around ${formatMoney(
        emergencyTarget
      )}. Your recorded available emergency/savings funds are about ${formatMoney(
        existingEmergencyFund
      )}, leaving a gap of approximately ${formatMoney(gap)}. Building this gradually can improve financial resilience.`,
      priority: 75,
    });
  } else if (
    monthlyCoreCommitments > 0 &&
    existingEmergencyFund >= emergencyTarget
  ) {
    recommendations.push({
      id: "emergency-fund-covered",
      type: "positive",
      title: "Your emergency reserve is on track",
      message: `Your recorded emergency/savings funds currently cover approximately six months of your core monthly commitments.`,
      priority: 65,
    });
  }

  // --------------------------------------------------
  // LONG-TERM PLANNING
  // --------------------------------------------------

  if (remaining > 0 && remaining >= monthlyIncome * 0.1) {
    recommendations.push({
      id: "long-term-planning",
      type: "planning",
      title: "Consider a long-term plan for your surplus",
      message: `You currently have around ${formatMoney(
        remaining
      )} left after your planned spending. After keeping appropriate emergency savings, it may be suitable to consider a SIP plan or another long-term investment approach depending on your goals and risk preference.`,
      priority: 45,
    });
  }

  // --------------------------------------------------
  // GENERAL SAVING MESSAGE
  // --------------------------------------------------

  if (totalVariableExpenses === 0 && monthlyIncome > 0) {
    recommendations.push({
      id: "start-tracking",
      type: "info",
      title: "Start tracking your monthly spending",
      message:
        "Add your daily expenses or import a CSV to make your recommendations more accurate.",
      priority: 40,
    });
  }

  return recommendations.sort((a, b) => b.priority - a.priority);
}