import { getUser } from "@/lib/supabase-server";
import { groq, MODELS } from "@/lib/groq";
import { NextResponse } from "next/server";
import { ReceiptRequestSchema, ReceiptResponseSchema } from "@/lib/schemas/receipt";

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedInput = ReceiptRequestSchema.safeParse(body);

    if (!validatedInput.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedInput.error.format() },
        { status: 400 }
      );
    }

    const { imageUrl } = validatedInput.data;

    // Determine if it's a URL or base64
    const imageContent = imageUrl.startsWith('data:') 
      ? { url: imageUrl } // Groq supports data URLs
      : { url: imageUrl };

    const completion = await groq.chat.completions.create({
      model: MODELS.vision,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract merchant name, total amount (as a number in INR), and date from this receipt. Return ONLY JSON: {\"merchant\":\"\",\"amount\":0,\"date\":\"YYYY-MM-DD\"}",
            },
            { type: "image_url", image_url: imageContent },
          ],
        },
      ],
      temperature: 0, // Lower temperature for more consistent JSON
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed = {};
    try {
      // Robust JSON extraction in case the AI adds markdown blocks
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : raw;
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error("AI Response parsing failed:", raw);
      parsed = {};
    }

    // Validate AI output against schema to ensure defaults are applied
    const validatedOutput = ReceiptResponseSchema.parse(parsed);

    return NextResponse.json({ data: validatedOutput });
  } catch (error) {
    console.error("Receipt API Error:", error);
    return NextResponse.json(
      { error: "Failed to process receipt" },
      { status: 500 }
    );
  }
}
