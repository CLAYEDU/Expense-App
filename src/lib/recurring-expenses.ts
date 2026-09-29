import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

export type RecurringType =
  | "Rent"
  | "EMI"
  | "Electricity"
  | "Internet / Mobile"
  | "Insurance"
  | "Subscription"
  | "Education"
  | "Other";

export type RecurringFrequency =
  | "Monthly"
  | "Yearly";

export type RecurringExpense = {
  id: string;
  uid: string;

  name: string;
  type: RecurringType;

  amount: number;
  currency: "INR" | "AED";

  frequency: RecurringFrequency;

  dueDay: number;

  startDate: string;

  active: boolean;

  /**
   * Stores the occurrence key that has been marked paid.
   * Example:
   * 2026-09
   * 2026
   */
  lastPaidPeriod?: string;

  note?: string;

  createdAt?: unknown;
  updatedAt?: unknown;
};

export type RecurringExpenseInput = {
  name: string;
  type: RecurringType;
  amount: number;
  currency: "INR" | "AED";
  frequency: RecurringFrequency;
  dueDay: number;
  startDate: string;
  active: boolean;
  note?: string;
  lastPaidPeriod?: string;
};

function recurringCollection(uid: string) {
  return collection(
    db,
    "users",
    uid,
    "recurringExpenses"
  );
}

export async function getRecurringExpenses(
  uid: string
): Promise<RecurringExpense[]> {
  const snapshot = await getDocs(
    recurringCollection(uid)
  );

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...(item.data() as Omit<
        RecurringExpense,
        "id"
      >),
    }))
    .sort((a, b) => {
      return a.dueDay - b.dueDay;
    });
}

export async function addRecurringExpense(
  uid: string,
  input: RecurringExpenseInput
) {
  const reference = await addDoc(
    recurringCollection(uid),
    {
      ...input,
      uid,
      amount: Number(input.amount),
      dueDay: Number(input.dueDay),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  return reference.id;
}

export async function updateRecurringExpense(
  uid: string,
  recurringId: string,
  input: Partial<RecurringExpenseInput>
) {
  const reference = doc(
    db,
    "users",
    uid,
    "recurringExpenses",
    recurringId
  );

  const updates: Record<string, unknown> = {
    ...input,
    updatedAt: serverTimestamp(),
  };

  if (input.amount !== undefined) {
    updates.amount = Number(
      input.amount
    );
  }

  if (input.dueDay !== undefined) {
    updates.dueDay = Number(
      input.dueDay
    );
  }

  await updateDoc(
    reference,
    updates
  );
}

export async function deleteRecurringExpense(
  uid: string,
  recurringId: string
) {
  const reference = doc(
    db,
    "users",
    uid,
    "recurringExpenses",
    recurringId
  );

  await deleteDoc(reference);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function getMonthlyPeriodKey(
  date = new Date()
) {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}`;
}

export function getYearlyPeriodKey(
  date = new Date()
) {
  return String(date.getFullYear());
}

export function getPeriodKey(
  recurring: RecurringExpense,
  date = new Date()
) {
  if (recurring.frequency === "Yearly") {
    return getYearlyPeriodKey(date);
  }

  return getMonthlyPeriodKey(date);
}

export function isPaidForCurrentPeriod(
  recurring: RecurringExpense,
  date = new Date()
) {
  return (
    recurring.lastPaidPeriod ===
    getPeriodKey(recurring, date)
  );
}

export function getDaysInMonth(
  year: number,
  month: number
) {
  return new Date(
    year,
    month + 1,
    0
  ).getDate();
}

export function getNextDueDate(
  recurring: RecurringExpense,
  fromDate = new Date()
) {
  const start = new Date(
    `${recurring.startDate}T00:00:00`
  );

  if (
    Number.isNaN(start.getTime())
  ) {
    return null;
  }

  let year =
    fromDate.getFullYear();

  let month =
    fromDate.getMonth();

  if (recurring.frequency === "Yearly") {
    let targetYear = year;

    if (
      month > start.getMonth() ||
      (month === start.getMonth() &&
        fromDate.getDate() >
          recurring.dueDay)
    ) {
      targetYear += 1;
    }

    const maxDay =
      getDaysInMonth(
        targetYear,
        start.getMonth()
      );

    const day = Math.min(
      recurring.dueDay,
      maxDay
    );

    return new Date(
      targetYear,
      start.getMonth(),
      day
    );
  }

  let targetMonth = month;

  const maxDayThisMonth =
    getDaysInMonth(
      year,
      targetMonth
    );

  const targetDay = Math.min(
    recurring.dueDay,
    maxDayThisMonth
  );

  const candidate = new Date(
    year,
    targetMonth,
    targetDay
  );

  if (candidate < fromDate) {
    targetMonth += 1;

    if (targetMonth > 11) {
      targetMonth = 0;
      year += 1;
    }
  }

  const maxDay =
    getDaysInMonth(
      year,
      targetMonth
    );

  return new Date(
    year,
    targetMonth,
    Math.min(
      recurring.dueDay,
      maxDay
    )
  );
}

export function getRecurringStatus(
  recurring: RecurringExpense,
  today = new Date()
) {
  if (!recurring.active) {
    return "inactive" as const;
  }

  if (
    isPaidForCurrentPeriod(
      recurring,
      today
    )
  ) {
    return "paid" as const;
  }

  const dueDate =
    getCurrentDueDate(
      recurring,
      today
    );

  if (!dueDate) {
    return "upcoming" as const;
  }

  const difference =
    differenceInCalendarDays(
      dueDate,
      today
    );

  if (difference < 0) {
    return "overdue" as const;
  }

  if (difference <= 7) {
    return "due-soon" as const;
  }

  return "upcoming" as const;
}

export function getCurrentDueDate(
  recurring: RecurringExpense,
  today = new Date()
) {
  const start = new Date(
    `${recurring.startDate}T00:00:00`
  );

  if (
    Number.isNaN(start.getTime())
  ) {
    return null;
  }

  let year =
    today.getFullYear();

  let month =
    today.getMonth();

  if (
    recurring.frequency === "Yearly"
  ) {
    let targetYear = year;

    if (
      month < start.getMonth()
    ) {
      targetYear -= 1;
    }

    if (
      month === start.getMonth() &&
      today.getDate() <
        recurring.dueDay
    ) {
      targetYear -= 1;
    }

    const day = Math.min(
      recurring.dueDay,
      getDaysInMonth(
        targetYear,
        start.getMonth()
      )
    );

    return new Date(
      targetYear,
      start.getMonth(),
      day
    );
  }

  const day = Math.min(
    recurring.dueDay,
    getDaysInMonth(
      year,
      month
    )
  );

  return new Date(
    year,
    month,
    day
  );
}

function differenceInCalendarDays(
  dateA: Date,
  dateB: Date
) {
  const a = new Date(dateA);
  const b = new Date(dateB);

  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);

  const difference =
    a.getTime() - b.getTime();

  return Math.round(
    difference /
      (1000 * 60 * 60 * 24)
  );
}

export function getDaysUntilDue(
  recurring: RecurringExpense,
  today = new Date()
) {
  const dueDate =
    getCurrentDueDate(
      recurring,
      today
    );

  if (!dueDate) {
    return null;
  }

  return differenceInCalendarDays(
    dueDate,
    today
  );
}

export function getRecurringPeriodLabel(
  recurring: RecurringExpense
) {
  if (
    recurring.frequency === "Yearly"
  ) {
    return "year";
  }

  return "month";
}