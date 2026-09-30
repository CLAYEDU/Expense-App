import {
  addExpense,
  type ExpenseInput,
  type ExpenseCategory,
} from "./expenses";

import {
  getRecurringExpenseCategory,
  getRecurringExpenseDate,
  getRecurringPaymentPeriod,
  updateRecurringExpense,
  type RecurringExpense,
} from "./recurring-expenses";

export async function markRecurringExpensePaid(
  uid: string,
  recurring: RecurringExpense
) {
  const period = getRecurringPaymentPeriod(recurring);

  // Prevent duplicate payment recording for the same cycle
  if (recurring.lastPaidPeriod === period) {
    throw new Error(
      "This recurring payment has already been marked as paid for this period."
    );
  }

  // Gracefully handle category / type differences across models
  const recurringCategoryOrType =
    recurring.category || (recurring as { type?: string }).type || "Other";

  // Cast to ExpenseCategory to satisfy ExpenseInput
  const resolvedCategory = getRecurringExpenseCategory(
    recurringCategoryOrType
  ) as ExpenseCategory;

  const itemNote = (recurring as { note?: string }).note;
  const defaultNote = `${recurring.name} (${recurringCategoryOrType}) payment`;

  const expense: ExpenseInput = {
    date: getRecurringExpenseDate(recurring),
    title: recurring.name,
    amount: Number(recurring.amount) || 0,
    category: resolvedCategory,
    paymentMethod: "Bank Transfer",
    note: itemNote || defaultNote,
  };

  const expenseId = await addExpense(uid, expense);

  await updateRecurringExpense(uid, recurring.id, {
    lastPaidPeriod: period,
  });

  return {
    expenseId,
    period,
  };
}