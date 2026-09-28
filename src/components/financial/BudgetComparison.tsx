"use client";

import {
  BudgetSummary,
} from "@/lib/budget-engine";

interface BudgetComparisonProps {
  summary: BudgetSummary;
  currency: string;
}

export default function BudgetComparison({
  summary,
  currency,
}: BudgetComparisonProps) {
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-medium text-neutral-500">
          Budget vs actual
        </p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
          How you're tracking
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Your current month's planned spending compared
          with recorded expenses.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs text-neutral-500">
            Planned
          </p>

          <p className="mt-1 font-semibold text-neutral-900">
            {currency}{" "}
            {formatAmount(
              summary.totalPlanned
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs text-neutral-500">
            Actual
          </p>

          <p className="mt-1 font-semibold text-neutral-900">
            {currency}{" "}
            {formatAmount(
              summary.totalActual
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs text-neutral-500">
            Remaining
          </p>

          <p
            className={`mt-1 font-semibold ${
              summary.remainingBudget < 0
                ? "text-red-600"
                : "text-neutral-900"
            }`}
          >
            {summary.remainingBudget < 0
              ? "-"
              : ""}
            {currency}{" "}
            {formatAmount(
              summary.remainingBudget
            )}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {summary.categories.map((item) => (
          <div
            key={item.category}
            className="rounded-2xl border border-neutral-100 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-neutral-900">
                  {item.category}
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  Planned {currency}{" "}
                  {formatAmount(item.planned)}
                  {" · "}
                  Actual {currency}{" "}
                  {formatAmount(item.actual)}
                </p>
              </div>

              <div className="text-left sm:text-right">
                {item.status === "over" && (
                  <p className="text-sm font-medium text-red-600">
                    Over budget by{" "}
                    {currency}{" "}
                    {formatAmount(
                      Math.abs(item.difference)
                    )}
                  </p>
                )}

                {item.status === "near" && (
                  <p className="text-sm font-medium text-amber-600">
                    Nearing budget
                  </p>
                )}

                {item.status === "under" && (
                  <p className="text-sm font-medium text-neutral-700">
                    {currency}{" "}
                    {formatAmount(
                      item.difference
                    )}{" "}
                    remaining
                  </p>
                )}

                {item.status === "not-set" && (
                  <p className="text-sm text-neutral-400">
                    No budget set
                  </p>
                )}
              </div>
            </div>

            {item.planned > 0 && (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    item.status === "over"
                      ? "bg-red-500"
                      : item.status === "near"
                      ? "bg-amber-500"
                      : "bg-neutral-900"
                  }`}
                  style={{
                    width: `${Math.min(
                      item.percentageUsed,
                      100
                    )}%`,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}