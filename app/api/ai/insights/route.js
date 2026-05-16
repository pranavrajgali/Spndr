import { createClient, getUser } from "@/lib/supabase-server";
import { chatCompletion, MODELS } from "@/lib/groq";
import { NextResponse } from "next/server";
import { InsightsRequestSchema } from "@/lib/schemas/insights";

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validatedInput = InsightsRequestSchema.safeParse(body);

    if (!validatedInput.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedInput.error.format() },
        { status: 400 }
      );
    }

    const { 
      month = new Date().getMonth() + 1, 
      year = new Date().getFullYear(), 
      regenerate 
    } = validatedInput.data;

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

    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("type, amount, category, description, date")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .gte("date", start)
      .lt("date", end);

    if (txError) {
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }

    const completion = await chatCompletion(
      [
        {
          role: "system",
          content:
            "You are a personal finance coach for Indian college students. Write 2-3 short, helpful paragraphs of monthly insights in plain English. Focus on students' perspective.",
        },
        {
          role: "user",
          content: `Analyze these transactions for ${month}/${year}:\n${JSON.stringify(transactions ?? [])}`,
        },
      ],
      MODELS.insights
    );

    const summary_text = completion.choices[0]?.message?.content?.trim() || "No insights could be generated.";

    const { data, error: upsertError } = await supabase
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

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Insights API Error:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
