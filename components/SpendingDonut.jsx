"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

const COLORS = [
  "#0D9488", // Teal 600
  "#06B6D4", // Cyan 500
  "#3B82F6", // Blue 500
  "#8B5CF6", // Violet 500
  "#EC4899", // Pink 500
  "#F43F5E", // Rose 500
  "#F59E0B", // Amber 500
  "#10B981", // Emerald 500
];

export default function SpendingDonut() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/summary");
        const json = await res.json();
        
        if (json.spending_by_category) {
          const chartData = Object.entries(json.spending_by_category).map(([name, value]) => ({
            name,
            value: Number(value)
          })).sort((a, b) => b.value - a.value);
          
          setData(chartData);
          setTotal(json.month_expense || 0);
        }
      } catch (err) {
        console.error("Failed to fetch donut data", err);
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

  if (data.length === 0) {
    return (
      <section className="h-[350px] flex flex-col items-center justify-center rounded-[24px] border border-[#0D9488]/20 bg-white/40 p-6 backdrop-blur-xl shadow-sm">
        <div className="text-4xl mb-2">🍩</div>
        <p className="text-sm font-medium text-[#134E4A]">No spending data yet</p>
        <p className="text-xs text-[#6B7280]">Add your first transaction to see the breakdown.</p>
      </section>
    );
  }

  return (
    <section className="h-[350px] rounded-[24px] border border-[#0D9488]/20 bg-white/40 p-6 backdrop-blur-xl shadow-sm flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#134E4A]">Spending Breakdown</h3>
        <p className="text-xs text-[#6B7280]">Current Month</p>
      </div>

      <div className="relative flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="40%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend 
              layout="vertical" 
              align="right" 
              verticalAlign="middle"
              iconType="circle"
              formatter={(value) => <span className="text-xs font-medium text-[#4B5563]">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text (Shifted to match cx="40%") */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ transform: 'translateX(-10%)' }}>
          <span className="text-[10px] uppercase font-bold text-[#6B7280] leading-none">Total</span>
          <span className="text-lg font-black text-[#134E4A] leading-tight">
            {formatCurrency(total).replace('₹', '')}
          </span>
        </div>
      </div>
    </section>
  );
}
