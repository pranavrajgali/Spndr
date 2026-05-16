import { createClient, getUser } from "@/lib/supabase-server";
import { goldCreateSchema } from "@/lib/schemas/gold";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gold")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let gramsOwned = 0;
  for (const row of data ?? []) {
    const g = Number(row.grams);
    gramsOwned += row.type === "buy" ? g : -g;
  }

  return NextResponse.json({
    data,
    summary: {
      grams_owned: Math.max(0, gramsOwned),
      entry_count: data?.length ?? 0,
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
    body = goldCreateSchema.parse(await request.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.flatten() : String(e);
    return NextResponse.json({ error: "Invalid payload", details: msg }, { status: 400 });
  }

  const parsedDate = new Date(body.date);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const expected = body.grams * body.price_per_gram;
  if (Math.abs(expected - body.total_paid) > expected * 0.05 + 1) {
    return NextResponse.json(
      {
        error: "total_paid should match grams × price_per_gram (within 5%)",
        expected: Math.round(expected * 100) / 100,
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gold")
    .insert({
      user_id: user.id,
      type: body.type,
      grams: body.grams,
      price_per_gram: body.price_per_gram,
      total_paid: body.total_paid,
      date: parsedDate.toISOString().slice(0, 10),
      notes: body.notes,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
