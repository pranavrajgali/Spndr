import BudgetCard from "@/components/BudgetCard";
import BudgetProgress from "@/components/BudgetProgress";

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Budgets</h1>
      <BudgetProgress />
      <BudgetCard />
    </div>
  );
}
