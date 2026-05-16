import { createClient, getUser } from "@/lib/supabase-server";
import { adjustBudgetSpent } from "@/lib/budgets";
import { csvConfirmSchema } from "@/lib/schemas/csv";
import {
  signedAmountForInsert,
  validateCategory,
} from "@/lib/schemas/transaction";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = csvConfirmSchema.parse(await request.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.flatten() : String(e);
    return NextResponse.json({ error: "Invalid payload", details: msg }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: importRow, error: impErr } = await supabase
    .from("csv_imports")
    .select("id, user_id, status")
    .eq("id", body.importId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (impErr || !importRow) {
    return NextResponse.json({ error: "Import not found" }, { status: 404 });
  }

  const toInsert = body.rows.filter((r) => !r.skip);
  const inserts = [];
  let failed = 0;

  for (const row of toInsert) {
    const cat = validateCategory(row.type, row.category);
    if (!cat.ok) {
      failed += 1;
      continue;
    }
    const parsedDate = new Date(row.date);
    if (Number.isNaN(parsedDate.getTime())) {
      failed += 1;
      continue;
    }
    const dateStr = parsedDate.toISOString().slice(0, 10);
    const amount = signedAmountForInsert(row.type, row.amount);

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: row.type,
        amount,
        description: row.description,
        category: row.category,
        date: dateStr,
        source: "csv",
      })
      .select()
      .single();

    if (error) {
      failed += 1;
      continue;
    }

    await adjustBudgetSpent(
      supabase,
      user.id,
      {
        category: row.category,
        amount,
        date: dateStr,
        type: row.type,
      },
      "add"
    );

    inserts.push(data);
  }

  await supabase
    .from("csv_imports")
    .update({
      status: failed > 0 ? "partial" : "completed",
      processed_rows: inserts.length,
      failed_rows: failed + body.rows.filter((r) => r.skip).length,
    })
    .eq("id", body.importId);

  return NextResponse.json({
    imported: inserts.length,
    failed,
    skipped: body.rows.filter((r) => r.skip).length,
    data: inserts,
  });
}
