import {
  BudgetMap,
} from "@/lib/budgets";

import {
  Expense,
  ExpenseCategory,
} from "@/lib/expenses";

export interface BudgetAnalysis {
  category: ExpenseCategory;

  planned: number;

  actual: number;

  difference: number;

  percentageUsed: number;

  status:
    | "under"
    | "near"
    | "over"
    | "not-set";
}

export interface BudgetSummary {
  totalPlanned: number;

  totalActual: number;

  remainingBudget: number;

  percentageUsed: number;

  categoriesOverBudget: number;

  categoriesUnderBudget: number;

  categories: BudgetAnalysis[];
}

export function analyzeBudget(
  budgets: BudgetMap,
  expenses: Expense[]
): BudgetSummary {
  const currentMonth = new Date()
    .toISOString()
    .slice(0, 7);

  const currentMonthExpenses =
    expenses.filter((expense) =>
      expense.date.startsWith(currentMonth)
    );

  const categories =
    Object.keys(budgets) as ExpenseCategory[];

  const analyses: BudgetAnalysis[] =
    categories.map((category) => {
      const planned = Number(
        budgets[category] || 0
      );

      const actual =
        currentMonthExpenses
          .filter(
            (expense) =>
              expense.category === category
          )
          .reduce(
            (sum, expense) =>
              sum + Number(expense.amount || 0),
            0
          );

      const difference = planned - actual;

      const percentageUsed =
        planned > 0
          ? (actual / planned) * 100
          : actual > 0
          ? 100
          : 0;

      let status:
        | "under"
        | "near"
        | "over"
        | "not-set";

      if (planned <= 0 && actual <= 0) {
        status = "not-set";
      } else if (planned <= 0 && actual > 0) {
        status = "over";
      } else if (percentageUsed > 100) {
        status = "over";
      } else if (percentageUsed >= 80) {
        status = "near";
      } else {
        status = "under";
      }

      return {
        category,
        planned,
        actual,
        difference,
        percentageUsed,
        status,
      };
    });

  const totalPlanned = analyses.reduce(
    (sum, item) => sum + item.planned,
    0
  );

  const totalActual = analyses.reduce(
    (sum, item) => sum + item.actual,
    0
  );

  const remainingBudget =
    totalPlanned - totalActual;

  const percentageUsed =
    totalPlanned > 0
      ? (totalActual / totalPlanned) * 100
      : 0;

  const categoriesOverBudget =
    analyses.filter(
      (item) => item.status === "over"
    ).length;

  const categoriesUnderBudget =
    analyses.filter(
      (item) => item.status === "under"
    ).length;

  return {
    totalPlanned,
    totalActual,
    remainingBudget,
    percentageUsed,
    categoriesOverBudget,
    categoriesUnderBudget,
    categories: analyses,
  };
}