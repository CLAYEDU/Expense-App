"use client";

import { useState } from "react";
import {
  deleteExpense,
  Expense,
} from "@/lib/expenses";

interface ExpenseListProps {
  uid: string;
  expenses: Expense[];
  currency: string;
  onExpenseChanged: () => void;
}

export default function ExpenseList({
  uid,
  expenses,
  currency,
  onExpenseChanged,
}: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(amount);

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this expense?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      await deleteExpense(uid, id);

      onExpenseChanged();
    } catch (error) {
      console.error(error);
      alert("Unable to delete this expense.");
    } finally {
      setDeletingId(null);
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p className="text-lg font-medium text-neutral-800">
          No expenses yet
        </p>

        <p className="mt-2 text-sm text-neutral-500">
          Your expenses will appear here after you add them.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
      <div className="border-b border-neutral-100 px-6 py-5">
        <h2 className="text-xl font-semibold text-neutral-900">
          Recent expenses
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Your recorded transactions
        </p>
      </div>

      <div className="divide-y divide-neutral-100">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="flex flex-col gap-4 px-6 py-5 transition hover:bg-neutral-50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium text-neutral-900">
                {expense.title}
              </p>

              <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
                <span>{expense.category}</span>
                <span>•</span>
                <span>{expense.date}</span>
                <span>•</span>
                <span>{expense.paymentMethod}</span>
              </div>

              {expense.note && (
                <p className="mt-2 text-sm text-neutral-500">
                  {expense.note}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-5 sm:justify-end">
              <p className="font-semibold text-neutral-900">
                {currency} {formatAmount(expense.amount)}
              </p>

              <button
                type="button"
                onClick={() => handleDelete(expense.id)}
                disabled={deletingId === expense.id}
                className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
              >
                {deletingId === expense.id
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}