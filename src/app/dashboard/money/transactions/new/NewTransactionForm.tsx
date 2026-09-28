/* eslint-disable @typescript-eslint/no-explicit-any -- Unavoidable due to dynamic Mongoose Document mapping in Server Components */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTransaction } from "@/actions/transaction.actions";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function NewTransactionForm({ accounts }: { accounts: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      amount: parseFloat(formData.get("amount") as string),
      date: formData.get("date") as string,
      accountId: formData.get("accountId") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as "income" | "expense" | "transfer",
    };

    const res = await createTransaction(data);
    if (res.success) {
      router.refresh();
      router.push("/dashboard/money");
    } else {
      setError(res.error || "Failed to add transaction");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/30 p-3 rounded-md">{error}</div>}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium leading-6">Transaction Type</label>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 rounded-md border border-zinc-200 p-3 cursor-pointer hover:bg-zinc-50 has-[:checked]:ring-2 has-[:checked]:ring-green-600 dark:border-zinc-700 dark:hover:bg-zinc-800">
              <input type="radio" name="type" value="expense" defaultChecked className="hidden" />
              <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-transparent peer-checked:bg-green-600"></div>
              </div>
              <span className="font-medium text-red-600">Expense</span>
            </label>
            <label className="flex items-center gap-2 rounded-md border border-zinc-200 p-3 cursor-pointer hover:bg-zinc-50 has-[:checked]:ring-2 has-[:checked]:ring-green-600 dark:border-zinc-700 dark:hover:bg-zinc-800">
              <input type="radio" name="type" value="income" className="hidden" />
              <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-transparent peer-checked:bg-green-600"></div>
              </div>
              <span className="font-medium text-green-600">Income</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium leading-6">Amount</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              required
              className="mt-2 block w-full rounded-md border-0 py-2 px-3 bg-background text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-focus sm:text-sm sm:leading-6 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium leading-6">Date</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
              className="mt-2 block w-full rounded-md border-0 py-2 px-3 bg-background text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-focus sm:text-sm sm:leading-6 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium leading-6">Account</label>
          <select
            name="accountId"
            required
            className="mt-2 block w-full rounded-md border-0 py-2 px-3 bg-background text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-focus sm:text-sm sm:leading-6 transition-colors"
          >
            <option value="">Select Account</option>
  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {accounts.map((acc: any) => (
              <option key={acc._id} value={acc._id}>{acc.name} ({acc.balance})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium leading-6">Description</label>
          <input
            name="description"
            type="text"
            required
            placeholder="What was this for?"
            className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 bg-background text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-focus sm:text-sm sm:leading-6 transition-colors"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <a
          href="/dashboard/money"
          className="px-4 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {loading ? "Saving..." : "Save Transaction"}
        </button>
      </div>
    </form>
  );
}
