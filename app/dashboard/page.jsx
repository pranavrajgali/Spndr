import AIInsights from "@/components/AIInsights";
import SpendingDonut from "@/components/SpendingDonut";
import IncomeExpenseBar from "@/components/IncomeExpenseBar";
import DailySpendLine from "@/components/DailySpendLine";
import SurviveIndicator from "@/components/SurviveIndicator";
import SavingsTrend from "@/components/SavingsTrend";
import { createClient, getUser } from "@/lib/supabase-server";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getUser();
  const supabase = await createClient();
  
  const [walletRes, profileRes] = await Promise.all([
    supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_profile").select("transfer_frequency, expected_transfer_day").eq("user_id", user.id).maybeSingle(),
  ]);

  const wallet = walletRes.data;
  const profile = profileRes.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-[#6B7280]">Overview of spending and balance</p>
        </div>
        {wallet != null && (
          <div className="rounded-[20px] border border-[#0D9488]/18 bg-white/55 px-5 py-4 text-right backdrop-blur-md">
            <p className="text-xs uppercase tracking-wide text-[#6B7280]">
              Wallet
            </p>
            <p className="text-2xl font-bold tabular-nums text-[#134E4A]">
              {formatCurrency(Number(wallet.balance))}
            </p>
            <Link
              href="/dashboard/transactions"
              className="mt-2 inline-block text-xs font-semibold text-[#0D9488] hover:underline"
            >
              Add transaction
            </Link>
          </div>
        )}
      </div>
      <SurviveIndicator 
        balance={wallet?.balance || 0} 
        frequency={profile?.transfer_frequency || 'monthly'} 
        targetDay={profile?.expected_transfer_day} 
      />
      <div className="grid gap-4 md:grid-cols-2">
        <SpendingDonut />
        <IncomeExpenseBar />
      </div>
      <DailySpendLine />
      <SavingsTrend />
      <AIInsights />
    </div>
  );
}
