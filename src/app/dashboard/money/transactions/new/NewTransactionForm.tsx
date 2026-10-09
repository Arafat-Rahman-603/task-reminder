/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTransaction } from "@/actions/transaction.actions";
import { ArrowDownRight, ArrowUpRight, Loader2, Paperclip } from "lucide-react";
import { AttachmentUpload } from "@/components/ui/AttachmentUpload";

export default function NewTransactionForm({ accounts }: { accounts: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attachments, setAttachments] = useState<any[]>([]);

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
      type: txType,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    if (isNaN(data.amount) || data.amount <= 0) {
      setError("Please enter a valid amount greater than 0");
      setLoading(false);
      return;
    }

    if (!data.accountId) {
      setError("Please select an account");
      setLoading(false);
      return;
    }

    const res = await createTransaction(data);
    if (res.success) {
      setLoading(false);
      router.refresh();
      router.push("/dashboard/money");
    } else {
      setError(res.error || "Failed to add transaction");
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="p-3 text-sm font-medium text-danger-foreground bg-danger/20 rounded-xl text-center">
          {error}
        </div>
      )}

      {/* Type Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Transaction Type</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTxType("expense")}
            className={`flex items-center gap-2 p-3.5 rounded-xl border-2 transition-all font-medium text-sm ${
              txType === "expense"
                ? "border-error bg-error/10 text-error"
                : "border-surface-container-high bg-surface-container/60 text-on-surface-variant hover:border-error/50"
            }`}
          >
            <ArrowDownRight className="w-5 h-5 shrink-0" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => setTxType("income")}
            className={`flex items-center gap-2 p-3.5 rounded-xl border-2 transition-all font-medium text-sm ${
              txType === "income"
                ? "border-stitch-primary bg-primary/10 text-stitch-primary"
                : "border-surface-container-high bg-surface-container/60 text-on-surface-variant hover:border-primary/50"
            }`}
          >
            <ArrowUpRight className="w-5 h-5 shrink-0" />
            Income
          </button>
        </div>
      </div>

      {/* Amount */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="amount" className="text-xs font-medium text-on-surface-variant">Amount</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium text-sm">৳</span>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className="w-full h-12 pl-8 pr-4 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all"
          />
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-xs font-medium text-on-surface-variant">Description</label>
        <input
          id="description"
          name="description"
          type="text"
          required
          placeholder={txType === "income" ? "e.g. Freelance payment, Salary..." : "e.g. Groceries, Rent, Netflix..."}
          className="w-full h-12 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all"
        />
      </div>

      {/* Date */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="date" className="text-xs font-medium text-on-surface-variant">Date</label>
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={today}
          className="w-full h-12 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all"
        />
      </div>

      {/* Account Selection */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="accountId" className="text-xs font-medium text-on-surface-variant">Account</label>
        {accounts.length === 0 ? (
          <div className="p-3 rounded-xl bg-surface-container-high/60 text-xs text-on-surface-variant text-center">
            No accounts found. <a href="/dashboard/money/accounts/new" className="text-stitch-primary underline">Add one first</a>
          </div>
        ) : (
          <select
            id="accountId"
            name="accountId"
            required
            className="w-full h-12 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all"
          >
            <option value="">Select account...</option>
            {accounts.map((acc: any) => (
              <option key={acc._id} value={acc._id}>
                {acc.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Attachments Upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5"/> Attachments (Receipts, Docs)</label>
        <AttachmentUpload
          multiple
          folder="manageo/receipts"
          attachments={attachments}
          onChange={setAttachments}
          label="Upload receipt or document"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || accounts.length === 0}
        className="w-full h-12 rounded-xl bg-stitch-primary text-on-primary font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:pointer-events-none mt-1"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Recording...</>
        ) : (
          `Record ${txType === "income" ? "Income" : "Expense"}`
        )}
      </button>
    </form>
  );
}
