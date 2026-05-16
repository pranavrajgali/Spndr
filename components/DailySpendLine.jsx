"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

export default function DailySpendLine() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/summary");
        const json = await res.json();
        if (json.daily_trend) {
          // Format dates for display (e.g., "Mon", "Tue")
          const formatted = json.daily_trend.map(item => ({
            ...item,
            displayDate: format(parseISO(item.date), "EEE")
          }));
          setData(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch trend data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-[300px] w-full animate-pulse rounded-[24px] bg-white/20 border border-[#0D9488]/10" />
    );
  }

  const todaySpend = data[data.length - 1]?.amount || 0;
  const yesterdaySpend = data[data.length - 2]?.amount || 0;
  const isUp = todaySpend > yesterdaySpend;

  return (
    <section className="h-[350px] rounded-[24px] border border-[#0D9488]/20 bg-white/40 p-6 backdrop-blur-xl shadow-sm flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#134E4A]">Spending Trend</h3>
          <p className="text-xs text-[#6B7280]">Last 7 days</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-[#134E4A] tabular-nums">
            {formatCurrency(todaySpend)}
          </p>
          <p className={cn(
            "text-[10px] font-bold uppercase",
            isUp ? "text-rose-500" : "text-emerald-500"
          )}>
            {isUp ? "↑ Higher than yesterday" : "↓ Lower than yesterday"}
          </p>
        </div>
      </div>

      <div className="flex-1 -ml-4 -mr-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="displayDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis hide />
            <Tooltip 
              cursor={{ stroke: '#0D9488', strokeWidth: 2 }}
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="#0D9488" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorSpend)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
