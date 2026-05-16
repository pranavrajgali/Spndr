import { getUser } from "@/lib/supabase-server";
import { groq, MODELS } from "@/lib/groq";
import { NextResponse } from "next/server";

export async function POST(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageUrl } = await request.json();
  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  }

  const completion = await groq.chat.completions.create({
    model: MODELS.vision,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract merchant, total amount (INR number only), and date from this receipt. Return JSON: {\"merchant\":\"\",\"amount\":0,\"date\":\"YYYY-MM-DD\"}",
          },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    temperature: 0.1,
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  let parsed = {};
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    parsed = { merchant: null, amount: null, date: null };
  }

  return NextResponse.json({ data: parsed });
}
