import type { Expense } from "./expenses";
import type { BudgetMap } from "./budgets";
import type { RecurringExpense } from "./recurring-expenses";

export type InsightType =
  | "positive"
  | "warning"
  | "attention"
  | "info";

export type InsightPriority =
  | "high"
  | "medium"
  | "low";

export type FinancialInsight = {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  message: string;
  category?: string;
};

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

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function formatCurrency(
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
  ).format(Math.round(amount));
}

function getCurrentMonthExpenses(
  expenses: Expense[]
) {
  const monthKey = getMonthKey();

  return expenses.filter((expense) =>
    expense.date?.startsWith(monthKey)
  );
}

function getCategoryTotals(
  expenses: Expense[]
) {
  const totals: Record<string, number> = {};

  expenses.forEach((expense) => {
    const category =
      expense.category || "Other";

    totals[category] =
      (totals[category] || 0) +
      Number(expense.amount || 0);
  });

  return totals;
}

function getActiveRecurringMonthlyAmount(
  recurringExpenses: RecurringExpense[]
) {
  return recurringExpenses
    .filter((item) => item.active)
    .reduce((total, item) => {
      if (item.frequency === "Monthly") {
        return total + Number(item.amount || 0);
      }

      return (
        total +
        Number(item.amount || 0) / 12
      );
    }, 0);
}

export function generateFinancialInsights({
  profile,
  expenses,
  budgets,
  recurringExpenses,
}: {
  profile: FinancialProfile;
  expenses: Expense[];
  budgets: BudgetMap;
  recurringExpenses: RecurringExpense[];
}): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  const monthlyExpenses =
    getCurrentMonthExpenses(expenses);

  const categoryTotals =
    getCategoryTotals(monthlyExpenses);

  const totalExpenses =
    monthlyExpenses.reduce(
      (sum, expense) =>
        sum + Number(expense.amount || 0),
      0
    );

  const income =
    Number(profile.monthlyIncome || 0);

  const emi =
    Number(profile.emiAmount || 0);

  const essential =
    Number(profile.essentialExpenses || 0);

  const fixed =
    Number(profile.otherFixedExpenses || 0);

  const emergencyFund =
    Number(
      profile.currentEmergencyFund || 0
    );

  const savingsTarget =
    Number(
      profile.monthlySavingsTarget || 0
    );

  const recurringMonthly =
    getActiveRecurringMonthlyAmount(
      recurringExpenses
    );

  const availableAfterRecordedExpenses =
    income - totalExpenses;

  const plannedFixedCommitments =
    essential +
    fixed +
    emi +
    recurringMonthly;

  const plannedFlexibleAmount =
    income - plannedFixedCommitments;

  /*
   * 1. Income vs spending
   */
  if (
    income > 0 &&
    totalExpenses > income
  ) {
    insights.push({
      id: "income-exceeded",
      type: "attention",
      priority: "high",
      title: "Spending has exceeded income",
      message: `Your recorded expenses are ${formatCurrency(
        totalExpenses - income,
        profile.currency
      )} above your monthly income. Consider reviewing your largest flexible spending categories.`,
    });
  } else if (
    income > 0 &&
    totalExpenses <= income * 0.7
  ) {
    insights.push({
      id: "spending-controlled",
      type: "positive",
      priority: "medium",
      title: "Spending is currently controlled",
      message: `You have used about ${Math.round(
        (totalExpenses / income) * 100
      )}% of your monthly income in recorded expenses so far.`,
    });
  }

  /*
   * 2. Savings
   */
  const estimatedSavings =
    income - totalExpenses;

  if (
    savingsTarget > 0 &&
    estimatedSavings >= savingsTarget
  ) {
    insights.push({
      id: "savings-target-reached",
      type: "positive",
      priority: "high",
      title: "Your savings target is on track",
      message: `Based on the expenses recorded so far, you have approximately ${formatCurrency(
        estimatedSavings,
        profile.currency
      )} available after expenses, compared with your ${formatCurrency(
        savingsTarget,
        profile.currency
      )} monthly savings target.`,
    });
  } else if (
    savingsTarget > 0 &&
    estimatedSavings >= 0
  ) {
    insights.push({
      id: "savings-target-progress",
      type: "info",
      priority: "medium",
      title: "You are building toward your savings target",
      message: `Approximately ${formatCurrency(
        Math.max(estimatedSavings, 0),
        profile.currency
      )} remains after recorded expenses. Your monthly target is ${formatCurrency(
        savingsTarget,
        profile.currency
      )}.`,
    });
  }

  /*
   * 3. EMI awareness
   */
  if (emi > 0 && income > 0) {
    const emiRatio =
      (emi / income) * 100;

    if (emiRatio >= 30) {
      insights.push({
        id: "emi-high-share",
        type: "warning",
        priority: "high",
        title: "EMI is taking a significant share of income",
        message: `Your EMI is approximately ${emiRatio.toFixed(
          0
        )}% of your monthly income. When planning savings, keep the EMI commitment and essential expenses in mind first.`,
      });
    } else {
      insights.push({
        id: "emi-accounted",
        type: "info",
        priority: "low",
        title: "EMI included in your planning",
        message: `Your ${formatCurrency(
          emi,
          profile.currency
        )} monthly EMI is being considered when estimating available money for savings and flexible spending.`,
      });
    }
  }

  /*
   * 4. Emergency fund
   *
   * Use essential + fixed + EMI as the
   * base monthly commitment.
   */
  const emergencyFundMonthlyBase =
    essential + fixed + emi;

  const emergencyFundTarget =
    emergencyFundMonthlyBase * 6;

  if (
    emergencyFundTarget > 0 &&
    emergencyFund >= emergencyFundTarget
  ) {
    insights.push({
      id: "emergency-fund-covered",
      type: "positive",
      priority: "medium",
      title: "Emergency fund is well established",
      message: `Your recorded emergency fund of ${formatCurrency(
        emergencyFund,
        profile.currency
      )} is above the current six-month planning reference of approximately ${formatCurrency(
        emergencyFundTarget,
        profile.currency
      )}.`,
    });
  } else if (
    emergencyFundTarget > 0 &&
    emergencyFund > 0
  ) {
    const remaining =
      emergencyFundTarget -
      emergencyFund;

    insights.push({
      id: "emergency-fund-progress",
      type: "info",
      priority: "medium",
      title: "Emergency fund is building",
      message: `Your current emergency fund is ${formatCurrency(
        emergencyFund,
        profile.currency
      )}. Based on your essential, fixed, and EMI commitments, the six-month planning reference is approximately ${formatCurrency(
        emergencyFundTarget,
        profile.currency
      )}, leaving about ${formatCurrency(
        Math.max(remaining, 0),
        profile.currency
      )} toward that reference.`,
    });
  } else if (
    emergencyFundTarget > 0
  ) {
    insights.push({
      id: "emergency-fund-start",
      type: "attention",
      priority: "medium",
      title: "Consider building an emergency fund",
      message: `Your essential, fixed, and EMI commitments are approximately ${formatCurrency(
        emergencyFundMonthlyBase,
        profile.currency
      )} per month. An emergency reserve can help cover unexpected expenses.`,
    });
  }

  /*
   * 5. Budget analysis
   */
  Object.entries(budgets || {}).forEach(
    ([category, budget]) => {
      const planned =
        Number(budget || 0);

      if (planned <= 0) return;

      const actual =
        categoryTotals[category] || 0;

      const percentage =
        (actual / planned) * 100;

      if (percentage > 100) {
        insights.push({
          id: `budget-over-${category}`,
          type: "warning",
          priority: "high",
          title: `${category} is over budget`,
          message: `You have recorded ${formatCurrency(
            actual,
            profile.currency
          )} against a planned ${formatCurrency(
            planned,
            profile.currency
          )}.`,
          category,
        });
      } else if (percentage >= 80) {
        insights.push({
          id: `budget-near-${category}`,
          type: "warning",
          priority: "medium",
          title: `${category} is approaching its budget`,
          message: `You have used approximately ${percentage.toFixed(
            0
          )}% of your ${category} budget.`,
          category,
        });
      }
    }
  );

  /*
   * 6. Largest spending category
   */
  const categoryEntries =
    Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1]
    );

  if (categoryEntries.length > 0) {
    const [largestCategory, largestAmount] =
      categoryEntries[0];

    const largestPercentage =
      totalExpenses > 0
        ? (largestAmount / totalExpenses) *
          100
        : 0;

    insights.push({
      id: "largest-category",
      type: "info",
      priority: "low",
      title: `${largestCategory} is your largest spending category`,
      message: `${formatCurrency(
        largestAmount,
        profile.currency
      )} has been recorded here this month, representing approximately ${largestPercentage.toFixed(
        0
      )}% of your recorded spending.`,
      category: largestCategory,
    });
  }

  /*
   * 7. Recurring commitments
   */
  if (
    recurringMonthly > 0 &&
    income > 0
  ) {
    const recurringRatio =
      (recurringMonthly / income) *
      100;

    if (recurringRatio >= 40) {
      insights.push({
        id: "recurring-high",
        type: "warning",
        priority: "high",
        title: "Recurring commitments are significant",
        message: `Your active recurring commitments are approximately ${formatCurrency(
          recurringMonthly,
          profile.currency
        )} per month, around ${recurringRatio.toFixed(
          0
        )}% of your monthly income.`,
      });
    } else {
      insights.push({
        id: "recurring-controlled",
        type: "info",
        priority: "low",
        title: "Recurring commitments are included",
        message: `Approximately ${formatCurrency(
          recurringMonthly,
          profile.currency
        )} per month is currently committed to active recurring payments.`,
      });
    }
  }

  /*
   * 8. Available flexible amount
   */
  if (
    income > 0 &&
    plannedFlexibleAmount > 0
  ) {
    insights.push({
      id: "flexible-amount",
      type: "positive",
      priority: "medium",
      title: "You have some planned flexibility",
      message: `After essential expenses, fixed commitments, EMI, and active recurring payments, approximately ${formatCurrency(
        plannedFlexibleAmount,
        profile.currency
      )} remains based on your current setup.`,
    });
  }

  /*
   * 9. Existing investments
   */
  if (
    profile.currentInvestments > 0
  ) {
    insights.push({
      id: "existing-investments",
      type: "positive",
      priority: "low",
      title: "You already have investments recorded",
      message: `Your current investment balance is ${formatCurrency(
        profile.currentInvestments,
        profile.currency
      )}. Your planning view will consider this alongside your savings and other financial resources.`,
    });
  }

  /*
   * 10. Soft long-term planning suggestion
   */
  if (
    estimatedSavings > 0 &&
    estimatedSavings >=
      Math.max(500, income * 0.1)
  ) {
    insights.push({
      id: "long-term-planning",
      type: "info",
      priority: "low",
      title: "You may have room for long-term planning",
      message:
        "If your emergency savings and near-term needs are adequately covered, it may be suitable to consider a SIP plan or another long-term investment approach as part of your future planning.",
    });
  }

  /*
   * Sort by priority.
   */
  const priorityOrder: Record<
    InsightPriority,
    number
  > = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return insights.sort(
    (a, b) =>
      priorityOrder[a.priority] -
      priorityOrder[b.priority]
  );
}