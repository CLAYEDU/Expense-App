"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, UploadCloud, Sparkles, Receipt } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { getExpenses, Expense } from "@/lib/expenses";
import { getFinancialProfile } from "@/lib/financial-profile";

import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import ExpenseSummary from "@/components/ExpenseSummary";

interface FinancialProfile {
  country: "IN" | "AE";
  currency: "INR" | "AED";
}

export default function ExpensesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profile, setProfile] = useState<FinancialProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError("");

      const [expenseData, financialProfile] = await Promise.all([
        getExpenses(user.uid),
        getFinancialProfile(user.uid),
      ]);

      if (!financialProfile) {
        router.replace("/setup");
        return;
      }

      setExpenses(expenseData);
      setProfile(financialProfile);
    } catch (err) {
      console.error(err);
      setError("Unable to load your expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }

    if (user) {
      loadData();
    }
  }, [authLoading, user, router, loadData]);

  // Loading State with Apple Glass Skeleton
  if (authLoading || loading) {
    return (
      <main className="relative min-h-screen bg-[#edf2ee] p-6 text-neutral-900 overflow-hidden">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-24 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-emerald-400/40 via-teal-300/30 to-emerald-200/20 blur-[130px]" />
          <div className="absolute top-[28%] -left-32 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-teal-400/35 via-emerald-300/30 to-cyan-300/25 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="h-9 w-48 animate-pulse rounded-2xl bg-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-xl" />

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-[32px] border border-white/80 bg-white/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <main className="relative min-h-screen bg-[#edf2ee] text-neutral-900 antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* ================= APPLE AMBIENT LIVING AURORA BACKGROUND ================= */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Vibrant Emerald Aurora (Top-Right) */}
        <div className="absolute -top-36 -right-24 h-[620px] w-[620px] rounded-full bg-gradient-to-br from-emerald-400/50 via-teal-300/40 to-emerald-200/25 blur-[120px]" />
        {/* Electric Mint & Cyan Aurora (Left Edge) */}
        <div className="absolute top-[25%] -left-36 h-[650px] w-[650px] rounded-full bg-gradient-to-tr from-teal-400/40 via-emerald-300/35 to-cyan-300/30 blur-[140px]" />
        {/* Soft Cyan Depth Aura (Bottom-Right) */}
        <div className="absolute -bottom-36 right-[15%] h-[580px] w-[580px] rounded-full bg-gradient-to-t from-cyan-300/35 via-emerald-200/30 to-transparent blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ================= HEADER ================= */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/70 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xl">
              <Sparkles size={14} className="text-emerald-600 animate-pulse" />
              <span>Cash Outflow Stream</span>
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
              Expenses
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-neutral-500 max-w-xl leading-relaxed">
              Track real-time outflows, maintain runway transparency, and synchronize daily spending with your monthly plan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/expenses/import")}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#173d32] px-5 py-3 text-xs font-bold text-white shadow-[0_12px_28px_rgba(23,61,50,0.25)] transition hover:bg-[#1f5c4a] hover:scale-105 active:scale-95"
            >
              <UploadCloud size={16} />
              Import CSV
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/85 bg-white/70 px-5 py-3 text-xs font-bold text-neutral-800 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:bg-white hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.08)] active:scale-95"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </button>
          </div>
        </header>

        {/* Error Alert Pill */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-300/80 bg-red-50/80 p-4 text-xs font-bold text-red-700 shadow-sm backdrop-blur-xl">
            {error}
          </div>
        )}

        {/* ================= SUMMARY SECTION ================= */}
        <div className="overflow-hidden rounded-[36px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:shadow-[0_25px_50px_-10px_rgba(16,185,129,0.12)]">
          <ExpenseSummary
            expenses={expenses}
            currency={profile.currency}
          />
        </div>

        {/* ================= FORM & LIST SECTION ================= */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[430px_1fr]">
          {/* Add Expense Form Card */}
          <div className="overflow-hidden rounded-[36px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 sm:p-7 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:shadow-[0_25px_50px_-10px_rgba(16,185,129,0.12)]">
            <div className="mb-5 flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-800 shadow-sm">
                  <Plus size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-neutral-900">
                    Log New Outflow
                  </h2>
                  <p className="text-[11px] font-semibold text-neutral-400">
                    Record immediate single transaction
                  </p>
                </div>
              </div>
              <span className="rounded-xl border border-white/90 bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-900 shadow-xs">
                {profile.currency}
              </span>
            </div>

            <ExpenseForm
              uid={user.uid}
              currency={profile.currency}
              onExpenseAdded={loadData}
            />
          </div>

          {/* Expense History List Card */}
          <div className="overflow-hidden rounded-[36px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 sm:p-7 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:shadow-[0_25px_50px_-10px_rgba(6,182,212,0.12)]">
            <div className="mb-5 flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-800 shadow-sm">
                  <Receipt size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-neutral-900">
                    Transaction Ledger
                  </h2>
                  <p className="text-[11px] font-semibold text-neutral-400">
                    {expenses.length} verified item records
                  </p>
                </div>
              </div>
            </div>

            <ExpenseList
              uid={user.uid}
              expenses={expenses}
              currency={profile.currency}
              onExpenseChanged={loadData}
            />
          </div>
        </div>
      </div>
    </main>
  );
}