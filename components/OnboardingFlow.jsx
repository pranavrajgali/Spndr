"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function OnboardingFlow() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [balance, setBalance] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [transferDay, setTransferDay] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    setLoading(false);
    if (walletError) {
      setError(walletError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        disabled={loading}
        className="w-full rounded-full bg-[#0D9488] hover:bg-[#0D9488]/90 py-6"
      >
        {loading ? "Saving…" : "Continue to dashboard"}
      </Button>
    </form>
  );
}
