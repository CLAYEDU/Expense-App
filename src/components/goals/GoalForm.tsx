"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
} from "lucide-react";

import Link from "next/link";

import {
  addGoal,
  updateGoal,
  type Goal,
  type GoalInput,
  type GoalType,
} from "@/lib/goals";

import { useAuth } from "@/components/auth-provider";

type Props = {
  mode: "create" | "edit";
  goal?: Goal;
};

const goalTypes: GoalType[] = [
  "Emergency Fund",
  "Travel",
  "Education",
  "Laptop / Phone",
  "Vehicle",
  "Home",
  "Family",
  "Investment",
  "Other",
];

export default function GoalForm({
  mode,
  goal,
}: Props) {
  const router = useRouter();

  const { user } = useAuth();

  const [name, setName] = useState(
    goal?.name || ""
  );

  const [type, setType] =
    useState<GoalType>(
      goal?.type || "Other"
    );

  const [targetAmount, setTargetAmount] =
    useState(
      goal?.targetAmount?.toString() || ""
    );

  const [currentAmount, setCurrentAmount] =
    useState(
      goal?.currentAmount?.toString() ||
        "0"
    );

  const [targetDate, setTargetDate] =
    useState(
      goal?.targetDate || ""
    );

  const [description, setDescription] =
    useState(
      goal?.description || ""
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

    const target =
      Number(targetAmount);

    const current =
      Number(currentAmount);

    if (!name.trim()) {
      setError(
        "Please enter a goal name."
      );
      return;
    }

    if (
      !Number.isFinite(target) ||
      target <= 0
    ) {
      setError(
        "Target amount must be greater than zero."
      );
      return;
    }

    if (
      !Number.isFinite(current) ||
      current < 0
    ) {
      setError(
        "Current amount cannot be negative."
      );
      return;
    }

    if (current > target) {
      setError(
        "Current amount cannot be greater than the target amount."
      );
      return;
    }

    if (!targetDate) {
      setError(
        "Please select a target date."
      );
      return;
    }

    const selectedDate = new Date(
      `${targetDate}T00:00:00`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setError(
        "Target date must be today or a future date."
      );
      return;
    }

    const input: GoalInput = {
      name: name.trim(),
      type,
      targetAmount: target,
      currentAmount: current,
      targetDate,
      description:
        description.trim() || undefined,
    };

    try {
      setSaving(true);

      if (
        mode === "edit" &&
        goal
      ) {
        await updateGoal(
          user.uid,
          goal.id,
          input
        );
      } else {
        await addGoal(
          user.uid,
          input
        );
      }

      router.push("/goals");
      router.refresh();
    } catch (err) {
      console.error(
        "Failed to save goal:",
        err
      );

      setError(
        "Something went wrong while saving the goal."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/goals"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-950"
      >
        <ArrowLeft className="h-4 w-4" />

        Back to goals
      </Link>

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
            {mode === "edit"
              ? "Edit goal"
              : "Create a goal"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Set a target and let the app calculate
            how much you may need to set aside each
            month.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >
          <div>
            <label
              htmlFor="goal-name"
              className="mb-2 block text-sm font-medium text-neutral-800"
            >
              Goal name
            </label>

            <input
              id="goal-name"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="e.g. New Laptop"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-500 focus:bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="goal-type"
              className="mb-2 block text-sm font-medium text-neutral-800"
            >
              Goal type
            </label>

            <select
              id="goal-type"
              value={type}
              onChange={(event) =>
                setType(
                  event.target.value as GoalType
                )
              }
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-500 focus:bg-white"
            >
              {goalTypes.map(
                (goalType) => (
                  <option
                    key={goalType}
                    value={goalType}
                  >
                    {goalType}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="target-amount"
                className="mb-2 block text-sm font-medium text-neutral-800"
              >
                Target amount
              </label>

              <input
                id="target-amount"
                type="number"
                min="1"
                step="0.01"
                value={targetAmount}
                onChange={(event) =>
                  setTargetAmount(
                    event.target.value
                  )
                }
                placeholder="50000"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-500 focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="current-amount"
                className="mb-2 block text-sm font-medium text-neutral-800"
              >
                Already saved
              </label>

              <input
                id="current-amount"
                type="number"
                min="0"
                step="0.01"
                value={currentAmount}
                onChange={(event) =>
                  setCurrentAmount(
                    event.target.value
                  )
                }
                placeholder="0"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="target-date"
              className="mb-2 block text-sm font-medium text-neutral-800"
            >
              Target date
            </label>

            <input
              id="target-date"
              type="date"
              value={targetDate}
              onChange={(event) =>
                setTargetDate(
                  event.target.value
                )
              }
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-500 focus:bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-neutral-800"
            >
              Description
              <span className="ml-1 font-normal text-neutral-400">
                optional
              </span>
            </label>

            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Add a little context about this goal..."
              className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-500 focus:bg-white"
            />
          </div>

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
                  : "Create goal"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}