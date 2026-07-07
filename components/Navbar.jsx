"use client";

import Link from "next/link";
import { LogOut, User, Trash2, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleDeleteAccount() {
    if (!confirm("WARNING: This will permanently delete your profile and all transaction history. This cannot be undone. Are you sure?")) return;
    
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        alert("Account deleted successfully.");
        handleLogout();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete account");
      }
    } catch (err) {
      alert("Error deleting account");
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#0D9488]/15 bg-white/70 px-4 py-3 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/dashboard" className="flex items-center">
          <span className="text-2xl font-extrabold tracking-tight text-[#0D9488] transition-transform active:scale-95">
            spndr<span className="text-[#0D9488]">.</span>
          </span>
        </Link>
        
        <nav className="hidden gap-6 text-xs font-black uppercase tracking-widest text-[#6B7280] md:flex">
          <Link href="/dashboard" className="hover:text-[#0D9488] transition-colors">Home</Link>
          <Link href="/dashboard/history" className="hover:text-[#0D9488] transition-colors">History</Link>
          <Link href="/dashboard/transactions" className="hover:text-[#0D9488] transition-colors">Add Transaction</Link>
          <Link href="/dashboard/budgets" className="hover:text-[#0D9488] transition-colors">Budgets</Link>
          <Link href="/dashboard/chat" className="hover:text-[#0D9488] transition-colors">AI Assistant</Link>
        </nav>

        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#134E4A]/5 text-[#134E4A] hover:bg-[#134E4A]/10 transition-colors"
          >
            <User size={20} />
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl border border-[#0D9488]/20 bg-white p-2 shadow-2xl backdrop-blur-xl z-20 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 mb-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Account Settings</p>
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#374151] hover:bg-[#0D9488]/5 hover:text-[#0D9488] transition-all"
                >
                  <LogOut size={18} />
                  Sign Out / Switch User
                </button>

                <div className="my-1 h-px bg-[#0D9488]/10" />

                <button 
                  onClick={handleDeleteAccount}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all"
                >
                  <Trash2 size={18} />
                  Delete My Data
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
