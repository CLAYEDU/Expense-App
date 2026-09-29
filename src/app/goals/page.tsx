"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Plus,
  Target,
  Sparkles,
  Trophy,
  TrendingUp,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { getFinancialProfile } from "@/lib/financial-profile";
import {
  deleteGoal,
  getGoals,
  type Goal,
} from "@/lib/goals";
import GoalCard from "@/components/goals/GoalCard";

export default function GoalsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [currency, setCurrency] = useState<"INR" | "AED">("INR");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    if (!user) return;

    try {
      const profile = await getFinancialProfile(user.uid);

      if (!profile) {
        router.replace("/setup");
        return;
      }

      setCurrency(profile.currency);
      const userGoals = await getGoals(user.uid);
      setGoals(userGoals);
    } catch (error) {
      console.error("Failed to load goals:", error);
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    loadGoals();
  }, [authLoading, user, router, loadGoals]);

  async function handleDelete(goalId: string) {
    if (!user) return;

    const confirmed = window.confirm("Are you sure you want to delete this goal?");
    if (!confirmed) return;

    try {
      setDeletingId(goalId);
      await deleteGoal(user.uid, goalId);
      setGoals((current) => current.filter((goal) => goal.id !== goalId));
    } catch (error) {
      console.error("Failed to delete goal:", error);
      window.alert("Unable to delete this goal. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const completedGoals = useMemo(
    () => goals.filter((goal) => goal.currentAmount >= goal.targetAmount).length,
    [goals]
  );

  const totalTarget = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.targetAmount, 0),
    [goals]
  );

  const totalSaved = useMemo(
    () =>
      goals.reduce(
        (sum, goal) => sum + Math.min(goal.currentAmount, goal.targetAmount),
        0
      ),
    [goals]
  );

  const overallProgress =
    totalTarget > 0
      ? Math.min(100, (totalSaved / totalTarget) * 100)
      : 0;

  // Loading skeleton with Apple Glass styling
  if (authLoading || loading) {
    return (
      <main className="relative min-h-screen bg-[#edf2ee] p-6 text-neutral-900 overflow-hidden">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-24 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-emerald-400/40 via-teal-300/30 to-emerald-200/20 blur-[130px]" />
          <div className="absolute top-[28%] -left-32 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-teal-400/35 via-emerald-300/30 to-cyan-300/25 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="h-9 w-40 animate-pulse rounded-2xl bg-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-xl" />

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-[32px] border border-white/80 bg-white/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl"
              />
            ))}
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-[36px] border border-white/80 bg-white/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#edf2ee] text-neutral-900 antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* ================= APPLE AMBIENT LIVING AURORA BACKGROUND ================= */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-36 -right-24 h-[620px] w-[620px] rounded-full bg-gradient-to-br from-emerald-400/50 via-teal-300/40 to-emerald-200/25 blur-[120px]" />
        <div className="absolute top-[25%] -left-36 h-[650px] w-[650px] rounded-full bg-gradient-to-tr from-teal-400/40 via-emerald-300/35 to-cyan-300/30 blur-[140px]" />
        <div className="absolute -bottom-36 right-[15%] h-[580px] w-[580px] rounded-full bg-gradient-to-t from-cyan-300/35 via-emerald-200/30 to-transparent blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/85 bg-white/70 px-4 py-2.5 text-xs font-bold text-neutral-800 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:bg-white hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.08)] active:scale-95"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>

          <Link
            href="/goals/create"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#173d32] px-5 py-2.5 text-xs font-bold text-white shadow-[0_12px_28px_rgba(23,61,50,0.25)] transition hover:bg-[#1f5c4a] hover:scale-105 active:scale-95"
          >
            <Plus size={16} />
            New Goal
          </Link>
        </div>

        {/* ================= HEADER ================= */}
        <header className="mt-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-600/30">
              <Target size={24} />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/70 px-3 py-0.5 text-[11px] font-bold text-emerald-800 shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xl">
                <Sparkles size={12} className="text-emerald-600 animate-pulse" />
                <span>Capital Objectives</span>
              </div>

              <h1 className="mt-1 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
                Financial Goals
              </h1>

              <p className="mt-0.5 text-xs sm:text-sm text-neutral-500">
                Turn your aspirational milestones into calibrated, measurable savings targets.
              </p>
            </div>
          </div>
        </header>

        {/* ================= SUMMARY STATS (3 CARDS) ================= */}
        <section className="grid gap-4 sm:grid-cols-3">
          {/* Card 1: Total Goals */}
          <div className="group overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Active Goals
              </p>
              <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-700 transition group-hover:scale-110">
                <Target size={16} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-neutral-950">
              {goals.length}
            </p>
            <p className="mt-2 text-[11px] font-semibold text-neutral-500">
              Fund targets registered
            </p>
          </div>

          {/* Card 2: Completed */}
          <div className="group overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Completed
              </p>
              <div className="rounded-xl bg-amber-500/15 p-2 text-amber-700 transition group-hover:scale-110">
                <Trophy size={16} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-neutral-950">
              {completedGoals}
            </p>
            <p className="mt-2 text-[11px] font-semibold text-neutral-500">
              100% funded milestones
            </p>
          </div>

          {/* Card 3: Overall Progress */}
          <div className="group overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Overall Progress
              </p>
              <div className="rounded-xl bg-teal-500/15 p-2 text-teal-700 transition group-hover:scale-110">
                <TrendingUp size={16} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-neutral-950">
              {Math.round(overallProgress)}%
            </p>
            <p className="mt-2 text-[11px] font-semibold text-neutral-500">
              Across all targets
            </p>
          </div>
        </section>

        {/* ================= OVERALL PROGRESS METRIC BAR ================= */}
        {goals.length > 0 && (
          <section className="mt-5 overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Aggregate Cumulative Savings
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-700">
                  <span className="font-extrabold text-neutral-950">
                    {currency === "INR" ? "₹" : "AED "}
                    {totalSaved.toLocaleString(currency === "INR" ? "en-IN" : "en-AE")}
                  </span>{" "}
                  saved of{" "}
                  <span className="text-neutral-500">
                    {currency === "INR" ? "₹" : "AED "}
                    {totalTarget.toLocaleString(currency === "INR" ? "en-IN" : "en-AE")}
                  </span>
                </p>
              </div>

              <span className="rounded-xl border border-white/90 bg-white/80 px-3 py-1 text-xs font-black text-emerald-900 shadow-xs self-start sm:self-auto">
                {Math.round(overallProgress)}% Funded
              </span>
            </div>

            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full border border-white/80 bg-neutral-200/60 p-0.5 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 transition-all duration-1000 shadow-sm"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </section>
        )}

        {/* ================= GOALS GRID ================= */}
        <section className="mt-8">
          {goals.length === 0 ? (
            <div className="rounded-[36px] border border-dashed border-white/90 bg-white/40 p-12 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 text-neutral-400 shadow-sm">
                <Target size={28} />
              </div>

              <h2 className="mt-4 font-black text-neutral-950 text-lg">
                No active goals yet
              </h2>

              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-neutral-500">
                Create your first savings goal and Finora will calculate optimal runway allocations to keep you on schedule.
              </p>

              <Link
                href="/goals/create"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#173d32] px-6 py-3 text-xs font-bold text-white shadow-[0_12px_28px_rgba(23,61,50,0.25)] transition hover:bg-[#1f5c4a] hover:scale-105 active:scale-95"
              >
                <Plus size={16} />
                Create your first goal
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={`overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-2 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl ${
                    deletingId === goal.id ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <GoalCard
                    goal={goal}
                    currency={currency}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}