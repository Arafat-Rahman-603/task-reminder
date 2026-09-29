"use client";

import { useState, useTransition } from "react";
import { ArrowUpRight, ArrowDownRight, ArrowRight, Receipt, PlusCircle, Building2, TrendingUp, TrendingDown, CheckCircle, Server, Wallet, LayoutList, Trash2, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { deleteAccount } from "@/actions/account.actions";
import { deleteTransaction } from "@/actions/transaction.actions";
import { DateRangeSelector, DateRange } from "@/components/ui/DateRangeSelector";
import { FilterButton, FilterPanel } from "@/components/ui/FilterPanel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MoneyClient({ totalBalance, transactions: initialTransactions, accounts: initialAccounts }: { totalBalance: number, transactions: any[], accounts: any[] }) {
  const [activeTab, setActiveTab] = useState<"overview" | "accounts" | "transactions">("overview");
  const [dateRange, setDateRange] = useState<DateRange>("this_month");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    accountId: "",
  });
  
  const [transactions, setTransactions] = useState(initialTransactions);
  const [accounts, setAccounts] = useState(initialAccounts);
  
  const [pending, startTransition] = useTransition();

  const handleDeleteAccount = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this account?")) return;
    
    // Optimistic delete
    setAccounts(prev => prev.filter(a => a._id !== id));
    
    startTransition(async () => {
      const res = await deleteAccount(id);
      if (!res.success) {
        alert(res.error);
        // revert (simplistic)
        setAccounts(initialAccounts);
      }
    });
  };

  const handleDeleteTransaction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this transaction?")) return;
    
    setTransactions(prev => prev.filter(t => t._id !== id));
    
    startTransition(async () => {
      const res = await deleteTransaction(id);
      if (!res.success) {
        alert(res.error);
        setTransactions(initialTransactions);
      }
    });
  };

  // Compute real income/expense totals from actual transactions
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

  const filteredTransactions = transactions.filter(t => {
    if (filters.type && t.type !== filters.type) return false;
    if (filters.accountId && t.accountId?._id !== filters.accountId) return false;
    return true;
  });

  const netFlow = totalIncome - totalExpenses;
  
  // Re-calculate total balance from local accounts (to reflect optimistic deletes)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const localTotalBalance = accounts.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance?.$numberDecimal || acc.balance || "0"), 0);

  return (
    <div className={`flex flex-col w-full space-y-5 pb-6 text-on-surface ${pending ? 'opacity-80' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-stitch-primary">Finance</span>
          <h2 className="text-xl font-bold tracking-tight text-on-surface">Financial Health</h2>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <FilterButton 
            isActive={showFilterPanel || !!filters.type || !!filters.accountId}
            activeCount={(filters.type ? 1 : 0) + (filters.accountId ? 1 : 0)}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          />
          <Link
            href="/dashboard/money/transactions/new"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-container text-on-primary-container font-medium text-xs shadow-md hover:bg-stitch-primary hover:text-on-primary transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            New
          </Link>
        </div>
      </div>

      <FilterPanel 
        isOpen={showFilterPanel} 
        onClose={() => setShowFilterPanel(false)}
        onClear={() => setFilters({ type: "", accountId: "" })}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant">Transaction Type</label>
            <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})} className="w-full h-10 px-3 bg-surface-container text-sm rounded-xl border border-surface-variant/50 focus:outline-none focus:border-stitch-primary/50 transition-colors">
              <option value="">Any Type</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant">Account</label>
            <select value={filters.accountId} onChange={e => setFilters({...filters, accountId: e.target.value})} className="w-full h-10 px-3 bg-surface-container text-sm rounded-xl border border-surface-variant/50 focus:outline-none focus:border-stitch-primary/50 transition-colors">
              <option value="">Any Account</option>
              {accounts.map(acc => (
                <option key={acc._id} value={acc._id}>{acc.name}</option>
              ))}
            </select>
          </div>
        </div>
      </FilterPanel>

      {/* Hero Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container/70 backdrop-blur-2xl p-5 shadow-xl">
        <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-stitch-primary/10 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-16 -left-12 w-48 h-48 rounded-full bg-tertiary/10 blur-3xl"></div>
        <div className="relative z-10 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide text-on-surface-variant flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-stitch-primary animate-pulse"></span>
              Total Balance Across {accounts.length} Account{accounts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Hero Figure */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-on-surface">{formatCurrency(localTotalBalance)}</span>
            {netFlow >= 0 ? (
              <span className="text-xs font-semibold text-stitch-primary px-2 py-0.5 rounded-full bg-primary-container/60 shadow-sm flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> Net Positive
              </span>
            ) : (
              <span className="text-xs font-semibold text-error px-2 py-0.5 rounded-full bg-error-container/30 shadow-sm flex items-center gap-0.5">
                <ArrowDownRight className="w-3 h-3" /> Net Negative
              </span>
            )}
          </div>

          {/* Real Cashflow Pills */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-high/60 backdrop-blur-md shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-stitch-primary">
                <TrendingUp className="w-[18px] h-[18px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-on-surface-variant font-medium">Total Income</span>
                <span className="text-sm font-bold text-stitch-primary truncate">+{formatCurrency(totalIncome)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-high/60 backdrop-blur-md shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-error">
                <TrendingDown className="w-[18px] h-[18px]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-on-surface-variant font-medium">Total Expenses</span>
                <span className="text-sm font-bold text-error truncate">-{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Net Flow Indicator */}
          {transactions.length > 0 && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-on-surface-variant">Net Cash Flow</span>
              <span className={`font-bold ${netFlow >= 0 ? "text-success" : "text-error"}`}>
                {netFlow >= 0 ? "+" : ""}{formatCurrency(Math.abs(netFlow))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center p-1 rounded-xl bg-surface-container-high/80 backdrop-blur-md shadow-inner w-full">
        {[
          { key: "overview", label: "Overview", icon: Wallet },
          { key: "accounts", label: `Accounts (${accounts.length})`, icon: Building2 },
          { key: "transactions", label: `Transactions (${transactions.length})`, icon: LayoutList },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === key ? "bg-stitch-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate hidden sm:inline">{label}</span>
            <span className="inline sm:hidden">{label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Quick Financial Actions — always visible */}
      <div className="grid grid-cols-3 gap-2">
        <Link href="/dashboard/money/transactions/new" className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-surface-container/60 hover:bg-surface-container-high/90 backdrop-blur-xl transition-all active:scale-95 shadow-md text-center">
          <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center text-stitch-primary shadow-sm transition-colors">
            <Receipt className="w-[20px] h-[20px]" />
          </div>
          <span className="text-[11px] font-medium text-on-surface tracking-tight">Transaction</span>
        </Link>
        <Link href="/dashboard/money/accounts/new" className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-surface-container/60 hover:bg-surface-container-high/90 backdrop-blur-xl transition-all active:scale-95 shadow-md text-center">
          <div className="w-10 h-10 rounded-xl bg-tertiary/10 group-hover:bg-tertiary/20 flex items-center justify-center text-tertiary shadow-sm transition-colors">
            <Building2 className="w-[20px] h-[20px]" />
          </div>
          <span className="text-[11px] font-medium text-on-surface tracking-tight">Add Account</span>
        </Link>
        <button onClick={() => setActiveTab('transactions')} className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-surface-container/60 hover:bg-surface-container-high/90 backdrop-blur-xl transition-all active:scale-95 shadow-md text-center">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 group-hover:bg-secondary/20 flex items-center justify-center text-stitch-secondary shadow-sm transition-colors">
            <LayoutList className="w-[20px] h-[20px]" />
          </div>
          <span className="text-[11px] font-medium text-on-surface tracking-tight">All History</span>
        </button>
      </div>

      {/* Accounts Tab */}
      {activeTab === "accounts" && (
        <div className="space-y-2">
          {accounts.length === 0 ? (
            <div className="py-8 text-center rounded-2xl bg-surface-container/60 border border-dashed border-surface-container-high">
              <Building2 className="w-10 h-10 text-on-surface-variant opacity-40 mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">No accounts yet</p>
              <Link href="/dashboard/money/accounts/new" className="text-xs text-stitch-primary font-medium hover:underline mt-1 inline-block">Add your first account</Link>
            </div>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            accounts.map((account: any) => {
              const balance = account.balance?.$numberDecimal ? parseFloat(account.balance.$numberDecimal) : 0;
              return (
                <Link href={`/dashboard/money/accounts/${account._id}`} key={account._id} className="group flex items-center justify-between p-4 rounded-2xl bg-surface-container/60 hover:bg-surface-container-high/80 backdrop-blur-xl transition-all shadow-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-stitch-primary shrink-0">
                      <Building2 className="w-[18px] h-[18px]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-on-surface truncate group-hover:text-stitch-primary transition-colors">{account.name}</span>
                      <span className="text-[11px] text-on-surface-variant capitalize">{account.type || "account"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold shrink-0 ${balance >= 0 ? "text-on-surface" : "text-error"}`}>
                      {formatCurrency(balance, account.currency)}
                    </span>
                    <button onClick={(e) => handleDeleteAccount(account._id, e)} className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="py-8 text-center rounded-2xl bg-surface-container/60 border border-dashed border-surface-container-high">
              <Receipt className="w-10 h-10 text-on-surface-variant opacity-40 mx-auto mb-2" />
              <p className="text-sm text-on-surface-variant">No transactions yet</p>
              <Link href="/dashboard/money/transactions/new" className="text-xs text-stitch-primary font-medium hover:underline mt-1 inline-block">Record your first transaction</Link>
            </div>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            filteredTransactions.map((t: any) => {
              const isIncome = t.type === "income";
              const amount = typeof t.amount === "object" && t.amount?.$numberDecimal ? parseFloat(t.amount.$numberDecimal) : Number(t.amount) || 0;
              return (
                <div key={t._id} className="group flex items-center justify-between p-3.5 rounded-2xl bg-surface-container/60 hover:bg-surface-container-high/80 backdrop-blur-xl transition-all shadow-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${isIncome ? "bg-primary/10 text-stitch-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
                      {isIncome ? <CheckCircle className="w-[18px] h-[18px]" /> : <Server className="w-[18px] h-[18px]" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-on-surface truncate">{t.description}</span>
                      <span className="text-[10px] font-medium text-on-surface-variant">
                        {t.accountId?.name || "Account"} · {formatDate(new Date(t.date))}
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
      )}

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Recent Transactions</span>
            <button onClick={() => setActiveTab('transactions')} className="text-xs font-medium text-stitch-primary hover:text-primary-fixed transition-colors flex items-center gap-0.5">
              View All <ArrowRight className="w-[16px] h-[16px]" />
            </button>
          </div>

          <div className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="py-8 text-center text-on-surface-variant text-sm rounded-2xl bg-surface-container/60 border border-dashed border-surface-container-high">
                <Receipt className="w-8 h-8 opacity-40 mx-auto mb-2" />
                <p>No transactions yet.</p>
                <Link href="/dashboard/money/transactions/new" className="text-xs text-stitch-primary font-medium hover:underline mt-1 inline-block">Add first transaction</Link>
              </div>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              filteredTransactions.slice(0, 5).map((t: any) => {
                const isIncome = t.type === "income";
                const amount = typeof t.amount === "object" && t.amount?.$numberDecimal ? parseFloat(t.amount.$numberDecimal) : Number(t.amount) || 0;
                return (
                  <div key={t._id} className="group flex items-center justify-between p-3.5 rounded-2xl bg-surface-container/60 hover:bg-surface-container-high/80 backdrop-blur-xl transition-all shadow-md">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${isIncome ? "bg-primary/10 text-stitch-primary" : "bg-surface-container-high text-on-surface-variant"}`}>
                        {isIncome ? <CheckCircle className="w-[18px] h-[18px]" /> : <Server className="w-[18px] h-[18px]" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-on-surface truncate">{t.description}</span>
                        <span className="text-[10px] font-medium text-on-surface-variant">
                          {t.accountId?.name || "Account"} · {formatDate(new Date(t.date))}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-2 pl-2">
                      <div className="flex flex-col text-right">
                        <span className={`text-sm font-bold ${isIncome ? "text-stitch-primary" : "text-error"}`}>
                          {isIncome ? "+" : "-"}{formatCurrency(amount, t.currency)}
                        </span>
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
      )}
    </div>
  );
}
