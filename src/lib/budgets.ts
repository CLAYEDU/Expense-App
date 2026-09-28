import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { ExpenseCategory } from "@/lib/expenses";

export type BudgetMap = Record<
  ExpenseCategory,
  number
>;

export const DEFAULT_BUDGETS: BudgetMap = {
  "Food & Groceries": 0,
  Housing: 0,
  "Electricity & Utilities": 0,
  Transport: 0,
  Shopping: 0,
  Healthcare: 0,
  Education: 0,
  "EMI / Debt": 0,
  Entertainment: 0,
  Family: 0,
  Travel: 0,
  Other: 0,
};

export async function getBudgets(
  uid: string
): Promise<BudgetMap> {
  const budgetRef = doc(
    db,
    "users",
    uid,
    "settings",
    "monthlyBudget"
  );

  const snapshot = await getDoc(budgetRef);

  if (!snapshot.exists()) {
    return DEFAULT_BUDGETS;
  }

  const data = snapshot.data();

  return {
    ...DEFAULT_BUDGETS,
    ...(data.budgets || {}),
  };
}

export async function saveBudgets(
  uid: string,
  budgets: BudgetMap
) {
  const budgetRef = doc(
    db,
    "users",
    uid,
    "settings",
    "monthlyBudget"
  );

  await setDoc(
    budgetRef,
    {
      budgets,
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );
}