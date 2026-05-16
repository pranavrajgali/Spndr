import Papa from "papaparse";

export function parseCSV(text) {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (result.errors.length) {
    throw new Error(result.errors[0]?.message || "CSV parse failed");
  }

  return result.data.map(normalizeRow).filter(Boolean);
}

function normalizeRow(row) {
  const description =
    row.description ||
    row.narration ||
    row.particulars ||
    row.remark ||
    row["transaction details"];
  const amountRaw =
    row.amount || row.debit || row.credit || row["amount (inr)"];
  const date = row.date || row["transaction date"] || row.txn_date;

  if (!description || !amountRaw) return null;

  const amount = Math.abs(parseFloat(String(amountRaw).replace(/,/g, "")));
  if (Number.isNaN(amount)) return null;

  return {
    description: String(description).trim(),
    amount,
    date: date ? String(date).trim() : null,
    raw: row,
  };
}
