"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

import {
  addRecurringExpense,
  updateRecurringExpense,
  type RecurringExpense,
  type RecurringExpenseInput,
  type RecurringFrequency,
  type RecurringType,
} from "@/lib/recurring-expenses";

import { Check, Loader2 } from "lucide-react";

type Props = {
  mode: "create" | "edit";
  recurring?: RecurringExpense;
  currency?: "INR" | "AED";
};

const FREQUENCIES: RecurringFrequency[] = [
  "Monthly",
  "Yearly",
  "Weekly",
  "Biweekly",
];

const CATEGORIES: RecurringType[] = [
  "Rent",
  "EMI",
  "Electricity",
  "Internet / Mobile",
  "Insurance",
  "Subscription",
  "Education",
  "Other",
];

export default function RecurringExpenseForm({
  mode,
  recurring,
  currency = "INR",
}: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(recurring?.name || "");
  const [amount, setAmount] = useState(recurring ? String(recurring.amount) : "");

  // Cast initial value safely to RecurringType
  const [type, setType] = useState<RecurringType>(
    (recurring?.category as RecurringType) ||
      ((recurring as any)?.type as RecurringType) ||
      "Subscription"
  );

  // Cast initial value safely to RecurringFrequency
  const [frequency, setFrequency] = useState<RecurringFrequency>(
    (recurring?.frequency as RecurringFrequency) || "Monthly"
  );

  const [dueDay, setDueDay] = useState(recurring ? String(recurring.dueDay) : "1");
  const [startDate, setStartDate] = useState(
    (recurring as any)?.startDate || new Date().toISOString().split("T")[0]
  );
  const [note, setNote] = useState((recurring as any)?.note || "");
  const [active, setActive] = useState(recurring?.active ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setError("Please provide a name for this recurring expense.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    const numDueDay = parseInt(dueDay, 10);
    if (isNaN(numDueDay) || numDueDay < 1 || numDueDay > 31) {
      setError("Due day must be between 1 and 31.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: RecurringExpenseInput = {
        name: name.trim(),
        amount: numAmount,
        category: type,
        type: type,
        frequency,
        dueDay: numDueDay,
        startDate,
        note: note.trim() || undefined,
        active,
        currency,
      };

      if (mode === "create") {
        await addRecurringExpense(user.uid, payload);
      } else if (mode === "edit" && recurring) {
        await updateRecurringExpense(user.uid, recurring.id, payload);
      }

      router.push("/recurring");
      router.refresh();
    } catch (err: any) {
      console.error("Error saving recurring expense:", err);
      setError(err?.message || "Failed to save recurring expense.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-300/80 bg-red-50/90 p-4 text-xs font-bold text-red-800 shadow-sm backdrop-blur-md">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">
          Commitment Title
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Netflix, Apartment Rent, Car Loan"
          className="w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur-md outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Amount */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">
            Amount ({currency})
          </label>
          <input
            type="number"
            step="any"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur-md outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Due Day */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">
            Billing Day of Month (1 - 31)
          </label>
          <input
            type="number"
            min="1"
            max="31"
            required
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            className="w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur-md outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Category / Type */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">
            Category
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as RecurringType)}
            className="w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur-md outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">
            Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
            className="w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur-md outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
          >
            {FREQUENCIES.map((freq) => (
              <option key={freq} value={freq}>
                {freq}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Start Date */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">
            First Billing / Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur-md outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="active-toggle"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-5 w-5 rounded-lg border-neutral-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="active-toggle" className="text-xs font-bold text-neutral-800 cursor-pointer">
            Commitment is currently active
          </label>
        </div>
      </div>

      {/* Note / Memo */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">
          Note / Memo (Optional)
        </label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Account number, contract renewal date"
          className="w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur-md outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-2xl border border-white/90 bg-white/70 px-5 py-3 text-xs font-bold text-neutral-700 shadow-sm backdrop-blur-md transition hover:bg-white active:scale-95"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#173d32] px-6 py-3 text-xs font-bold text-white shadow-lg shadow-[#173d32]/25 transition hover:bg-[#1f5c4a] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check size={16} />
              <span>{mode === "create" ? "Create Commitment" : "Update Commitment"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}