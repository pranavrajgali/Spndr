"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Fetch history on load
  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    const supabase = createClient();
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(50);
    
    if (data) setMessages(data);
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setLoading(true);

    // Optimistic UI update
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();

      if (data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        
        // NOTE: We no longer do window.location.reload()
        // The user can see the confirmation and the dashboard will reflect it next time they visit.
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function clearChat() {
    if (!confirm("Clear your chat history?")) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
  }

  return (
    <section className="flex flex-col h-[500px] rounded-[24px] border border-[#0D9488]/20 bg-white/40 overflow-hidden backdrop-blur-xl shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#0D9488]/10 bg-[#0D9488]/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#0D9488] text-white">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#134E4A]">Finance Coach</h3>
            <p className="text-[10px] text-[#0D9488] font-bold uppercase tracking-wider">Online</p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 text-[#6B7280] hover:text-rose-500 transition-colors"
          title="Clear History"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Messages area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-50">
            <Bot size={40} className="text-[#0D9488]" />
            <p className="text-sm font-medium text-[#134E4A]">Ask me anything!</p>
            <p className="text-xs text-[#6B7280]">"How much did I spend on food this week?"</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-white",
              msg.role === "user" ? "bg-[#134E4A]" : "bg-[#0D9488]"
            )}>
              {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={cn(
              "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap",
              msg.role === "user" 
                ? "bg-[#134E4A] text-white rounded-tr-none" 
                : "bg-white text-[#374151] rounded-tl-none border border-[#0D9488]/10"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="h-8 w-8 rounded-full bg-[#0D9488]/10 flex items-center justify-center text-[#0D9488]">
              <Loader2 size={14} className="animate-spin" />
            </div>
            <div className="bg-white/50 border border-[#0D9488]/10 px-4 py-2.5 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488]/40 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488]/40 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488]/40 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="p-4 bg-white/60 border-t border-[#0D9488]/10">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your coach..."
            className="w-full bg-white rounded-full pl-6 pr-14 py-3 text-sm border border-[#0D9488]/20 focus:ring-2 focus:ring-[#0D9488] outline-none shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2 rounded-full bg-[#0D9488] text-white disabled:opacity-50 hover:bg-[#0D9488]/90 transition-colors shadow-md"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </section>
  );
}
