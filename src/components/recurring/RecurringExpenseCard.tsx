"use client";

import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  Repeat,
  Trash2,
  AlertCircle,
} from "lucide-react";

import {
  getRecurringStatus,
  getRecurringPaymentPeriod,
  type RecurringExpense,
} from "@/lib/recurring-expenses";

type Props = {
  recurring: RecurringExpense;
  currency: "INR" | "AED";
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
  paying?: boolean;
};

function formatCurrency(amount: number, currency: "INR" | "AED") {
  return new Intl.NumberFormat(
    currency === "INR" ? "en-IN" : "en-AE",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }
  ).format(Number(amount) || 0);
}

export default function RecurringExpenseCard({
  recurring,
  currency,
  onDelete,
  onMarkPaid,
  paying = false,
}: Props) {
  const status = getRecurringStatus(recurring);
  const paid = status === "paid";

  const statusText = paid
    ? "Paid"
    : status === "overdue"
    ? "Overdue"
    : status === "due_soon"
    ? "Due soon"
    : "Upcoming";

  const statusBadgeClass = paid
    ? "border-emerald-300/80 bg-emerald-500/15 text-emerald-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)]"
    : status === "overdue"
    ? "border-red-300/80 bg-red-500/15 text-red-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)]"
    : status === "due_soon"
    ? "border-amber-300/80 bg-amber-500/15 text-amber-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)]"
    : "border-white/80 bg-white/70 text-neutral-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)]";

  const categoryName =
    recurring.category || (recurring as any).type || "General Commitment";

  const noteText = (recurring as any).note || "";

  return (
    <article className="group relative overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-white/80 via-white/60 to-white/45 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),inset_0_1px_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-xl">
      {/* Header Info Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black tracking-tight text-neutral-950">
              {recurring.name}
            </h3>

            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider backdrop-blur-md ${statusBadgeClass}`}
            >
              {paid && <CheckCircle2 size={12} className="text-emerald-700" />}
              {status === "overdue" && <AlertCircle size={12} className="text-red-600" />}
              {statusText}
            </span>
          </div>

          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {categoryName} • {recurring.frequency}
          </p>
        </div>

        <p className="shrink-0 text-lg sm:text-xl font-black tracking-tight text-neutral-950">
          {formatCurrency(recurring.amount, currency)}
        </p>
      </div>

      {/* Metric Capsule Grid */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/80 bg-white/60 p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Due Day
          </p>
          <p className="mt-0.5 text-sm font-black text-neutral-900">
            Day {recurring.dueDay || 1}
          </p>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/60 p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Cadence
          </p>
          <p className="mt-0.5 text-sm font-black text-neutral-900">
            {recurring.frequency}
          </p>
        </div>

        <div className="col-span-2 rounded-2xl border border-white/80 bg-white/60 p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md sm:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Active Period
          </p>
          <p className="mt-0.5 text-sm font-black text-neutral-900 truncate">
            {getRecurringPaymentPeriod(recurring)}
          </p>
        </div>
      </div>

      {/* Note / Memo */}
      {noteText && (
        <p className="mt-3.5 text-xs font-semibold leading-relaxed text-neutral-500 italic">
          &ldquo;{noteText}&rdquo;
        </p>
      )}

      {/* Action Bar */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/5 pt-4">
        {!paid ? (
          <button
            type="button"
            disabled={paying}
            onClick={() => onMarkPaid(recurring.id)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#173d32] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(23,61,50,0.25)] transition hover:bg-[#1f5c4a] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            <span>{paying ? "Recording..." : "Mark as Paid"}</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-300/80 bg-emerald-50/90 px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-xs backdrop-blur-md">
            <CheckCircle2 size={14} className="text-emerald-700" />
            <span>Payment Recorded</span>
          </div>
        )}

        <Link
          href={`/recurring/${recurring.id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-white/90 bg-white/70 px-3.5 py-2.5 text-xs font-bold text-neutral-800 shadow-xs backdrop-blur-md transition hover:bg-white hover:shadow-sm active:scale-95"
        >
          <Edit3 size={13} className="text-neutral-500" />
          <span>Edit</span>
        </Link>

        <button
          type="button"
          onClick={() => onDelete(recurring.id)}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-red-200/60 bg-red-50/70 px-3.5 py-2.5 text-xs font-bold text-red-600 shadow-xs backdrop-blur-md transition hover:bg-red-100 hover:text-red-700 active:scale-95"
        >
          <Trash2 size={13} />
          <span>Delete</span>
        </button>
      </div>
    </article>
  );
}