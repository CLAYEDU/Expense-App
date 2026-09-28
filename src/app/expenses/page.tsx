"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [profile, setProfile] =
    useState<FinancialProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError("");

      const [expenseData, financialProfile] =
        await Promise.all([
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
      setError(
        "Unable to load your expenses. Please try again."
      );
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

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200" />

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-3xl bg-neutral-200"
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
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">
              Money management
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
              Expenses
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
              Keep your spending organized so your financial
              plan can be based on your actual expenses.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Back to dashboard
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <ExpenseSummary
          expenses={expenses}
          currency={profile.currency}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
          <ExpenseForm
            uid={user.uid}
            currency={profile.currency}
            onExpenseAdded={loadData}
          />

          <ExpenseList
            uid={user.uid}
            expenses={expenses}
            currency={profile.currency}
            onExpenseChanged={loadData}
          />
        </div>
      </div>
    </main>
  );
}