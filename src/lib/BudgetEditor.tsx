"use client";

import { useEffect, useState } from "react";

import {
  BudgetMap,
  DEFAULT_BUDGETS,
  saveBudgets,
} from "@/lib/budgets";

import {
  ExpenseCategory,
} from "@/lib/expenses";

interface BudgetEditorProps {
  uid: string;
  currency: string;
  initialBudgets: BudgetMap;
  onSaved: () => void;
}

const categories =
  Object.keys(DEFAULT_BUDGETS) as ExpenseCategory[];

export default function BudgetEditor({
  uid,
  currency,
  initialBudgets,
  onSaved,
}: BudgetEditorProps) {
  const [budgets, setBudgets] =
    useState<BudgetMap>(initialBudgets);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    setBudgets(initialBudgets);
  }, [initialBudgets]);

  function updateBudget(
    category: ExpenseCategory,
    value: string
  ) {
    const amount =
      value === ""
        ? 0
        : Math.max(0, Number(value));

    setBudgets((current) => ({
      ...current,
      [category]: amount,
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setMessage("");

      await saveBudgets(uid, budgets);

      setMessage(
        "Your monthly budget has been saved."
      );

      onSaved();
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to save the budget. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  const totalBudget = Object.values(
    budgets
  ).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-medium text-neutral-500">
          Monthly planning
        </p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
          Set your spending plan
        </h2>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          These are planning targets, not restrictions.
          You can change them whenever your situation changes.
        </p>
      </div>

      <div className="space-y-3">
        {categories.map((category) => (
          <div
            key={category}
            className="flex flex-col gap-3 rounded-2xl bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-neutral-800">
                {category}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Monthly target
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400">
                {currency}
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  budgets[category] === 0
                    ? ""
                    : budgets[category]
                }
                onChange={(event) =>
                  updateBudget(
                    category,
                    event.target.value
                  )
                }
                placeholder="0"
                className="w-32 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-right text-sm outline-none transition focus:border-neutral-500"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-neutral-900 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-neutral-400">
            Total monthly budget
          </p>

          <p className="mt-1 text-xl font-semibold">
            {currency} {formatAmount(totalBudget)}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100 disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save budget"}
        </button>
      </div>

      {message && (
        <p className="mt-4 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          {message}
        </p>
      )}
    </div>
  );
}