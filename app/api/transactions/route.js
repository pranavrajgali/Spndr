import { createClient, getUser } from "@/lib/supabase-server";
import {
  signedAmountForInsert,
  transactionCreateSchema,
  validateCategory,
} from "@/lib/schemas/transaction";
import { adjustBudgetSpent } from "@/lib/budgets";
import { adjustWalletAfterRemovedTransaction } from "@/lib/wallet";
import { NextResponse } from "next/server";
import { z } from "zod";

const softDeleteSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));
  const offset = (page - 1) * limit;
  const rangeEnd = offset + limit - 1;

  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, rangeEnd);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    meta: {
      page,
      limit,
      total: count ?? data?.length ?? 0,
      hasMore: count != null ? offset + (data?.length ?? 0) < count : (data?.length ?? 0) === limit,
    },
  });
}

export async function POST(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = transactionCreateSchema.parse(await request.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.flatten() : String(e);
    return NextResponse.json({ error: "Invalid payload", details: msg }, { status: 400 });
  }

  const cat = validateCategory(body.type, body.category);
  if (!cat.ok) {
    return NextResponse.json({ error: cat.error }, { status: 400 });
  }

  const parsedDate = new Date(body.date);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const amount = signedAmountForInsert(body.type, body.amount);
  const dateStr = new Date().toISOString(); // Full timestamp with time

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: body.type,
      amount,
      description: body.description,
      category: body.category,
      date: dateStr,
      source: body.source ?? "manual",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bErr = await adjustBudgetSpent(
    supabase,
    user.id,
    {
      category: body.category,
      amount,
      date: dateStr,
      type: body.type,
    },
    "add"
  );
  if (bErr.error) {
    return NextResponse.json({ error: bErr.error }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/** Guide: PATCH → soft delete (set is_deleted = true). */
export async function PATCH(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = softDeleteSchema.parse(await request.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.flatten() : String(e);
    return NextResponse.json({ error: "Invalid payload", details: msg }, { status: 400 });
  }

  const supabase = await createClient();

  const row = await softDeleteTransaction(supabase, user.id, parsed.id);
  if (row.error) {
    return NextResponse.json({ error: row.error }, { status: row.status ?? 500 });
  }

  return NextResponse.json({ data: row.data });
}

export async function DELETE(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = softDeleteSchema.parse(await request.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.flatten() : String(e);
    return NextResponse.json({ error: "Invalid payload", details: msg }, { status: 400 });
  }

  const supabase = await createClient();

  const row = await softDeleteTransaction(supabase, user.id, parsed.id);
  if (row.error) {
    return NextResponse.json({ error: row.error }, { status: row.status ?? 500 });
  }

  return NextResponse.json({ data: row.data });
}

async function softDeleteTransaction(supabase, userId, id) {
  const { data: row, error: fetchErr } = await supabase
    .from("transactions")
    .select("id, amount, is_deleted, type, category, date")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { error: "Transaction not found", status: 404 };
  }
  if (row.is_deleted) {
    return { error: "Already removed", status: 400 };
  }

  const { error: updErr } = await supabase
    .from("transactions")
    .update({ is_deleted: true })
    .eq("id", id)
    .eq("user_id", userId);

  if (updErr) {
    return { error: updErr.message, status: 500 };
  }

  const wErr = await adjustWalletAfterRemovedTransaction(supabase, userId, row.amount);
  if (wErr.error) {
    return { error: wErr.error, status: 500 };
  }

  const bErr = await adjustBudgetSpent(
    supabase,
    userId,
    {
      category: row.category,
      amount: row.amount,
      date: row.date,
      type: row.type,
    },
    "remove"
  );
  if (bErr.error) {
    return { error: bErr.error, status: 500 };
  }

  const { data } = await supabase.from("transactions").select("*").eq("id", id).single();
  return { data };
}
