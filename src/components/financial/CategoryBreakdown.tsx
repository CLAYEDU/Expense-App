"use client";

import { CategoryBreakdown as CategoryData } from "@/lib/financial-engine";

interface CategoryBreakdownProps {
  data: CategoryData[];
  currency: string;
}

export default function CategoryBreakdown({
  data,
  currency,
}: CategoryBreakdownProps) {
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(amount);

  if (data.length === 0) {
    return (
      <div className="rounded-3xl border border-black/10 bg-white p-6">
        <h2 className="text-xl font-semibold text-neutral-900">
          Spending by category
        </h2>

        <p className="mt-2 text-sm text-neutral-500">
          Add some expenses to see your spending breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">
          Spending by category
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Your current month's recorded spending
        </p>
      </div>

      <div className="space-y-5">
        {data.map((item) => (
          <div key={item.category}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-800">
                  {item.category}
                </p>

                <p className="text-xs text-neutral-500">
                  {item.percentage}% of recorded spending
                </p>
              </div>

              <p className="text-sm font-semibold text-neutral-900">
                {currency} {formatAmount(item.amount)}
              </p>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-neutral-900 transition-all duration-700"
                style={{
                  width: `${Math.min(
                    item.percentage,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}