"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { getFinancialProfile } from "@/lib/financial-profile";

import CSVImporter from "@/components/expenses/CSVImporter";

interface FinancialProfile {
  currency: "INR" | "AED";
}

export default function ExpenseImportPage() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const router = useRouter();

  const [profile, setProfile] =
    useState<FinancialProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const loadProfile = useCallback(
    async () => {
      if (!user) return;

      try {
        const data =
          await getFinancialProfile(
            user.uid
          );

        if (!data) {
          router.replace("/setup");
          return;
        }

        setProfile(
          data as FinancialProfile
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [user, router]
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    loadProfile();
  }, [
    authLoading,
    user,
    router,
    loadProfile,
  ]);

  if (
    authLoading ||
    loading ||
    !user ||
    !profile
  ) {
    return (
      <main className="min-h-screen bg-[#f7f6f2] p-6">
        <div className="mx-auto max-w-5xl">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-neutral-200" />

          <div className="mt-8 h-[500px] animate-pulse rounded-3xl bg-neutral-200" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">
              Expense management
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
              CSV Import Center
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
              Bring your existing transaction history into
              the app without entering every expense manually.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/expenses")
            }
            className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Back to expenses
          </button>
        </header>

        <CSVImporter
          uid={user.uid}
          currency={profile.currency}
          onImported={() =>
            router.push("/expenses")
          }
        />

        <div className="mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">
            CSV format
          </h2>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            The minimum required columns are{" "}
            <strong>date</strong>,{" "}
            <strong>title</strong>, and{" "}
            <strong>amount</strong>.
            Category, payment method and note are optional.
          </p>

          <div className="mt-5 overflow-x-auto rounded-2xl bg-neutral-950 p-4">
            <code className="whitespace-nowrap text-xs text-neutral-200">
              date,title,amount,category,paymentMethod,note
            </code>
          </div>

          <div className="mt-5">
            <a
              href="/sample-expenses.csv"
              download
              className="inline-flex rounded-2xl border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Download sample CSV
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}