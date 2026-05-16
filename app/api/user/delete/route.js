import { createClient, getUser } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function DELETE(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  
  // We delete all data associated with this user.
  // We can't delete the actual Auth user from here without a service role,
  // but we can wipe their financial footprint.
  
  try {
    const tables = [
      'transactions',
      'budgets',
      'wallets',
      'balances',
      'gold',
      'receipts',
      'ai_insights',
      'chat_messages',
      'csv_imports',
      'user_profile'
    ];

    for (const table of tables) {
      await supabase
        .from(table)
        .delete()
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Failed to delete account data" }, { status: 500 });
  }
}
