"use client";

import { FinancialAnalysis } from "@/lib/financial-engine";

interface FinancialStatusProps {
  analysis: FinancialAnalysis;
  currency: string;
}

export default function FinancialStatus({
  analysis,
  currency,
}: FinancialStatusProps) {
  const amount = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(
    Math.abs(analysis.remainingAfterActualExpenses)
  );

  const statusTitle = {
    healthy: "Positive monthly position",
    watch: "Watch your monthly spending",
    tight: "Monthly buffer is tight",
    negative: "Spending is above income",
  }[analysis.status];

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100">
          {analysis.status === "healthy"
            ? "✓"
            : analysis.status === "negative"
            ? "!"
            : "•"}
        </div>

        <div>
          <p className="text-sm font-medium text-neutral-500">
            Financial status
          </p>

          <h2 className="mt-1 text-xl font-semibold text-neutral-900">
            {statusTitle}
          </h2>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {analysis.statusMessage}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs text-neutral-500">
            Remaining after expenses
          </p>

          <p className="mt-1 text-lg font-semibold text-neutral-900">
            {analysis.remainingAfterActualExpenses < 0
              ? "-"
              : ""}
            {currency} {amount}
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs text-neutral-500">
            Current savings rate
          </p>

          <p className="mt-1 text-lg font-semibold text-neutral-900">
            {analysis.savingsRate}%
          </p>
        </div>
      </div>
    </div>
  );
}