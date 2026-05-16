"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";

export default function TransactionList({ reloadKey = 0 }) {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const load = useCallback(
    async (nextPage, append) => {
      const isFirst = !append;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `/api/transactions?page=${nextPage}&limit=20`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to load transactions");
          return;
        }

        const data = json.data ?? [];
        setRows((prev) => (append ? [...prev, ...data] : data));
        setHasMore(Boolean(json.meta?.hasMore));
        setPage(nextPage);
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    load(1, false);
  }, [load, reloadKey]);

  async function remove(id) {
    setRemovingId(id);
    setError("");
    try {
      const res = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not remove");
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <section className="rounded-[20px] border border-[#0D9488]/18 bg-white/55 p-6 backdrop-blur-md">
        <p className="text-sm text-[#6B7280]">Loading…</p>
      </section>
    );
  }

  return (
    <section className="rounded-[20px] border border-[#0D9488]/18 bg-white/55 p-4 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent activity</h2>
      </div>

      {error && <p className="mb-3 text-sm text-[#F43F5E]">{error}</p>}

      {rows.length === 0 ? (
        <p className="text-sm text-[#6B7280]">No transactions yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((t) => {
            const isExpense = Number(t.amount) < 0;
            return (
              <li
                key={t.id}
                className="flex gap-3 border-b border-[#0D9488]/10 pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{t.description}</p>
                  <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-[#6B7280]">
                    <span>{t.category}</span>
                    <span>·</span>
                    <span>{formatDate(t.date)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold tabular-nums ${
                      isExpense ? "text-[#F43F5E]" : "text-[#0D9488]"
                    }`}
                  >
                    {isExpense ? "−" : "+"}
                    {formatCurrency(Math.abs(Number(t.amount)))}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="mt-1 text-[#F43F5E] hover:bg-[#F43F5E]/10"
                    disabled={removingId === t.id}
                    onClick={() => remove(t.id)}
                  >
                    {removingId === t.id ? "…" : "Remove"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && rows.length > 0 && (
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="outline"
            disabled={loadingMore}
            className="rounded-full"
            onClick={() => load(page + 1, true)}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </section>
  );
}
