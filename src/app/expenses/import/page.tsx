"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, Sparkles, FileText, Download } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { getFinancialProfile } from "@/lib/financial-profile";
import CSVImporter from "@/components/expenses/CSVImporter";

interface FinancialProfile {
  currency: "INR" | "AED";
}

export default function ExpenseImportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      const data = await getFinancialProfile(user.uid);

      if (!data) {
        router.replace("/setup");
        return;
      }

      setProfile(data as FinancialProfile);
    } catch (error) {
      console.error(error);
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

    loadProfile();
  }, [authLoading, user, router, loadProfile]);

  // Loading State with Apple Glass Skeleton
  if (authLoading || loading || !user || !profile) {
    return (
      <main className="relative min-h-screen bg-[#edf2ee] p-6 text-neutral-900 overflow-hidden">
        {/* Living Mesh Background */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-24 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-emerald-400/40 via-teal-300/30 to-emerald-200/20 blur-[130px]" />
          <div className="absolute top-[28%] -left-32 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-teal-400/35 via-emerald-300/30 to-cyan-300/25 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="h-9 w-64 animate-pulse rounded-2xl bg-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)] backdrop-blur-xl" />
          <div className="mt-8 h-[500px] animate-pulse rounded-[36px] border border-white/80 bg-white/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl" />
        </div>
      </main>
    );
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

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ================= HEADER ================= */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/70 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xl">
              <Sparkles size={14} className="text-emerald-600 animate-pulse" />
              <span>Bulk Transaction Ingestion</span>
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
              CSV Import Center
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-neutral-500 max-w-2xl leading-relaxed">
              Bring your existing transaction history into the app seamlessly without manual record entry.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/expenses")}
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/85 bg-white/70 px-5 py-3 text-xs font-bold text-neutral-800 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition-all duration-300 hover:bg-white hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.08)] active:scale-95 sm:self-auto"
          >
            <ArrowLeft size={16} />
            Back to expenses
          </button>
        </header>

        {/* ================= CSV IMPORTER COMPONENT WRAPPER ================= */}
        <div className="overflow-hidden rounded-[36px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:shadow-[0_25px_50px_-10px_rgba(16,185,129,0.12)]">
          <CSVImporter
            uid={user.uid}
            currency={profile.currency}
            onImported={() => router.push("/expenses")}
          />
        </div>

        {/* ================= SPECIFICATION & SAMPLE DOWNLOAD CARD ================= */}
        <div className="mt-8 overflow-hidden rounded-[36px] border border-white/80 bg-gradient-to-br from-white/75 via-white/55 to-white/40 p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.85)] backdrop-blur-2xl transition hover:shadow-[0_25px_50px_-10px_rgba(6,182,212,0.12)]">
          <div className="flex items-center gap-2.5 border-b border-black/5 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-800 shadow-sm">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-900">
                CSV Schema & Column Format
              </h2>
              <p className="text-[11px] font-semibold text-neutral-400">
                Ensure your file headers match the required structure
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs sm:text-sm leading-relaxed text-neutral-600">
            The minimum required column headers are <strong>date</strong>, <strong>title</strong>, and <strong>amount</strong>. 
            Additional fields like category, payment method, and notes are optional and will fall back gracefully.
          </p>

          {/* Frosted Dark Code Block */}
          <div className="mt-5 overflow-x-auto rounded-2xl border border-neutral-800/60 bg-neutral-950/90 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md">
            <code className="whitespace-nowrap font-mono text-xs text-emerald-400">
              date,title,amount,category,paymentMethod,note
            </code>
          </div>

          {/* Download Sample Button */}
          <div className="mt-6">
            <a
              href="/sample-expenses.csv"
              download
              className="inline-flex items-center gap-2 rounded-2xl border border-white/90 bg-white/80 px-5 py-3 text-xs font-bold text-neutral-800 shadow-[0_8px_20px_rgba(0,0,0,0.04),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition hover:bg-white hover:shadow-md active:scale-95"
            >
              <Download size={15} className="text-emerald-700" />
              Download sample CSV template
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}