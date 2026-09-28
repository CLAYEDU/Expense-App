"use client";

import { Expense } from "@/lib/expenses";

interface ExpenseSummaryProps {
  expenses: Expense[];
  currency: string;
}

export default function ExpenseSummary({
  expenses,
  currency,
}: ExpenseSummaryProps) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthlyExpenses = expenses.filter((expense) =>
    expense.date.startsWith(currentMonth)
  );

  const total = monthlyExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const count = monthlyExpenses.length;

  const categories = new Set(
    monthlyExpenses.map((expense) => expense.category)
  );

  const formatAmount = (value: number) =>
    new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-sm text-neutral-500">
          This month
        </p>

        <p className="mt-2 text-2xl font-semibold text-neutral-900">
          {currency} {formatAmount(total)}
        </p>

        <p className="mt-1 text-xs text-neutral-500">
          Total recorded spending
        </p>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-sm text-neutral-500">
          Transactions
        </p>

        <p className="mt-2 text-2xl font-semibold text-neutral-900">
          {count}
        </p>

        <p className="mt-1 text-xs text-neutral-500">
          Expenses recorded this month
        </p>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-sm text-neutral-500">
          Categories
        </p>

        <p className="mt-2 text-2xl font-semibold text-neutral-900">
          {categories.size}
        </p>

        <p className="mt-1 text-xs text-neutral-500">
          Categories used this month
        </p>
      </div>
    </div>
  );
}