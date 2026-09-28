"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAccount } from "@/actions/account.actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      currency: formData.get("currency") as string,
      balance: parseFloat(formData.get("balance") as string) || 0,
    };

    const res = await createAccount(data);
    if (res.success) {
      router.refresh();
      router.push("/dashboard/money");
    } else {
      setError(res.error || "Failed to create account");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/money" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add New Account</h1>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/30 p-3 rounded-md">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium leading-6">Account Name</label>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g. City Bank Salary"
                className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 bg-background text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-focus sm:text-sm sm:leading-6 transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium leading-6">Account Type</label>
                <select
                  name="type"
                  required
                  className="mt-2 block w-full rounded-md border-0 py-2 px-3 bg-background text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-focus sm:text-sm sm:leading-6 transition-colors"
                >
                  <option value="cash">Cash</option>
                  <option value="checking">Checking Account</option>
                  <option value="savings">Savings Account</option>
                  <option value="investment">Investment / Wallet</option>
                  <option value="credit">Credit Card</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium leading-6">Currency</label>
                <select
                  name="currency"
                  defaultValue="BDT"
                  className="mt-2 block w-full rounded-md border-0 py-2 px-3 bg-background text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-focus sm:text-sm sm:leading-6 transition-colors"
                >
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium leading-6">Starting Balance</label>
              <input
                name="balance"
                type="number"
                step="0.01"
                required
                defaultValue="0"
                className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 bg-background text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-focus sm:text-sm sm:leading-6 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Link
              href="/dashboard/money"
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {loading ? "Saving..." : "Save Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
