"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { getFinancialProfile } from "@/lib/financial-profile";
import { getExpenses } from "@/lib/expenses";

import {
  analyzeFinances,
  FinancialAnalysis,
  FinancialProfileForEngine,
} from "@/lib/financial-engine";
import type { FinancialProfile } from "@/types/finance";

import CategoryBreakdown from "@/components/financial/CategoryBreakdown";
import FinancialStatus from "@/components/financial/FinancialStatus";
import PlanningCard from "@/components/financial/PlanningCard";
import SplashScreen1 from "@/components/UI/splashscreen1";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  LogOut,
  PiggyBank,
  Plus,
  Receipt,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Compass,
} from "lucide-react";
import { logoutUser } from "@/lib/auth";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setLoadError("");

      const [financialProfile, expenses] = await Promise.all([
        getFinancialProfile(user.uid),
        getExpenses(user.uid),
      ]);

      if (!financialProfile) {
        router.replace("/setup");
        return;
      }

      setProfile(financialProfile);

      const rawProfile = financialProfile as any;
      const engineInput: FinancialProfileForEngine = {
        monthlyIncome: Number(rawProfile.monthlyIncome ?? 0),
        essentialExpenses: Number(rawProfile.essentialExpenses ?? 0),
        otherFixedExpenses: Number(
          rawProfile.otherFixedExpenses ?? rawProfile.recurringExpenses ?? 0
        ),
        emiAmount: Number(rawProfile.emiAmount ?? rawProfile.emi ?? 0),
        currentSavings: Number(rawProfile.currentSavings ?? 0),
        currentInvestments: Number(
          rawProfile.currentInvestments ?? rawProfile.monthlyInvestments ?? 0
        ),
        currentEmergencyFund: Number(
          rawProfile.currentEmergencyFund ?? rawProfile.emergencyFund ?? 0
        ),
        monthlySavingsTarget: rawProfile.monthlySavingsTarget
          ? Number(rawProfile.monthlySavingsTarget)
          : undefined,
        currency: rawProfile.currency || "INR",
      };

      const result = analyzeFinances(engineInput, expenses || []);
      setAnalysis(result);
      setLoading(false);
    } catch (error: any) {
      console.error("Dashboard loading error:", error);
      setLoadError(error?.message || "Unable to load financial data.");
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    loadDashboard();
  }, [authLoading, user, router, loadDashboard]);

  async function handleLogout() {
    await logoutUser();
    router.replace("/login");
  }

  // 1. Error state (prevents white screen if Firestore rejects the query)
  if (loadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0d1311] px-6 text-center text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 mb-4 border border-red-500/20">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-xl font-bold">Failed to load financial space</h2>
        <p className="mt-2 max-w-sm text-xs text-neutral-400">{loadError}</p>
        <button
          onClick={loadDashboard}
          className="mt-6 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
        >
          Try Again
        </button>
      </main>
    );
  }

  // 2. Loading state: Always show FinoraSplash instead of returning null
  if (authLoading || loading || !user || !profile || !analysis) {
    return (
      <SplashScreen1
        slowThresholdMs={4500}
        onRetry={loadDashboard}
      />
    );
  }

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(
      profile.country === "AE" ? "en-AE" : "en-IN",
      {
        maximumFractionDigits: 0,
      }
    ).format(Math.abs(amount));

  const isSurplusNegative = analysis.remainingAfterActualExpenses < 0;

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-neutral-900 antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* Background Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-100/40 blur-[120px]" />
        <div className="absolute top-[30%] -left-32 h-[450px] w-[450px] rounded-full bg-teal-100/30 blur-[130px]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg shadow-emerald-700/20">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-neutral-950">
                  Finora
                </span>
              </div>
              <p className="text-[11px] font-medium text-neutral-400">
                {profile.country === "AE" ? "United Arab Emirates" : "India"} • {profile.currency}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/budget")}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 active:scale-95"
            >
              <Target size={15} className="text-emerald-700" />
              <span className="hidden sm:inline">Add Budget</span>
            </button>

            <button
              onClick={() => router.push("/expenses")}
              className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-neutral-900/10 transition hover:bg-neutral-800 hover:shadow-lg active:scale-95"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Add Expense</span>
            </button>

            <button
              onClick={() => router.push("/setup")}
              className="rounded-xl border border-neutral-200/80 bg-white p-2.5 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
              title="Edit Profile Setup"
            >
              <SlidersHorizontal size={17} />
            </button>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="rounded-xl border border-neutral-200/80 bg-white p-2.5 text-neutral-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <section className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Financial Pulse
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-neutral-950 sm:text-4xl">
              Financial Dashboard
            </h1>
            <p className="mt-1 text-sm text-neutral-500 max-w-lg leading-relaxed">
              Your real-time asset position, commitments, and automated capital deployment insights.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-400">
              Monthly Savings Target:
            </span>
            <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-neutral-800 shadow-sm border border-neutral-200/80">
              {profile.monthlySavings
                ? `${profile.currency} ${formatAmount(profile.monthlySavings)}`
                : "20% Optimal Rule"}
            </span>
          </div>
        </section>

        {/* Highlight Grid */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-[26px] border border-neutral-200/80 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Monthly Inflow
              </p>
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 transition group-hover:scale-110">
                <ArrowDownLeft size={18} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-neutral-950">
              <span className="text-lg font-semibold text-neutral-400 mr-1.5">
                {profile.currency}
              </span>
              {formatAmount(analysis.monthlyIncome)}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-700">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px]">
                ↑
              </span>
              Primary verified budget
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[26px] border border-neutral-200/80 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Recorded Outflow
              </p>
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 transition group-hover:scale-110">
                <Receipt size={18} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-neutral-950">
              <span className="text-lg font-semibold text-neutral-400 mr-1.5">
                {profile.currency}
              </span>
              {formatAmount(analysis.totalExpenses)}
            </p>
            <div className="mt-4 text-xs font-medium text-neutral-500">
              {analysis.categoryBreakdown.length} active spending streams
            </div>
          </div>

          <div
            className={`group relative overflow-hidden rounded-[26px] border p-6 transition hover:-translate-y-1 hover:shadow-xl ${
              isSurplusNegative
                ? "border-red-200 bg-red-50/40 shadow-red-500/5"
                : "border-emerald-200/80 bg-emerald-50/30 shadow-emerald-500/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Net Monthly Buffer
              </p>
              <div
                className={`rounded-xl p-2.5 transition group-hover:scale-110 ${
                  isSurplusNegative
                    ? "bg-red-100 text-red-600"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                <Wallet size={18} />
              </div>
            </div>
            <p
              className={`mt-4 text-3xl font-black tracking-tight ${
                isSurplusNegative ? "text-red-600" : "text-emerald-950"
              }`}
            >
              <span className="text-lg font-semibold opacity-60 mr-1.5">
                {isSurplusNegative ? "-" : ""}
                {profile.currency}
              </span>
              {formatAmount(analysis.remainingAfterActualExpenses)}
            </p>
            <div className="mt-4 text-xs font-semibold text-neutral-500">
              {isSurplusNegative
                ? "Deficit: Spending outpaced income"
                : "Liquid capital remaining"}
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[26px] border border-neutral-200/80 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Savings Efficiency
              </p>
              <div className="rounded-xl bg-teal-50 p-2.5 text-teal-600 transition group-hover:scale-110">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-neutral-950">
              {analysis.savingsRate}%
            </p>
            <div className="mt-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                  style={{
                    width: `${Math.min(Math.max(analysis.savingsRate, 0), 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Health Status */}
        <section className="mt-8">
          <FinancialStatus analysis={analysis} currency={profile.currency} />
        </section>

        {/* Category Breakdown & Reserves */}
        <section className="mt-8 grid gap-7 lg:grid-cols-[1.3fr_1fr]">
          <CategoryBreakdown
            data={analysis.categoryBreakdown}
            currency={profile.currency}
          />

          <div className="flex flex-col justify-between rounded-[32px] border border-neutral-200/80 bg-white p-7 shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-neutral-950">
                    Net Capital Reserves
                  </h2>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    Calculated safety buffers and investments
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-100 p-2 text-neutral-600">
                  <ShieldCheck size={20} />
                </div>
              </div>

              <div className="mt-6 space-y-3.5">
                <div className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-[#fbfbfa] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/60 text-emerald-800">
                      <PiggyBank size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-neutral-500">Liquid Savings</span>
                      <p className="text-sm font-bold text-neutral-900">
                        {profile.currency} {formatAmount(analysis.currentSavings)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-500 border border-neutral-100">
                    Instant
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-[#fbfbfa] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100/60 text-teal-800">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-neutral-500">Investments</span>
                      <p className="text-sm font-bold text-neutral-900">
                        {profile.currency} {formatAmount(analysis.currentInvestments)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-500 border border-neutral-100">
                    Growth
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-[#fbfbfa] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100/60 text-orange-800">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-neutral-500">Active EMIs</span>
                      <p className="text-sm font-bold text-neutral-900">
                        {profile.currency} {formatAmount(analysis.emiAmount)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 border border-orange-200/50">
                    Monthly
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-[#fbfbfa] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100/60 text-blue-800">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-neutral-500">3-Month Safety Target</span>
                      <p className="text-sm font-bold text-neutral-900">
                        {profile.currency} {formatAmount(analysis.emergencyFundTarget)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 border border-blue-200/50">
                    Shield
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push("/setup")}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-3 text-xs font-bold text-neutral-800 transition hover:bg-neutral-50"
            >
              Update Capital Figures
              <ChevronRight size={14} />
            </button>
          </div>
        </section>

        {/* Guidance */}
        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Automated Guidance
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-950">
              Actionable Next Steps
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
          <PlanningCard
            title="Recommended Savings Target"
            description={analysis.recommendation}
            icon={<PiggyBank size={20} className="text-emerald-700" />}
          />
        
          <PlanningCard
            title="Emergency Fund Health"
            description={analysis.emergencyRecommendation}
            icon={<ShieldCheck size={20} className="text-teal-700" />}
          />
        
          <PlanningCard
            title="Long-Term Wealth Building"
            description={analysis.longTermRecommendation}
            icon={<Compass size={20} className="text-emerald-800" />}
          />
        </div>
        </section>

        {/* Quick Launch Cards */}
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div
            onClick={() => router.push("/expenses")}
            className="group cursor-pointer rounded-[28px] border border-neutral-200/90 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:scale-110">
                <Plus size={22} />
              </div>
              <ArrowUpRight
                size={18}
                className="text-neutral-400 transition group-hover:text-emerald-700"
              />
            </div>
            <h3 className="mt-5 text-lg font-bold text-neutral-900">
              Log Real Expenses
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-neutral-500">
              Record everyday spending manually or via import to automatically keep your category allocation and runway up to date.
            </p>
          </div>

          <div
            onClick={() => router.push("/budget")}
            className="group cursor-pointer rounded-[28px] border border-neutral-200/90 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 transition group-hover:scale-110">
                <Target size={22} />
              </div>
              <ArrowUpRight
                size={18}
                className="text-neutral-400 transition group-hover:text-amber-700"
              />
            </div>
            <h3 className="mt-5 text-lg font-bold text-neutral-900">
              Monthly Budget
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-neutral-500">
              Set proactive category limits, track spending progress across the month, and prevent unexpected end-of-month deficits.
            </p>
          </div>

          <div
            onClick={() => router.push("/setup")}
            className="group cursor-pointer rounded-[28px] border border-neutral-200/90 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 transition group-hover:scale-110">
                <Settings size={22} />
              </div>
              <ArrowUpRight
                size={18}
                className="text-neutral-400 transition group-hover:text-teal-700"
              />
            </div>
            <h3 className="mt-5 text-lg font-bold text-neutral-900">
              Calibrate Setup Parameters
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-neutral-500">
              Adjust baseline income, fixed utilities, monthly loan EMIs, or update your country currency configurations anytime.
            </p>
          </div>
        </section>
      </div>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with smooth blur */}
          <div
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowLogoutModal(false)}
          />

          {/* Dialog Box */}
          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-neutral-200/80 bg-white p-6 shadow-2xl transition-all sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-neutral-950">
                  Confirm Sign Out
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
                  Are you sure you want to log out? Any unsaved changes in progress will be closed.
                </p>
              </div>
            </div>

            {/* Warning Note */}
            <div className="mt-5 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-3.5 text-[11px] text-amber-800">
              <span className="font-semibold">Notice:</span> You will need to sign in again with your email or Google account to view your financial Dashboard.
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 active:scale-95"
              >
                No, Stay Here
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
              >
                <LogOut size={14} />
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}