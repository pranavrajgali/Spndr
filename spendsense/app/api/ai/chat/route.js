import { createClient, getUser } from "@/lib/supabase-server";
import { chatCompletion, CHAT_SYSTEM_PROMPT, MODELS } from "@/lib/groq";
import { adjustBudgetSpent } from "@/lib/budgets";
import { adjustWalletAfterRemovedTransaction } from "@/lib/wallet";
import { NextResponse } from "next/server";

export async function POST(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await request.json();
  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const supabase = await createClient();

  await supabase.from("chat_messages").insert({
    user_id: user.id,
    role: "user",
    content: message,
  });

  const completion = await chatCompletion(
    [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      { role: "user", content: message },
    ],
    MODELS.fast
  );

  const raw = completion.choices[0]?.message?.content || "{}";
  let action = {};
  try {
    action = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    action = { action: "reply", reply: raw };
  }

  let transactionId = null;

  if (action.action === "add" && action.amount) {
    const signedAmount =
      action.type === "expense"
        ? -Math.abs(action.amount)
        : Math.abs(action.amount);
    const dateStr = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: action.type || "expense",
        amount: signedAmount,
        description: action.description || message,
        category: action.category || "Other",
        date: dateStr,
        source: "chat",
      })
      .select("id")
      .single();
    transactionId = data?.id;
    await adjustBudgetSpent(
      supabase,
      user.id,
      {
        category: action.category || "Other",
        amount: signedAmount,
        date: dateStr,
        type: action.type || "expense",
      },
      "add"
    );
  }

  if (action.action === "delete") {
    const { data: latest } = await supabase
      .from("transactions")
      .select("id, amount, type, category, date")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest?.id) {
      await supabase
        .from("transactions")
        .update({ is_deleted: true })
        .eq("id", latest.id)
        .eq("user_id", user.id);
      const wErr = await adjustWalletAfterRemovedTransaction(
        supabase,
        user.id,
        latest.amount
      );
      if (wErr.error) {
        return NextResponse.json({ error: wErr.error }, { status: 500 });
      }
      const bErr = await adjustBudgetSpent(
        supabase,
        user.id,
        {
          category: latest.category,
          amount: latest.amount,
          date: latest.date,
          type: latest.type,
        },
        "remove"
      );
      if (bErr.error) {
        return NextResponse.json({ error: bErr.error }, { status: 500 });
      }
      transactionId = latest.id;
    }
  }

  const reply =
    action.reply ||
    (action.action === "add"
      ? `Logged ${action.description} for ₹${action.amount}.`
      : action.action === "delete"
        ? "Removed your last entry."
        : raw);

  await supabase.from("chat_messages").insert({
    user_id: user.id,
    role: "assistant",
    content: reply,
    transaction_id: transactionId,
  });

  return NextResponse.json({ reply, action, transactionId });
}
