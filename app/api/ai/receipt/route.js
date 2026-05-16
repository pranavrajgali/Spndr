import { getUser } from "@/lib/supabase-server";
import { chatCompletion, MODELS } from "@/lib/groq";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await request.json();
    if (!text || text.trim().length < 3) {
      return NextResponse.json({ error: "No text extracted from receipt" }, { status: 400 });
    }

    const completion = await chatCompletion(
      [
        {
          role: "system",
          content: `You extract receipt data from OCR text. The text may be messy/noisy.
Find: merchant name, total amount in INR (the FINAL amount paid, not subtotals), date, and category.
Category MUST be one of: [${EXPENSE_CATEGORIES.join(", ")}]
Return ONLY valid JSON: {"merchant":"name","amount":123.45,"date":"YYYY-MM-DD","category":"category name"}
If you can't find a value, use reasonable defaults. Amount should be a number, not a string.`,
        },
        {
          role: "user",
          content: `Parse this receipt text:\n${text}`,
        },
      ],
      MODELS.insights // Using the 70B model for better accuracy
    );

    const raw = completion.choices[0]?.message?.content || "{}";
    console.log("Receipt OCR Parse Response:", raw);

    let parsed = {};
    try {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        parsed = JSON.parse(raw.substring(start, end + 1));
      }
    } catch (e) {
      console.error("Receipt parse failed:", raw);
    }

    // Clean amount if string
    if (typeof parsed.amount === "string") {
      parsed.amount = parseFloat(parsed.amount.replace(/[^\d.]/g, "")) || 0;
    }

    return NextResponse.json({
      data: {
        merchant: parsed.merchant || "Unknown",
        amount: parsed.amount || 0,
        date: parsed.date || new Date().toISOString().slice(0, 10),
        category: parsed.category || "Other",
      },
    });
  } catch (error) {
    console.error("Receipt OCR API Error:", error);
    return NextResponse.json({ error: "Failed to parse receipt text" }, { status: 500 });
  }
}
