import { getUser } from "@/lib/supabase-server";
import { chatCompletion, MODELS } from "@/lib/groq";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { text } = await request.json();
    if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });

    const prompt = `
      You are a transaction extractor for Indian UPI/Bank statements. 
      Extract ALL transactions from the following text into a JSON list.
      
      Categories MUST be one of: [${[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].join(", ")}]

      Text:
      "${text.substring(0, 10000)}" -- limit to first 10k chars

      Return ONLY a JSON array of objects:
      [{"date":"YYYY-MM-DD", "amount": number, "type":"expense"|"income", "description":"...", "category":"..."}]
    `;

    const completion = await chatCompletion([
      { role: "system", content: "You are a professional bank statement parser. Return ONLY JSON." },
      { role: "user", content: prompt }
    ], MODELS.insights); // Use the stronger model for better parsing

    const raw = completion.choices[0]?.message?.content || "[]";
    let transactions = [];
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      transactions = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (e) {
      console.error("AI Statement Parsing Failed:", raw);
      transactions = [];
    }

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Statement API Error:", error);
    return NextResponse.json({ error: "Failed to parse statement" }, { status: 500 });
  }
}
