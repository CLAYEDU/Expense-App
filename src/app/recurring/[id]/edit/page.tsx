"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Sparkles } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { getFinancialProfile } from "@/lib/financial-profile";
import {
  getRecurringExpenses,
  type RecurringExpense,
} from "@/lib/recurring-expenses";
import RecurringExpenseForm from "@/components/recurring/RecurringExpenseForm";

export default function EditRecurringPage() {
  const router = useRouter();
  const params = useParams();

  const id = typeof params?.id === "string" ? params.id : "";

  const { user, loading: authLoading } = useAuth();

  const [recurring, setRecurring] = useState<RecurringExpense | null>(null);
  const [currency, setCurrency] = useState<"INR" | "AED">("INR");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (authLoading) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const profile = await getFinancialProfile(user.uid);

        if (!profile) {
          router.replace("/setup");
          return;
        }

        setCurrency(profile.currency);

        const items = await getRecurringExpenses(user.uid);
        const found = items.find((item) => item.id === id);

        if (!found) {
          router.replace("/recurring");
          return;
        }

        setRecurring(found);
      } catch (error) {
        console.error("Failed to load recurring expense:", error);
        router.replace("/recurring");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading, id, router]);

  // Loading Skeleton with Apple Glass Styling
  if (authLoading || loading || !recurring) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-[#edf2ee] p-6 overflow-hidden">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-24 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-emerald-400/40 via-teal-300/30 to-emerald-200/20 blur-[130px]" />
          <div className="absolute top-[28%] -left-32 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-teal-400/35 via-emerald-300/30 to-cyan-300/25 blur-[140px]" />
        </div>
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#173d32] border-t-transparent relative z-10" />
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

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Link */}
        <Link
          href="/recurring"
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-white/85 bg-white/70 px-4 py-2.5 text-xs font-bold text-neutral-800 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:bg-white hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.08)] active:scale-95"
        >
          <ArrowLeft size={16} />
          Back to recurring
        </Link>

        {/* ================= HEADER ================= */}
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-600/30">
              <CalendarClock size={24} />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/70 px-3 py-0.5 text-[11px] font-bold text-emerald-800 shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xl">
                <Sparkles size={12} className="text-emerald-600 animate-pulse" />
                <span>Commitment Calibration</span>
              </div>

              <h1 className="mt-1 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
                Edit Recurring Expense
              </h1>

              <p className="mt-0.5 text-xs sm:text-sm text-neutral-500">
                Update billing cadence, payment dates, or commitment figures for this recurring payment.
              </p>
            </div>
          </div>
        </header>

        {/* ================= FORM CARD WRAPPER ================= */}
        <div className="overflow-hidden rounded-[36px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 sm:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:shadow-[0_25px_50px_-10px_rgba(16,185,129,0.12)]">
          <RecurringExpenseForm
            mode="edit"
            recurring={recurring}
            currency={currency}
          />
        </div>
      </div>
    </main>
  );
}