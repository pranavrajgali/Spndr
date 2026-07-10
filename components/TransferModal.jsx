"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getAccounts, transferFunds } from "@/lib/linked-accounts";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, ArrowRightLeft, AlertCircle } from "lucide-react";

export default function TransferModal({ isOpen, onClose, onSuccess }) {
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [destinationId, setDestinationId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      setError("");
      setSuccess(false);
      setAmount("");
      setDestinationId("");
      
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        setUser(authUser);

        // Fetch wallet balance
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", authUser.id)
          .maybeSingle();

        if (wallet) {
          setWalletBalance(Number(wallet.balance) || 0);
        }

        // Fetch other accounts
        const accountsData = await getAccounts(authUser.id);
        setAccounts(accountsData);
        if (accountsData.length > 0) {
          setDestinationId(accountsData[0].id);
        }
      } catch (err) {
        console.error("Error loading transfer options:", err);
        setError("Failed to load account balances.");
      }
    }
    loadData();
  }, [isOpen]);

  async function handleTransfer(e) {
    e.preventDefault();
    if (!user || !destinationId) return;

    const val = Number(amount);
    if (isNaN(val) || val <= 0) {
      setError("Please enter a valid transfer amount.");
      return;
    }

    if (val > walletBalance) {
      setError("Insufficient balance in your primary wallet.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await transferFunds(user.id, destinationId, val);
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.message || "Transfer failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const activeDest = accounts.find(acc => acc.id === destinationId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div 
        className="fixed inset-0 bg-[#134E4A]/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-[24px] border border-[#0D9488]/20 bg-white p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0D9488]/10 text-[#0D9488]">
            <ArrowRightLeft size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#134E4A]">Transfer Funds</h2>
            <p className="text-xs text-[#6B7280]">Move money securely to your linked accounts</p>
          </div>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-800">Transfer Successful!</h3>
            <p className="text-sm text-[#6B7280]">Your balances have been updated.</p>
          </div>
        ) : (
          <form onSubmit={handleTransfer} className="space-y-4">
            
            {/* Source Account (View Only) */}
            <div className="rounded-xl border border-[#0D9488]/10 bg-[#0D9488]/5 p-3.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488]">From (Source)</span>
              <div className="flex justify-between items-center mt-1">
                <p className="font-bold text-[#134E4A]">Primary Wallet</p>
                <p className="text-sm font-bold text-[#134E4A] tabular-nums">
                  {formatCurrency(walletBalance)}
                </p>
              </div>
            </div>

            {/* Destination Account Selection */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">To (Destination Account)</span>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full rounded-xl border border-[#0D9488]/20 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#0D9488] outline-none"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.is_special ? "Specialized" : "Bank"} — Bal: {formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            {/* Transfer Amount Input */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Transfer Amount (INR)</span>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm font-bold text-[#6B7280]">₹</span>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-[#0D9488]/20 bg-white pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#0D9488] outline-none font-bold text-neutral-800 placeholder-neutral-400"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex gap-2 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Submit Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-full border border-[#0D9488]/30 text-[#0D9488] hover:bg-[#0D9488]/5 py-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !destinationId || !amount}
                className="flex-1 rounded-full bg-[#0D9488] hover:bg-[#0D9488]/90 text-white py-5 font-bold"
              >
                {loading ? "Processing..." : "Confirm Transfer"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
