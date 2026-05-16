import GoldTracker from "@/components/GoldTracker";
import GoldChart from "@/components/GoldChart";

export default function GoldPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gold tracker</h1>
      <GoldTracker />
      <GoldChart />
    </div>
  );
}
