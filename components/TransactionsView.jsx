"use client";

import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import ReceiptScanner from "@/components/ReceiptScanner";
import { useState } from "react";

export default function TransactionsView() {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="text-2xl font-bold">Transactions</h1>
      
      <div className="space-y-4">
        <TransactionForm onSaved={() => setReloadKey((k) => k + 1)} />
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">or scan a receipt</span></div>
        </div>
        <ReceiptScanner />
      </div>

      <TransactionList reloadKey={reloadKey} />
    </div>
  );
}
