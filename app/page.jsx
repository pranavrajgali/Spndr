import Link from "next/link";
import { Sparkles, Shield, Wallet, ArrowRight, Activity, TrendingUp, AlertTriangle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#F0FDFA] text-[#134E4A] overflow-hidden flex flex-col justify-between selection:bg-[#0D9488]/10">
      
      {/* Decorative Grid & Mesh Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#2DD4BF]/15 via-[#F0FDFA] to-[#F0FDFA] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#0D9488 1.5px, transparent 1.5px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#2DD4BF]/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-[#0D9488]/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Navigation header */}
      <header className="relative w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center">
          <span className="text-2xl font-extrabold tracking-tight text-[#0D9488]">
            spndr<span className="text-[#0D9488]">.</span>
          </span>
        </div>
        <Link
          href="/login"
          className="text-xs font-black uppercase tracking-widest text-[#134E4A] hover:text-[#0D9488] transition-all px-4 py-2 rounded-full border border-[#0D9488]/10 bg-white/30 backdrop-blur-md"
        >
          Log in
        </Link>
      </header>

      {/* Main Hero Section */}
      <main className="relative flex-1 w-full max-w-6xl mx-auto px-6 py-12 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center z-10">
        
        {/* Left Column: Core Value Pitch */}
        <div className="lg:col-span-6 space-y-8 text-left max-w-xl animate-in fade-in slide-in-from-left-6 duration-1000">
          
          {/* Badge indicator */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/10 text-xs font-bold text-[#0D9488] tracking-wide">
            <Sparkles size={12} className="animate-pulse" />
            <span>Savage AI Coach V1.1 is now live</span>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight text-[#134E4A]">
              Track money.<br />
              Get roasted.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D9488] to-[#0D9488]/70">
                Actually save.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#134E4A]/80 leading-relaxed font-medium">
              The AI-powered financial command center built specifically for Indian college students. Log expenses in seconds, scan receipts, import UPI statement PDFs, and get brutally roasted by our Savage Coach when you blow ₹500 on Zomato.
            </p>
          </div>

          {/* CTA actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 h-12 rounded-full bg-[#0D9488] px-8 text-sm font-black text-white hover:bg-[#0f766e] transition-all shadow-lg shadow-[#0D9488]/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              Start saving now
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-12 rounded-full border border-[#0D9488]/30 bg-white/40 backdrop-blur-md px-8 text-sm font-bold text-[#134E4A] hover:bg-white/80 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Access Dashboard
            </Link>
          </div>

          {/* Trust points */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#0D9488]/10 text-[#134E4A]/70">
            <div className="flex flex-col gap-1">
              <span className="text-lg font-black text-[#0D9488]">₹0</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">No Bank Login</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-black text-[#0D9488]">100%</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">Private & Safe</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-black text-[#0D9488]">5x</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">Faster Tracking</span>
            </div>
          </div>

        </div>

        {/* Right Column: High-Fidelity App Feature Mocks */}
        <div className="lg:col-span-6 w-full space-y-6 animate-in fade-in slide-in-from-right-6 duration-1000 delay-200">
          
          {/* Card 1: The Survive Indicator (App's signature feature) */}
          <div className="rounded-[24px] border border-[#0D9488]/20 bg-white/70 p-6 backdrop-blur-xl shadow-xl shadow-teal-900/5 relative overflow-hidden transition-all hover:scale-[1.01] hover:border-[#0D9488]/30">
            <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-[#2DD4BF] to-[#0D9488]" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#0D9488]/10 text-[#0D9488]">
                  <Wallet size={16} />
                </div>
                <div>
                  <h3 className="text-xs uppercase font-bold tracking-wider text-[#6B7280]">Daily Allowance</h3>
                  <p className="text-xl font-black text-[#134E4A]">₹240 <span className="text-xs font-bold text-[#6B7280]">/ day</span></p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/10 flex items-center gap-1">
                <AlertTriangle size={10} /> Survival mode
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="h-2 w-full bg-[#134E4A]/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-500 to-amber-500 w-[35%] rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-[#6B7280]">
                <span>12 days left until next transfer</span>
                <span>₹2,880 left</span>
              </div>
            </div>
          </div>

          {/* Card 2: The Savage AI Coach (Conversational roast demo) */}
          <div className="rounded-[24px] border border-[#0D9488]/20 bg-white/70 p-6 backdrop-blur-xl shadow-xl shadow-teal-900/5 space-y-4 transition-all hover:scale-[1.01] hover:border-[#0D9488]/30">
            <div className="flex items-center gap-2 pb-2 border-b border-[#0D9488]/10">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <Activity size={16} />
              </div>
              <div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-[#6B7280]">Savage Coach</h3>
                <p className="text-xs font-black text-rose-600">Active roast mode</p>
              </div>
            </div>
            
            {/* Mock Chat bubbles */}
            <div className="space-y-3.5 text-xs font-medium">
              <div className="flex flex-col gap-1 items-end ml-12">
                <span className="px-3.5 py-2.5 rounded-2xl rounded-tr-none bg-[#134E4A] text-white font-semibold">
                  I spent ₹1,200 on Starbucks coffee today
                </span>
                <span className="text-[9px] font-bold text-[#6B7280]">Just now • UPI log</span>
              </div>
              <div className="flex flex-col gap-1 items-start mr-12 animate-in slide-in-from-left-2 duration-300">
                <span className="px-3.5 py-2.5 rounded-2xl rounded-tl-none bg-rose-500/5 text-rose-900 font-semibold border border-rose-500/10 leading-relaxed shadow-sm">
                  ☕ ₹1,200 for water, sugar, and milk? Did you buy the coffee machine or are you just renting the chair, you absolute clown? Your daily budget is literally ₹240. You just drank 5 days of your survival. Stick to tap water and Nescafé, brother.
                </span>
                <span className="text-[9px] font-extrabold text-rose-500 uppercase tracking-wider">Spndr AI Coach • Savage response</span>
              </div>
            </div>
          </div>

          {/* Card 3: Real-time Stats summary grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[20px] border border-[#0D9488]/10 bg-white/40 p-4 backdrop-blur-xl shadow-md flex items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280]">Daily Limit</span>
                <p className="text-sm font-bold text-[#134E4A]">Food: ₹150 max</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
                !
              </div>
            </div>
            <div className="rounded-[20px] border border-[#0D9488]/10 bg-white/40 p-4 backdrop-blur-xl shadow-md flex items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280]">Wallet Growth</span>
                <p className="text-sm font-bold text-[#134E4A]">+₹4,500 saved</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <TrendingUp size={16} />
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Footer bar */}
      <footer className="relative w-full max-w-6xl mx-auto px-6 py-8 border-t border-[#0D9488]/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-[#134E4A]/60 z-10">
        <p>© 2026 spndr. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-[#0D9488]">Terms</Link>
          <Link href="/signup" className="hover:text-[#0D9488]">Privacy</Link>
          <Link href="https://github.com/pranavrajgali/Spndr" className="hover:text-[#0D9488]">GitHub</Link>
        </div>
      </footer>

    </div>
  );
}
