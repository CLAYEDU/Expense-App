"use client";

import type {
  FinancialInsight,
} from "@/lib/financial-insights";

type Props = {
  insights: FinancialInsight[];
  limit?: number;
};

function getStyles(
  type: FinancialInsight["type"]
) {
  switch (type) {
    case "positive":
      return {
        container:
          "border-emerald-200 bg-emerald-50",
        icon: "✓",
        iconClass:
          "bg-emerald-100 text-emerald-700",
        title: "text-emerald-950",
        message: "text-emerald-800",
      };

    case "warning":
      return {
        container:
          "border-amber-200 bg-amber-50",
        icon: "!",
        iconClass:
          "bg-amber-100 text-amber-700",
        title: "text-amber-950",
        message: "text-amber-800",
      };

    case "attention":
      return {
        container:
          "border-red-200 bg-red-50",
        icon: "!",
        iconClass:
          "bg-red-100 text-red-700",
        title: "text-red-950",
        message: "text-red-800",
      };

    default:
      return {
        container:
          "border-neutral-200 bg-neutral-50",
        icon: "i",
        iconClass:
          "bg-neutral-200 text-neutral-700",
        title: "text-neutral-950",
        message: "text-neutral-700",
      };
  }
}

export default function FinancialInsights({
  insights,
  limit = 6,
}: Props) {
  const visibleInsights =
    insights.slice(0, limit);

  if (visibleInsights.length === 0) {
    return (
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-sm font-semibold text-neutral-700">
            ✦
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-500">
              Financial insights
            </p>

            <h2 className="text-xl font-semibold text-neutral-950">
              No insights yet
            </h2>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-neutral-500">
          Add some expenses, budgets, or financial
          planning details to start receiving
          personalized insights.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">
            Financial insights
          </p>

          <h2 className="mt-1 text-xl font-semibold text-neutral-950">
            Based on your current numbers
          </h2>
        </div>

        <div className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600">
          {insights.length} insight
          {insights.length === 1
            ? ""
            : "s"}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {visibleInsights.map(
          (insight) => {
            const styles =
              getStyles(insight.type);

            return (
              <div
                key={insight.id}
                className={`rounded-2xl border p-4 ${styles.container}`}
              >
                <div className="flex gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${styles.iconClass}`}
                  >
                    {styles.icon}
                  </div>

                  <div className="min-w-0">
                    <h3
                      className={`text-sm font-semibold ${styles.title}`}
                    >
                      {insight.title}
                    </h3>

                    <p
                      className={`mt-1 text-sm leading-6 ${styles.message}`}
                    >
                      {insight.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>
    </section>
  );
}