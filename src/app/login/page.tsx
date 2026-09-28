"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { loginUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await loginUser(
        email.trim(),
        password
      );

      router.replace("/dashboard");
    } catch (error: any) {
      if (
        error?.code ===
        "auth/invalid-credential"
      ) {
        setError(
          "The email or password is incorrect."
        );
      } else {
        setError(
          "Unable to sign in. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-10">
      <div className="mx-auto flex min-h-[85vh] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-[#e7e5df] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.08)] md:grid-cols-2">

          <div className="hidden bg-[#173d32] p-12 text-white md:flex md:flex-col md:justify-between">
            <div>
              <div className="mb-10 text-xl font-semibold">
                Finora
              </div>

              <h1 className="max-w-md text-5xl font-medium leading-[1.05]">
                Understand your money.
                Plan your future.
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-white/70">
                Track everyday expenses,
                understand your spending and
                build a financial plan around
                your actual situation.
              </p>
            </div>

            <p className="text-sm text-white/50">
              India • UAE • INR • AED
            </p>
          </div>

          <div className="p-7 sm:p-12">
            <div className="mb-10 md:hidden">
              <div className="text-xl font-semibold">
                Finora
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-sm font-medium text-[#1f5c4a]">
                Welcome back
              </p>

              <h2 className="text-3xl font-semibold tracking-tight">
                Sign in
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6f7069]">
                Continue to your personal
                financial space.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-[#deddd7] bg-[#fafaf8] px-4 py-3.5 outline-none transition focus:border-[#1f5c4a] focus:ring-4 focus:ring-[#1f5c4a]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-[#deddd7] bg-[#fafaf8] px-4 py-3.5 outline-none transition focus:border-[#1f5c4a] focus:ring-4 focus:ring-[#1f5c4a]/10"
                />
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-[#173d32] px-5 py-3.5 font-medium text-white transition hover:bg-[#205543] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Signing in..."
                  : "Sign in"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#6f7069]">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-[#1f5c4a] hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}