import type { Expense } from "./expenses";
import type { BudgetMap } from "./budgets";
import type { RecurringExpense } from "./recurring-expenses";

export type MonthlyReport = {
  monthKey: string;
  monthLabel: string;

  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  savingsRate: number;

  budgetTotal: number;
  budgetUsed: number;
  budgetRemaining: number;
  budgetUsageRate: number;

  recurringMonthlyCommitment: number;

  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    budget: number;
    budgetUsedPercentage: number;
  }[];

  previousMonthExpenses: number;
  expenseChange: number;
  expenseChangePercentage: number;

  previousMonthSavings: number;
  savingsChange: number;

  savingsTarget: number;
  savingsTargetProgress: number;
};

function getLocalDate(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

export function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );
}

export function getMonthStart(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Date(year, month - 1, 1);
}

export function getPreviousMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  const date = new Date(year, month - 2, 1);

  return getMonthKey(date);
}

export function getNextMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  const date = new Date(year, month, 1);

  return getMonthKey(date);
}

function isExpenseInMonth(
  expense: Expense,
  monthKey: string
) {
  if (!expense.date) return false;

  return expense.date.startsWith(monthKey);
}

function calculateExpenseTotal(
  expenses: Expense[],
  monthKey: string
) {
  return expenses
    .filter((expense) =>
      isExpenseInMonth(expense, monthKey)
    )
    .reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );
}

function calculateCategoryTotals(
  expenses: Expense[],
  monthKey: string
) {
  const totals: Record<string, number> = {};

  expenses
    .filter((expense) =>
      isExpenseInMonth(expense, monthKey)
    )
    .forEach((expense) => {
      const category =
        expense.category || "Other";

      totals[category] =
        (totals[category] || 0) +
        Number(expense.amount || 0);
    });

  return totals;
}

export function buildMonthlyReport({
  expenses,
  budgets,
  recurringExpenses,
  monthKey,
  monthlyIncome,
  savingsTarget = 0,
}: {
  expenses: Expense[];
  budgets: BudgetMap;
  recurringExpenses: RecurringExpense[];
  monthKey: string;
  monthlyIncome: number;
  savingsTarget?: number;
}): MonthlyReport {
  const previousMonthKey =
    getPreviousMonthKey(monthKey);

  const totalExpenses =
    calculateExpenseTotal(expenses, monthKey);

  const previousMonthExpenses =
    calculateExpenseTotal(
      expenses,
      previousMonthKey
    );

  const totalSavings =
    monthlyIncome - totalExpenses;

  const previousMonthSavings =
    monthlyIncome - previousMonthExpenses;

  const savingsRate =
    monthlyIncome > 0
      ? (totalSavings / monthlyIncome) * 100
      : 0;

  const categoryTotals =
    calculateCategoryTotals(
      expenses,
      monthKey
    );

  // Safe string indexing
  const safeBudgets = (budgets || {}) as Record<string, number | undefined>;

  const categories = Array.from(
    new Set([
      ...Object.keys(safeBudgets),
      ...Object.keys(categoryTotals),
    ])
  );

  const categoryBreakdown = categories
    .map((category) => {
      const amount =
        categoryTotals[category] || 0;

      const budget =
        Number(safeBudgets[category] || 0);

      return {
        category,
        amount,
        percentage:
          totalExpenses > 0
            ? (amount / totalExpenses) * 100
            : 0,
        budget,
        budgetUsedPercentage:
          budget > 0
            ? (amount / budget) * 100
            : 0,
      };
    })
    .filter(
      (item) =>
        item.amount > 0 || item.budget > 0
    )
    .sort(
      (a, b) => b.amount - a.amount
    );

  // Explicit <number> generic prevents reduce from inferring (number | undefined)
  const budgetTotal: number = Object.values(safeBudgets).reduce<number>(
    (sum, value) => sum + Number(value || 0),
    0
  );

  const budgetUsed = totalExpenses;

  const budgetRemaining =
    budgetTotal - budgetUsed;

  const budgetUsageRate =
    budgetTotal > 0
      ? (budgetUsed / budgetTotal) * 100
      : 0;

  const recurringMonthlyCommitment =
    recurringExpenses
      .filter((item) => item.active)
      .reduce((sum, item) => {
        if (item.frequency === "Monthly") {
          return sum + Number(item.amount || 0);
        }

        return (
          sum +
          Number(item.amount || 0) / 12
        );
      }, 0);

  const expenseChange =
    totalExpenses - previousMonthExpenses;

  const expenseChangePercentage =
    previousMonthExpenses > 0
      ? (expenseChange /
          previousMonthExpenses) *
        100
      : 0;

  const savingsChange =
    totalSavings - previousMonthSavings;

  const savingsTargetProgress =
    savingsTarget > 0
      ? Math.min(
          100,
          (Math.max(totalSavings, 0) /
            savingsTarget) *
            100
        )
      : 0;

  return {
    monthKey,
    monthLabel: getMonthLabel(monthKey),

    totalIncome: monthlyIncome,
    totalExpenses,
    totalSavings,
    savingsRate,

    budgetTotal,
    budgetUsed,
    budgetRemaining,
    budgetUsageRate,

    recurringMonthlyCommitment,

    categoryBreakdown,

    previousMonthExpenses,
    expenseChange,
    expenseChangePercentage,

    previousMonthSavings,
    savingsChange,

    savingsTarget,
    savingsTargetProgress,
  };
}

export function formatReportCurrency(
  amount: number,
  currency: "INR" | "AED"
) {
  return new Intl.NumberFormat(
    currency === "INR" ? "en-IN" : "en-AE",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }
  ).format(amount);
}

export function getExpenseChangeLabel(
  changePercentage: number
) {
  if (changePercentage === 0) {
    return "No change";
  }

  if (changePercentage > 0) {
    return `${Math.abs(
      changePercentage
    ).toFixed(1)}% higher`;
  }

  return `${Math.abs(
    changePercentage
  ).toFixed(1)}% lower`;
}

export function getBudgetStatus(
  usedPercentage: number
) {
  if (usedPercentage > 100) {
    return "over";
  }

  if (usedPercentage >= 80) {
    return "near";
  }

  return "under";
}