"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getFinancialProfile } from "@/lib/financial-profile";
import { getExpenses } from "@/lib/expenses";
import {
  analyzeFinances,
  type FinancialAnalysis,
} from "@/lib/financial-engine";

import { useAuth } from "@/components/auth-provider";
import type { FinancialProfile } from "@/types/finance";

import {
  ArrowUpRight,
  LogOut,
  Plus,
  Settings,
  Target,
  Wallet,
} from "lucide-react";

import { logoutUser } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (authLoading) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const [data, expenseData] = await Promise.all([
          getFinancialProfile(user.uid),
          getExpenses(user.uid),
        ]);

        if (!data?.setupCompleted) {
          router.replace("/setup");
          return;
        }

        setProfile(data);
        // analyzeFinances expects (profile, expenses)
        setAnalysis(analyzeFinances(data as any, expenseData));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading, router]);

  async function handleLogout() {
    await logoutUser();
    router.replace("/login");
  }

  if (authLoading || loading || !profile || !analysis) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#1f5c4a] border-t-transparent" />
          <p className="text-sm text-[#77776f]">
            Preparing your financial overview...
          </p>
        </div>
      </main>
    );
  }

  const formatter = new Intl.NumberFormat(
    profile.country === "AE" ? "en-AE" : "en-IN",
    {
      style: "currency",
      currency: profile.currency,
      maximumFractionDigits: 0,
    }
  );

  const currency = (amount: number) => formatter.format(amount);

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <header className="sticky top-0 z-20 border-b border-[#e7e5df] bg-[#f7f6f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <div className="font-semibold">Finora</div>
            <div className="text-xs text-[#77776f]">
              {profile.country === "AE" ? "UAE" : "India"} • {profile.currency}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-xl p-2.5 text-[#66665f] hover:bg-white"
              title="Settings"
            >
              <Settings size={18} />
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl p-2.5 text-[#66665f] hover:bg-white"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <section className="mb-8">
          <p className="text-sm font-medium text-[#1f5c4a]">
            Your financial space
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Your money at a glance.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#77776f]">
            Based on the financial information you've provided. These figures will
            become more accurate as you add your real expenses.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Monthly income"
            value={currency(analysis.monthlyIncome)}
            icon={<Wallet size={18} />}
          />

          <MetricCard
            title="Fixed commitments"
            value={currency(analysis.plannedFixedOutflow)}
            icon={<Target size={18} />}
          />

          <MetricCard
            title="Remaining after setup"
            value={currency(analysis.remainingAfterSetup)}
            icon={<ArrowUpRight size={18} />}
          />

          <MetricCard
            title="Available after expenses"
            value={currency(analysis.remainingAfterActualExpenses)}
            icon={<Wallet size={18} />}
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[28px] border border-[#e7e5df] bg-white p-6 sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm text-[#77776f]">
                  Initial financial assessment
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {analysis.status === "healthy"
                    ? "You have some room to plan."
                    : analysis.status === "watch"
                    ? "Your commitments need regular monitoring."
                    : analysis.status === "tight"
                    ? "Your monthly flexibility is limited."
                    : "Spending exceeds income."}
                </h2>
              </div>

              <div className="rounded-2xl bg-[#edf5f1] px-3 py-2 text-xs font-medium text-[#1f5c4a]">
                Initial view
              </div>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#66665f]">
              {analysis.statusMessage}
            </p>

            <div className="mt-8 space-y-5">
              <BreakdownRow
                label="Essential expenses"
                value={currency(analysis.essentialExpenses)}
                total={analysis.monthlyIncome}
              />

              <BreakdownRow
                label="Other fixed expenses"
                value={currency(analysis.otherFixedExpenses)}
                total={analysis.monthlyIncome}
              />

              <BreakdownRow
                label="EMI obligations"
                value={currency(analysis.emiAmount)}
                total={analysis.monthlyIncome}
              />

              <BreakdownRow
                label="Net surplus / buffer"
                value={currency(analysis.remainingAfterActualExpenses)}
                total={analysis.monthlyIncome}
              />
            </div>
          </div>

          <div className="rounded-[28px] bg-[#173d32] p-6 text-white sm:p-8">
            <p className="text-sm text-white/60">Long-term planning</p>
            <h2 className="mt-3 text-2xl font-semibold">
              Think beyond this month.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              {analysis.longTermRecommendation}
            </p>

            {analysis.emergencyFundTarget > 0 && (
              <div className="mt-7 rounded-2xl bg-white/10 p-5">
                <p className="text-xs text-white/60">
                  Target emergency fund (3 months)
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {currency(analysis.emergencyFundTarget)}
                </p>
                <p className="mt-3 text-xs leading-5 text-white/50">
                  {analysis.emergencyRecommendation}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <ActionCard
            icon={<Plus size={20} />}
            title="Add your expenses"
            description="Start recording your everyday spending manually."
            button="Add expense"
            onClick={() => router.push("/expenses")}
          />

          <ActionCard
            icon={<ArrowUpRight size={20} />}
            title="Import transactions"
            description="Upload a CSV file from your bank or payment records."
            button="Import CSV"
            onClick={() => {}}
          />
        </section>

        <section className="mt-8 rounded-[28px] border border-[#e7e5df] bg-white p-6 sm:p-8">
          <p className="text-sm font-medium text-[#1f5c4a]">
            Your current profile
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ProfileValue
              label="Country"
              value={
                profile.country === "AE" ? "United Arab Emirates" : "India"
              }
            />

            <ProfileValue
              label="Current savings"
              value={currency(analysis.currentSavings)}
            />

            <ProfileValue
              label="Emergency fund"
              value={currency(analysis.currentEmergencyFund)}
            />

            <ProfileValue
              label="Current investments"
              value={currency(analysis.currentInvestments)}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[#e7e5df] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#77776f]">{title}</p>
        <div className="rounded-xl bg-[#f3f3ef] p-2 text-[#1f5c4a]">{icon}</div>
      </div>
      <p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  total,
}: {
  label: string;
  value: string;
  total: number;
}) {
  const numeric =
    Number(value.replace(/[^0-9.-]+/g, "")) || 0;

  const percentage =
    total > 0 ? Math.min((numeric / total) * 100, 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-[#66665f]">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#eeeeea]">
        <div
          className="h-full rounded-full bg-[#6d9b8b] transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  button,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  button: string;
  onClick?: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-[#e7e5df] bg-white p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf5f1] text-[#1f5c4a]">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#77776f]">{description}</p>
      <button
        onClick={onClick}
        type="button"
        className="mt-5 rounded-xl bg-[#f3f3ef] px-4 py-2.5 text-sm font-medium text-[#173d32] transition hover:bg-[#e9e9e4]"
      >
        {button}
      </button>
    </div>
  );
}

function ProfileValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-[#85857e]">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}