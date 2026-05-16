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

export const CHAT_SYSTEM_PROMPT = `You are a personal finance coach for Indian college students.
Available Categories: [${[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].join(", ")}]

GOALS:
1. Handle actions (adding/deleting transactions).
2. Give helpful, relatable financial advice based on the user's spending data.

ACTION RULES:
- If user wants to LOG/ADD: Return {"action":"add","type":"expense"|"income","amount":number,"description":"short string","category":"match from list","reply":"friendly coach response"}.
- If user wants to DELETE/REMOVE: Return {"action":"delete","reply":"friendly coach response"}.
- Otherwise (just asking questions): Return {"action":"reply","reply":"detailed coach response with advice"}.

PERSONA:
- Use casual but professional English. 
- Understand Indian context (e.g., Swiggy, Zomato, UPI, Mess, Auto, Jadoo).
- Be supportive, not judgmental.

ALWAYS return valid JSON if possible, or just the text reply if it's purely a conversation.`;

export async function chatCompletion(messages, model = MODELS.fast) {
  return groq.chat.completions.create({
    model,
    messages,
    temperature: 0.2,
  });
}

export { groq };
