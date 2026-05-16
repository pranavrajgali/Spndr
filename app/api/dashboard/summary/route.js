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

  // Daily spending for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const dailySpending = {};
  // Initialize with zeros for last 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailySpending[d.toISOString().slice(0, 10)] = 0;
  }

  for (const t of txns ?? []) {
    const d = new Date(t.date).toISOString().slice(0, 10);
    if (t.type === "expense" && dailySpending[d] !== undefined) {
      dailySpending[d] += Math.abs(Number(t.amount));
    }
  }

  const dailyTrend = Object.entries(dailySpending)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({ date, amount }));

  // Balance trend (last 30 days) - Working backwards from current balance
  const balanceTrend = [];
  let currentRunningBalance = Number(wallet?.balance ?? 0);
  
  // Sort transactions by date descending to subtract them backwards
  const sortedTxns = [...(txns ?? [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    
    balanceTrend.push({ date: dateStr, balance: currentRunningBalance });

    // Subtract transactions that happened on this day to find the previous day's balance
    const dayTxns = sortedTxns.filter(t => new Date(t.date).toISOString().slice(0, 10) === dateStr);
    for (const t of dayTxns) {
      currentRunningBalance -= Number(t.amount);
    }
  }

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
    daily_trend: dailyTrend,
    balance_trend: balanceTrend.reverse(),
  });
}
