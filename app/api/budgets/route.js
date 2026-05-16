import { createClient, getUser } from "@/lib/supabase-server";
import { budgetCreateSchema, budgetPatchSchema } from "@/lib/schemas/budget";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = Number(searchParams.get("month") || new Date().getMonth() + 1);
  const year = Number(searchParams.get("year") || new Date().getFullYear());

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", user.id)
    .eq("month", month)
    .eq("year", year)
    .order("category");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enriched = (data ?? []).map((b) => {
    const limit = Number(b.limit_amount);
    const spent = Number(b.spent_amount);
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const alertAt = b.alert_at_percent ?? 80;
    return {
      ...b,
      percent_used: pct,
      is_over: spent > limit,
      is_warning: pct >= alertAt && spent <= limit,
    };
  });

  return NextResponse.json({ data: enriched, month, year });
}

export async function POST(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = budgetCreateSchema.parse(await request.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.flatten() : String(e);
    return NextResponse.json({ error: "Invalid payload", details: msg }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .insert({
      user_id: user.id,
      category: body.category,
      limit_amount: body.limit_amount,
      spent_amount: 0,
      month: body.month,
      year: body.year,
      alert_at_percent: body.alert_at_percent,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = budgetPatchSchema.parse(await request.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.flatten() : String(e);
    return NextResponse.json({ error: "Invalid payload", details: msg }, { status: 400 });
  }

  const { id, ...updates } = body;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
