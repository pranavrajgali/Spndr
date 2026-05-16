import ReceiptScanner from "@/components/ReceiptScanner";

export default function ReceiptsPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Receipt scan</h1>
      <ReceiptScanner />
    </div>
  );
}
