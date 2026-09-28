"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, CheckCircle, Server, Trash2, Building2, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { deleteTransaction } from "@/actions/transaction.actions";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AccountDetailClient({ account, transactions: initialTransactions }: { account: any, transactions: any[] }) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [pending, startTransition] = useTransition();

  const balance = account.balance?.$numberDecimal ? parseFloat(account.balance.$numberDecimal) : (Number(account.balance) || 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalIncome = transactions.filter((t: any) => t.type === "income").reduce((sum: number, t: any) => {
    const amt = typeof t.amount === "object" && t.amount?.$numberDecimal ? parseFloat(t.amount.$numberDecimal) : Number(t.amount) || 0;
    return sum + amt;
  }, 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalExpenses = transactions.filter((t: any) => t.type === "expense").reduce((sum: number, t: any) => {
    const amt = typeof t.amount === "object" && t.amount?.$numberDecimal ? parseFloat(t.amount.$numberDecimal) : Number(t.amount) || 0;
    return sum + amt;
  }, 0);

  const handleDeleteTransaction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this transaction?")) return;
    
    setTransactions(prev => prev.filter(t => t._id !== id));
    
    startTransition(async () => {
      const res = await deleteTransaction(id);
      if (!res.success) {
        alert(res.error);
        setTransactions(initialTransactions);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className={`flex flex-col w-full space-y-6 pb-6 text-on-surface ${pending ? 'opacity-80' : ''}`}>
      {/* Header Navigation */}
      <div className="flex items-center gap-3 pt-1">
        <Link href="/dashboard/money" className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container-high hover:bg-surface-variant transition-colors">
          <ArrowLeft className="w-[18px] h-[18px] text-on-surface-variant" />
        </Link>
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-stitch-primary">Account Details</span>
          <h2 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
            {account.name}
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest uppercase bg-surface-variant text-on-surface-variant">
              {account.type}
            </span>
          </h2>
        </div>
      </div>

      {/* Hero Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-surface-container/70 backdrop-blur-2xl p-6 shadow-xl border border-surface-container-high">
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-stitch-primary/10 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-tertiary/10 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center space-y-3 text-center py-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-stitch-primary shadow-sm mb-1">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium tracking-wide text-on-surface-variant uppercase">
            Current Balance
          </span>
          <span className={`text-4xl font-extrabold tracking-tight ${balance < 0 ? 'text-error' : 'text-on-surface'}`}>
            {formatCurrency(balance, account.currency)}
          </span>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-surface-container/60 backdrop-blur-md shadow-sm border border-surface-container-high/50 text-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-stitch-primary">
            <TrendingUp className="w-[16px] h-[16px]" />
          </div>
          <span className="text-[11px] text-on-surface-variant font-medium uppercase tracking-wider">Total In</span>
          <span className="text-lg font-bold text-stitch-primary">+{formatCurrency(totalIncome, account.currency)}</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-surface-container/60 backdrop-blur-md shadow-sm border border-surface-container-high/50 text-center">
          <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center text-error">
            <TrendingDown className="w-[16px] h-[16px]" />
          </div>
          <span className="text-[11px] text-on-surface-variant font-medium uppercase tracking-wider">Total Out</span>
          <span className="text-lg font-bold text-error">-{formatCurrency(totalExpenses, account.currency)}</span>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-on-surface">Transaction History</h3>
          <span className="text-xs font-medium text-on-surface-variant">{transactions.length} total</span>
        </div>
        
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="py-10 text-center rounded-2xl bg-surface-container/40 border border-dashed border-surface-container-high">
              <Receipt className="w-10 h-10 text-on-surface-variant opacity-40 mx-auto mb-2" />
              <p className="text-sm font-medium text-on-surface-variant">No transactions in this account</p>
              <Link href="/dashboard/money/transactions/new" className="text-xs text-stitch-primary font-medium hover:underline mt-2 inline-block">Record your first transaction</Link>
            </div>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transactions.map((t: any) => {
              const isIncome = t.type === "income";
              const amount = typeof t.amount === "object" && t.amount?.$numberDecimal ? parseFloat(t.amount.$numberDecimal) : Number(t.amount) || 0;
              return (
                <div key={t._id} className="group flex items-center justify-between p-3.5 rounded-2xl bg-surface-container/60 hover:bg-surface-container-high/80 backdrop-blur-xl transition-all shadow-sm border border-transparent hover:border-surface-container-high">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${isIncome ? "bg-primary/10 text-stitch-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
                      {isIncome ? <CheckCircle className="w-[18px] h-[18px]" /> : <Server className="w-[18px] h-[18px]" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-on-surface truncate">{t.description}</span>
                      <span className="text-[10px] font-medium text-on-surface-variant">
                        {formatDate(new Date(t.date))}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-2 pl-2">
                    <div className="flex flex-col text-right">
                      <span className={`text-sm font-bold ${isIncome ? "text-stitch-primary" : "text-error"}`}>
                        {isIncome ? "+" : "-"}{formatCurrency(amount, t.currency)}
                      </span>
                      <span className="block text-[10px] text-on-surface-variant capitalize">{t.type}</span>
                    </div>
                    <button onClick={(e) => handleDeleteTransaction(t._id, e)} className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
