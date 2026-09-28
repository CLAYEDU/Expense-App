"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { registerUser } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
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

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      await registerUser(
        email.trim(),
        password
      );

      router.replace("/setup");
    } catch (error: any) {
      if (
        error?.code ===
        "auth/email-already-in-use"
      ) {
        setError(
          "An account already exists with this email."
        );
      } else if (
        error?.code ===
        "auth/invalid-email"
      ) {
        setError(
          "Please enter a valid email address."
        );
      } else {
        setError(
          "Unable to create the account. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-10">
      <div className="mx-auto flex min-h-[85vh] max-w-lg items-center">
        <div className="w-full rounded-[32px] border border-[#e7e5df] bg-white p-7 shadow-[0_30px_100px_rgba(0,0,0,0.08)] sm:p-12">

          <div className="mb-10">
            <div className="mb-8 text-xl font-semibold">
              Finora
            </div>

            <p className="mb-2 text-sm font-medium text-[#1f5c4a]">
              Start your journey
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              Create your account
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#6f7069]">
              We'll ask a few questions about
              your financial situation next.
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
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="w-full rounded-2xl border border-[#deddd7] bg-[#fafaf8] px-4 py-3.5 outline-none transition focus:border-[#1f5c4a] focus:ring-4 focus:ring-[#1f5c4a]/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Confirm password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                required
                autoComplete="new-password"
                placeholder="Repeat your password"
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
                ? "Creating account..."
                : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#6f7069]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#1f5c4a] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}