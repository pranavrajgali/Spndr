import { formatCurrency, getDaysUntilNextTransfer } from "@/lib/utils";

export default function SurviveIndicator({ balance, frequency, targetDay }) {
  const daysLeft = getDaysUntilNextTransfer(frequency, targetDay);
  const dailyAllowance = balance > 0 ? balance / daysLeft : 0;

  const isLow = dailyAllowance < 300; // Warning threshold for students

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-[#0D9488]/20 bg-white/40 p-6 backdrop-blur-xl shadow-sm">
      {/* Subtle Background Glow */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#0D9488]/5 blur-3xl" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-[#6B7280]">Daily Allowance</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-[#134E4A] tabular-nums">
              {formatCurrency(dailyAllowance)}
            </span>
            <span className="text-sm font-medium text-[#6B7280]">/ day</span>
          </div>
          <p className="text-xs text-[#0D9488] font-semibold uppercase tracking-wider">
            To survive {frequency === 'weekly' ? 'until Monday' : 'the month'}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/60 rounded-2xl p-4 border border-white/50 shadow-inner">
          <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-[#0D9488]/10 text-[#0D9488]">
            <span className="text-xl font-bold leading-none">{daysLeft}</span>
            <span className="text-[10px] uppercase font-bold">Days</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#134E4A]">Left until transfer</p>
            <p className="text-xs text-[#6B7280]">
              Next transfer: {frequency === 'weekly' ? 'Every Monday' : `Day ${targetDay} of month`}
            </p>
          </div>
        </div>
      </div>

      {isLow && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700 border border-orange-100">
          <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
          Budget is tight! Try to keep daily expenses under {formatCurrency(dailyAllowance)}.
        </div>
      )}
    </section>
  );
}
