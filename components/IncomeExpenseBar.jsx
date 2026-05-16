"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency, cn } from "@/lib/utils";

export default function IncomeExpenseBar() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/summary");
        const json = await res.json();
        
        setData([
          { name: "Income", amount: json.month_income || 0, color: "#10B981" },
          { name: "Expense", amount: json.month_expense || 0, color: "#F43F5E" }
        ]);
      } catch (err) {
        console.error("Failed to fetch bar data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-[350px] w-full animate-pulse rounded-[24px] bg-white/20 border border-[#0D9488]/10" />
    );
  }

  const isSaving = data[0]?.amount > data[1]?.amount;

  return (
    <section className="h-[350px] rounded-[24px] border border-[#0D9488]/20 bg-white/40 p-6 backdrop-blur-xl shadow-sm flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#134E4A]">Cash Flow</h3>
          <p className="text-xs text-[#6B7280]">Income vs. Expenses</p>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          isSaving ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
        )}>
          {isSaving ? "Net Savings" : "Overspending"}
        </div>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 10 }}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(13, 148, 136, 0.05)' }}
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={50}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
