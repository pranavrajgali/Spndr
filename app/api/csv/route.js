import { createClient, getUser } from "@/lib/supabase-server";
import { parseCSV } from "@/lib/csvParser";
import { categorizeRowsBatch, findDuplicateKeys } from "@/lib/csvImport";
import { csvParseSchema } from "@/lib/schemas/csv";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = csvParseSchema.parse(await request.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.flatten() : String(e);
    return NextResponse.json({ error: "Invalid payload", details: msg }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("csv-imports")
    .download(body.fileUrl);

  if (downloadError) {
    return NextResponse.json({ error: downloadError.message }, { status: 500 });
  }

  const text = await fileData.text();
  const parsed = parseCSV(text);

  const { data: importRow, error: importError } = await supabase
    .from("csv_imports")
    .insert({
      user_id: user.id,
      filename: body.filename,
      source: body.source,
      total_rows: parsed.length,
      status: "parsed",
    })
    .select()
    .single();

  if (importError) {
    return NextResponse.json({ error: importError.message }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  let rows = parsed.map((r) => ({
    description: r.description,
    amount: r.amount,
    date: r.date || today,
    type: "expense",
    category: "Other",
  }));

  if (body.categorize && rows.length > 0) {
    try {
      const categories = await categorizeRowsBatch(rows.map((r) => r.description));
      rows = rows.map((r, i) => ({ ...r, category: categories[i] }));
    } catch {
      return NextResponse.json(
        { error: "CSV parsed but categorization failed. Retry with categorize: false." },
        { status: 502 }
      );
    }
  }

  const { data: existing } = await supabase
    .from("transactions")
    .select("description, amount, date")
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .limit(5000);

  const duplicateFlags = findDuplicateKeys(existing ?? [], rows);
  rows = rows.map((r, i) => ({ ...r, possible_duplicate: duplicateFlags[i] }));

  return NextResponse.json({
    importId: importRow.id,
    rows,
    total: rows.length,
    message: body.categorize
      ? "Parsed and categorized. POST /api/csv/confirm to import."
      : "Parsed. Set categorize:true or categorize client-side, then POST /api/csv/confirm.",
  });
}
