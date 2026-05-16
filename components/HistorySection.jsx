"use client";

import { useState, useEffect } from "react";
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { formatCurrency, cn } from "@/lib/utils";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";

export default function HistorySection() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("all");

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      try {
        const res = await fetch("/api/transactions?limit=100");
        const json = await res.json();
        if (json.data) setTransactions(json.data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  const filtered = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || t.category === category;
    const matchesType = type === "all" || t.type === type;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Group by date
  const grouped = filtered.reduce((acc, t) => {
    const dateKey = format(new Date(t.date), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(t);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  function getDateLabel(dateStr) {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, dd MMM");
  }

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <section className="rounded-[24px] border border-[#0D9488]/20 bg-white/40 p-4 backdrop-blur-xl shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" size={18} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-[#0D9488]/10 focus:ring-2 focus:ring-[#0D9488] outline-none text-sm"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="flex-1 bg-white px-3 py-2 rounded-xl border border-[#0D9488]/10 text-xs font-bold text-[#134E4A] outline-none"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-2 bg-white px-3 py-2 rounded-xl border border-[#0D9488]/10 text-xs font-bold text-[#134E4A] outline-none"
          >
            <option value="All">All Categories</option>
            {Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])).sort().map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </section>

      {/* List */}
      <div className="space-y-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 w-full animate-pulse bg-white/20 rounded-2xl" />
            ))}
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <p className="text-sm font-medium text-[#6B7280]">No transactions found</p>
          </div>
        ) : (
          sortedDates.map(date => (
            <div key={date} className="space-y-3">
              <h3 className="text-[10px] uppercase font-black text-[#6B7280] tracking-widest px-2">
                {getDateLabel(date)}
              </h3>
              <div className="space-y-2">
                {grouped[date].map(t => (
                  <div 
                    key={t.id} 
                    className="group flex items-center justify-between p-4 bg-white/60 hover:bg-white/80 rounded-[20px] border border-[#0D9488]/10 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        t.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                      )}>
                        {t.type === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#134E4A]">{t.description}</p>
                        <p className="text-[10px] uppercase font-bold text-[#6B7280]">{t.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-black tabular-nums",
                        t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount).replace('₹', '')}
                      </p>
                      <p className="text-[10px] text-[#6B7280]">{format(new Date(t.date), "hh:mm a")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
