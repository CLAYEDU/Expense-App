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
import { db } from "@/lib/firebase";


export type ExpenseCategory =
  | "Food & Groceries"
  | "Housing"
  | "Electricity & Utilities"
  | "Transport"
  | "Shopping"
  | "Healthcare"
  | "Education"
  | "EMI / Debt"
  | "Entertainment"
  | "Family"
  | "Travel"
  | "Other";


export type PaymentMethod =
  | "Cash"
  | "Bank Transfer"
  | "Debit Card"
  | "Credit Card"
  | "UPI"
  | "Other";

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paymentMethod: PaymentMethod;
  note: string;
  source: "manual" | "csv" | "api";
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ExpenseInput {
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paymentMethod: PaymentMethod;
  note: string;
  source?: "manual" | "csv" | "api";
}

function expensesCollection(uid: string) {
  return collection(db, "users", uid, "expenses");
}

export async function addExpense(
  uid: string,
  expense: ExpenseInput
): Promise<string> {
  const docRef = await addDoc(expensesCollection(uid), {
    ...expense,
    source: expense.source ?? "manual",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getExpenses(uid: string): Promise<Expense[]> {
  const q = query(
    expensesCollection(uid),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<Expense, "id">),
  }));
}

export async function updateExpense(
  uid: string,
  expenseId: string,
  data: Partial<ExpenseInput>
) {
  const expenseRef = doc(db, "users", uid, "expenses", expenseId);

  await updateDoc(expenseRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteExpense(
  uid: string,
  expenseId: string
) {
  const expenseRef = doc(db, "users", uid, "expenses", expenseId);

  await deleteDoc(expenseRef);
}

export async function addExpensesBulk(
  uid: string,
  expenses: ExpenseInput[]
) {
  const results: string[] = [];

  for (const expense of expenses) {
    const id = await addExpense(uid, {
      ...expense,
      source: "csv",
    });

    results.push(id);
  }

  return results;
}