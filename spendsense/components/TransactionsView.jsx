"use client";

import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import { useState } from "react";

export default function TransactionsView() {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <TransactionForm onSaved={() => setReloadKey((k) => k + 1)} />
      <TransactionList reloadKey={reloadKey} />
    </div>
  );
}
