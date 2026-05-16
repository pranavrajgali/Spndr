import { getUser } from "@/lib/supabase-server";
import {
  categorizeExpensePrompt,
  categorizeIncomePrompt,
  chatCompletion,
  MODELS,
} from "@/lib/groq";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { NextResponse } from "next/server";

export async function POST(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { description, descriptions, type } = await request.json();
  const txType = type === "income" ? "income" : "expense";
  const items = descriptions?.length ? descriptions : [description];

  if (!items?.filter(Boolean).length) {
    return NextResponse.json({ error: "description required" }, { status: 400 });
  }

  const categories = txType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const promptFn =
    txType === "income" ? categorizeIncomePrompt : categorizeExpensePrompt;

  const results = [];

  for (const item of items) {
    let completion;
    try {
      completion = await chatCompletion(
        [{ role: "user", content: promptFn(item) }],
        MODELS.fast
      );
    } catch {
      return NextResponse.json(
        { error: "Failed to categorize — check GROQ_API_KEY and limits." },
        { status: 502 }
      );
    }
    const category =
      completion.choices[0]?.message?.content?.trim() || "Other";
    results.push({
      description: item,
      category: categories.includes(category) ? category : "Other",
    });
  }

  return NextResponse.json({
    data: results,
    category: results.length === 1 ? results[0].category : undefined,
  });
}
