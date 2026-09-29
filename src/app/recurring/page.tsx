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
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Plus,
  Repeat,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { getFinancialProfile } from "@/lib/financial-profile";
import {
  deleteRecurringExpense,
  getRecurringExpenses,
  getRecurringStatus,
  getDaysUntilDue,
  type RecurringExpense,
} from "@/lib/recurring-expenses";

import RecurringExpenseCard from "@/components/recurring/RecurringExpenseCard";

export default function RecurringPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [currency, setCurrency] = useState<"INR" | "AED">("INR");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const profile = await getFinancialProfile(user.uid);

      if (!profile) {
        router.replace("/setup");
        return;
      }

      setCurrency(profile.currency);
      const recurring = await getRecurringExpenses(user.uid);
      setItems(recurring);
    } catch (error) {
      console.error("Failed to load recurring expenses:", error);
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

    loadData();
  }, [authLoading, user, router, loadData]);

  async function handleDelete(id: string) {
    if (!user) return;

    const confirmed = window.confirm("Delete this recurring expense?");
    if (!confirmed) return;

    try {
      await deleteRecurringExpense(user.uid, id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete recurring expense:", error);
      window.alert("Unable to delete this recurring expense.");
    }
  }

  async function handleMarkPaid(id: string) {
    if (!user) return;

    const item = items.find((entry) => entry.id === id);
    if (!item) return;

    try {
      const now = new Date();
      const period =
        item.frequency === "Yearly"
          ? String(now.getFullYear())
          : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const { updateRecurringExpense } = await import(
        "@/lib/recurring-expenses"
      );

      await updateRecurringExpense(user.uid, id, {
        lastPaidPeriod: period,
      } as never);

      setItems((current) =>
        current.map((entry) =>
          entry.id === id
            ? { ...entry, lastPaidPeriod: period }
            : entry
        )
      );
    } catch (error) {
      console.error("Failed to mark payment:", error);
      window.alert("Unable to mark this payment as paid.");
    }
  }

  const activeItems = useMemo(
    () => items.filter((item) => item.active),
    [items]
  );

  const overdueItems = useMemo(
    () =>
      activeItems.filter(
        (item) => getRecurringStatus(item) === "overdue"
      ),
    [activeItems]
  );

  const dueSoonItems = useMemo(
    () =>
      activeItems.filter((item) => {
        const days = getDaysUntilDue(item);
        return days !== null && days >= 0 && days <= 7;
      }),
    [activeItems]
  );

  const monthlyCommitment = useMemo(
    () =>
      activeItems.reduce((sum, item) => {
        if (item.frequency === "Monthly") {
          return sum + (Number(item.amount) || 0);
        }
        return sum + (Number(item.amount) || 0) / 12;
      }, 0),
    [activeItems]
  );

  const formatMoney = (amount: number) =>
    `${currency === "INR" ? "₹" : "AED "}${Math.round(amount).toLocaleString(
      currency === "INR" ? "en-IN" : "en-AE"
    )}`;

  // Loading skeleton with Apple Glass design
  if (authLoading || loading) {
    return (
      <main className="relative min-h-screen bg-[#edf2ee] p-6 text-neutral-900 overflow-hidden">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-24 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-emerald-400/40 via-teal-300/30 to-emerald-200/20 blur-[130px]" />
          <div className="absolute top-[28%] -left-32 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-teal-400/35 via-emerald-300/30 to-cyan-300/25 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="h-9 w-52 animate-pulse rounded-2xl bg-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-xl" />

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
            href="/recurring/create"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#173d32] px-5 py-2.5 text-xs font-bold text-white shadow-[0_12px_28px_rgba(23,61,50,0.25)] transition hover:bg-[#1f5c4a] hover:scale-105 active:scale-95"
          >
            <Plus size={16} />
            Add Recurring
          </Link>
        </div>

        {/* ================= HEADER ================= */}
        <header className="mt-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-600/30">
              <CalendarClock size={24} />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/70 px-3 py-0.5 text-[11px] font-bold text-emerald-800 shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xl">
                <Sparkles size={12} className="text-emerald-600 animate-pulse" />
                <span>Automated Commitments</span>
              </div>

              <h1 className="mt-1 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
                Recurring Expenses
              </h1>

              <p className="mt-0.5 text-xs sm:text-sm text-neutral-500">
                Track repeated bills, loan EMIs, utilities, and scheduled payments with active cycle monitoring.
              </p>
            </div>
          </div>
        </header>

        {/* ================= SUMMARY STATS (3 CARDS) ================= */}
        <section className="grid gap-4 sm:grid-cols-3">
          {/* Card 1: Active Payments */}
          <div className="group overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Active Payments
              </p>
              <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-700 transition group-hover:scale-110">
                <Repeat size={16} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-neutral-950">
              {activeItems.length}
            </p>
            <p className="mt-2 text-[11px] font-semibold text-neutral-500">
              Recurring payments being tracked
            </p>
          </div>

          {/* Card 2: Estimated Monthly Commitment */}
          <div className="group overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Monthly Commitment
              </p>
              <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-700 transition group-hover:scale-110">
                <CalendarClock size={16} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-neutral-950">
              {formatMoney(monthlyCommitment)}
            </p>
            <p className="mt-2 text-[11px] font-semibold text-neutral-500">
              Normalized monthly run rate
            </p>
          </div>

          {/* Card 3: Due Soon */}
          <div className="group overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Due In 7 Days
              </p>
              <div className="rounded-xl bg-amber-500/15 p-2 text-amber-700 transition group-hover:scale-110">
                <AlertCircle size={16} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-neutral-950">
              {dueSoonItems.length}
            </p>
            <p className="mt-2 text-[11px] font-semibold text-neutral-500">
              Immediate payment window
            </p>
          </div>
        </section>

        {/* ================= OVERDUE ALERT BANNER ================= */}
        {overdueItems.length > 0 && (
          <section className="mt-5 overflow-hidden rounded-[32px] border border-red-300/80 bg-gradient-to-br from-red-50/80 via-white/60 to-red-100/50 p-6 shadow-[0_20px_40px_-15px_rgba(239,68,68,0.18),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-600 border border-red-200/60 shadow-sm">
                <AlertCircle size={22} />
              </div>

              <div>
                <h2 className="text-base font-black text-neutral-950">
                  Payments Needing Immediate Attention
                </h2>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                  <span className="font-extrabold text-red-600">
                    {overdueItems.length} active recurring payment
                    {overdueItems.length === 1 ? "" : "s"}
                  </span>{" "}
                  currently appear overdue for this payment cycle. Review or mark them as paid to restore clean runway tracking.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ================= RECURRING EXPENSES LIST ================= */}
        <section className="mt-8">
          {items.length === 0 ? (
            <div className="rounded-[36px] border border-dashed border-white/90 bg-white/40 p-12 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 text-neutral-400 shadow-sm">
                <CalendarClock size={28} />
              </div>

              <h2 className="mt-4 font-black text-neutral-950 text-lg">
                No recurring payments yet
              </h2>

              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-neutral-500">
                Add your regular rent, loan EMIs, electricity, streaming subscriptions, or insurance commitments for automated tracking.
              </p>

              <Link
                href="/recurring/create"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#173d32] px-6 py-3 text-xs font-bold text-white shadow-[0_12px_28px_rgba(23,61,50,0.25)] transition hover:bg-[#1f5c4a] hover:scale-105 active:scale-95"
              >
                <Plus size={16} />
                Add your first recurring payment
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-2 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <RecurringExpenseCard
                    recurring={item}
                    // currency={currency}
                    onDelete={handleDelete}
                    onMarkPaid={handleMarkPaid}
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