"use client";

import { useMemo } from "react";
import { FinancialAnalysis } from "@/lib/financial-engine";
import TwoDPieChart, { PieSegment } from "./TwoDPieChart";
import { Activity, ShieldCheck, AlertCircle } from "lucide-react";

interface FinancialStatusProps {
  analysis: FinancialAnalysis;
  currency: "INR" | "AED";
}

export default function FinancialStatus({
  analysis,
  currency,
}: FinancialStatusProps) {
  const pieData: PieSegment[] = useMemo(() => {
    // Fall back to plannedFixedOutflow if fixedCommitments is undefined
    const fixedOutflow =
      analysis.fixedCommitments ??
      (analysis as any).plannedFixedOutflow ??
      0;
    const livingOutflow = analysis.totalExpenses || 0;
    const liquidBuffer = Math.max(analysis.remainingAfterActualExpenses, 0);

    return [
      {
        label: "Fixed Commitments",
        value: fixedOutflow,
        color: "#10b981",
        darkColor: "#047857",
      },
      {
        label: "Living & Flexible Spends",
        value: livingOutflow,
        color: "#f59e0b",
        darkColor: "#b45309",
      },
      {
        label: "Liquid Buffer / Surplus",
        value: liquidBuffer,
        color: "#06b6d4",
        darkColor: "#0e7490",
      },
    ];
  }, [analysis]);

  const isHealthy = analysis.remainingAfterActualExpenses >= 0;

  return (
    <div className="relative overflow-hidden rounded-[36px] border border-white/80 bg-white/50 p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:shadow-[0_25px_60px_-10px_rgba(16,185,129,0.15)]">
      {/* Background Refracted Color Orbs */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/25 blur-[70px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-[70px]" />

      {/* Header */}
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
              <Activity size={15} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Real-Time Allocation
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-950">
            Capital Distribution
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Touch or hover any segment to inspect verified allocation across commitments and liquid buffer.
          </p>
        </div>

        {/* Status Capsule */}
        <div
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2 shadow-xs backdrop-blur-md ${
            isHealthy
              ? "border-emerald-300/80 bg-emerald-500/10 text-emerald-900"
              : "border-red-300/80 bg-red-500/10 text-red-900"
          }`}
        >
          {isHealthy ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
          <span className="text-xs font-bold">
            {isHealthy ? "Runway Secured" : "Deficit Alert"}
          </span>
        </div>
      </div>

      {/* 2D Interactive Pie Chart View */}
      <div className="relative z-10 mt-6">
        <TwoDPieChart
          data={pieData}
          currency={currency}
          totalValue={analysis.monthlyIncome}
        />
      </div>
    </div>
  );
}