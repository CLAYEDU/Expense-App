"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Info,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { getExpenses, type Expense } from "@/lib/expenses";
import { getBudgets, DEFAULT_BUDGETS, type BudgetMap } from "@/lib/budgets";
import {
  getRecurringExpenses,
  type RecurringExpense,
} from "@/lib/recurring-expenses";
import { getFinancialProfile } from "@/lib/financial-profile";
import type { FinancialProfile } from "@/types/finance";

import {
  buildMonthlyReport,
  getMonthKey,
  getMonthLabel,
  getNextMonthKey,
  getPreviousMonthKey,
} from "@/lib/monthly-reports";

import MonthlyReportView from "@/components/reports/MonthlyReportView";

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<BudgetMap>(DEFAULT_BUDGETS);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [profile, setProfile] = useState<FinancialProfile | null>(null);

  const [monthKey, setMonthKey] = useState(() => getMonthKey(new Date()));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    async function loadData() {
      if (!user) return;

      try {
        setLoading(true);

        const [expenseData, budgetData, recurringData, profileData] =
          await Promise.all([
            getExpenses(user.uid),
            getBudgets(user.uid),
            getRecurringExpenses(user.uid),
            getFinancialProfile(user.uid),
          ]);

        if (!profileData) {
          router.replace("/setup");
          return;
        }

        setExpenses(expenseData || []);
        setBudgets(budgetData || DEFAULT_BUDGETS);
        setRecurringExpenses(recurringData || []);
        setProfile(profileData as FinancialProfile);
      } catch (error) {
        console.error("Failed to load reports:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, authLoading, router]);

  const report = useMemo(() => {
    if (!profile) return null;

    return buildMonthlyReport({
      expenses,
      budgets,
      recurringExpenses,
      monthKey,
      monthlyIncome: Number(profile.monthlyIncome) || 0,
      savingsTarget: Number(profile.monthlySavings) || 0,
    });
  }, [profile, expenses, budgets, recurringExpenses, monthKey]);

  function exportCSV() {
    if (!report || !profile) return;

    const rows = [
      ["Monthly Financial Report", report.monthLabel],
      [],
      ["Summary", ""],
      ["Income", report.totalIncome],
      ["Total Expenses", report.totalExpenses],
      ["Savings", report.totalSavings],
      ["Savings Rate", `${report.savingsRate.toFixed(1)}%`],
      ["Budget", report.budgetTotal],
      ["Budget Used", report.budgetUsed],
      [
        "Recurring Monthly Commitment",
        report.recurringMonthlyCommitment,
      ],
      [],
      ["Category", "Budget", "Actual", "Usage %"],
      ...report.categoryBreakdown.map((item) => [
        item.category,
        item.budget,
        item.amount,
        item.budget > 0
          ? `${item.budgetUsedPercentage.toFixed(1)}%`
          : "Not set",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");

            if (
              value.includes(",") ||
              value.includes('"') ||
              value.includes("\n")
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }

            return value;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `financial-report-${monthKey}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  // Loading state with Apple Ambient Glass skeleton
  if (authLoading || loading || !profile) {
    return (
      <main className="relative min-h-screen bg-[#edf2ee] p-6 text-neutral-900 overflow-hidden">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-24 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-emerald-400/40 via-teal-300/30 to-emerald-200/20 blur-[130px]" />
          <div className="absolute top-[28%] -left-32 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-teal-400/35 via-emerald-300/30 to-cyan-300/25 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="h-9 w-48 animate-pulse rounded-2xl bg-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-xl" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-[32px] border border-white/80 bg-white/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl"
              />
            ))}
          </div>

          <div className="mt-8 h-96 animate-pulse rounded-[36px] border border-white/80 bg-white/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl" />
        </div>
      </main>
    );
  }

  if (!report) {
    return null;
  }

  const currentMonthKey = getMonthKey(new Date());
  const isFutureMonth = monthKey > currentMonthKey;

  return (
    <main className="relative min-h-screen bg-[#edf2ee] text-neutral-900 antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* ================= APPLE AMBIENT LIVING AURORA BACKGROUND ================= */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Vibrant Emerald Aurora (Top-Right) */}
        <div className="absolute -top-36 -right-24 h-[620px] w-[620px] rounded-full bg-gradient-to-br from-emerald-400/50 via-teal-300/40 to-emerald-200/25 blur-[120px]" />
        {/* Electric Mint & Cyan Aurora (Left Edge) */}
        <div className="absolute top-[25%] -left-36 h-[650px] w-[650px] rounded-full bg-gradient-to-tr from-teal-400/40 via-emerald-300/35 to-cyan-300/30 blur-[140px]" />
        {/* Soft Depth Aura (Bottom-Right) */}
        <div className="absolute -bottom-36 right-[15%] h-[580px] w-[580px] rounded-full bg-gradient-to-t from-cyan-300/35 via-emerald-200/30 to-transparent blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Navigation Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/85 bg-white/70 px-4 py-2.5 text-xs font-bold text-neutral-800 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:bg-white hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.08)] active:scale-95"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        </div>

        {/* ================= HEADER ================= */}
        <header className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/70 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xl">
                <Sparkles size={14} className="text-emerald-600 animate-pulse" />
                <span>Executive Ledger Analysis</span>
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
                Monthly Reports
              </h1>

              <p className="mt-1 text-xs sm:text-sm text-neutral-500 max-w-2xl leading-relaxed">
                Understand where your money went, evaluate budget accuracy, and track how much discretionary capital was preserved.
              </p>
            </div>

            <button
              type="button"
              onClick={exportCSV}
              className="inline-flex items-center gap-2 self-start rounded-2xl bg-[#173d32] px-5 py-3 text-xs font-bold text-white shadow-[0_12px_28px_rgba(23,61,50,0.25)] transition hover:bg-[#1f5c4a] hover:scale-105 active:scale-95 lg:self-auto"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>

          {/* ================= FROSTED GLASS MONTH SELECTOR ================= */}
          <div className="mt-6 flex items-center justify-between overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-2 sm:p-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl">
            <button
              type="button"
              onClick={() => setMonthKey(getPreviousMonthKey(monthKey))}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/90 bg-white/70 px-4 py-2.5 text-xs font-bold text-neutral-800 shadow-xs backdrop-blur-md transition hover:bg-white hover:shadow-sm active:scale-95"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex items-center gap-2.5 text-center">
              <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-800 shadow-xs">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Report Period
                </p>
                <p className="text-sm sm:text-base font-black tracking-tight text-neutral-950">
                  {getMonthLabel(monthKey)}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isFutureMonth}
              onClick={() => setMonthKey(getNextMonthKey(monthKey))}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/90 bg-white/70 px-4 py-2.5 text-xs font-bold text-neutral-800 shadow-xs backdrop-blur-md transition hover:bg-white hover:shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </header>

        {/* ================= REPORT VIEW CONTAINER ================= */}
        <div className="overflow-hidden rounded-[36px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:shadow-[0_25px_50px_-10px_rgba(16,185,129,0.12)]">
          <MonthlyReportView
            report={report}
            currency={profile.currency}
          />
        </div>

        {/* ================= FINANCIAL NOTE FOOTER PILL ================= */}
        <div className="mt-8 overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-5 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl">
          <div className="flex items-start gap-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-800 shadow-xs">
              <Info size={16} />
            </div>
            <p className="text-xs font-semibold leading-relaxed text-neutral-600">
              This statement is computed from verified inflow, transactions, category targets, and recurring obligations recorded in your workspace. Synchronizing records regularly sharpens historical variance accuracy.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}