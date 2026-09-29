"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/components/auth-provider";
import { getFinancialProfile } from "@/lib/financial-profile";
import { getExpenses, type Expense } from "@/lib/expenses";
import { getBudgets, DEFAULT_BUDGETS, type BudgetMap } from "@/lib/budgets";

import {
  analyzeFinances,
  FinancialAnalysis,
  FinancialProfileForEngine,
} from "@/lib/financial-engine";
import type { FinancialProfile } from "@/types/finance";

import CategoryBreakdown from "@/components/financial/CategoryBreakdown";
import PlanningCard from "@/components/financial/PlanningCard";
import SplashScreen1 from "@/components/UI/splashscreen1";
import RecommendationsPanel, {
  generateRecommendations,
  type Recommendation,
} from "@/components/financial/RecommendationsPanel";

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
  BellRing,
  Activity,
} from "lucide-react";
import { logoutUser } from "@/lib/auth";

// ============================================================================
// 1. INLINE ROBUST 2D PIE CHART (Crash-proof against undefined/empty data)
// ============================================================================

export interface PieSegment {
  label: string;
  value: number;
  color: string;
  darkColor?: string;
  glowColor?: string;
}

interface TwoDPieChartProps {
  data?: PieSegment[];
  currency?: string;
  totalValue?: number;
}

export function TwoDPieChart({
  data = [],
  currency = "INR",
  totalValue = 0,
}: TwoDPieChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Safe fallback against null, undefined, or missing items
  const cleanData = (data ?? []).filter(
    (d) => d && typeof d.value === "number" && d.value > 0
  );
  const total = cleanData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  if (total === 0 || cleanData.length === 0) {
    return (
      <div className="flex h-56 w-full flex-col items-center justify-center rounded-3xl border border-white/60 bg-white/40 p-6 text-center backdrop-blur-xl">
        <p className="text-xs font-semibold text-neutral-400">
          No recorded spending data yet
        </p>
      </div>
    );
  }

  let currentAngle = 0;
  const sectors = cleanData.map((item, idx) => {
    const fraction = item.value / total;
    const angle = fraction * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      ...item,
      index: idx,
      startAngle,
      endAngle,
      percentage: Math.round(fraction * 100),
    };
  });

  const size = 260;
  const center = size / 2;
  const outerRadius = 100;
  const innerRadius = 66;

  function toRad(deg: number) {
    return (deg * Math.PI) / 180;
  }

  function getDonutSlice(startDeg: number, endDeg: number, expand = 0) {
    const safeEnd = endDeg - startDeg >= 360 ? startDeg + 359.99 : endDeg;
    const rOut = outerRadius + expand;
    const rIn = innerRadius - expand * 0.4;

    const a1 = toRad(startDeg - 90);
    const a2 = toRad(safeEnd - 90);

    const x1 = center + rOut * Math.cos(a1);
    const y1 = center + rOut * Math.sin(a1);
    const x2 = center + rOut * Math.cos(a2);
    const y2 = center + rOut * Math.sin(a2);

    const x3 = center + rIn * Math.cos(a2);
    const y3 = center + rIn * Math.sin(a2);
    const x4 = center + rIn * Math.cos(a1);
    const y4 = center + rIn * Math.sin(a1);

    const largeArc = safeEnd - startDeg > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  }

  const activeItem = activeIdx !== null ? sectors[activeIdx] : null;

  return (
    <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
      {/* 2D Donut Chart Viewport */}
      <div className="relative flex h-64 w-64 sm:h-72 sm:w-72 shrink-0 items-center justify-center">
        {/* Soft Ambient Refraction Aura */}
        <div
          className="pointer-events-none absolute h-48 w-48 rounded-full blur-2xl transition-all duration-500"
          style={{
            backgroundColor: activeItem ? activeItem.color : "#10b981",
            opacity: 0.22,
          }}
        />

        <svg viewBox={`0 0 ${size} ${size}`} className="h-64 w-64 sm:h-72 sm:w-72 overflow-visible">
          {sectors.map((s) => {
            const isHovered = activeIdx === s.index;
            const isDimmed = activeIdx !== null && !isHovered;

            return (
              <path
                key={s.label}
                d={getDonutSlice(s.startAngle, s.endAngle, isHovered ? 6 : 0)}
                fill={s.color}
                onMouseEnter={() => setActiveIdx(s.index)}
                onMouseLeave={() => setActiveIdx(null)}
                onTouchStart={() => setActiveIdx(s.index)}
                className="cursor-pointer transition-all duration-300"
                style={{
                  opacity: isDimmed ? 0.35 : 1,
                  filter: isHovered
                    ? `drop-shadow(0 6px 14px ${s.color}66)`
                    : "drop-shadow(0 2px 4px rgba(0,0,0,0.04))",
                }}
              />
            );
          })}
        </svg>

        {/* Dynamic Center HUD Display */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-3">
          <div className="flex flex-col items-center justify-center rounded-full transition-all duration-300">
            {activeItem ? (
              <>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 max-w-[110px] truncate">
                  {activeItem.label}
                </span>
                <p className="text-base sm:text-lg font-black tracking-tight text-neutral-950 mt-0.5">
                  {currency} {new Intl.NumberFormat().format(activeItem.value)}
                </p>
                <span
                  className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-black text-white shadow-xs"
                  style={{ backgroundColor: activeItem.color }}
                >
                  {activeItem.percentage}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Total Monthly
                </span>
                <p className="text-base sm:text-lg font-black tracking-tight text-neutral-950 mt-0.5">
                  {currency} {new Intl.NumberFormat().format(totalValue)}
                </p>
                <span className="mt-0.5 text-[10px] font-semibold text-neutral-400">
                  Touch slice for details
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Legend with Glass Pills */}
      <div className="flex w-full flex-col gap-2.5">
        {sectors.map((item) => {
          const isSelected = activeIdx === item.index;

          return (
            <div
              key={item.label}
              onMouseEnter={() => setActiveIdx(item.index)}
              onMouseLeave={() => setActiveIdx(null)}
              onTouchStart={() => setActiveIdx(item.index)}
              className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition-all duration-300 ${
                isSelected
                  ? "scale-[1.02] border-white/95 bg-white/90 shadow-[0_12px_28px_rgba(0,0,0,0.08)] backdrop-blur-2xl"
                  : "border-white/60 bg-white/45 backdrop-blur-xl hover:border-white/80 hover:bg-white/65"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3.5 w-3.5 rounded-lg transition-transform duration-300"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: isSelected ? `0 0 12px ${item.color}` : "none",
                    transform: isSelected ? "scale(1.2)" : "scale(1)",
                  }}
                />
                <div>
                  <p className="text-xs font-bold text-neutral-900">{item.label}</p>
                  <p className="text-[11px] font-semibold text-neutral-500">
                    {item.percentage}% of verified inflow
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs font-black text-neutral-900">
                  {currency} {new Intl.NumberFormat().format(item.value)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 2. DASHBOARD MAIN COMPONENT
// ============================================================================

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [budgets, setBudgets] = useState<BudgetMap>(DEFAULT_BUDGETS);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setLoadError("");

      const [financialProfile, userExpenses, userBudgets] = await Promise.all([
        getFinancialProfile(user.uid),
        getExpenses(user.uid),
        getBudgets(user.uid),
      ]);

      if (!financialProfile) {
        router.replace("/setup");
        return;
      }

      setProfile(financialProfile);
      setExpenses(userExpenses || []);
      setBudgets(userBudgets || DEFAULT_BUDGETS);

      const rawProfile = financialProfile as any;
      const engineInput: FinancialProfileForEngine = {
        monthlyIncome: Number(rawProfile.monthlyIncome ?? 0),
        essentialExpenses: Number(rawProfile.essentialExpenses ?? 0),
        otherFixedExpenses: Number(
          rawProfile.otherFixedExpenses ?? rawProfile.recurringExpenses ?? 0
        ),
        emiAmount: Number(rawProfile.emiAmount ?? rawProfile.monthlyEmi ?? rawProfile.emi ?? 0),
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

      const result = analyzeFinances(engineInput, userExpenses || []);
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

  // Compute live recommendations
  const recommendations: Recommendation[] = useMemo(() => {
    if (!profile) return [];
    const rawProfile = profile as any;
    return generateRecommendations({
      expenses,
      budgets,
      monthlyIncome: Number(rawProfile.monthlyIncome ?? 0),
      essentialExpenses: Number(rawProfile.essentialExpenses ?? 0),
      otherFixedExpenses: Number(
        rawProfile.otherFixedExpenses ?? rawProfile.recurringExpenses ?? 0
      ),
      emiAmount: Number(rawProfile.emiAmount ?? rawProfile.monthlyEmi ?? rawProfile.emi ?? 0),
      currentSavings: Number(rawProfile.currentSavings ?? 0),
      currentEmergencyFund: Number(
        rawProfile.currentEmergencyFund ?? rawProfile.emergencyFund ?? 0
      ),
      currency: profile.currency || "INR",
    });
  }, [profile, expenses, budgets]);

  // Safe data shape for the 2D Donut Chart
  const pieData: PieSegment[] = useMemo(() => {
    if (!analysis) return [];

    const fixedOutflow =
      (analysis as any).fixedCommitments ??
      analysis.plannedFixedOutflow ??
      0;
    const livingOutflow = analysis.totalExpenses || 0;
    const liquidBuffer = Math.max(analysis.remainingAfterActualExpenses || 0, 0);

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

  async function handleLogout() {
    await logoutUser();
    router.replace("/login");
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f0d] px-6 text-center text-white">
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
      { maximumFractionDigits: 0 }
    ).format(Math.abs(amount));

  const isSurplusNegative = analysis.remainingAfterActualExpenses < 0;
  const isHealthy = !isSurplusNegative;

  return (
    <main className="relative min-h-screen bg-[#edf2ee] text-neutral-900 antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* ================= APPLE AMBIENT LIVING AURORA BACKGROUND ================= */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Vibrant Emerald Aurora (Top-Right) */}
        <div className="absolute -top-32 -right-24 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-emerald-400/50 via-teal-300/40 to-emerald-200/20 blur-[120px]" />
        {/* Electric Mint Aurora (Left Edge) */}
        <div className="absolute top-[28%] -left-32 h-[650px] w-[650px] rounded-full bg-gradient-to-tr from-teal-400/40 via-emerald-300/35 to-cyan-300/30 blur-[130px]" />
        {/* Soft Cyan Depth Aura (Bottom-Right) */}
        <div className="absolute -bottom-32 right-[15%] h-[550px] w-[550px] rounded-full bg-gradient-to-t from-cyan-300/40 via-emerald-200/30 to-transparent blur-[120px]" />
      </div>

      {/* Apple Glass Frosted Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/80 bg-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-600/30">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-neutral-950">
                Finora
              </span>
              <p className="text-[11px] font-semibold text-neutral-500">
                {profile.country === "AE" ? "United Arab Emirates" : "India"} • {profile.currency}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/budget")}
              className="flex items-center gap-1.5 rounded-2xl border border-white/90 bg-white/70 px-3.5 py-2.5 text-xs font-bold text-neutral-800 shadow-sm backdrop-blur-md transition hover:bg-white hover:shadow-md active:scale-95"
            >
              <Target size={15} className="text-emerald-700" />
              <span className="hidden sm:inline">Add Budget</span>
            </button>

            <button
              onClick={() => router.push("/expenses")}
              className="flex items-center gap-1.5 rounded-2xl bg-[#173d32] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#173d32]/25 transition hover:bg-[#1f5c4a] hover:scale-105 active:scale-95"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Add Expense</span>
            </button>

            {/* Notification Center Bell with Badge */}
            <Link
              href="/notifications"
              className="relative rounded-2xl border border-white/90 bg-white/70 p-2.5 text-neutral-600 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-neutral-900"
              title="Financial Insights & Notifications"
            >
              <BellRing size={17} />
              {recommendations.filter((r) => r.type === "warning").length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white shadow-sm animate-bounce">
                  {recommendations.filter((r) => r.type === "warning").length}
                </span>
              )}
            </Link>

            <button
              onClick={() => router.push("/setup")}
              className="rounded-2xl border border-white/90 bg-white/70 p-2.5 text-neutral-600 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-neutral-900"
              title="Edit Profile Setup"
            >
              <SlidersHorizontal size={17} />
            </button>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="rounded-2xl border border-white/90 bg-white/70 p-2.5 text-neutral-500 shadow-sm backdrop-blur-md transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* Header Title */}
        <section className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-white/80 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Financial Cockpit
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
              Financial Dashboard
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-neutral-500 max-w-lg leading-relaxed">
              Real-time capital balance, intelligent runway forecasts, and 2D visual fund allocations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-neutral-500">
              Savings Target:
            </span>
            <span className="rounded-2xl border border-white/90 bg-white/80 px-3.5 py-1.5 text-xs font-black text-emerald-900 shadow-sm backdrop-blur-md">
              {profile.monthlySavings
                ? `${profile.currency} ${formatAmount(profile.monthlySavings)}`
                : "20% Optimal Rule"}
            </span>
          </div>
        </section>

        {/* 1. Frosted Glass Top 4 KPI Cards */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Monthly Inflow
              </p>
              <div className="rounded-2xl bg-emerald-500/15 p-2.5 text-emerald-700 shadow-sm transition group-hover:scale-110">
                <ArrowDownLeft size={18} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-neutral-950">
              <span className="text-base font-bold text-neutral-400 mr-1.5">
                {profile.currency}
              </span>
              {formatAmount(analysis.monthlyIncome)}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-800">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-200/80 text-[10px]">
                ↑
              </span>
              Verified Baseline Income
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Recorded Outflow
              </p>
              <div className="rounded-2xl bg-amber-500/15 p-2.5 text-amber-700 shadow-sm transition group-hover:scale-110">
                <Receipt size={18} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-neutral-950">
              <span className="text-base font-bold text-neutral-400 mr-1.5">
                {profile.currency}
              </span>
              {formatAmount(analysis.totalExpenses)}
            </p>
            <div className="mt-4 text-xs font-semibold text-neutral-500">
              {analysis.categoryBreakdown.length} active spending streams
            </div>
          </div>

          <div
            className={`group relative overflow-hidden rounded-[32px] border p-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl ${
              isSurplusNegative
                ? "border-red-300/80 bg-gradient-to-br from-red-50/70 to-red-100/50"
                : "border-white/80 bg-gradient-to-br from-emerald-50/70 via-white/55 to-cyan-50/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Net Monthly Buffer
              </p>
              <div
                className={`rounded-2xl p-2.5 shadow-sm transition group-hover:scale-110 ${
                  isSurplusNegative
                    ? "bg-red-500/15 text-red-700"
                    : "bg-emerald-500/15 text-emerald-800"
                }`}
              >
                <Wallet size={18} />
              </div>
            </div>
            <p
              className={`mt-4 text-3xl font-black tracking-tight ${
                isSurplusNegative ? "text-red-700" : "text-emerald-950"
              }`}
            >
              <span className="text-base font-bold opacity-60 mr-1.5">
                {isSurplusNegative ? "-" : ""}
                {profile.currency}
              </span>
              {formatAmount(analysis.remainingAfterActualExpenses)}
            </p>
            <div className="mt-4 text-xs font-bold text-neutral-600">
              {isSurplusNegative
                ? "Deficit: Spends exceeded cashflow"
                : "Liquid Capital Remaining"}
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Savings Efficiency
              </p>
              <div className="rounded-2xl bg-teal-500/15 p-2.5 text-teal-700 shadow-sm transition group-hover:scale-110">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-neutral-950">
              {analysis.savingsRate}%
            </p>
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200/60 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 transition-all duration-1000"
                  style={{
                    width: `${Math.min(Math.max(analysis.savingsRate, 0), 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Interactive 2D Pie Chart Section */}
        <section className="mt-8">
          <div className="relative overflow-hidden rounded-[36px] border border-white/80 bg-white/50 p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:shadow-[0_25px_60px_-10px_rgba(16,185,129,0.15)]">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/25 blur-[70px]" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-[70px]" />

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

              <div
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 shadow-xs backdrop-blur-md ${
                  isHealthy
                    ? "border-emerald-300/80 bg-emerald-500/10 text-emerald-900"
                    : "border-red-300/80 bg-red-500/10 text-red-900"
                }`}
              >
                {isHealthy ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                <span className="text-xs font-bold">
                  {isHealthy ? "Runway Secured" : "Deficit Alert"}
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-6">
              <TwoDPieChart
                data={pieData}
                currency={profile.currency}
                totalValue={analysis.monthlyIncome}
              />
            </div>
          </div>
        </section>

        {/* 3. Actionable Insights Panel */}
        <section className="mt-8">
          <RecommendationsPanel recommendations={recommendations} />
        </section>

        {/* 4. Category Breakdown & Capital Reserves */}
        <section className="mt-8 grid gap-7 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-[36px] border border-white/80 bg-white/55 p-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl">
            <CategoryBreakdown
              data={analysis.categoryBreakdown}
              currency={profile.currency}
            />
          </div>

          <div className="flex flex-col justify-between rounded-[36px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-7 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-neutral-950">
                    Net Capital Reserves
                  </h2>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    Calculated safety buffers and investments
                  </p>
                </div>
                <div className="rounded-2xl border border-white/90 bg-white/80 p-2.5 text-neutral-700 shadow-sm backdrop-blur-md">
                  <ShieldCheck size={20} />
                </div>
              </div>

              <div className="mt-6 space-y-3.5">
                <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 p-4 shadow-xs backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-800">
                      <PiggyBank size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                        Liquid Savings
                      </span>
                      <p className="text-sm font-black text-neutral-900">
                        {profile.currency} {formatAmount(analysis.currentSavings)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-xl border border-white/80 bg-white/80 px-2.5 py-1 text-[10px] font-black text-neutral-600">
                    Instant
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 p-4 shadow-xs backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-800">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                        Investments
                      </span>
                      <p className="text-sm font-black text-neutral-900">
                        {profile.currency} {formatAmount(analysis.currentInvestments)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-xl border border-white/80 bg-white/80 px-2.5 py-1 text-[10px] font-black text-neutral-600">
                    Growth
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 p-4 shadow-xs backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-800">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                        Monthly EMIs
                      </span>
                      <p className="text-sm font-black text-neutral-900">
                        {profile.currency} {formatAmount(analysis.emiAmount)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-xl border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-800">
                    Recurring
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 p-4 shadow-xs backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-800">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                        3-Month Safety Target
                      </span>
                      <p className="text-sm font-black text-neutral-900">
                        {profile.currency} {formatAmount(analysis.emergencyFundTarget)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-xl border border-cyan-200/60 bg-cyan-50 px-2.5 py-1 text-[10px] font-black text-cyan-800">
                    Shield
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push("/setup")}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/90 bg-white/90 py-3.5 text-xs font-extrabold text-neutral-800 shadow-sm transition hover:bg-white hover:shadow-md"
            >
              Update Capital Figures
              <ChevronRight size={14} />
            </button>
          </div>
        </section>

        {/* 5. Automated Guidance Section */}
        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Automated Intelligence
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

        {/* 6. Quick Launch Cards */}
        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div
            onClick={() => router.push("/expenses")}
            className="group cursor-pointer rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-7 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:-translate-y-1.5 hover:border-emerald-300 hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 shadow-sm transition group-hover:scale-110">
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
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
              Record everyday spending manually or via import to automatically keep your category allocation and runway up to date.
            </p>
          </div>

          <div
            onClick={() => router.push("/budget")}
            className="group cursor-pointer rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-7 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:-translate-y-1.5 hover:border-amber-300 hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 shadow-sm transition group-hover:scale-110">
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
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
              Set proactive category limits, track spending progress across the month, and prevent unexpected end-of-month deficits.
            </p>
          </div>

          <div
            onClick={() => router.push("/setup")}
            className="group cursor-pointer rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-7 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:-translate-y-1.5 hover:border-teal-300 hover:shadow-xl sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-700 shadow-sm transition group-hover:scale-110">
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
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
              Adjust baseline income, fixed utilities, monthly loan EMIs, or update your country currency configurations anytime.
            </p>
          </div>
        </section>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-md transition-opacity"
            onClick={() => setShowLogoutModal(false)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/80 bg-white/80 p-7 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 border border-amber-300/60">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-neutral-950">
                  Confirm Sign Out
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
                  Are you sure you want to log out? Any unsaved edits will be discarded.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="rounded-2xl border border-white/80 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 shadow-xs transition hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-2xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}