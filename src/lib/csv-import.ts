import {
  ExpenseCategory,
  PaymentMethod,
  ExpenseInput,
} from "@/lib/expenses";

export interface ParsedExpenseRow extends ExpenseInput {
  rowNumber: number;
  valid: boolean;
  errors: string[];
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

function normalizeCategory(
  value: string
): ExpenseCategory {
  const cleaned = value.trim().toLowerCase();

  const found = categories.find(
    (category) =>
      category.toLowerCase() === cleaned
  );

  if (found) return found;

  const aliases: Record<
    string,
    ExpenseCategory
  > = {
    grocery: "Food & Groceries",
    groceries: "Food & Groceries",
    food: "Food & Groceries",
    restaurant: "Food & Groceries",

    rent: "Housing",
    house: "Housing",
    housing: "Housing",

    electricity: "Electricity & Utilities",
    utility: "Electricity & Utilities",
    utilities: "Electricity & Utilities",

    fuel: "Transport",
    petrol: "Transport",
    diesel: "Transport",
    transport: "Transport",

    shopping: "Shopping",

    medical: "Healthcare",
    health: "Healthcare",
    healthcare: "Healthcare",

    school: "Education",
    education: "Education",

    emi: "EMI / Debt",
    loan: "EMI / Debt",
    debt: "EMI / Debt",

    entertainment: "Entertainment",

    family: "Family",

    travel: "Travel",
  };

  return aliases[cleaned] ?? "Other";
}

function normalizePaymentMethod(
  value: string
): PaymentMethod {
  const cleaned = value.trim().toLowerCase();

  const aliases: Record<
    string,
    PaymentMethod
  > = {
    cash: "Cash",

    upi: "UPI",
    "upi payment": "UPI",

    bank: "Bank Transfer",
    transfer: "Bank Transfer",
    "bank transfer": "Bank Transfer",

    debit: "Debit Card",
    "debit card": "Debit Card",

    credit: "Credit Card",
    "credit card": "Credit Card",
  };

  return (
    aliases[cleaned] ?? "Other"
  );
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];

  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (
        insideQuotes &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (
      char === "," &&
      !insideQuotes
    ) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());

  return result;
}

export function parseCSV(
  csvText: string
): ParsedExpenseRow[] {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error(
      "The CSV file does not contain any expense rows."
    );
  }

  const headers = parseCSVLine(
    lines[0]
  ).map((header) =>
    header.trim().toLowerCase()
  );

  const requiredHeaders = [
    "date",
    "title",
    "amount",
  ];

  const missingHeaders =
    requiredHeaders.filter(
      (header) =>
        !headers.includes(header)
    );

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required columns: ${missingHeaders.join(
        ", "
      )}`
    );
  }

  const rows: ParsedExpenseRow[] = [];

  for (
    let index = 1;
    index < lines.length;
    index++
  ) {
    const values = parseCSVLine(
      lines[index]
    );

    const row: Record<string, string> = {};

    headers.forEach(
      (header, headerIndex) => {
        row[header] =
          values[headerIndex] ?? "";
      }
    );

    const errors: string[] = [];

    const date =
      row.date?.trim() ?? "";

    const title =
      row.title?.trim() ?? "";

    const amount =
      Number(
        row.amount?.replace(
          /[^0-9.-]/g,
          ""
        )
      );

    if (!date) {
      errors.push("Date is missing");
    } else if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        date
      )
    ) {
      errors.push(
        "Date must use YYYY-MM-DD format"
      );
    }

    if (!title) {
      errors.push("Title is missing");
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      errors.push(
        "Amount must be greater than 0"
      );
    }

    const category =
      normalizeCategory(
        row.category ?? ""
      );

    const paymentMethod =
      normalizePaymentMethod(
        row.paymentmethod ??
          row.payment_method ??
          ""
      );

    rows.push({
      rowNumber: index + 1,

      title,

      amount,

      date,

      category,

      paymentMethod,

      note: row.note?.trim() ?? "",

      source: "csv",

      valid: errors.length === 0,

      errors,
    });
  }

  return rows;
}