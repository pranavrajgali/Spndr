import AIInsights from "@/components/AIInsights";
import SpendingDonut from "@/components/SpendingDonut";
import IncomeExpenseBar from "@/components/IncomeExpenseBar";
import DailySpendLine from "@/components/DailySpendLine";
import SurviveIndicator from "@/components/SurviveIndicator";
import SavingsTrend from "@/components/SavingsTrend";
import DashboardAccounts from "@/components/DashboardAccounts";
import { createClient, getUser } from "@/lib/supabase-server";

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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#134E4A]">Dashboard</h1>
          <p className="text-sm text-[#6B7280]">Overview of spending and balance</p>
        </div>
      </div>
      
      <DashboardAccounts 
        userId={user.id} 
        initialWalletBalance={Number(wallet?.balance) || 0} 
      />

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

