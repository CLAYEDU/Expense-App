export type PaymentMethod =
  | "cash"
  | "card"
  | "upi"
  | "bank_transfer"
  | "wallet"
  | "other";

export type ExpenseSource =
  | "manual"
  | "csv"
  | "bank"
  | "payment_api";

export interface Expense {
  id?: string;

  date: string;

  description: string;

  amount: number;

  currency: "INR" | "AED";

  category: string;

  group:
    | "essential"
    | "lifestyle"
    | "financial"
    | "other";

  paymentMethod: PaymentMethod;

  source: ExpenseSource;

  notes?: string;

  createdAt?: unknown;
}