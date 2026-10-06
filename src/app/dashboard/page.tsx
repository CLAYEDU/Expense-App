"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FinancialInsightsLoader from "@/components/financial/FinancialInsightsLoader";
import UpdateReservesModal, { type ReserveTab } from "@/components/financial/UpdateReservesModal";

import { useAuth } from "@/components/auth-provider";
import { getFinancialProfile } from "@/lib/financial-profile";
import { getExpenses, type Expense } from "@/lib/expenses";
import { getBudgets, DEFAULT_BUDGETS, type BudgetMap } from "@/lib/budgets";
import { getGoals, getGoalProgress, type Goal } from "@/lib/goals";
import HelpPopover from "@/components/financial/HelpPopOver";
import ReservesDistributionChart from "@/components/financial/ReserveDistributionChart";

import {
  getRecurringExpenses,
  getRecurringStatus,
  type RecurringExpense,
} from "@/lib/recurring-expenses";

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
  ArrowRight,
  ChevronRight,
  LogOut,
  PiggyBank,
  Plus,
  Receipt,
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
  Flag,
  Repeat,
  AlertCircle,
  FileText,
  X,
  Bot,
  ListChecks,
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
      <div className="relative flex h-64 w-64 sm:h-72 sm:w-72 shrink-0 items-center justify-center">
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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMobileActionMenu, setShowMobileActionMenu] = useState(false);

  // Reserves Modal State
  const [showReservesModal, setShowReservesModal] = useState(false);
  const [selectedReserveTab, setSelectedReserveTab] = useState<ReserveTab>("savings");

  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const loadDashboard = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setLoadError("");

      const [
        financialProfile,
        userExpenses,
        userBudgets,
        userGoals,
        userRecurringExpenses,
      ] = await Promise.all([
        getFinancialProfile(user.uid),
        getExpenses(user.uid),
        getBudgets(user.uid),
        getGoals(user.uid),
        getRecurringExpenses(user.uid),
      ]);

      if (!financialProfile) {
        router.replace("/setup");
        return;
      }

      setProfile(financialProfile);
      setExpenses(userExpenses || []);
      setBudgets(userBudgets || DEFAULT_BUDGETS);
      setGoals(userGoals || []);
      setRecurringExpenses(userRecurringExpenses || []);

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

  // Handle closing mobile action dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setShowMobileActionMenu(false);
      }
    }

    if (showMobileActionMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMobileActionMenu]);

  // Recurring Commitments Analytics
  const activeRecurringExpenses = useMemo(
    () => recurringExpenses.filter((item) => item.active),
    [recurringExpenses]
  );

  const recurringMonthlyCommitment = useMemo(
    () =>
      activeRecurringExpenses.reduce((sum, item) => {
        if (item.frequency === "Monthly") {
          return sum + (Number(item.amount) || 0);
        }
        return sum + (Number(item.amount) || 0) / 12;
      }, 0),
    [activeRecurringExpenses]
  );

  const overdueRecurringExpenses = useMemo(
    () =>
      activeRecurringExpenses.filter(
        (item) => getRecurringStatus(item) === "overdue"
      ),
    [activeRecurringExpenses]
  );

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

  function openReserveManager(tab: ReserveTab) {
    setSelectedReserveTab(tab);
    setShowReservesModal(true);
  }

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
      {/* Ambient Aurora Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-24 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-emerald-400/50 via-teal-300/40 to-emerald-200/20 blur-[120px]" />
        <div className="absolute top-[28%] -left-32 h-[650px] w-[650px] rounded-full bg-gradient-to-tr from-teal-400/40 via-emerald-300/35 to-cyan-300/30 blur-[130px]" />
        <div className="absolute -bottom-32 right-[15%] h-[550px] w-[550px] rounded-full bg-gradient-to-t from-cyan-300/40 via-emerald-200/30 to-transparent blur-[120px]" />
      </div>

      {/* Top Header Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/80 bg-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
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
            {/* ================= LAPTOP VIEW (lg:flex) ================= */}
            <div className="hidden lg:flex items-center gap-2">
              <Link
                href="/reports"
                aria-label="Monthly Reports"
                className="flex items-center gap-1.5 rounded-2xl border border-white/90 bg-white/70 px-3.5 py-2.5 text-xs font-bold text-neutral-800 shadow-sm backdrop-blur-md transition hover:bg-white hover:shadow-md active:scale-95"
              >
                <FileText size={15} className="text-emerald-700" />
                <span>Reports</span>
              </Link>

              <Link
                href="/goals"
                aria-label="Goals"
                className="flex items-center gap-1.5 rounded-2xl border border-white/90 bg-white/70 px-3.5 py-2.5 text-xs font-bold text-neutral-800 shadow-sm backdrop-blur-md transition hover:bg-white hover:shadow-md active:scale-95"
              >
                <Flag size={15} className="text-teal-700" />
                <span>Goals</span>
              </Link>

              <Link
                href="/recurring"
                aria-label="Recurring Commitments"
                className="flex items-center gap-1.5 rounded-2xl border border-white/90 bg-white/70 px-3.5 py-2.5 text-xs font-bold text-neutral-800 shadow-sm backdrop-blur-md transition hover:bg-white hover:shadow-md active:scale-95"
              >
                <Repeat size={15} className="text-emerald-700" />
                <span>Commitments</span>
              </Link>

              <button
                onClick={() => router.push("/budget")}
                aria-label="Add Budget"
                className="flex items-center gap-1.5 rounded-2xl border border-white/90 bg-white/70 px-3.5 py-2.5 text-xs font-bold text-neutral-800 shadow-sm backdrop-blur-md transition hover:bg-white hover:shadow-md active:scale-95"
              >
                <Target size={15} className="text-emerald-700" />
                <span>Add Budget</span>
              </button>

              <button
                onClick={() => router.push("/expenses")}
                aria-label="Add Expense"
                className="flex items-center gap-1.5 rounded-2xl bg-[#173d32] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#173d32]/25 transition hover:bg-[#1f5c4a] hover:scale-105 active:scale-95"
              >
                <Plus size={15} />
                <span>Add Expense</span>
              </button>
            </div>

            {/* ================= MOBILE & TABLET VIEW (lg:hidden) ================= */}
            <div className="relative lg:hidden" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setShowMobileActionMenu(!showMobileActionMenu)}
                className={`flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-bold shadow-sm backdrop-blur-md transition active:scale-95 ${
                  showMobileActionMenu
                    ? "border-emerald-500 bg-[#173d32] text-white shadow-emerald-700/20"
                    : "border-white/90 bg-white/75 text-neutral-900 hover:bg-white"
                }`}
                aria-label="Quick Actions Menu"
                title="Quick Actions"
              >
                <Plus
                  size={16}
                  className={`transition-transform duration-300 ${
                    showMobileActionMenu ? "rotate-45 text-white" : "text-emerald-700"
                  }`}
                />
                <span className="text-[11px] font-black uppercase tracking-tight">
                  Actions
                </span>
              </button>

              {/* Mobile Glass Popover Menu */}
              {showMobileActionMenu && (
                <div className="absolute right-0 top-12 z-50 w-64 origin-top-right overflow-hidden rounded-[28px] border border-white/85 bg-white/80 p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-2 border-b border-black/5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      Quick Deployment
                    </span>
                    <button
                      onClick={() => setShowMobileActionMenu(false)}
                      className="text-neutral-400 hover:text-neutral-700"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="mt-1 space-y-1">
                    <button
                      onClick={() => {
                        setShowMobileActionMenu(false);
                        router.push("/expenses");
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition hover:bg-white/80 active:scale-98"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-800 shadow-sm">
                        <Plus size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-neutral-900">Add Expense</p>
                        <p className="text-[10px] font-semibold text-neutral-500">Record transaction outflow</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileActionMenu(false);
                        router.push("/budget");
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition hover:bg-white/80 active:scale-98"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800 shadow-sm">
                        <Target size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-neutral-900">Monthly Budget</p>
                        <p className="text-[10px] font-semibold text-neutral-500">Set spending caps</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileActionMenu(false);
                        router.push("/goals");
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition hover:bg-white/80 active:scale-98"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-800 shadow-sm">
                        <Flag size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-neutral-900">Financial Goals</p>
                        <p className="text-[10px] font-semibold text-neutral-500">Track savings milestones</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileActionMenu(false);
                        router.push("/recurring");
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition hover:bg-white/80 active:scale-98"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-800 shadow-sm">
                        <Repeat size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-neutral-900">Commitments</p>
                        <p className="text-[10px] font-semibold text-neutral-500">Recurring bills & EMIs</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileActionMenu(false);
                        router.push("/reports");
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition hover:bg-white/80 active:scale-98"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-800 shadow-sm">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-neutral-900">Monthly Reports</p>
                        <p className="text-[10px] font-semibold text-neutral-500">Performance summaries & CSV</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Pill */}
            <Link
              href="/notifications"
              className="relative rounded-2xl border border-white/90 bg-white/70 p-2 sm:p-2.5 text-neutral-600 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-neutral-900"
              title="Financial Insights & Notifications"
            >
              <BellRing size={17} />
              {recommendations.filter((r) => r.type === "warning").length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white shadow-sm animate-bounce">
                  {recommendations.filter((r) => r.type === "warning").length}
                </span>
              )}
            </Link>

            {/* Calibration Setup */}
            <button
              onClick={() => router.push("/setup")}
              className="rounded-2xl border border-white/90 bg-white/70 p-2 sm:p-2.5 text-neutral-600 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-neutral-900"
              title="Edit Profile Setup"
            >
              <SlidersHorizontal size={17} />
            </button>

            {/* Sign Out */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="rounded-2xl border border-white/90 bg-white/70 p-2 sm:p-2.5 text-neutral-500 shadow-sm backdrop-blur-md transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
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

        {/* ================= 1. FROSTED GLASS TOP 4 KPI CARDS ================= */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Monthly Inflow with Help Button */}
          <div className="group relative overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Monthly Inflow
                </p>
                <HelpPopover
                  title="What is Monthly Inflow?"
                  description="This is the total money that enters your account each month, such as your job salary, freelancing, or business income."
                  example="If your salary is INR 20,000 every month, your monthly inflow is INR 20,000."
                />
              </div>
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

          {/* Card 2: Recorded Outflow with Help Button */}
          <div className="group relative overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Recorded Outflow
                </p>
                <HelpPopover
                  title="What is Recorded Outflow?"
                  description="This is the total amount of money you have actually spent and logged this month on day-to-day living expenses (like groceries, shopping, dining, or bills)."
                  example="If you logged an INR 333 bill, your recorded outflow shows INR 333."
                />
              </div>
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

          {/* Card 3: Net Monthly Buffer */}
          <div
            className={`group relative overflow-hidden rounded-[32px] border p-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl ${
              isSurplusNegative
                ? "border-red-300/80 bg-gradient-to-br from-red-50/70 to-red-100/50"
                : "border-white/80 bg-gradient-to-br from-emerald-50/70 via-white/55 to-cyan-50/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Net Monthly Buffer
                </p>
                <HelpPopover
                  title="What is Net Monthly Buffer?"
                  description="This is the breathing room left in your wallet this month. It shows the exact cash remaining after subtracting all your day-to-day recorded spending from your monthly income."
                  example="If your income is INR 20,000 and you have spent INR 333 so far, your net buffer is INR 19,667. This is the unspent cash available for extra savings, investments, or surprise expenses."
                />
              </div>
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

          {/* Card 4: Savings Efficiency */}
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

        {/* ================= 2. INTERACTIVE 2D PIE CHART SECTION ================= */}
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
                
                {/* Header Text with Help Button */}
                <div className="mt-1 flex items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-neutral-950">
                    Capital Distribution
                  </h2>
                  <HelpPopover
                    title="How to Read This Chart"
                    description="This chart divides your monthly income into three simple buckets: 
                    (1) Fixed Commitments: like rent or EMIs that you must pay.
                    (2) Living & Flexible Spends: Living Spends that you have recorded so far. 
                    (3) Liquid Buffer: which is the remaining cash left to save or invest."
                    example="If your income is INR 20,000, and you spend INR 333, the chart shows where every Rupee stands right now."
                  />
                </div>
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

        {/* ================= 3. DIFFERENTIATED FINANCIAL INTELLIGENCE & ACTION PLAYBOOK ================= */}
        <section className="mt-8 space-y-6">
          {/* Engine 1: Finora AI Financial Intelligence */}
          <div className="overflow-hidden rounded-[36px] border border-white/80 bg-white/50 p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-sm">
                <Bot size={17} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-neutral-950">
                  Finora AI Financial Intelligence
                </h3>
                <p className="text-[11px] font-semibold text-neutral-500">
                  Live observations and anomaly detection tailored to your profile
                </p>
              </div>
            </div>

            <FinancialInsightsLoader
              uid={user.uid}
              profile={{
                ...profile,
                otherFixedExpenses:
                  (profile as any).otherFixedExpenses ??
                  (profile as any).recurringExpenses ??
                  0,
                emiAmount:
                  (profile as any).emiAmount ??
                  (profile as any).monthlyEmi ??
                  (profile as any).emi ??
                  0,
                currentInvestments:
                  (profile as any).currentInvestments ??
                  (profile as any).monthlyInvestments ??
                  0,
              } as any}
              limit={6}
            />
          </div>

          {/* Engine 2: Strategic Financial Playbook */}
          <div className="overflow-hidden rounded-[36px] border border-white/80 bg-white/50 p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-600 text-white shadow-sm">
                <ListChecks size={17} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-neutral-950">
                  Strategic Financial Playbook
                </h3>
                <p className="text-[11px] font-semibold text-neutral-500">
                  Rule-based milestones, debt reduction targets, and runway action items
                </p>
              </div>
            </div>

            <RecommendationsPanel recommendations={recommendations} />
          </div>
        </section>

        {/* ================= 4. UPCOMING COMMITMENTS (RECURRING EXPENSES) ================= */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-800 shadow-sm">
                  <Repeat className="h-4 w-4" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-neutral-950">
                  Upcoming commitments
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-neutral-500">
                Recurring bills and fixed monthly payments to keep in mind.
              </p>
            </div>

            <Link
              href="/recurring"
              className="flex items-center gap-1.5 text-xs font-extrabold text-[#1f5c4a] transition hover:text-[#173d32] hover:translate-x-0.5"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Monthly Total */}
            <div className="overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-5 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Monthly commitments
                </p>
                <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-700">
                  <Receipt size={16} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-neutral-950">
                {profile.currency === "INR" ? "₹" : "AED "}
                {Math.round(recurringMonthlyCommitment).toLocaleString(
                  profile.currency === "INR" ? "en-IN" : "en-AE"
                )}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-neutral-500">
                Based on active recurring payments
              </p>
            </div>

            {/* Card 2: Active Reminders */}
            <div className="overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-5 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Active reminders
                </p>
                <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-700">
                  <Repeat size={16} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-neutral-950">
                {activeRecurringExpenses.length}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-neutral-500">
                Recurring payments being tracked
              </p>
            </div>

            {/* Card 3: Overdue / Need Attention */}
            <div
              className={`overflow-hidden rounded-[28px] border p-5 backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl sm:col-span-2 lg:col-span-1 ${
                overdueRecurringExpenses.length > 0
                  ? "border-red-300/80 bg-gradient-to-br from-red-50/70 to-red-100/50 shadow-[0_15px_35px_-10px_rgba(239,68,68,0.15),inset_0_1px_1px_rgba(255,255,255,0.9)]"
                  : "border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.85)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Need attention
                </p>
                <div
                  className={`rounded-xl p-2 ${
                    overdueRecurringExpenses.length > 0
                      ? "bg-red-500/15 text-red-600"
                      : "bg-teal-500/15 text-teal-700"
                  }`}
                >
                  <AlertCircle size={16} />
                </div>
              </div>
              <p
                className={`mt-3 text-2xl font-black ${
                  overdueRecurringExpenses.length > 0
                    ? "text-red-600"
                    : "text-neutral-950"
                }`}
              >
                {overdueRecurringExpenses.length}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-neutral-500">
                {overdueRecurringExpenses.length > 0
                  ? "Payments currently marked overdue"
                  : "All recurring commitments up to date"}
              </p>
            </div>
          </div>
        </section>

        {/* ================= 5. YOUR GOALS (APPLE LIQUID GLASS) ================= */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-500/15 text-teal-800 shadow-sm">
                  <Flag className="h-4 w-4" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-neutral-950">
                  Your goals
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-neutral-500">
                Keep track of what you're saving towards.
              </p>
            </div>

            <Link
              href="/goals"
              className="flex items-center gap-1.5 text-xs font-extrabold text-[#1f5c4a] transition hover:text-[#173d32] hover:translate-x-0.5"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {goals.length === 0 ? (
            <div className="overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-7 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl">
              <p className="text-sm font-black text-neutral-900">
                Create your first financial goal
              </p>
              <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                Set a target for something important and track your progress over time.
              </p>

              <Link
                href="/goals/create"
                className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-[#173d32] px-5 py-2.5 text-xs font-bold text-white shadow-[0_12px_28px_rgba(23,61,50,0.25)] transition hover:bg-[#1f5c4a] hover:scale-105 active:scale-95"
              >
                <Plus size={14} />
                Create goal
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {goals.slice(0, 2).map((goal) => {
                const progress = getGoalProgress(goal);

                return (
                  <Link
                    key={goal.id}
                    href="/goals"
                    className="group overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-5 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-neutral-900 group-hover:text-emerald-900 transition">
                          {goal.name}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
                          {(goal as any).category || (goal as any).type || "General Goal"}
                        </p>
                      </div>

                      <span className="rounded-xl border border-white/90 bg-white/80 px-2.5 py-1 text-xs font-black text-emerald-900 shadow-xs">
                        {Math.round(progress)}%
                      </span>
                    </div>

                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full border border-white/80 bg-neutral-200/60 p-0.5 shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 shadow-sm"
                        style={{
                          width: `${Math.min(Math.max(progress, 0), 100)}%`,
                        }}
                      />
                    </div>

                    <div className="mt-3 flex justify-between text-xs font-bold text-neutral-600">
                      <span>
                        {profile.currency === "INR" ? "₹" : "AED "}
                        {Number(goal.currentAmount || 0).toLocaleString(
                          profile.currency === "INR" ? "en-IN" : "en-AE"
                        )}
                      </span>
                      <span className="text-neutral-400">
                        Target: {profile.currency === "INR" ? "₹" : "AED "}
                        {Number(goal.targetAmount || 0).toLocaleString(
                          profile.currency === "INR" ? "en-IN" : "en-AE"
                        )}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ================= 6. CATEGORY BREAKDOWN & 4 WORKABLE CAPITAL RESERVES ================= */}
        <section className="mt-8 grid gap-7 lg:grid-cols-[1.3fr_1.1fr]">
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
                    Manage real-time savings, investment targets, and debt caps
                  </p>
                </div>
                <div className="rounded-2xl border border-white/90 bg-white/80 p-2.5 text-neutral-700 shadow-sm backdrop-blur-md">
                  <ShieldCheck size={20} />
                </div>
              </div>

              {/* NEW: Dedicated Accumulated Wealth Donut Chart */}
              <div className="mt-5">
                <ReservesDistributionChart
                  savings={analysis.currentSavings}
                  investments={analysis.currentInvestments}
                  emergencyFund={analysis.currentEmergencyFund}
                  currency={profile.currency}
                />
              </div>

              <div className="mt-5 space-y-3">
                {/* 1. Liquid Savings */}
                <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-800">
                      <PiggyBank size={17} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Liquid Savings
                      </span>
                      <p className="text-sm font-black text-neutral-900">
                        {profile.currency} {formatAmount(analysis.currentSavings)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openReserveManager("savings")}
                    className="flex items-center gap-1 rounded-xl border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-800 hover:bg-emerald-100 transition active:scale-95"
                  >
                    <Plus size={12} /> Add Cash
                  </button>
                </div>

                {/* 2. Investments */}
                <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-800">
                      <TrendingUp size={17} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Investments
                      </span>
                      <p className="text-sm font-black text-neutral-900">
                        {profile.currency} {formatAmount(analysis.currentInvestments)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openReserveManager("investment")}
                    className="flex items-center gap-1 rounded-xl border border-teal-200/80 bg-teal-50 px-2.5 py-1 text-[10px] font-black text-teal-800 hover:bg-teal-100 transition active:scale-95"
                  >
                    <Plus size={12} /> Top-up
                  </button>
                </div>

                {/* 3. Emergency Fund */}
                <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-800">
                        <ShieldCheck size={17} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Emergency Fund
                        </span>
                        <p className="text-sm font-black text-neutral-900">
                          {profile.currency} {formatAmount(analysis.currentEmergencyFund)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openReserveManager("emergency")}
                      className="flex items-center gap-1 rounded-xl border border-cyan-200/80 bg-cyan-50 px-2.5 py-1 text-[10px] font-black text-cyan-800 hover:bg-cyan-100 transition active:scale-95"
                    >
                      <Plus size={12} /> Add Fund
                    </button>
                  </div>

                  <div className="mt-2.5 border-t border-black/5 pt-2">
                    <div className="flex justify-between text-[10px] font-bold text-neutral-500">
                      <span>
                        Target: {profile.currency} {formatAmount(analysis.emergencyFundTarget)} (3-Mo Runway)
                      </span>
                      <span>
                        {Math.min(
                          Math.round(
                            (analysis.currentEmergencyFund /
                              Math.max(analysis.emergencyFundTarget, 1)) *
                              100
                          ),
                          100
                        )}
                        %
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/60">
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all duration-700"
                        style={{
                          width: `${Math.min(
                            (analysis.currentEmergencyFund /
                              Math.max(analysis.emergencyFundTarget, 1)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Monthly EMIs */}
                <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-800">
                      <Receipt size={17} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Monthly EMIs
                      </span>
                      <p className="text-sm font-black text-neutral-900">
                        {profile.currency} {formatAmount(analysis.emiAmount)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openReserveManager("emi")}
                    className="flex items-center gap-1 rounded-xl border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-800 hover:bg-amber-100 transition active:scale-95"
                  >
                    Edit Cap
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openReserveManager("savings")}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/90 bg-white/90 py-3 text-xs font-extrabold text-neutral-800 shadow-sm transition hover:bg-white hover:shadow-md active:scale-95"
            >
              Deposit / Adjust All Reserves
              <ChevronRight size={14} />
            </button>
          </div>
        </section>

        {/* 7. Guidance Section */}
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

        {/* 8. Quick Launch Cards */}
        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
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
            <h3 className="mt-5 text-base font-bold text-neutral-900">
              Log Real Expenses
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
              Record everyday spending manually or via import.
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
            <h3 className="mt-5 text-base font-bold text-neutral-900">
              Monthly Budget
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
              Set proactive limits to prevent end-of-month deficits.
            </p>
          </div>

          <div
            onClick={() => router.push("/goals")}
            className="group cursor-pointer rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-7 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:-translate-y-1.5 hover:border-teal-300 hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-700 shadow-sm transition group-hover:scale-110">
                <Flag size={22} />
              </div>
              <ArrowUpRight
                size={18}
                className="text-neutral-400 transition group-hover:text-teal-700"
              />
            </div>
            <h3 className="mt-5 text-base font-bold text-neutral-900">
              Financial Goals
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
              Track progress across targets and deadlines.
            </p>
          </div>

          <div
            onClick={() => router.push("/recurring")}
            className="group cursor-pointer rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-7 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:-translate-y-1.5 hover:border-cyan-300 hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-700 shadow-sm transition group-hover:scale-110">
                <Repeat size={22} />
              </div>
              <ArrowUpRight
                size={18}
                className="text-neutral-400 transition group-hover:text-cyan-700"
              />
            </div>
            <h3 className="mt-5 text-base font-bold text-neutral-900">
              Commitments
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
              Manage subscriptions, utility bills, and loan EMIs.
            </p>
          </div>

          <div
            onClick={() => router.push("/reports")}
            className="group cursor-pointer rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-7 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:-translate-y-1.5 hover:border-emerald-300 hover:shadow-xl sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 shadow-sm transition group-hover:scale-110">
                <FileText size={22} />
              </div>
              <ArrowUpRight
                size={18}
                className="text-neutral-400 transition group-hover:text-emerald-700"
              />
            </div>
            <h3 className="mt-5 text-base font-bold text-neutral-900">
              Monthly Reports
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
              Review monthly performance statements and export CSV data.
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

      {/* Reserves Modal Instance */}
      <UpdateReservesModal
        uid={user.uid}
        currency={profile.currency}
        initialTab={selectedReserveTab}
        currentSavings={
          analysis.currentSavings ?? (profile as any)?.currentSavings ?? 0
        }
        currentEmergencyFund={
          analysis.currentEmergencyFund ?? (profile as any)?.currentEmergencyFund ?? 0
        }
        currentInvestments={
          analysis.currentInvestments ?? (profile as any)?.currentInvestments ?? 0
        }
        currentEmi={
          analysis.emiAmount ??
          (profile as any)?.emiAmount ??
          (profile as any)?.monthlyEmi ??
          (profile as any)?.emi ??
          0
        }
        isOpen={showReservesModal}
        onClose={() => setShowReservesModal(false)}
        onSuccess={async (appliedUpdates) => {
          if (appliedUpdates && profile) {
            // 1. Instantly update local profile state
            const updatedProfile = {
              ...profile,
              ...(appliedUpdates.currentSavings !== undefined && {
                currentSavings: appliedUpdates.currentSavings,
                savings: appliedUpdates.currentSavings,
              }),
              ...(appliedUpdates.currentInvestments !== undefined && {
                currentInvestments: appliedUpdates.currentInvestments,
                monthlyInvestments: appliedUpdates.currentInvestments,
              }),
              ...(appliedUpdates.currentEmergencyFund !== undefined && {
                currentEmergencyFund: appliedUpdates.currentEmergencyFund,
                emergencyFund: appliedUpdates.currentEmergencyFund,
              }),
              ...(appliedUpdates.emiAmount !== undefined && {
                emiAmount: appliedUpdates.emiAmount,
                monthlyEmi: appliedUpdates.emiAmount,
                emi: appliedUpdates.emiAmount,
              }),
            };
            setProfile(updatedProfile);

            // 2. Instantly recalculate the financial analysis engine
            const raw = updatedProfile as any;
            const freshEngineInput: FinancialProfileForEngine = {
              monthlyIncome: Number(raw.monthlyIncome ?? 0),
              essentialExpenses: Number(raw.essentialExpenses ?? 0),
              otherFixedExpenses: Number(
                raw.otherFixedExpenses ?? raw.recurringExpenses ?? 0
              ),
              emiAmount: Number(raw.emiAmount ?? raw.monthlyEmi ?? raw.emi ?? 0),
              currentSavings: Number(raw.currentSavings ?? 0),
              currentInvestments: Number(
                raw.currentInvestments ?? raw.monthlyInvestments ?? 0
              ),
              currentEmergencyFund: Number(
                raw.currentEmergencyFund ?? raw.emergencyFund ?? 0
              ),
              monthlySavingsTarget: raw.monthlySavingsTarget
                ? Number(raw.monthlySavingsTarget)
                : undefined,
              currency: raw.currency || "INR",
            };

            const recalculated = analyzeFinances(freshEngineInput, expenses);
            setAnalysis(recalculated);
          }

          // 3. Re-sync in the background from Firestore
          await loadDashboard();
        }}
      />
    </main>
  );
}