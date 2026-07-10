"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getAccounts } from "@/lib/linked-accounts";
import { formatCurrency } from "@/lib/utils";
import { ArrowRightLeft, CreditCard, Wallet, Landmark, Coins, ChevronDown, ChevronUp } from "lucide-react";
import TransferModal from "./TransferModal";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardAccounts({ userId, initialWalletBalance }) {
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState(initialWalletBalance);
  const [accounts, setAccounts] = useState([]);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const supabase = createClient();

  async function fetchBalances() {
    try {
      // 1. Fetch wallet balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (wallet) {
        setWalletBalance(Number(wallet.balance) || 0);
      }

      // 2. Fetch linked & specialized accounts
      const accountsData = await getAccounts(userId);
      setAccounts(accountsData);
    } catch (err) {
      console.error("Error fetching dashboard accounts:", err);
    }
  }

  useEffect(() => {
    fetchBalances();
  }, [userId]);

  function handleTransferSuccess() {
    fetchBalances();
    // Refresh the router to update server-rendered dashboard components (like SurviveIndicator or graphs)
    router.refresh();
  }

  // Compute total aggregated balance
  const customAccounts = accounts.filter(acc => !acc.is_special);
  const specialAccounts = accounts.filter(acc => acc.is_special);
  const accountsTotal = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const grandTotal = walletBalance + accountsTotal;

  // Icons based on account names
  function getAccountIcon(name, isSpecial) {
    if (isSpecial) {
      if (name.toLowerCase() === "gold") return <Coins className="size-5 text-amber-500" />;
      if (name.toLowerCase() === "silver") return <Coins className="size-5 text-slate-400" />;
      return <CreditCard className="size-5 text-purple-500" />; // Fampay
    }
    return <Landmark className="size-5 text-teal-600" />;
  }

  return (
    <div className="space-y-4">
      {/* Overview Header Section */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Total Net Worth / Combined Balance Card */}
        <div className="rounded-[20px] border border-[#0D9488]/18 bg-gradient-to-br from-[#134E4A] to-[#0D9488] p-5 text-white shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Aggregated Balance</span>
            <p className="text-3xl font-extrabold tracking-tight tabular-nums mt-1">
              {formatCurrency(grandTotal)}
            </p>
          </div>
          <p className="text-[11px] opacity-75 mt-3">Combined holdings across wallet, bank, and specialized accounts</p>
        </div>

        {/* Primary Wallet Card with Quick Action Buttons */}
        <div className="rounded-[20px] border border-[#0D9488]/18 bg-white/55 p-5 backdrop-blur-md flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] flex items-center gap-1">
                <Wallet className="size-3" /> Primary Wallet
              </span>
              <p className="text-2xl font-bold tabular-nums text-[#134E4A] mt-1">
                {formatCurrency(walletBalance)}
              </p>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#134E4A]/5 text-[#134E4A] hover:bg-[#134E4A]/10 transition-colors"
              title={isCollapsed ? "Show all balances" : "Hide balances details"}
            >
              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 pt-2 border-t border-[#0D9488]/10">
            <Link
              href="/dashboard/transactions"
              className="flex-1 text-center rounded-full bg-[#0D9488]/10 text-[#0D9488] hover:bg-[#0D9488]/15 px-3 py-2 text-xs font-bold transition-all"
            >
              Add transaction
            </Link>
            <button
              onClick={() => setIsTransferOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-[#0D9488] text-white hover:bg-[#0D9488]/90 px-3 py-2 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <ArrowRightLeft className="size-3" /> Transfer Funds
            </button>
          </div>
        </div>
      </div>

      {/* Individual Account Balances Details */}
      {!isCollapsed && (
        <div className="rounded-[20px] border border-[#0D9488]/18 bg-white/30 p-4 backdrop-blur-md space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#6B7280]">Account Balances ({accounts.length + 1})</h3>
            <Link 
              href="/dashboard/settings" 
              className="text-xs font-bold text-[#0D9488] hover:underline"
            >
              Manage accounts
            </Link>
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {/* Primary Wallet */}
            <div className="rounded-xl border border-[#0D9488]/10 bg-white/70 p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0D9488]/10 text-[#0D9488]">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-[#134E4A]">Primary Wallet</p>
                  <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded font-bold uppercase">Main</span>
                </div>
              </div>
              <p className="font-bold text-sm text-[#134E4A] tabular-nums">{formatCurrency(walletBalance)}</p>
            </div>

            {/* Custom Accounts */}
            {customAccounts.map(acc => (
              <div key={acc.id} className="rounded-xl border border-[#0D9488]/10 bg-white/70 p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
                    {getAccountIcon(acc.name, false)}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-neutral-800 truncate max-w-[120px]">{acc.name}</p>
                    <span className="text-[10px] text-[#6B7280] bg-neutral-100 px-1.5 py-0.5 rounded font-medium">Bank</span>
                  </div>
                </div>
                <p className="font-bold text-sm text-neutral-800 tabular-nums">{formatCurrency(acc.balance)}</p>
              </div>
            ))}

            {/* Specialized Accounts */}
            {specialAccounts.map(acc => (
              <div key={acc.id} className="rounded-xl border border-[#0D9488]/10 bg-white/50 p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-50">
                    {getAccountIcon(acc.name, true)}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-neutral-800">{acc.name}</p>
                    <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-bold uppercase">Special</span>
                  </div>
                </div>
                <p className="font-bold text-sm text-neutral-800 tabular-nums">{formatCurrency(acc.balance)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer Modal overlay */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onSuccess={handleTransferSuccess}
      />
    </div>
  );
}
