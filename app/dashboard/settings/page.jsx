"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  getAccounts,
  addAccount,
  renameAccount,
  deleteAccount,
} from "@/lib/linked-accounts";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Edit2, Plus, ArrowLeft, Save, Shield, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  
  // Profile settings state
  const [displayName, setDisplayName] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [transferDay, setTransferDay] = useState("");
  const [walletBalance, setWalletBalance] = useState("");

  // Accounts state
  const [accounts, setAccounts] = useState([]);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountBalance, setNewAccountBalance] = useState("");
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editingAccountName, setEditingAccountName] = useState("");

  // Loading/feedback state
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push("/login");
          return;
        }
        setUser(authUser);

        // Fetch profile
        const { data: profile } = await supabase
          .from("user_profile")
          .select("*")
          .eq("user_id", authUser.id)
          .maybeSingle();

        if (profile) {
          setDisplayName(profile.display_name || "");
          setFrequency(profile.transfer_frequency || "monthly");
          setTransferDay(profile.expected_transfer_day || "");
        }

        // Fetch wallet balance
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", authUser.id)
          .maybeSingle();

        if (wallet) {
          setWalletBalance(wallet.balance.toString());
        }

        // Fetch accounts
        const accountsData = await getAccounts(authUser.id);
        setAccounts(accountsData);
      } catch (err) {
        console.error("Error loading settings:", err);
        setError("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setError("");
    setSuccess("");

    try {
      // 1. Update user_profile
      const { error: profileError } = await supabase
        .from("user_profile")
        .update({
          display_name: displayName,
          transfer_frequency: frequency,
          expected_transfer_day: frequency !== "flexible" && transferDay ? Number(transferDay) : null,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // 2. Update wallets
      const { error: walletError } = await supabase
        .from("wallets")
        .update({
          balance: Number(walletBalance) || 0,
        })
        .eq("user_id", user.id);

      if (walletError) throw walletError;

      setSuccess("Profile settings updated successfully!");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAddAccount(e) {
    e.preventDefault();
    if (!user || !newAccountName.trim()) return;
    setSavingAccount(true);
    setError("");
    setSuccess("");

    try {
      const added = await addAccount(
        user.id,
        newAccountName.trim(),
        Number(newAccountBalance) || 0
      );
      setAccounts(prev => [...prev, added]);
      setNewAccountName("");
      setNewAccountBalance("");
      setSuccess("Account linked successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to link account.");
    } finally {
      setSavingAccount(false);
    }
  }

  async function handleRenameAccount(accountId) {
    if (!user || !editingAccountName.trim()) return;
    setError("");
    setSuccess("");

    try {
      const updated = await renameAccount(user.id, accountId, editingAccountName.trim());
      setAccounts(prev => prev.map(acc => acc.id === accountId ? updated : acc));
      setEditingAccountId(null);
      setEditingAccountName("");
      setSuccess("Account renamed successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to rename account.");
    }
  }

  async function handleDeleteAccount(accountId, name) {
    if (!user) return;
    if (!confirm(`Are you sure you want to unlink and delete the account "${name}"?`)) return;
    setError("");
    setSuccess("");

    try {
      await deleteAccount(user.id, accountId);
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      setSuccess("Account unlinked successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to delete account.");
    }
  }

  const customAccounts = accounts.filter(acc => !acc.is_special);
  const specialAccounts = accounts.filter(acc => acc.is_special);

  // Compute total balance
  const walletAmt = Number(walletBalance) || 0;
  const accountsTotal = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const grandTotal = walletAmt + accountsTotal;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0D9488] border-t-transparent"></div>
        <p className="text-sm text-[#6B7280]">Loading Settings...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0D9488]/20 bg-white/60 text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Settings & Accounts</h1>
          <p className="text-sm text-[#6B7280]">Manage bank connections, specialized accounts, and profile info</p>
        </div>
      </div>

      {/* Aggregated Total Balance View */}
      <div className="rounded-[20px] border border-[#0D9488]/18 bg-gradient-to-br from-[#134E4A] to-[#0D9488] p-6 text-white shadow-lg">
        <p className="text-xs uppercase tracking-wider opacity-85">Total Combined Net Worth</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums">
          {formatCurrency(grandTotal)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/20 pt-4 text-sm opacity-90">
          <div>
            <p className="text-xs opacity-75">Primary Wallet</p>
            <p className="font-bold tabular-nums">{formatCurrency(walletAmt)}</p>
          </div>
          <div>
            <p className="text-xs opacity-75">Linked & Specialized</p>
            <p className="font-bold tabular-nums">{formatCurrency(accountsTotal)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-[#0D9488]/30 bg-[#0D9488]/5 px-4 py-3 text-sm text-[#0D9488]">
          {success}
        </div>
      )}

      {/* Profile and Wallet Balance Settings */}
      <form onSubmit={handleSaveProfile} className="rounded-[20px] border border-[#0D9488]/18 bg-white/55 p-6 backdrop-blur-md space-y-4">
        <h2 className="text-lg font-bold text-[#134E4A]">Profile & Wallet Settings</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm font-semibold">
            Display Name
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-[#0D9488]/20 bg-white px-3 py-2 font-normal focus:ring-2 focus:ring-[#0D9488] outline-none"
              placeholder="Your name"
            />
          </label>

          <label className="block space-y-1 text-sm font-semibold">
            Primary Wallet Balance (INR)
            <input
              type="number"
              required
              value={walletBalance}
              onChange={(e) => setWalletBalance(e.target.value)}
              className="w-full rounded-xl border border-[#0D9488]/20 bg-white px-3 py-2 font-normal focus:ring-2 focus:ring-[#0D9488] outline-none"
              placeholder="0"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm font-semibold">
            Pocket Money Frequency
            <select
              value={frequency}
              onChange={(e) => {
                setFrequency(e.target.value);
                setTransferDay("");
              }}
              className="w-full rounded-xl border border-[#0D9488]/20 bg-white px-3 py-2 font-normal focus:ring-2 focus:ring-[#0D9488] outline-none"
            >
              <option value="monthly">Every Month (Monthly allowance)</option>
              <option value="weekly">Every Week (Weekly allowance)</option>
              <option value="flexible">Flexible (As and when needed)</option>
            </select>
          </label>

          {frequency === "monthly" && (
            <label className="block space-y-1 text-sm font-semibold">
              Expected Day of Month
              <input
                type="number"
                min={1}
                max={31}
                required
                value={transferDay}
                onChange={(e) => setTransferDay(e.target.value)}
                className="w-full rounded-xl border border-[#0D9488]/20 bg-white px-3 py-2 font-normal focus:ring-2 focus:ring-[#0D9488] outline-none"
                placeholder="1"
              />
            </label>
          )}

          {frequency === "weekly" && (
            <label className="block space-y-1 text-sm font-semibold">
              Expected Day of Week
              <select
                required
                value={transferDay}
                onChange={(e) => setTransferDay(e.target.value)}
                className="w-full rounded-xl border border-[#0D9488]/20 bg-white px-3 py-2 font-normal focus:ring-2 focus:ring-[#0D9488] outline-none"
              >
                <option value="">Select a day</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
                <option value="0">Sunday</option>
              </select>
            </label>
          )}
        </div>

        <Button
          type="submit"
          disabled={savingProfile}
          className="rounded-full bg-[#0D9488] hover:bg-[#0D9488]/90 font-bold w-full sm:w-auto"
        >
          {savingProfile ? "Saving Settings…" : "Save Settings"}
        </Button>
      </form>

      {/* Linked Accounts Section */}
      <div className="rounded-[20px] border border-[#0D9488]/18 bg-white/55 p-6 backdrop-blur-md space-y-6">
        <h2 className="text-lg font-bold text-[#134E4A]">Linked Bank Accounts</h2>

        {/* Existing custom accounts */}
        <div className="space-y-3">
          {customAccounts.length === 0 ? (
            <p className="text-sm text-[#6B7280] italic">No bank accounts linked yet. Add up to 3 bank accounts below.</p>
          ) : (
            customAccounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between border border-[#0D9488]/10 rounded-xl p-3.5 bg-white shadow-sm transition-all hover:border-[#0D9488]/25">
                {editingAccountId === acc.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      required
                      value={editingAccountName}
                      onChange={(e) => setEditingAccountName(e.target.value)}
                      className="flex-1 rounded-lg border border-[#0D9488]/20 px-2 py-1 text-sm bg-white outline-none focus:ring-1 focus:ring-[#0D9488]"
                      placeholder="Account name"
                    />
                    <Button
                      onClick={() => handleRenameAccount(acc.id)}
                      size="sm"
                      className="bg-[#0D9488] hover:bg-[#0D9488]/90 py-1"
                    >
                      <Save size={14} className="mr-1" /> Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAccountId(null);
                        setEditingAccountName("");
                      }}
                      className="border-[#0D9488]/20 text-[#6B7280] hover:bg-neutral-100"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-bold text-[#134E4A]">{acc.name}</p>
                      <p className="text-xs text-[#6B7280]">Custom linked account</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-neutral-800 tabular-nums">{formatCurrency(acc.balance)}</p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingAccountId(acc.id);
                            setEditingAccountName(acc.name);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-[#0D9488] transition-colors"
                          title="Rename account"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(acc.id, acc.name)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Unlink account"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add custom account form */}
        {customAccounts.length < 3 ? (
          <form onSubmit={handleAddAccount} className="border-t border-[#0D9488]/10 pt-4 space-y-3">
            <h3 className="text-sm font-bold text-[#0D9488]">+ Link New Bank Account</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g. ICICI Bank, PayTM Wallet"
                className="w-full rounded-xl border border-[#0D9488]/20 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#0D9488] outline-none"
              />
              <input
                type="number"
                value={newAccountBalance}
                onChange={(e) => setNewAccountBalance(e.target.value)}
                placeholder="Initial balance (optional)"
                className="w-full rounded-xl border border-[#0D9488]/20 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#0D9488] outline-none"
              />
            </div>
            <Button
              type="submit"
              disabled={savingAccount || !newAccountName.trim()}
              className="rounded-full bg-[#0D9488] hover:bg-[#0D9488]/90 font-bold"
            >
              <Plus size={16} className="mr-1" /> {savingAccount ? "Linking…" : "Link Bank Account"}
            </Button>
          </form>
        ) : (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-2.5 items-start text-xs text-amber-800">
            <Shield size={16} className="shrink-0 mt-0.5" />
            <p>You have linked the maximum limit of 3 bank accounts. To link a different account, please delete/unlink one of your existing linked accounts first.</p>
          </div>
        )}
      </div>

      {/* Specialized accounts overview */}
      <div className="rounded-[20px] border border-[#0D9488]/18 bg-white/55 p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#134E4A]">Specialized System Accounts</h2>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0D9488]/10 text-[#0D9488] cursor-help" title="These accounts are built-in and cannot be renamed or unlinked.">
            <HelpCircle size={12} />
          </div>
        </div>
        <p className="text-xs text-[#6B7280] -mt-2">Standard specialized asset storage accounts pre-configured for transfers</p>
        
        <div className="space-y-3">
          {specialAccounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between border border-[#0D9488]/10 rounded-xl p-3.5 bg-white/60">
              <div>
                <p className="font-bold text-[#134E4A]">{acc.name}</p>
                <p className="text-xs text-[#6B7280]">Specialized Account</p>
              </div>
              <p className="font-bold text-neutral-800 tabular-nums">{formatCurrency(acc.balance)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
