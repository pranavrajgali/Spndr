"use client";

import { useState } from "react";
import { Sparkles, Bot, ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AIInsights() {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");

  async function handleReveal() {
    setRevealed(true);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate: false }),
      });
      const json = await res.json();
      if (json.data) {
        setInsight(json.data);
      } else {
        throw new Error(json.error || "Failed to get insights");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={cn(
      "relative overflow-hidden rounded-[28px] border transition-all duration-500",
      revealed 
        ? "border-[#0D9488]/20 bg-white/40 p-6 backdrop-blur-xl" 
        : "border-[#0D9488]/10 bg-white/20 p-4 hover:bg-white/30 cursor-pointer"
    )}>
      {!revealed ? (
        <div 
          onClick={handleReveal}
          className="flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0D9488] text-white shadow-lg shadow-[#0D9488]/20 group-hover:scale-110 transition-transform">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#134E4A]">Ask Finance Coach</h3>
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">Get personalized spending advice</p>
            </div>
          </div>
          <Sparkles size={18} className="text-[#0D9488] animate-pulse" />
        </div>
      ) : (
        <div className="relative z-10 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-[#0D9488]" />
              <h3 className="text-xs font-bold text-[#134E4A] uppercase tracking-widest">Coach Insights</h3>
            </div>
            <button 
              onClick={() => setRevealed(false)}
              className="text-[10px] font-bold text-[#6B7280] hover:text-[#134E4A]"
            >
              Close
            </button>
          </div>

          <div className="min-h-[60px]">
            {loading ? (
              <div className="space-y-2 py-2">
                <div className="h-3 w-3/4 bg-[#0D9488]/10 rounded-full animate-pulse" />
                <div className="h-3 w-full bg-[#0D9488]/10 rounded-full animate-pulse" />
                <div className="h-3 w-1/2 bg-[#0D9488]/10 rounded-full animate-pulse" />
              </div>
            ) : error ? (
              <p className="text-xs text-rose-500 py-2">{error}</p>
            ) : (
              <div className="prose prose-sm prose-teal text-[#374151] leading-relaxed italic text-xs">
                {insight?.summary_text.split('\n').map((para, i) => (
                  <p key={i} className="mb-2 last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
