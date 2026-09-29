import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

export type GoalType =
  | "Emergency Fund"
  | "Travel"
  | "Education"
  | "Laptop / Phone"
  | "Vehicle"
  | "Home"
  | "Family"
  | "Investment"
  | "Other";

export type Goal = {
  id: string;
  uid: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  description?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type GoalInput = {
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  description?: string;
};

function goalsCollection(uid: string) {
  return collection(db, "users", uid, "goals");
}

export async function getGoals(
  uid: string
): Promise<Goal[]> {
  const q = query(
    goalsCollection(uid),
    orderBy("targetDate", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Goal, "id">),
  }));
}

export async function addGoal(
  uid: string,
  input: GoalInput
) {
  const reference = await addDoc(
    goalsCollection(uid),
    {
      ...input,
      uid,
      targetAmount: Number(input.targetAmount),
      currentAmount: Number(input.currentAmount),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  return reference.id;
}

export async function updateGoal(
  uid: string,
  goalId: string,
  input: Partial<GoalInput>
) {
  const goalReference = doc(
    db,
    "users",
    uid,
    "goals",
    goalId
  );

  await updateDoc(goalReference, {
    ...input,
    ...(input.targetAmount !== undefined
      ? {
          targetAmount: Number(
            input.targetAmount
          ),
        }
      : {}),
    ...(input.currentAmount !== undefined
      ? {
          currentAmount: Number(
            input.currentAmount
          ),
        }
      : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGoal(
  uid: string,
  goalId: string
) {
  const goalReference = doc(
    db,
    "users",
    uid,
    "goals",
    goalId
  );

  await deleteDoc(goalReference);
}

export function getGoalProgress(goal: Goal) {
  if (goal.targetAmount <= 0) {
    return 0;
  }

  const percentage =
    (goal.currentAmount / goal.targetAmount) *
    100;

  return Math.min(
    100,
    Math.max(0, percentage)
  );
}

export function getGoalRemaining(
  goal: Goal
) {
  return Math.max(
    0,
    goal.targetAmount - goal.currentAmount
  );
}

export function getMonthsRemaining(
  targetDate: string
) {
  const today = new Date();

  const target = new Date(
    `${targetDate}T00:00:00`
  );

  if (Number.isNaN(target.getTime())) {
    return 0;
  }

  if (target <= today) {
    return 0;
  }

  const yearDifference =
    target.getFullYear() -
    today.getFullYear();

  const monthDifference =
    target.getMonth() -
    today.getMonth();

  const months =
    yearDifference * 12 +
    monthDifference;

  // Count the current partial month as a month
  // when there is still time remaining.
  return Math.max(1, months);
}

export function getSuggestedMonthlyContribution(
  goal: Goal
) {
  const remaining =
    getGoalRemaining(goal);

  const months =
    getMonthsRemaining(
      goal.targetDate
    );

  if (remaining <= 0) {
    return 0;
  }

  if (months <= 0) {
    return remaining;
  }

  return Math.ceil(
    remaining / months
  );
}

export function getGoalStatus(
  goal: Goal
) {
  const remaining =
    getGoalRemaining(goal);

  if (remaining <= 0) {
    return "completed";
  }

  const months =
    getMonthsRemaining(
      goal.targetDate
    );

  if (months <= 0) {
    return "due";
  }

  const suggested =
    getSuggestedMonthlyContribution(
      goal
    );

  return suggested > 0
    ? "active"
    : "active";
}