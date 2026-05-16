/** Reverse effect of an active transaction on wallet (matches trigger: INSERT adds amount). */
export async function adjustWalletAfterRemovedTransaction(supabase, userId, transactionAmount) {
  const { data: wallet, error: fetchErr } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchErr || !wallet) {
    return { error: fetchErr?.message ?? "Wallet not found" };
  }

  const nextBalance = Number(wallet.balance) - Number(transactionAmount);
  const { error: updErr } = await supabase
    .from("wallets")
    .update({ balance: nextBalance })
    .eq("user_id", userId);

  if (updErr) {
    return { error: updErr.message };
  }
  return {};
}
