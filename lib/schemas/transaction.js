import { z } from "zod";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";

export const transactionCreateSchema = z.object({
  type: z.enum(["income", "expense"]),
  description: z.string().trim().min(1).max(2000),
  amount: z.coerce.number().positive().max(999_999_999),
  category: z.string().min(1),
  date: z.string(),
  source: z
    .enum(["manual", "csv", "chat", "receipt"])
    .optional()
    .default("manual"),
});

/** Validate category belongs to expense or income set. */
export function validateCategory(type, category) {
  const list = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!list.includes(category)) {
    return { ok: false, error: "Invalid category for transaction type." };
  }
  return { ok: true };
}

/** DB stores signed amount: expenses negative (wallet trigger sums amount). */
export function signedAmountForInsert(type, positiveAmount) {
  const raw = Number(positiveAmount);
  return type === "expense" ? -Math.abs(raw) : Math.abs(raw);
}
