import Groq from "groq-sdk";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "./categories";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const MODELS = {
  fast: "llama-3.1-8b-instant",
  insights: "llama-3.3-70b-versatile",
  vision: "llama-3.2-11b-vision-preview",
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

export const CHAT_SYSTEM_PROMPT = `You are a polite, helpful, and constructive AI Finance Assistant for college students. 

PERSONA:
- You are professional, encouraging, and clear.
- Provide simple, actionable financial tips when appropriate.
- Keep the tone friendly, helpful, and concise.

GOALS:
1. Handle actions (adding/deleting transactions).
2. Give helpful, constructive financial guidance or confirmations based on data.

ACTION RULES:
- If user wants to LOG/ADD: Return {"action":"add","type":"expense"|"income","amount":number,"description":"short string","category":"match from list","reply":"polite confirmation message"}.
- If user wants to DELETE/REMOVE: Return {"action":"delete","reply":"polite confirmation of removal"}.
- Otherwise: Return {"action":"reply","reply":"constructive advice/response"}.

ALWAYS return valid JSON for actions, or just a helpful text reply.`;

export async function chatCompletion(messages, model = MODELS.fast) {
  return groq.chat.completions.create({
    model,
    messages,
    temperature: 0.2,
  });
}

export { groq };
