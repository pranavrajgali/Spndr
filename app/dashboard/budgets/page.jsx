import BudgetsView from "@/components/BudgetsView";

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-[#134E4A]">Budget Targets</h1>
        <p className="text-sm text-[#6B7280]">Stay disciplined and track your limits</p>
      </div>
      <BudgetsView />
    </div>
  );
}
