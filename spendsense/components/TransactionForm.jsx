"use client";

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

export default function TransactionForm({ onSaved }) {
  const today = () => new Date().toISOString().slice(0, 10);

  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(today);
  const [catLoading, setCatLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const suggestCategory = useCallback(async () => {
    if (!description.trim()) return;

    setCatLoading(true);
    setHint("");
    setError("");
    try {
      const res = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          type,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setHint(json.error || "Could not categorize — pick a category.");
        return;
      }
      const next = json.category ?? json.data?.[0]?.category;
      if (next) setCategory(next);
    } finally {
      setCatLoading(false);
    }
  }, [description, type]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          description: description.trim(),
          amount: Number(amount),
          category: category || "Other",
          date,
          source: "manual",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg =
          typeof json.details === "object"
            ? JSON.stringify(json.details)
            : json.error || "Could not save";
        setError(msg);
        return;
      }

      setDescription("");
      setAmount("");
      setCategory("");
      setDate(today());
      setHint("Saved.");

      if (typeof onSaved === "function") onSaved();
      setTimeout(() => setHint(""), 2500);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-[20px] border border-[#0D9488]/18 bg-white/55 p-5 backdrop-blur-md">
      <h2 className="mb-4 text-lg font-semibold">Add transaction</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setType("expense");
              setCategory("");
            }}
            className={cn(
              "flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition",
              type === "expense"
                ? "border-[#F43F5E] bg-[#F43F5E]/10 text-[#F43F5E]"
                : "border-transparent bg-white/60 text-[#6B7280]"
            )}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setType("income");
              setCategory("");
            }}
            className={cn(
              "flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition",
              type === "income"
                ? "border-[#0D9488] bg-[#0D9488]/10 text-[#0D9488]"
                : "border-transparent bg-white/60 text-[#6B7280]"
            )}
          >
            Income
          </button>
        </div>

        <label className="block space-y-1 text-sm">
          Description
          <input
            required
            value={description}
            onChange={(ev) => setDescription(ev.target.value)}
            onBlur={suggestCategory}
            placeholder="e.g. Swiggy lunch"
            className="w-full rounded-xl border border-[#0D9488]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#0D9488]/40"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            Amount (INR)
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={amount}
              onChange={(ev) => setAmount(ev.target.value)}
              className="w-full rounded-xl border border-[#0D9488]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#0D9488]/40"
            />
          </label>

          <label className="block space-y-1 text-sm">
            Date
            <input
              type="date"
              required
              value={date}
              onChange={(ev) => setDate(ev.target.value)}
              className="w-full rounded-xl border border-[#0D9488]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#0D9488]/40"
            />
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          Category
          <div className="flex gap-2">
            <select
              required
              value={category}
              onChange={(ev) => setCategory(ev.target.value)}
              className="flex-1 rounded-xl border border-[#0D9488]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#0D9488]/40"
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 rounded-full px-4"
              disabled={catLoading || !description.trim()}
              onClick={suggestCategory}
            >
              {catLoading ? "…" : "AI"}
            </Button>
          </div>
          <span className="text-xs text-[#6B7280]">
            Blur the description field or tap AI for a suggestion.
          </span>
        </label>

        {hint && <p className="text-sm text-[#0D9488]">{hint}</p>}
        {error && <p className="text-sm text-[#F43F5E]">{error}</p>}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[#0D9488] hover:bg-[#0f766e]"
        >
          {submitting ? "Saving…" : "Save transaction"}
        </Button>
      </form>
    </section>
  );
}
