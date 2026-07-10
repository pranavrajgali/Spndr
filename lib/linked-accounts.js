import { createClient } from "./supabase";

const SPECIAL_ACCOUNT_NAMES = ["Fampay", "Gold", "Silver"];

function getLocalAccounts(userId) {
  if (typeof window === "undefined") return [];
  const key = `spndr_linked_accounts_${userId}`;
  const data = localStorage.getItem(key);
  if (!data) {
    const initial = SPECIAL_ACCOUNT_NAMES.map(name => ({
      id: name.toLowerCase(),
      name,
      balance: 0,
      is_special: true,
      user_id: userId,
      created_at: new Date().toISOString()
    }));
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
}

function saveLocalAccounts(userId, accounts) {
  if (typeof window === "undefined") return;
  const key = `spndr_linked_accounts_${userId}`;
  localStorage.setItem(key, JSON.stringify(accounts));
}

export async function getAccounts(userId) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("linked_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("linked_accounts select failed, falling back to localStorage", error);
      return getLocalAccounts(userId);
    }

    let accounts = data || [];
    const missingSpecials = SPECIAL_ACCOUNT_NAMES.filter(
      name => !accounts.some(acc => acc.name.toLowerCase() === name.toLowerCase())
    );

    if (missingSpecials.length > 0) {
      const inserts = missingSpecials.map(name => ({
        user_id: userId,
        name,
        balance: 0,
        is_special: true
      }));

      const { data: inserted, error: insertError } = await supabase
        .from("linked_accounts")
        .insert(inserts)
        .select();

      if (insertError) {
        console.warn("linked_accounts insert specialized failed, falling back to localStorage", insertError);
        return getLocalAccounts(userId);
      }

      if (inserted) {
        accounts = [...accounts, ...inserted];
      }
    }

    return accounts;
  } catch (err) {
    console.error("Error in getAccounts:", err);
    return getLocalAccounts(userId);
  }
}

export async function addAccount(userId, name, initialBalance = 0) {
  const accounts = await getAccounts(userId);
  const customAccounts = accounts.filter(acc => !acc.is_special);
  
  if (customAccounts.length >= 3) {
    throw new Error("You can link up to 3 additional bank accounts.");
  }

  if (accounts.some(acc => acc.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("An account with this name already exists.");
  }

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("linked_accounts")
      .insert({
        user_id: userId,
        name: name.trim(),
        balance: Number(initialBalance) || 0,
        is_special: false
      })
      .select()
      .single();

    if (error) {
      console.warn("linked_accounts insert custom failed, falling back to localStorage", error);
      const local = getLocalAccounts(userId);
      const newAcc = {
        id: Math.random().toString(36).substring(2, 9),
        user_id: userId,
        name: name.trim(),
        balance: Number(initialBalance) || 0,
        is_special: false,
        created_at: new Date().toISOString()
      };
      local.push(newAcc);
      saveLocalAccounts(userId, local);
      return newAcc;
    }
    return data;
  } catch (err) {
    console.error("Error in addAccount:", err);
    const local = getLocalAccounts(userId);
    const newAcc = {
      id: Math.random().toString(36).substring(2, 9),
      user_id: userId,
      name: name.trim(),
      balance: Number(initialBalance) || 0,
      is_special: false,
      created_at: new Date().toISOString()
    };
    local.push(newAcc);
    saveLocalAccounts(userId, local);
    return newAcc;
  }
}

export async function renameAccount(userId, accountId, newName) {
  const accounts = await getAccounts(userId);
  if (accounts.some(acc => acc.id !== accountId && acc.name.toLowerCase() === newName.toLowerCase())) {
    throw new Error("An account with this name already exists.");
  }

  const target = accounts.find(acc => acc.id === accountId);
  if (!target) throw new Error("Account not found.");
  if (target.is_special) throw new Error("Specialized accounts cannot be renamed.");

  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("linked_accounts")
      .update({ name: newName.trim(), updated_at: new Date().toISOString() })
      .eq("id", accountId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.warn("linked_accounts update failed, falling back to localStorage", error);
      const local = getLocalAccounts(userId);
      const idx = local.findIndex(acc => acc.id === accountId);
      if (idx !== -1) {
        local[idx].name = newName.trim();
        local[idx].updated_at = new Date().toISOString();
        saveLocalAccounts(userId, local);
        return local[idx];
      }
      throw new Error("Local account not found.");
    }
    return data;
  } catch (err) {
    console.error("Error in renameAccount:", err);
    const local = getLocalAccounts(userId);
    const idx = local.findIndex(acc => acc.id === accountId);
    if (idx !== -1) {
      local[idx].name = newName.trim();
      local[idx].updated_at = new Date().toISOString();
      saveLocalAccounts(userId, local);
      return local[idx];
    }
    throw err;
  }
}

export async function deleteAccount(userId, accountId) {
  const accounts = await getAccounts(userId);
  const target = accounts.find(acc => acc.id === accountId);
  if (!target) throw new Error("Account not found.");
  if (target.is_special) throw new Error("Specialized accounts cannot be unlinked.");

  const supabase = createClient();
  try {
    const { error } = await supabase
      .from("linked_accounts")
      .delete()
      .eq("id", accountId)
      .eq("user_id", userId);

    if (error) {
      console.warn("linked_accounts delete failed, falling back to localStorage", error);
      const local = getLocalAccounts(userId);
      const updated = local.filter(acc => acc.id !== accountId);
      saveLocalAccounts(userId, updated);
      return;
    }
  } catch (err) {
    console.error("Error in deleteAccount:", err);
    const local = getLocalAccounts(userId);
    const updated = local.filter(acc => acc.id !== accountId);
    saveLocalAccounts(userId, updated);
  }
}

export async function transferFunds(userId, destinationAccountId, amount) {
  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error("Please enter a valid positive transfer amount.");
  }

  const supabase = createClient();

  // 1. Get primary wallet balance
  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (walletError || !wallet) {
    throw new Error("Unable to retrieve primary wallet balance.");
  }

  const primaryBalance = Number(wallet.balance);
  if (primaryBalance < parsedAmount) {
    throw new Error(`Insufficient funds in primary wallet. Current balance: ${primaryBalance}`);
  }

  // 2. Find destination account
  const accounts = await getAccounts(userId);
  const destAccount = accounts.find(acc => acc.id === destinationAccountId);
  if (!destAccount) {
    throw new Error("Destination account not found.");
  }

  // 3. Log expense transaction (automatically deducts from primary wallet via DB trigger)
  const description = `Transfer to ${destAccount.name}`;
  const category = destAccount.name === "Gold" ? "Gold" : "Other";
  
  const { error: txError } = await supabase.from("transactions").insert({
    user_id: userId,
    type: "expense",
    amount: -parsedAmount,
    description,
    category,
    date: new Date().toISOString(),
    source: "manual"
  });

  if (txError) {
    throw new Error(`Transfer failed: ${txError.message}`);
  }

  // 4. Update destination account's balance
  const nextDestBalance = Number(destAccount.balance) + parsedAmount;
  
  try {
    const { error: destError } = await supabase
      .from("linked_accounts")
      .update({ balance: nextDestBalance, updated_at: new Date().toISOString() })
      .eq("id", destinationAccountId)
      .eq("user_id", userId);

    if (destError) {
      console.warn("linked_accounts balance update failed, falling back to localStorage", destError);
      const local = getLocalAccounts(userId);
      const idx = local.findIndex(acc => acc.id === destinationAccountId);
      if (idx !== -1) {
        local[idx].balance = nextDestBalance;
        local[idx].updated_at = new Date().toISOString();
        saveLocalAccounts(userId, local);
      }
    }
  } catch (err) {
    console.error("Error updating destination balance:", err);
    const local = getLocalAccounts(userId);
    const idx = local.findIndex(acc => acc.id === destinationAccountId);
    if (idx !== -1) {
      local[idx].balance = nextDestBalance;
      local[idx].updated_at = new Date().toISOString();
      saveLocalAccounts(userId, local);
    }
  }

  // 5. Special logic for Gold
  if (destAccount.name.toLowerCase() === "gold") {
    try {
      const { data: profile } = await supabase
        .from("user_profile")
        .select("gold_price_per_gram")
        .eq("user_id", userId)
        .maybeSingle();

      const pricePerGram = Number(profile?.gold_price_per_gram) || 6000;
      const grams = parsedAmount / pricePerGram;

      await supabase.from("gold").insert({
        user_id: userId,
        type: "buy",
        grams,
        price_per_gram: pricePerGram,
        total_paid: parsedAmount,
        date: new Date().toISOString().slice(0, 10),
        notes: `Inter-account transfer from Primary Wallet`
      });
    } catch (goldErr) {
      console.error("Gold tracker entry insertion failed:", goldErr);
    }
  }
}
