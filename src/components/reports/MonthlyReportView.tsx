"use client";

import { useMemo } from "react";
import {
  formatReportCurrency,
  getBudgetStatus,
  getExpenseChangeLabel,
  type MonthlyReport,
} from "@/lib/monthly-reports";

type Props = {
  report: MonthlyReport;
  currency: "INR" | "AED";
};

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

export default function MonthlyReportView({
  report,
  currency,
}: Props) {
  const topCategories = useMemo(
    () =>
      report.categoryBreakdown.slice(0, 6),
    [report.categoryBreakdown]
  );

  const savingsPositive =
    report.totalSavings >= 0;

  return (
    <div className="space-y-6">
      {/* Main KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">
            Income
          </p>

          <p className="mt-2 text-2xl font-semibold text-neutral-950">
            {formatReportCurrency(
              report.totalIncome,
              currency
            )}
          </p>

          <p className="mt-2 text-xs text-neutral-500">
            Monthly income
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">
            Expenses
          </p>

          <p className="mt-2 text-2xl font-semibold text-neutral-950">
            {formatReportCurrency(
              report.totalExpenses,
              currency
            )}
          </p>

          <p className="mt-2 text-xs text-neutral-500">
            {getExpenseChangeLabel(
              report.expenseChangePercentage
            )}{" "}
            vs previous month
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">
            Savings
          </p>

          <p
            className={`mt-2 text-2xl font-semibold ${
              savingsPositive
                ? "text-emerald-700"
                : "text-red-600"
            }`}
          >
            {formatReportCurrency(
              report.totalSavings,
              currency
            )}
          </p>

          <p className="mt-2 text-xs text-neutral-500">
            {report.savingsRate.toFixed(1)}% savings rate
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">
            Recurring commitments
          </p>

          <p className="mt-2 text-2xl font-semibold text-neutral-950">
            {formatReportCurrency(
              report.recurringMonthlyCommitment,
              currency
            )}
          </p>

          <p className="mt-2 text-xs text-neutral-500">
            Estimated monthly commitment
          </p>
        </div>
      </div>

      {/* Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-neutral-500">
                Savings overview
              </p>

              <h2 className="mt-1 text-xl font-semibold text-neutral-950">
                {formatReportCurrency(
                  report.totalSavings,
                  currency
                )}
              </h2>
            </div>

            <div className="rounded-2xl bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700">
              {report.savingsRate.toFixed(1)}%
            </div>
          </div>

          {report.savingsTarget > 0 && (
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-neutral-500">
                  Monthly savings target
                </span>

                <span className="font-medium text-neutral-800">
                  {formatReportCurrency(
                    report.savingsTarget,
                    currency
                  )}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-neutral-900 transition-all"
                  style={{
                    width: `${clamp(
                      report.savingsTargetProgress
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-neutral-500">
                {report.savingsTargetProgress.toFixed(
                  0
                )}
                % of your target reached
              </p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">
                Previous month savings
              </p>

              <p className="mt-1 font-semibold">
                {formatReportCurrency(
                  report.previousMonthSavings,
                  currency
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">
                Change
              </p>

              <p
                className={`mt-1 font-semibold ${
                  report.savingsChange >= 0
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {report.savingsChange >= 0
                  ? "+"
                  : ""}
                {formatReportCurrency(
                  report.savingsChange,
                  currency
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Budget */}
        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">
            Budget performance
          </p>

          <div className="mt-1 flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold text-neutral-950">
              {formatReportCurrency(
                report.budgetUsed,
                currency
              )}
            </h2>

            <span className="text-sm text-neutral-500">
              of{" "}
              {formatReportCurrency(
                report.budgetTotal,
                currency
              )}
            </span>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full rounded-full transition-all ${
                report.budgetUsageRate > 100
                  ? "bg-red-500"
                  : report.budgetUsageRate >= 80
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{
                width: `${clamp(
                  report.budgetUsageRate
                )}%`,
              }}
            />
          </div>

          <div className="mt-3 flex justify-between text-sm">
            <span className="text-neutral-500">
              {report.budgetUsageRate.toFixed(1)}% used
            </span>

            <span
              className={
                report.budgetRemaining >= 0
                  ? "font-medium text-emerald-700"
                  : "font-medium text-red-600"
              }
            >
              {report.budgetRemaining >= 0
                ? `${formatReportCurrency(
                    report.budgetRemaining,
                    currency
                  )} remaining`
                : `${formatReportCurrency(
                    Math.abs(
                      report.budgetRemaining
                    ),
                    currency
                  )} over`}
            </span>
          </div>
        </section>
      </div>

      {/* Category analysis */}
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">
              Spending breakdown
            </p>

            <h2 className="mt-1 text-xl font-semibold text-neutral-950">
              Where your money went
            </h2>
          </div>

          <span className="text-sm text-neutral-500">
            {report.categoryBreakdown.length} categories
          </span>
        </div>

        <div className="mt-6 space-y-5">
          {topCategories.length === 0 ? (
            <div className="rounded-2xl bg-neutral-50 p-6 text-center text-sm text-neutral-500">
              No expenses recorded for this month.
            </div>
          ) : (
            topCategories.map((item) => {
              const status =
                getBudgetStatus(
                  item.budgetUsedPercentage
                );

              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {item.category}
                      </p>

                      <p className="text-xs text-neutral-500">
                        {item.percentage.toFixed(1)}% of total spending
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatReportCurrency(
                          item.amount,
                          currency
                        )}
                      </p>

                      {item.budget > 0 && (
                        <p
                          className={`text-xs ${
                            status === "over"
                              ? "text-red-600"
                              : status === "near"
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {item.budgetUsedPercentage.toFixed(
                            0
                          )}
                          % of budget
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-neutral-800 transition-all"
                      style={{
                        width: `${clamp(
                          item.percentage
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Detailed budget table */}
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-medium text-neutral-500">
            Category budget performance
          </p>

          <h2 className="mt-1 text-xl font-semibold text-neutral-950">
            Planned vs actual
          </h2>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                <th className="pb-3 font-medium">
                  Category
                </th>

                <th className="pb-3 font-medium">
                  Budget
                </th>

                <th className="pb-3 font-medium">
                  Actual
                </th>

                <th className="pb-3 font-medium">
                  Usage
                </th>

                <th className="pb-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {report.categoryBreakdown.map(
                (item) => {
                  const status =
                    getBudgetStatus(
                      item.budgetUsedPercentage
                    );

                  return (
                    <tr
                      key={item.category}
                      className="border-b border-neutral-100 last:border-0"
                    >
                      <td className="py-4 font-medium text-neutral-900">
                        {item.category}
                      </td>

                      <td className="py-4 text-neutral-600">
                        {item.budget > 0
                          ? formatReportCurrency(
                              item.budget,
                              currency
                            )
                          : "Not set"}
                      </td>

                      <td className="py-4 text-neutral-600">
                        {formatReportCurrency(
                          item.amount,
                          currency
                        )}
                      </td>

                      <td className="py-4 text-neutral-600">
                        {item.budget > 0
                          ? `${item.budgetUsedPercentage.toFixed(
                              0
                            )}%`
                          : "—"}
                      </td>

                      <td className="py-4">
                        {item.budget <= 0 ? (
                          <span className="text-neutral-400">
                            No budget
                          </span>
                        ) : (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              status === "over"
                                ? "bg-red-50 text-red-700"
                                : status === "near"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {status === "over"
                              ? "Over budget"
                              : status === "near"
                              ? "Near limit"
                              : "Within budget"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}