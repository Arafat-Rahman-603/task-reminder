"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAccount } from "@/actions/account.actions";
import Link from "next/link";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";

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
    <div className="w-full max-w-lg mx-auto space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/money"
          className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-stitch-primary">Money</span>
          <h1 className="text-xl font-bold tracking-tight text-on-surface">Add New Account</h1>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl border border-surface-container-high p-5 shadow-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="p-3 text-sm font-medium text-danger-foreground bg-danger/20 rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Account Icon */}
          <div className="flex items-center justify-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center">
              <Building2 className="w-7 h-7" />
            </div>
          </div>

          {/* Account Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-medium text-on-surface-variant">Account Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. City Bank Salary, Mobile Banking..."
              className="w-full h-12 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Account Type */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="type" className="text-xs font-medium text-on-surface-variant">Account Type</label>
              <select
                id="type"
                name="type"
                required
                className="w-full h-12 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all"
              >
                <option value="cash">Cash</option>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="investment">Investment</option>
                <option value="credit">Credit Card</option>
                <option value="mobile">Mobile Banking</option>
              </select>
            </div>

            {/* Currency */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="currency" className="text-xs font-medium text-on-surface-variant">Currency</label>
              <select
                id="currency"
                name="currency"
                defaultValue="BDT"
                className="w-full h-12 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all"
              >
                <option value="BDT">BDT (৳)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
          </div>

          {/* Starting Balance */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="balance" className="text-xs font-medium text-on-surface-variant">Starting Balance</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium text-sm">৳</span>
              <input
                id="balance"
                name="balance"
                type="number"
                step="0.01"
                defaultValue="0"
                className="w-full h-12 pl-8 pr-4 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all"
              />
            </div>
            <p className="text-[11px] text-on-surface-variant">Set to 0 to start fresh, or enter your current balance.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Link
              href="/dashboard/money"
              className="flex-1 h-12 rounded-xl bg-surface-container-high text-on-surface-variant font-medium text-sm flex items-center justify-center hover:text-on-surface transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 rounded-xl bg-stitch-primary text-on-primary font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
