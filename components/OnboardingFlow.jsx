"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { addAccount } from "@/lib/linked-accounts";

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [balance, setBalance] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [transferDay, setTransferDay] = useState("");
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleNextStep(e) {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }
    setError("");
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Please log in first.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("user_profile").insert({
      user_id: user.id,
      display_name: displayName,
      transfer_frequency: frequency,
      expected_transfer_day: frequency !== "flexible" && transferDay ? Number(transferDay) : null,
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    const { error: walletError } = await supabase.from("wallets").insert({
      user_id: user.id,
      balance: Number(balance) || 0,
    });

    if (walletError) {
      setError(walletError.message);
      setLoading(false);
      return;
    }

    // Save linked bank accounts if any
    for (const acc of linkedAccounts) {
      if (acc.name.trim()) {
        try {
          await addAccount(user.id, acc.name.trim(), Number(acc.balance) || 0);
        } catch (e) {
          console.error("Failed to add account during onboarding", e);
        }
      }
    }

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  if (step === 2) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Link additional accounts</h1>
          <p className="text-sm text-[#6B7280]">
            You can link and track up to three additional bank accounts (optional).
          </p>
        </div>

        <div className="space-y-4">
          {linkedAccounts.map((acc, index) => (
            <div key={index} className="flex gap-2 items-end border border-[#0D9488]/15 rounded-xl p-3 bg-[#0D9488]/5 relative">
              <div className="flex-1 space-y-1">
                <span className="text-xs font-bold text-[#0D9488]">Account #{index + 1} Name</span>
                <input
                  required
                  placeholder="e.g. HDFC Bank, SBI"
                  value={acc.name}
                  onChange={(e) => {
                    const next = [...linkedAccounts];
                    next[index].name = e.target.value;
                    setLinkedAccounts(next);
                  }}
                  className="w-full rounded-xl border border-[#0D9488]/20 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div className="w-28 space-y-1">
                <span className="text-xs font-bold text-[#0D9488]">Initial Balance</span>
                <input
                  type="number"
                  placeholder="0"
                  value={acc.balance}
                  onChange={(e) => {
                    const next = [...linkedAccounts];
                    next[index].balance = e.target.value;
                    setLinkedAccounts(next);
                  }}
                  className="w-full rounded-xl border border-[#0D9488]/20 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setLinkedAccounts(linkedAccounts.filter((_, i) => i !== index));
                }}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold p-2"
              >
                Remove
              </button>
            </div>
          ))}

          {linkedAccounts.length < 3 && (
            <button
              type="button"
              onClick={() => {
                setLinkedAccounts([...linkedAccounts, { name: "", balance: "" }]);
              }}
              className="w-full border border-dashed border-[#0D9488]/30 rounded-xl py-3 text-sm text-[#0D9488] font-bold hover:bg-[#0D9488]/5 transition-colors"
            >
              + Link a bank account
            </button>
          )}
        </div>

        {error && <p className="text-sm text-[#F43F5E]">{error}</p>}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => setStep(1)}
            className="flex-1 rounded-full border border-[#0D9488]/35 text-[#0D9488] hover:bg-[#0D9488]/5 py-6"
          >
            Back
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="flex-[2] rounded-full bg-[#0D9488] hover:bg-[#0D9488]/90 py-6"
          >
            {loading ? "Completing setup…" : "Complete setup"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleNextStep} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Set up your wallet</h1>
        <p className="text-sm text-[#6B7280]">
          Tell us your name and current balance to get started.
        </p>
      </div>
      
      <div className="space-y-4">
        <label className="block space-y-1 text-sm">
          Display name
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-[#0D9488]/20 px-3 py-2 focus:ring-2 focus:ring-[#0D9488] outline-none"
            placeholder="e.g. Pranav"
          />
        </label>

        <label className="block space-y-1 text-sm">
          Current balance (INR)
          <input
            type="number"
            required
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full rounded-xl border border-[#0D9488]/20 px-3 py-2 focus:ring-2 focus:ring-[#0D9488] outline-none"
            placeholder="0"
          />
        </label>

        <label className="block space-y-1 text-sm">
          How often do you get money?
          <select
            value={frequency}
            onChange={(e) => {
              setFrequency(e.target.value);
              setTransferDay("");
            }}
            className="w-full rounded-xl border border-[#0D9488]/20 px-3 py-2 focus:ring-2 focus:ring-[#0D9488] outline-none bg-white"
          >
            <option value="monthly">Every Month (Monthly allowance)</option>
            <option value="weekly">Every Week (Weekly allowance)</option>
            <option value="flexible">Flexible (As and when needed)</option>
          </select>
        </label>

        {frequency === "monthly" && (
          <label className="block space-y-1 text-sm">
            What day of the month? (1–31)
            <input
              type="number"
              min={1}
              max={31}
              required
              value={transferDay}
              onChange={(e) => setTransferDay(e.target.value)}
              className="w-full rounded-xl border border-[#0D9488]/20 px-3 py-2 focus:ring-2 focus:ring-[#0D9488] outline-none"
              placeholder="e.g. 1"
            />
          </label>
        )}

        {frequency === "weekly" && (
          <label className="block space-y-1 text-sm">
            Which day of the week?
            <select
              required
              value={transferDay}
              onChange={(e) => setTransferDay(e.target.value)}
              className="w-full rounded-xl border border-[#0D9488]/20 px-3 py-2 focus:ring-2 focus:ring-[#0D9488] outline-none bg-white"
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

        {frequency === "flexible" && (
          <p className="text-xs text-[#6B7280] italic">
            The dashboard will focus on your daily average spending.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-[#F43F5E]">{error}</p>}
      
      <Button
        type="submit"
        className="w-full rounded-full bg-[#0D9488] hover:bg-[#0D9488]/90 py-6"
      >
        Continue
      </Button>
    </form>
  );
}

