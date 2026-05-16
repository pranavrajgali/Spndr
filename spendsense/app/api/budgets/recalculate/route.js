import { createClient, getUser } from "@/lib/supabase-server";
import { recalculateBudgetSpent } from "@/lib/budgets";
import { NextResponse } from "next/server";

export async function POST(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const month = Number(body.month ?? new Date().getMonth() + 1);
  const year = Number(body.year ?? new Date().getFullYear());

  const supabase = await createClient();
  const result = await recalculateBudgetSpent(supabase, user.id, month, year);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const { data } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", user.id)
    .eq("month", month)
    .eq("year", year);

  return NextResponse.json({ data, month, year, message: "Recalculated from transactions" });
}
