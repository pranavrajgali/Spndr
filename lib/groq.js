import Groq from "groq-sdk";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "./categories";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const MODELS = {
  fast: "llama-3.1-8b-instant",
  insights: "llama-3.3-70b-versatile",
  vision: "llava-v1.5-7b-410m-free",
};

export function categorizeExpensePrompt(description) {
  return `You are a transaction categorizer for Indian spending.
Categorize this transaction into exactly one of these categories:
[${EXPENSE_CATEGORIES.join(", ")}]
Transaction: '${description}'
Reply with ONLY the category name, nothing else.`;
}

export function categorizeIncomePrompt(description) {
  return `You are a transaction categorizer for Indian income.
Categorize this transaction into exactly one of these categories:
[${INCOME_CATEGORIES.join(", ")}]
Transaction: '${description}'
Reply with ONLY the category name, nothing else.`;
}

/** @deprecated use categorizeExpensePrompt */
export function categorizePrompt(description) {
  return categorizeExpensePrompt(description);
}

export const CHAT_SYSTEM_PROMPT = `You are a finance assistant. The user will describe a transaction
in natural language. Extract: type (income/expense), amount,
description, category. Return JSON only:
{"type":"expense","amount":20,"description":"coffee",
 "category":"Food & Drinks", "action":"add"}
If user says delete/remove, set action to 'delete'.`;

export async function chatCompletion(messages, model = MODELS.fast) {
  return groq.chat.completions.create({
    model,
    messages,
    temperature: 0.2,
  });
}

export { groq };
