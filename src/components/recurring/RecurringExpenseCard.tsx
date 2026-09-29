"use client";

import Link from "next/link";

import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Pencil,
  Trash2,
} from "lucide-react";

import type {
  RecurringExpense,
} from "@/lib/recurring-expenses";

import {
  getDaysUntilDue,
  getRecurringStatus,
  isPaidForCurrentPeriod,
} from "@/lib/recurring-expenses";

type Props = {
  recurring: RecurringExpense;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
};

export default function RecurringExpenseCard({
  recurring,
  onDelete,
  onMarkPaid,
}: Props) {
  const status =
    getRecurringStatus(recurring);

  const daysUntilDue =
    getDaysUntilDue(recurring);

  const paid =
    isPaidForCurrentPeriod(
      recurring
    );

  const formatMoney = (
    amount: number
  ) => {
    return `${
      recurring.currency === "INR"
        ? "₹"
        : "AED "
    }${amount.toLocaleString(
      recurring.currency ===
        "INR"
        ? "en-IN"
        : "en-AE",
      {
        maximumFractionDigits: 0,
      }
    )}`;
  };

  const dueText = (() => {
    if (!recurring.active) {
      return "Inactive";
    }

    if (paid) {
      return "Paid for this period";
    }

    if (
      daysUntilDue !== null &&
      daysUntilDue < 0
    ) {
      const days = Math.abs(
        daysUntilDue
      );

      return `Overdue by ${days} day${
        days === 1 ? "" : "s"
      }`;
    }

    if (
      daysUntilDue !== null &&
      daysUntilDue === 0
    ) {
      return "Due today";
    }

    if (
      daysUntilDue !== null &&
      daysUntilDue <= 7
    ) {
      return `Due in ${daysUntilDue} day${
        daysUntilDue === 1
          ? ""
          : "s"
      }`;
    }

    return `Due on day ${recurring.dueDay}`;
  })();

  return (
    <article className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100">
            {status === "overdue" ? (
              <CircleAlert className="h-5 w-5 text-neutral-700" />
            ) : status === "paid" ? (
              <CheckCircle2 className="h-5 w-5 text-neutral-700" />
            ) : (
              <CalendarDays className="h-5 w-5 text-neutral-700" />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="truncate font-semibold text-neutral-950">
              {recurring.name}
            </h2>

            <p className="mt-1 text-xs text-neutral-500">
              {recurring.type}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={`/recurring/${recurring.id}/edit`}
            className="rounded-xl p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label={`Edit ${recurring.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={() =>
              onDelete(recurring.id)
            }
            className="rounded-xl p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label={`Delete ${recurring.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-neutral-950">
            {formatMoney(
              recurring.amount
            )}
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            per{" "}
            {recurring.frequency ===
            "Monthly"
              ? "month"
              : "year"}
          </p>
        </div>

        <span
          className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700"
        >
          {dueText}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">
            Frequency
          </p>

          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {recurring.frequency}
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">
            Due day
          </p>

          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {recurring.dueDay}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
        <Clock3 className="h-3.5 w-3.5" />

        {dueText}
      </div>

      {recurring.note && (
        <p className="mt-4 border-t border-neutral-100 pt-4 text-sm leading-6 text-neutral-600">
          {recurring.note}
        </p>
      )}

      {recurring.active &&
        !paid && (
          <button
            type="button"
            onClick={() =>
              onMarkPaid(
                recurring.id
              )
            }
            className="mt-5 w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Mark as paid
          </button>
        )}

      {paid && (
        <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700">
          <CheckCircle2 className="h-4 w-4" />

          Paid for this period
        </div>
      )}
    </article>
  );
}