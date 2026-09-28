export type Country = "IN" | "AE";

export type Currency = "INR" | "AED";

export type IncomeFrequency =
  | "monthly"
  | "weekly"
  | "biweekly"
  | "irregular";

export interface FinancialProfile {
  country: Country;
  currency: Currency;

  monthlyIncome: number;
  incomeFrequency: IncomeFrequency;

  essentialExpenses: number;
  recurringExpenses: number;
  monthlyEmi: number;
  monthlySavings: number;
  monthlyInvestments: number;

  currentSavings: number;
  emergencyFund: number;

  hasEmi: boolean;
  hasEmergencyFund: boolean;

  financialGoals: string[];

  setupCompleted: boolean;

  createdAt?: unknown;
  updatedAt?: unknown;
}