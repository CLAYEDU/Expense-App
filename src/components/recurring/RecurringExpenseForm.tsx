"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Loader2,
  Save,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";

import {
  addRecurringExpense,
  updateRecurringExpense,
  type RecurringExpense,
  type RecurringExpenseInput,
  type RecurringFrequency,
  type RecurringType,
} from "@/lib/recurring-expenses";

type Props = {
  mode: "create" | "edit";
  recurring?: RecurringExpense;
  currency: "INR" | "AED";
};

const recurringTypes: RecurringType[] = [
  "Rent",
  "EMI",
  "Electricity",
  "Internet / Mobile",
  "Insurance",
  "Subscription",
  "Education",
  "Other",
];

const frequencies: RecurringFrequency[] = [
  "Monthly",
  "Yearly",
];

export default function RecurringExpenseForm({
  mode,
  recurring,
  currency,
}: Props) {
  const router = useRouter();

  const { user } = useAuth();

  const [name, setName] =
    useState(
      recurring?.name || ""
    );

  const [type, setType] =
    useState<RecurringType>(
      recurring?.type || "Other"
    );

  const [amount, setAmount] =
    useState(
      recurring?.amount?.toString() ||
        ""
    );

  const [frequency, setFrequency] =
    useState<RecurringFrequency>(
      recurring?.frequency ||
        "Monthly"
    );

  const [dueDay, setDueDay] =
    useState(
      recurring?.dueDay?.toString() ||
        "1"
    );

  const [startDate, setStartDate] =
    useState(
      recurring?.startDate ||
        new Date()
          .toISOString()
          .split("T")[0]
    );

  const [active, setActive] =
    useState(
      recurring?.active ?? true
    );

  const [note, setNote] =
    useState(
      recurring?.note || ""
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!user) {
      setError(
        "Please sign in again before continuing."
      );
      return;
    }

    setError("");

    const numericAmount =
      Number(amount);

    const numericDueDay =
      Number(dueDay);

    if (!name.trim()) {
      setError(
        "Please enter a name."
      );
      return;
    }

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setError(
        "Amount must be greater than zero."
      );
      return;
    }

    if (
      !Number.isInteger(
        numericDueDay
      ) ||
      numericDueDay < 1 ||
      numericDueDay > 31
    ) {
      setError(
        "Due day must be between 1 and 31."
      );
      return;
    }

    if (!startDate) {
      setError(
        "Please select a start date."
      );
      return;
    }

    const input: RecurringExpenseInput =
      {
        name: name.trim(),
        type,
        amount: numericAmount,
        currency,
        frequency,
        dueDay: numericDueDay,
        startDate,
        active,
        note:
          note.trim() || undefined,
      };

    try {
      setSaving(true);

      if (
        mode === "edit" &&
        recurring
      ) {
        await updateRecurringExpense(
          user.uid,
          recurring.id,
          input
        );
      } else {
        await addRecurringExpense(
          user.uid,
          input
        );
      }

      router.push(
        "/recurring"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Failed to save recurring expense:",
        error
      );

      setError(
        "Something went wrong while saving this recurring expense."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/recurring"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-950"
      >
        <ArrowLeft className="h-4 w-4" />

        Back to recurring expenses
      </Link>

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
          {mode === "edit"
            ? "Edit recurring expense"
            : "Add recurring expense"}
        </h1>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Add bills, rent, EMIs or subscriptions
          that repeat on a regular schedule.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >
          <div>
            <label
              htmlFor="recurring-name"
              className="mb-2 block text-sm font-medium text-neutral-800"
            >
              Name
            </label>

            <input
              id="recurring-name"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="e.g. Home Rent"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-500 focus:bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="recurring-type"
              className="mb-2 block text-sm font-medium text-neutral-800"
            >
              Type
            </label>

            <select
              id="recurring-type"
              value={type}
              onChange={(event) =>
                setType(
                  event.target
                    .value as RecurringType
                )
              }
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-500 focus:bg-white"
            >
              {recurringTypes.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="recurring-amount"
                className="mb-2 block text-sm font-medium text-neutral-800"
              >
                Amount (
                {currency === "INR"
                  ? "₹"
                  : "AED"}
                )
              </label>

              <input
                id="recurring-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value
                  )
                }
                placeholder="5000"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-500 focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="recurring-frequency"
                className="mb-2 block text-sm font-medium text-neutral-800"
              >
                Frequency
              </label>

              <select
                id="recurring-frequency"
                value={frequency}
                onChange={(event) =>
                  setFrequency(
                    event.target
                      .value as RecurringFrequency
                  )
                }
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-500 focus:bg-white"
              >
                {frequencies.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="recurring-due-day"
                className="mb-2 block text-sm font-medium text-neutral-800"
              >
                Due day
              </label>

              <input
                id="recurring-due-day"
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(event) =>
                  setDueDay(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-500 focus:bg-white"
              />

              <p className="mt-1.5 text-xs text-neutral-500">
                For example, enter 5 for the 5th
                of each month.
              </p>
            </div>

            <div>
              <label
                htmlFor="recurring-start-date"
                className="mb-2 block text-sm font-medium text-neutral-800"
              >
                Start date
              </label>

              <input
                id="recurring-start-date"
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="recurring-note"
              className="mb-2 block text-sm font-medium text-neutral-800"
            >
              Note
              <span className="ml-1 font-normal text-neutral-400">
                optional
              </span>
            </label>

            <textarea
              id="recurring-note"
              rows={3}
              value={note}
              onChange={(event) =>
                setNote(
                  event.target.value
                )
              }
              placeholder="Add account details, reminder notes, etc."
              className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-500 focus:bg-white"
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div>
              <p className="text-sm font-medium text-neutral-900">
                Active reminder
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Disable this when the recurring payment
                is no longer active.
              </p>
            </div>

            <input
              type="checkbox"
              checked={active}
              onChange={(event) =>
                setActive(
                  event.target.checked
                )
              }
              className="h-5 w-5 rounded border-neutral-300"
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />

                {mode === "edit"
                  ? "Save changes"
                  : "Add recurring expense"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}