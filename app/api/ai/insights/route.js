import { createClient, getUser } from "@/lib/supabase-server";
import { chatCompletion, MODELS } from "@/lib/groq";
import { NextResponse } from "next/server";

export async function POST(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const month = body.month ?? new Date().getMonth() + 1;
  const year = body.year ?? new Date().getFullYear();
  const regenerate = Boolean(body.regenerate);

  const supabase = await createClient();

  if (!regenerate) {
    const { data: cached } = await supabase
      .from("ai_insights")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", month)
      .eq("year", year)
      .maybeSingle();

    if (cached?.summary_text) {
      return NextResponse.json({ data: cached });
    }
  }

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const end = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data: transactions } = await supabase
    .from("transactions")
    .select("type, amount, category, description, date")
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .gte("date", start)
    .lt("date", end);

  const completion = await chatCompletion(
    [
      {
        role: "system",
        content:
          "You are a personal finance coach for Indian college students. Write 2-3 short paragraphs of monthly insights in plain English.",
      },
      {
        role: "user",
        content: `Analyze these transactions for ${month}/${year}:\n${JSON.stringify(transactions ?? [])}`,
      },
    ],
    MODELS.insights
  );

  const summary_text = completion.choices[0]?.message?.content?.trim() || "";

  const { data, error } = await supabase
    .from("ai_insights")
    .upsert(
      {
        user_id: user.id,
        month,
        year,
        summary_text,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,month,year" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
