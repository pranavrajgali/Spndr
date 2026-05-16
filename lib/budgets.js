import { EXPENSE_CATEGORIES } from "./categories";

/** @returns {{ month: number, year: number }} */
export function monthYearFromDate(dateStr) {
  const d = new Date(dateStr);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

/**
 * Adjust budget.spent_amount when an expense transaction is added or removed.
 * Only applies to expense type and known expense categories.
 */
export async function adjustBudgetSpent(
  supabase,
  userId,
  { category, amount, date, type },
  direction
) {
  if (type !== "expense" || !EXPENSE_CATEGORIES.includes(category)) {
    return {};
  }

  const delta = Math.abs(Number(amount));
  if (!delta) return {};

  const { month, year } = monthYearFromDate(date);
  const signedDelta = direction === "add" ? delta : -delta;

  const { data: budget } = await supabase
    .from("budgets")
    .select("id, spent_amount")
    .eq("user_id", userId)
    .eq("category", category)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (!budget) return {};

  const nextSpent = Math.max(0, Number(budget.spent_amount) + signedDelta);
  const { error } = await supabase
    .from("budgets")
    .update({ spent_amount: nextSpent })
    .eq("id", budget.id)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  return {};
}

/** Recompute spent_amount from transactions for one user/month/year. */
export async function recalculateBudgetSpent(supabase, userId, month, year) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const end = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data: budgets, error: bErr } = await supabase
    .from("budgets")
    .select("id, category")
    .eq("user_id", userId)
    .eq("month", month)
    .eq("year", year);

  if (bErr) return { error: bErr.message };

  const { data: txns, error: tErr } = await supabase
    .from("transactions")
    .select("category, amount, type")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .eq("type", "expense")
    .gte("date", start)
    .lt("date", end);

  if (tErr) return { error: tErr.message };

  const spentByCategory = {};
  for (const t of txns ?? []) {
    spentByCategory[t.category] =
      (spentByCategory[t.category] ?? 0) + Math.abs(Number(t.amount));
  }

  for (const b of budgets ?? []) {
    const spent = spentByCategory[b.category] ?? 0;
    await supabase
      .from("budgets")
      .update({ spent_amount: spent })
      .eq("id", b.id)
      .eq("user_id", userId);
  }

  return {};
}
