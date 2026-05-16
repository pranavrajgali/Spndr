import { categorizeExpensePrompt, chatCompletion, MODELS } from "./groq";
import { EXPENSE_CATEGORIES } from "./categories";

const BATCH = 10;

export async function categorizeRowsBatch(descriptions) {
  const results = [];
  for (let i = 0; i < descriptions.length; i += BATCH) {
    const chunk = descriptions.slice(i, i + BATCH);
    for (const desc of chunk) {
      const completion = await chatCompletion(
        [{ role: "user", content: categorizeExpensePrompt(desc) }],
        MODELS.fast
      );
      const raw = completion.choices[0]?.message?.content?.trim() || "Other";
      results.push(EXPENSE_CATEGORIES.includes(raw) ? raw : "Other");
    }
  }
  return results;
}

export function findDuplicateKeys(existing, incoming) {
  const keys = new Set(
    existing.map(
      (t) =>
        `${t.date}|${Math.abs(Number(t.amount))}|${t.description?.toLowerCase()}`
    )
  );
  return incoming.map((row) => {
    const key = `${row.date}|${row.amount}|${row.description?.toLowerCase()}`;
    return keys.has(key);
  });
}
