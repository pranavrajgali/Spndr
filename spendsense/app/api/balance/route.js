import { createClient, getUser } from "@/lib/supabase-server";
import { balanceSetSchema } from "@/lib/schemas/balance";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wallets")
    .select("balance, id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    balance: data?.balance ?? 0,
    wallet_id: data?.id ?? null,
  });
}

/** Set absolute wallet balance (e.g. after counting cash) and log in balances table. */
export async function POST(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = balanceSetSchema.parse(await request.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.flatten() : String(e);
    return NextResponse.json({ error: "Invalid payload", details: msg }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: wallet } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  const previous = Number(wallet?.balance ?? 0);
  const adjustment = body.balance - previous;

  const { error: logError } = await supabase.from("balances").insert({
    user_id: user.id,
    amount: adjustment,
    note: body.note ?? `Balance set to ${body.balance}`,
  });

  if (logError) {
    return NextResponse.json({ error: logError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("wallets")
    .update({ balance: body.balance })
    .eq("user_id", user.id)
    .select("balance")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    balance: data?.balance ?? body.balance,
    previous_balance: previous,
    adjustment,
  });
}
