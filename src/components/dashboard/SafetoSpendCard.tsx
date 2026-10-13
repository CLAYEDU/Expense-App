"use client";

import React from "react";
import { Zap, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";

interface SafeToSpendCardProps {
  monthlyIncome: number;
  totalExpenses: number;
  emiAmount: number;
  savingsTarget: number;
  currency: string;
}

export default function SafeToSpendCard({
  monthlyIncome,
  totalExpenses,
  emiAmount,
  savingsTarget,
  currency,
}: SafeToSpendCardProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Days in month & days remaining
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - currentDay + 1);

  // Discretionary Capital = Income - (Committed EMIs + Target Savings + Spent So Far)
  const remainingDiscretionary =
    monthlyIncome - (emiAmount + savingsTarget + totalExpenses);
  const dailyAllowance = Math.max(0, remainingDiscretionary / daysRemaining);

  // Pacing status calculation
  const calendarProgressPct = (currentDay / totalDaysInMonth) * 100;
  const burnProgressPct =
    monthlyIncome > 0 ? (totalExpenses / monthlyIncome) * 100 : 0;
  const isOverpacing = burnProgressPct > calendarProgressPct + 10;

  const fmt = (num: number) =>
    `${currency} ${Math.round(Math.abs(num)).toLocaleString("en-IN")}`;

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/85 via-white/70 to-white/50 p-6 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-emerald-400/15 blur-2xl" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-800 shadow-xs">
            <Zap size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Safe-to-Spend Daily Runway
            </h3>
            <p className="text-[11px] font-medium text-neutral-400">
              {daysRemaining} day{daysRemaining > 1 ? "s" : ""} left in cycle
            </p>
          </div>
        </div>

        {/* Dynamic Burn Velocity Badge */}
        {remainingDiscretionary <= 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-700">
            <AlertTriangle size={12} />
            Budget Depleted
          </span>
        ) : isOverpacing ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-700">
            <TrendingUp size={12} />
            High Burn Rate
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
            <ShieldCheck size={12} />
            Pacing Healthy
          </span>
        )}
      </div>

      <div className="mt-5 flex items-baseline justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tracking-tight text-neutral-900 sm:text-4xl">
              {fmt(dailyAllowance)}
            </span>
            <span className="text-xs font-bold text-neutral-400">/ day</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-neutral-500">
            {remainingDiscretionary > 0
              ? `${fmt(remainingDiscretionary)} discretionary capital remaining`
              : `Deficit of ${fmt(remainingDiscretionary)} against monthly targets`}
          </p>
        </div>

        <div className="hidden space-y-0.5 text-right text-[10px] font-semibold text-neutral-400 sm:block">
          <div>Committed EMIs: {fmt(emiAmount)}</div>
          <div>Target Savings: {fmt(savingsTarget)}</div>
        </div>
      </div>
    </div>
  );
}