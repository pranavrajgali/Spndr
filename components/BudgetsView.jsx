"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

export default function BudgetsView() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: EXPENSE_CATEGORIES[0],
    limit_amount: "",
    alert_at_percent: 80
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  async function fetchBudgets() {
    setLoading(true);
    try {
      const res = await fetch("/api/budgets");
      const json = await res.json();
      if (json.data) setBudgets(json.data);
    } catch (err) {
      console.error("Failed to fetch budgets", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newBudget,
          limit_amount: parseFloat(newBudget.limit_amount),
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        }),
      });
      if (res.ok) {
        setShowForm(false);
        fetchBudgets();
      }
    } catch (err) {
      console.error("Failed to add budget", err);
    }
  }

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.limit_amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent_amount), 0);
  const totalPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="space-y-8 pb-20">
      {/* Summary Header */}
      <section className="rounded-[24px] bg-[#134E4A] p-6 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#2DD4BF]">Total Monthly Budget</p>
              <h2 className="text-3xl font-black tabular-nums">{formatCurrency(totalBudget)}</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-white/60">Spent so far</p>
              <p className="text-lg font-bold text-white/90">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
              <span>Overall Progress</span>
              <span>{totalPercent}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-500",
                  totalPercent > 90 ? "bg-rose-400" : totalPercent > 70 ? "bg-amber-400" : "bg-[#2DD4BF]"
                )}
                style={{ width: `${Math.min(totalPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#134E4A] uppercase tracking-wider">My Guardrails</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D9488] text-white rounded-full text-xs font-bold shadow-md hover:bg-[#0D9488]/90 transition-all"
        >
          {showForm ? "Cancel" : <><Plus size={16} /> New Budget</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="p-6 rounded-[24px] border border-[#0D9488]/20 bg-white/60 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-[#6B7280] ml-1">Category</label>
              <select 
                value={newBudget.category}
                onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                className="w-full bg-white px-3 py-2.5 rounded-xl border border-[#0D9488]/10 text-sm outline-none"
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-[#6B7280] ml-1">Limit (₹)</label>
              <input 
                type="number"
                required
                value={newBudget.limit_amount}
                onChange={(e) => setNewBudget({...newBudget, limit_amount: e.target.value})}
                placeholder="2000"
                className="w-full bg-white px-3 py-2.5 rounded-xl border border-[#0D9488]/10 text-sm outline-none"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-[#134E4A] text-white rounded-xl text-sm font-bold shadow-md">
            Create Budget Target
          </button>
        </form>
      )}

      {/* Grid */}
      <div className="grid gap-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-32 bg-white/20 rounded-[24px] animate-pulse border border-[#0D9488]/10" />)
        ) : budgets.length === 0 ? (
          <div className="text-center py-20 bg-white/40 rounded-[24px] border border-dashed border-[#0D9488]/20">
            <AlertCircle className="mx-auto text-[#0D9488]/40 mb-2" size={32} />
            <p className="text-sm font-medium text-[#6B7280]">No budgets set yet.</p>
            <p className="text-xs text-[#9CA3AF]">Set one for "Food" or "Shopping" to start tracking!</p>
          </div>
        ) : (
          budgets.map(b => (
            <div key={b.id} className="group relative rounded-[24px] border border-[#0D9488]/10 bg-white/60 p-5 backdrop-blur-xl transition-all hover:bg-white/80 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-[#134E4A]">{b.category}</h4>
                  <p className="text-[10px] text-[#6B7280] font-medium tracking-tight">
                    {formatCurrency(Number(b.spent_amount))} of {formatCurrency(Number(b.limit_amount))}
                  </p>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  b.is_over ? "bg-rose-100 text-rose-600" : b.is_warning ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                )}>
                  {b.is_over ? "Over Limit" : b.is_warning ? "Warning" : "Safe"}
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-3 w-full bg-[#0D9488]/5 rounded-full overflow-hidden border border-[#0D9488]/5">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000 ease-out",
                      b.is_over ? "bg-rose-500" : b.is_warning ? "bg-amber-500" : "bg-[#0D9488]"
                    )}
                    style={{ width: `${Math.min(b.percent_used, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[#6B7280]">{b.percent_used}% Used</span>
                  <span className="text-[10px] font-bold text-[#6B7280]">
                    {b.is_over ? `₹${Math.abs(Number(b.limit_amount) - Number(b.spent_amount))} over` : `₹${Number(b.limit_amount) - Number(b.spent_amount)} left`}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
