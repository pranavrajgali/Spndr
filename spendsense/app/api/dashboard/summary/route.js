import { createClient, getUser } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** Backend-only aggregate for testing / future charts. No UI required. */
export async function GET(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = Number(searchParams.get("month") || new Date().getMonth() + 1);
  const year = Number(searchParams.get("year") || new Date().getFullYear());

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const end = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const supabase = await createClient();

  const [
    { data: wallet },
    { data: txns },
    { data: budgets },
    { count: txnCount },
  ] = await Promise.all([
    supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("transactions")
      .select("type, amount, category, date")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .gte("date", start)
      .lt("date", end),
    supabase
      .from("budgets")
      .select("category, limit_amount, spent_amount, alert_at_percent")
      .eq("user_id", user.id)
      .eq("month", month)
      .eq("year", year),
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_deleted", false),
  ]);

  let income = 0;
  let expense = 0;
  const byCategory = {};

  for (const t of txns ?? []) {
    const abs = Math.abs(Number(t.amount));
    if (t.type === "income") income += abs;
    else {
      expense += abs;
      byCategory[t.category] = (byCategory[t.category] ?? 0) + abs;
    }
  }

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  const budgetsAtRisk = (budgets ?? []).filter((b) => {
    const limit = Number(b.limit_amount);
    const spent = Number(b.spent_amount);
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    return pct >= (b.alert_at_percent ?? 80);
  });

  return NextResponse.json({
    month,
    year,
    wallet_balance: Number(wallet?.balance ?? 0),
    month_income: income,
    month_expense: expense,
    month_net: income - expense,
    top_spending_category: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
    spending_by_category: byCategory,
    budgets_at_risk: budgetsAtRisk,
    total_transactions_all_time: txnCount ?? 0,
  });
}
