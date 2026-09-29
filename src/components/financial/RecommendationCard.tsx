"use client";

import { AlertTriangle, CheckCircle, Info, PiggyBank, Target } from "lucide-react";
import type { Recommendation } from "@/lib/recommendations";

export function RecommendationCard({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const getIcon = () => {
    switch (recommendation.type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "positive":
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case "saving":
        return <PiggyBank className="h-5 w-5 text-blue-600" />;
      case "planning":
        return <Target className="h-5 w-5 text-purple-600" />;
      default:
        return <Info className="h-5 w-5 text-neutral-600" />;
    }
  };

  const getCardStyle = () => {
    switch (recommendation.type) {
      case "warning":
        return "border-amber-200 bg-amber-50/40 text-amber-900";
      case "positive":
        return "border-emerald-200 bg-emerald-50/40 text-emerald-900";
      case "saving":
        return "border-blue-200 bg-blue-50/40 text-blue-900";
      case "planning":
        return "border-purple-200 bg-purple-50/40 text-purple-900";
      default:
        return "border-neutral-200 bg-white text-neutral-900";
    }
  };

  return (
    <div
      className={`flex items-start gap-4 rounded-3xl border p-5 shadow-xs transition ${getCardStyle()}`}
    >
      <div className="mt-0.5 rounded-2xl bg-white p-2.5 shadow-xs border border-neutral-100 shrink-0">
        {getIcon()}
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-neutral-900 text-sm sm:text-base">
            {recommendation.title}
          </h3>
          {recommendation.category && (
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-neutral-600 border border-neutral-200 shadow-xs">
              {recommendation.category}
            </span>
          )}
        </div>

        <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-neutral-600">
          {recommendation.message}
        </p>
      </div>
    </div>
  );
}

export default RecommendationCard;