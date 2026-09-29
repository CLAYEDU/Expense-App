"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Pencil,
  Target,
  Trash2,
} from "lucide-react";

import type { Goal } from "@/lib/goals";
import {
  getGoalProgress,
  getGoalRemaining,
  getMonthsRemaining,
  getSuggestedMonthlyContribution,
} from "@/lib/goals";

type Props = {
  goal: Goal;
  currency: "INR" | "AED";
  onDelete: (goalId: string) => void;
};

export default function GoalCard({
  goal,
  currency,
  onDelete,
}: Props) {
  const progress =
    getGoalProgress(goal);

  const remaining =
    getGoalRemaining(goal);

  const months =
    getMonthsRemaining(
      goal.targetDate
    );

  const monthlyContribution =
    getSuggestedMonthlyContribution(
      goal
    );

  const completed =
    progress >= 100;

  const formatMoney = (
    amount: number
  ) =>
    `${currency === "INR" ? "₹" : "AED "}${amount.toLocaleString(
      currency === "INR"
        ? "en-IN"
        : "en-AE",
      {
        maximumFractionDigits: 0,
      }
    )}`;

  const formattedDate =
    new Date(
      `${goal.targetDate}T00:00:00`
    ).toLocaleDateString(
      currency === "INR"
        ? "en-IN"
        : "en-AE",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );

  return (
    <motion.article
      layout
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100">
            {completed ? (
              <CheckCircle2 className="h-5 w-5 text-neutral-700" />
            ) : (
              <Target className="h-5 w-5 text-neutral-700" />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="truncate font-semibold text-neutral-950">
              {goal.name}
            </h2>

            <p className="mt-1 text-xs text-neutral-500">
              {goal.type}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={`/goals/${goal.id}/edit`}
            className="rounded-xl p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label={`Edit ${goal.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={() =>
              onDelete(goal.id)
            }
            className="rounded-xl p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label={`Delete ${goal.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold tracking-tight text-neutral-950">
              {formatMoney(
                goal.currentAmount
              )}
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              of {formatMoney(
                goal.targetAmount
              )}
            </p>
          </div>

          <span className="text-sm font-semibold text-neutral-700">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${progress}%`,
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            className="h-full rounded-full bg-neutral-900"
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">
            Remaining
          </p>

          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {formatMoney(remaining)}
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">
            Suggested / month
          </p>

          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {formatMoney(
              monthlyContribution
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />

          {completed
            ? "Goal completed"
            : months > 0
              ? `${months} month${
                  months === 1
                    ? ""
                    : "s"
                } remaining`
              : "Target date reached"}
        </span>

        <span>
          Target: {formattedDate}
        </span>
      </div>

      {goal.description && (
        <p className="mt-4 border-t border-neutral-100 pt-4 text-sm leading-6 text-neutral-600">
          {goal.description}
        </p>
      )}
    </motion.article>
  );
}