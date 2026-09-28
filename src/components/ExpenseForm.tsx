"use client";

import { FormEvent, useState } from "react";
import {
  addExpense,
  ExpenseCategory,
  PaymentMethod,
} from "@/lib/expenses";

interface ExpenseFormProps {
  uid: string;
  currency: string;
  onExpenseAdded: () => void;
}

const categories: ExpenseCategory[] = [
  "Food & Groceries",
  "Housing",
  "Electricity & Utilities",
  "Transport",
  "Shopping",
  "Healthcare",
  "Education",
  "EMI / Debt",
  "Entertainment",
  "Family",
  "Travel",
  "Other",
];

const paymentMethods: PaymentMethod[] = [
  "Cash",
  "Bank Transfer",
  "Debit Card",
  "Credit Card",
  "UPI",
  "Other",
];

export default function ExpenseForm({
  uid,
  currency,
  onExpenseAdded,
}: ExpenseFormProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] =
    useState<ExpenseCategory>("Food & Groceries");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("Cash");
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");

    const numericAmount = Number(amount);

    if (!title.trim()) {
      setError("Please enter an expense name.");
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    try {
      setSaving(true);

      await addExpense(uid, {
        title: title.trim(),
        amount: numericAmount,
        category,
        date,
        paymentMethod,
        note: note.trim(),
        source: "manual",
      });

      setTitle("");
      setAmount("");
      setCategory("Food & Groceries");
      setDate(new Date().toISOString().split("T")[0]);
      setPaymentMethod("Cash");
      setNote("");

      onExpenseAdded();
    } catch (err) {
      console.error(err);
      setError("Unable to save the expense. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
    >
      <div className="mb-6">
        <p className="text-sm font-medium text-neutral-500">
          Expense tracking
        </p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
          Add an expense
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Record your spending manually. You can import CSV files later.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Expense name
          </label>

          <input
            type="text"
            placeholder="Groceries"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none transition focus:border-neutral-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Amount ({currency})
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="850"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none transition focus:border-neutral-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Category
          </label>

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as ExpenseCategory)
            }
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-neutral-500 focus:bg-white"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Date
          </label>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-neutral-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Payment method
          </label>

          <select
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value as PaymentMethod)
            }
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-neutral-500 focus:bg-white"
          >
            {paymentMethods.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">
            Note
          </label>

          <input
            type="text"
            placeholder="Optional"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-neutral-500 focus:bg-white"
          />
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-6 w-full rounded-2xl bg-neutral-900 px-5 py-3.5 font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving expense..." : "Add expense"}
      </button>
    </form>
  );
}