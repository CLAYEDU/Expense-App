import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ExpenseCategory } from "@/lib/expenses";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type RecurringFrequency = "Monthly" | "Yearly" | "Weekly" | "Biweekly";

export type RecurringType =
  | "Rent"
  | "EMI"
  | "Electricity"
  | "Internet / Mobile"
  | "Insurance"
  | "Subscription"
  | "Education"
  | "Other";

export type RecurringStatus =
  | "paid"
  | "due_soon"
  | "overdue"
  | "upcoming"
  | "inactive";

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  frequency: RecurringFrequency | string;
  category?: RecurringType | string;
  type?: RecurringType | string; // Alias for category
  dueDay: number; // Day of the month (1 - 31)
  active: boolean;
  currency?: "INR" | "AED" | string;
  note?: string;
  lastPaidPeriod?: string; // e.g. "2026-09" or "2026"
  createdAt?: unknown;
  updatedAt?: unknown;
}

// Exported input type expected by RecurringExpenseForm
export type RecurringExpenseInput = Omit<RecurringExpense, "id"> & {
  id?: string;
};

// ============================================================================
// DATE & PERIOD HELPERS
// ============================================================================

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthlyPeriodKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getYearlyPeriodKey(date: Date = new Date()): string {
  return String(date.getFullYear());
}

export function getRecurringPaymentPeriod(recurring: RecurringExpense): string {
  const date = new Date();
  if (recurring.frequency === "Yearly") {
    return getYearlyPeriodKey(date);
  }
  return getMonthlyPeriodKey(date);
}

export function getRecurringPeriodLabel(recurring: RecurringExpense): string {
  return getRecurringPaymentPeriod(recurring);
}

export function getRecurringExpenseDate(recurring: RecurringExpense): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const safeDay = Math.min(
    Math.max(1, recurring.dueDay || 1),
    getDaysInMonth(year, month)
  );

  return `${year}-${String(month + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

export function getRecurringExpenseCategory(
  type: RecurringType | string
): ExpenseCategory {
  switch (type) {
    case "Rent":
      return "Housing";
    case "EMI":
      return "EMI / Debt";
    case "Electricity":
    case "Internet / Mobile":
      return "Electricity & Utilities";
    case "Subscription":
      return "Entertainment";
    case "Education":
      return "Education";
    case "Insurance":
    default:
      return "Other";
  }
}

// ============================================================================
// STATUS & DUE DATE LOGIC
// ============================================================================

export function getDaysUntilDue(recurring: RecurringExpense): number | null {
  if (!recurring.active) return null;

  const currentPeriod = getRecurringPaymentPeriod(recurring);
  if (recurring.lastPaidPeriod === currentPeriod) {
    return null;
  }

  const today = new Date();
  const currentDay = today.getDate();
  const dueDay = recurring.dueDay || 1;

  return dueDay - currentDay;
}

export function getRecurringStatus(recurring: RecurringExpense): RecurringStatus {
  if (!recurring.active) return "inactive";

  const currentPeriod = getRecurringPaymentPeriod(recurring);
  if (recurring.lastPaidPeriod === currentPeriod) {
    return "paid";
  }

  const today = new Date();
  const currentDay = today.getDate();
  const dueDay = recurring.dueDay || 1;

  if (currentDay > dueDay) {
    return "overdue";
  }

  if (dueDay - currentDay <= 7) {
    return "due_soon";
  }

  return "upcoming";
}

export function isPaidForCurrentPeriod(recurring: RecurringExpense): boolean {
  return getRecurringStatus(recurring) === "paid";
}

// ============================================================================
// FIRESTORE CRUD OPERATIONS
// ============================================================================

export async function getRecurringExpenses(uid: string): Promise<RecurringExpense[]> {
  const ref = collection(db, "users", uid, "recurringExpenses");
  try {
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<RecurringExpense, "id">),
    }));
  } catch {
    const snap = await getDocs(ref);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<RecurringExpense, "id">),
    }));
  }
}

export async function saveRecurringExpense(
  uid: string,
  data: RecurringExpenseInput
): Promise<string> {
  const ref = collection(db, "users", uid, "recurringExpenses");
  const docRef = data.id ? doc(ref, data.id) : doc(ref);

  await setDoc(
    docRef,
    {
      ...data,
      amount: Number(data.amount) || 0,
      dueDay: Number(data.dueDay) || 1,
      active: data.active ?? true,
      updatedAt: serverTimestamp(),
      ...(data.id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );

  return docRef.id;
}

// Alias to satisfy imports looking for `addRecurringExpense`
export const addRecurringExpense = saveRecurringExpense;

export async function updateRecurringExpense(
  uid: string,
  id: string,
  updates: Partial<RecurringExpense>
): Promise<void> {
  const docRef = doc(db, "users", uid, "recurringExpenses", id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRecurringExpense(uid: string, id: string): Promise<void> {
  const docRef = doc(db, "users", uid, "recurringExpenses", id);
  await deleteDoc(docRef);
}

// ============================================================================
// CONNECTED WORKFLOW: MARK AS PAID
// ============================================================================

export async function markRecurringAsPaid(
  uid: string,
  recurring: RecurringExpense
): Promise<{ expenseId: string; period: string }> {
  const period = getRecurringPaymentPeriod(recurring);
  const expenseDate = getRecurringExpenseDate(recurring);
  const mappedCategory = getRecurringExpenseCategory(
    recurring.category || recurring.type || recurring.name
  );

  const expenseDocRef = doc(collection(db, "users", uid, "expenses"));
  const newExpense = {
    id: expenseDocRef.id,
    title: `${recurring.name} (${recurring.frequency || "Monthly"})`,
    amount: Number(recurring.amount) || 0,
    category: mappedCategory,
    date: expenseDate,
    paymentMethod: "Bank Transfer",
    note: `Automated payment from recurring commitment [${recurring.name}] for ${period}`,
    createdAt: serverTimestamp(),
  };

  await setDoc(expenseDocRef, newExpense);

  const recurringDocRef = doc(db, "users", uid, "recurringExpenses", recurring.id);
  await setDoc(
    recurringDocRef,
    {
      lastPaidPeriod: period,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { expenseId: expenseDocRef.id, period };
}