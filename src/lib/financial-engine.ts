import { Expense } from "@/lib/expenses";

export interface FinancialProfileForEngine {
  monthlyIncome: number;
  essentialExpenses: number;
  otherFixedExpenses: number;
  emiAmount: number;
  currentSavings: number;
  currentInvestments: number;
  currentEmergencyFund?: number;
  monthlySavingsTarget?: number;
  currency: "INR" | "AED";
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface FinancialAnalysis {
  fixedCommitments: number;
  monthlyIncome: number;

  totalExpenses: number;
  essentialExpenses: number;
  otherFixedExpenses: number;
  emiAmount: number;

  plannedFixedOutflow: number;
  remainingAfterSetup: number;
  remainingAfterActualExpenses: number;

  savingsRate: number;

  currentSavings: number;
  currentInvestments: number;
  currentEmergencyFund: number;

  emergencyFundTarget: number;
  emergencyFundGap: number;

  categoryBreakdown: CategoryBreakdown[];

  status: "healthy" | "watch" | "tight" | "negative";

  statusMessage: string;

  recommendation: string;
  emergencyRecommendation: string;
  longTermRecommendation: string;
}

function round(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function getCurrentMonthExpenses(expenses: Expense[] = []): Expense[] {
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-09"

  return expenses.filter((expense) => {
    if (!expense?.date) return false;

    const rawDate: unknown = expense.date;
    let dateStr = "";

    if (typeof rawDate === "string") {
      dateStr = rawDate;
    } else if (rawDate instanceof Date) {
      dateStr = rawDate.toISOString();
    } else if (
      rawDate &&
      typeof rawDate === "object" &&
      "toDate" in rawDate &&
      typeof (rawDate as { toDate: () => Date }).toDate === "function"
    ) {
      dateStr = (rawDate as { toDate: () => Date }).toDate().toISOString();
    }

    return dateStr.startsWith(currentMonth);
  });
}

export function analyzeFinances(
  profile: FinancialProfileForEngine,
  expenses: Expense[] = []
): FinancialAnalysis {
  const monthlyIncome = Number(profile.monthlyIncome) || 0;
  const essentialExpenses = Number(profile.essentialExpenses) || 0;
  const otherFixedExpenses = Number(profile.otherFixedExpenses) || 0;
  const emiAmount = Number(profile.emiAmount) || 0;
  const currentSavings = Number(profile.currentSavings) || 0;
  const currentInvestments = Number(profile.currentInvestments) || 0;

  const monthlyExpenses = getCurrentMonthExpenses(expenses);

  const totalExpenses = monthlyExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const plannedFixedOutflow =
    essentialExpenses + otherFixedExpenses + emiAmount;

  const remainingAfterSetup = monthlyIncome - plannedFixedOutflow;

  const remainingAfterActualExpenses = monthlyIncome - totalExpenses;

  const savingsRate =
    monthlyIncome > 0
      ? (remainingAfterActualExpenses / monthlyIncome) * 100
      : 0;

  /*
   * Category breakdown
   */
  const categoryTotals: Record<string, number> = {};

  monthlyExpenses.forEach((expense) => {
    const category = expense.category || "Uncategorized";

    categoryTotals[category] =
      (categoryTotals[category] || 0) + Number(expense.amount || 0);
  });

  const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount: round(amount),
      percentage:
        totalExpenses > 0 ? round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  /*
   * Emergency fund calculation
   * Baseline is 3 months of essential + other fixed + EMI commitments
   */
  const monthlyEssentialNeed =
    essentialExpenses + otherFixedExpenses + emiAmount;

  const emergencyFundTarget = monthlyEssentialNeed * 3;

  const currentEmergencyFund = Number(
    profile.currentEmergencyFund ?? currentSavings ?? 0
  );

  const emergencyFundGap = Math.max(
    0,
    emergencyFundTarget - currentEmergencyFund
  );

  /*
   * Financial status
   */
  let status: FinancialAnalysis["status"];
  let statusMessage: string;

  if (totalExpenses > monthlyIncome) {
    status = "negative";
    statusMessage =
      "Your recorded spending is currently higher than your monthly income.";
  } else if (savingsRate < 10) {
    status = "tight";
    statusMessage =
      "Your current spending leaves only a small monthly buffer.";
  } else if (savingsRate < 20) {
    status = "watch";
    statusMessage =
      "You have a positive monthly buffer, but there is room to strengthen it.";
  } else {
    status = "healthy";
    statusMessage =
      "You're currently keeping a meaningful portion of your income available after recorded spending.";
  }

  /*
   * Savings recommendation
   */
  let suggestedSavingsRate = 10;

  if (monthlyIncome >= 30000) {
    suggestedSavingsRate = 20;
  } else if (monthlyIncome >= 15000) {
    suggestedSavingsRate = 15;
  }

  const basicSavingsTarget = monthlyIncome * (suggestedSavingsRate / 100);

  const availableForSaving = Math.max(0, remainingAfterActualExpenses);

  const suggestedMonthlySaving = Math.min(
    basicSavingsTarget,
    availableForSaving
  );

  let recommendation: string;

  if (availableForSaving <= 0) {
    recommendation =
      "Your current recorded spending is leaving little or no monthly surplus. Review the largest spending categories before increasing your savings target.";
  } else if (emergencyFundGap > 0) {
    recommendation = `Based on your current profile, setting aside around ${round(
      suggestedMonthlySaving
    )} ${profile.currency} per month may help strengthen your financial buffer while you work toward your existing emergency-fund target.`;
  } else {
    recommendation =
      "Your emergency-fund position is currently covered against the app's baseline target. You could consider directing part of your available monthly surplus toward your longer-term goals.";
  }

  /*
   * Emergency fund message
   */
  let emergencyRecommendation: string;

  if (emergencyFundTarget <= 0) {
    emergencyRecommendation =
      "Add your regular essential expenses to your financial setup to calculate an emergency-fund target.";
  } else if (emergencyFundGap > 0) {
    emergencyRecommendation = `Your current emergency-fund position is ${round(
      currentEmergencyFund
    )} ${profile.currency}. The current 3-month baseline is ${round(
      emergencyFundTarget
    )} ${profile.currency}.`;
  } else {
    emergencyRecommendation =
      "Your recorded emergency-fund amount currently meets the app's 3-month baseline.";
  }

  /*
   * Long-term planning message
   */
  let longTermRecommendation: string;

  if (emergencyFundGap > 0 || emiAmount > 0) {
    longTermRecommendation =
      "For long-term planning, consider strengthening your financial buffer and accounting for existing EMI obligations before increasing investment commitments.";
  } else if (availableForSaving > 0) {
    longTermRecommendation =
      "With a positive monthly surplus and your basic financial buffer in place, it may be suitable to consider a SIP plan for long-term planning alongside other goal-based savings.";
  } else {
    longTermRecommendation =
      "Focus first on creating a consistent monthly surplus. Long-term planning becomes easier once regular savings are sustainable.";
  }

  return {
    monthlyIncome: round(monthlyIncome),
    fixedCommitments: round(plannedFixedOutflow),

    totalExpenses: round(totalExpenses),
    essentialExpenses: round(essentialExpenses),
    otherFixedExpenses: round(otherFixedExpenses),
    emiAmount: round(emiAmount),

    plannedFixedOutflow: round(plannedFixedOutflow),
    remainingAfterSetup: round(remainingAfterSetup),
    remainingAfterActualExpenses: round(remainingAfterActualExpenses),

    savingsRate: round(savingsRate),

    currentSavings: round(currentSavings),
    currentInvestments: round(currentInvestments),
    currentEmergencyFund: round(currentEmergencyFund),

    emergencyFundTarget: round(emergencyFundTarget),
    emergencyFundGap: round(emergencyFundGap),

    categoryBreakdown,

    status,
    statusMessage,

    recommendation,
    emergencyRecommendation,
    longTermRecommendation,
  };
}