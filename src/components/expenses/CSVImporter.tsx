"use client";

import {
  useRef,
  useState,
} from "react";

import {
  addExpensesBulk,
} from "@/lib/expenses";

import {
  parseCSV,
  ParsedExpenseRow,
} from "@/lib/csv-import";

interface CSVImporterProps {
  uid: string;
  currency: string;
  onImported: () => void;
}

export default function CSVImporter({
  uid,
  currency,
  onImported,
}: CSVImporterProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [rows, setRows] =
    useState<ParsedExpenseRow[]>([]);

  const [fileName, setFileName] =
    useState("");

  const [error, setError] =
    useState("");

  const [importing, setImporting] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  async function handleFile(
    file: File
  ) {
    setError("");
    setSuccess("");
    setRows([]);
    setFileName(file.name);

    if (
      !file.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setError(
        "Please select a CSV file."
      );
      return;
    }

    try {
      const text =
        await file.text();

      const parsed =
        parseCSV(text);

      setRows(parsed);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to read the CSV file."
      );
    }
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (file) {
      handleFile(file);
    }
  }

  async function handleImport() {
    const validRows =
      rows.filter(
        (row) => row.valid
      );

    if (validRows.length === 0) {
      setError(
        "There are no valid rows to import."
      );
      return;
    }

    try {
      setImporting(true);
      setError("");
      setSuccess("");

      await addExpensesBulk(
        uid,
        validRows.map((row) => ({
          title: row.title,
          amount: row.amount,
          category: row.category,
          date: row.date,
          paymentMethod:
            row.paymentMethod,
          note: row.note,
          source: "csv",
        }))
      );

      setSuccess(
        `${validRows.length} expense${
          validRows.length === 1
            ? ""
            : "s"
        } imported successfully.`
      );

      setRows([]);

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }

      onImported();
    } catch (err) {
      console.error(err);

      setError(
        "Some expenses could not be imported. Please try again."
      );
    } finally {
      setImporting(false);
    }
  }

  const validCount =
    rows.filter(
      (row) => row.valid
    ).length;

  const invalidCount =
    rows.filter(
      (row) => !row.valid
    ).length;

  const totalAmount =
    rows
      .filter(
        (row) => row.valid
      )
      .reduce(
        (sum, row) =>
          sum + row.amount,
        0
      );

  const formatAmount =
    (amount: number) =>
      new Intl.NumberFormat(
        undefined,
        {
          maximumFractionDigits: 2,
        }
      ).format(amount);

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">

      <div className="mb-6">
        <p className="text-sm font-medium text-neutral-500">
          Bulk import
        </p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
          Import expenses from CSV
        </h2>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Upload a bank, spreadsheet, or payment-export
          CSV. Your transactions will be previewed before
          anything is added to your account.
        </p>
      </div>

      <div
        className="cursor-pointer rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8 text-center transition hover:border-neutral-400 hover:bg-white"
        onClick={() =>
          fileInputRef.current?.click()
        }
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
          ↑
        </div>

        <p className="mt-4 font-medium text-neutral-900">
          Choose a CSV file
        </p>

        <p className="mt-1 text-sm text-neutral-500">
          Required columns: date, title, amount
        </p>

        {fileName && (
          <p className="mt-3 text-sm font-medium text-neutral-700">
            {fileName}
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          {success}
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-6">

          <div className="grid gap-3 sm:grid-cols-3">

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">
                Rows
              </p>

              <p className="mt-1 text-lg font-semibold">
                {rows.length}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">
                Valid
              </p>

              <p className="mt-1 text-lg font-semibold">
                {validCount}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500">
                Total
              </p>

              <p className="mt-1 text-lg font-semibold">
                {currency}{" "}
                {formatAmount(
                  totalAmount
                )}
              </p>
            </div>

          </div>

          {invalidCount > 0 && (
            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
              {invalidCount} row
              {invalidCount === 1
                ? ""
                : "s"}{" "}
              contain errors and will not be imported.
            </div>
          )}

          <div className="mt-5 overflow-x-auto rounded-2xl border border-neutral-100">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    Date
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Expense
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Amount
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Category
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100">
                {rows.slice(0, 100).map(
                  (row) => (
                    <tr key={row.rowNumber}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.date}
                      </td>

                      <td className="px-4 py-3">
                        {row.title}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {currency}{" "}
                        {formatAmount(
                          row.amount
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {row.category}
                      </td>

                      <td className="px-4 py-3">
                        {row.valid ? (
                          <span className="font-medium text-neutral-700">
                            Ready
                          </span>
                        ) : (
                          <span className="font-medium text-red-600">
                            {row.errors.join(
                              ", "
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {rows.length > 100 && (
            <p className="mt-3 text-xs text-neutral-500">
              Showing the first 100 rows in the preview.
              All valid rows will be imported.
            </p>
          )}

          <button
            type="button"
            disabled={
              importing ||
              validCount === 0
            }
            onClick={handleImport}
            className="mt-6 w-full rounded-2xl bg-neutral-900 px-5 py-3.5 font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {importing
              ? "Importing..."
              : `Import ${validCount} expense${
                  validCount === 1
                    ? ""
                    : "s"
                }`}
          </button>
        </div>
      )}

    </div>
  );
}