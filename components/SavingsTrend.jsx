"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function SavingsTrend() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/summary");
        const json = await res.json();
        if (json.balance_trend) {
          const formatted = json.balance_trend.map(item => ({
            ...item,
            displayDate: format(parseISO(item.date), "dd MMM")
          }));
          setData(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch balance trend", err);
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

  const currentBalance = data[data.length - 1]?.balance || 0;
  const initialBalance = data[0]?.balance || 0;
  const diff = currentBalance - initialBalance;
  const isUp = diff >= 0;

  return (
    <section className="h-[380px] rounded-[24px] border border-[#0D9488]/20 bg-white/40 p-6 backdrop-blur-xl shadow-sm flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#134E4A]">Wallet Growth</h3>
          <p className="text-xs text-[#6B7280]">Last 30 days balance</p>
        </div>
        <div className="text-right">
          <div className={cn(
            "flex items-center justify-end gap-1 font-black",
            isUp ? "text-emerald-600" : "text-rose-600"
          )}>
            {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="text-lg tabular-nums">
              {isUp ? "+" : ""}{formatCurrency(diff).replace('₹', '')}
            </span>
          </div>
          <p className="text-[10px] font-bold uppercase text-[#6B7280]">
            Net change this month
          </p>
        </div>
      </div>

      <div className="flex-1 -ml-6 -mr-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#134E4A" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#134E4A" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
            <XAxis 
              dataKey="displayDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 10 }}
              interval={6} // Show every week
              dy={10}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
              cursor={{ stroke: '#134E4A', strokeWidth: 1, strokeDasharray: '4 4' }}
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Area 
              type="stepAfter" 
              dataKey="balance" 
              stroke="#134E4A" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorBalance)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 pt-4 border-t border-[#0D9488]/10 flex justify-between items-center text-[10px] font-bold text-[#6B7280] uppercase tracking-tighter">
        <span>30 Days Ago: {formatCurrency(initialBalance)}</span>
        <span>Current: {formatCurrency(currentBalance)}</span>
      </div>
    </section>
  );
}
