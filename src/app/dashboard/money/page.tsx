/* eslint-disable @typescript-eslint/no-explicit-any -- Unavoidable dynamic db payload */
import { getAccounts } from "@/actions/account.actions";
import { getRecentTransactions } from "@/actions/transaction.actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PlusCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";

export default async function MoneyDashboard() {
  const [{ accounts }, { transactions }] = await Promise.all([
    getAccounts(),
    getRecentTransactions(5)
  ]);

  // After serializeDoc, balance is a string (from Decimal128 $numberDecimal). Must parseFloat.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalBalance = accounts.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance || "0"), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Money</h1>
          <p className="text-muted-foreground dark:text-zinc-400 mt-1">
            Manage your finances, budgets, and investments.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/money/accounts/new"
            className="flex items-center gap-2 rounded-md bg-secondary border border-border px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Add Account
          </Link>
          <Link
            href="/dashboard/money/transactions/new"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            New Transaction
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-primary p-6 text-primary-foreground shadow-sm">
          <h3 className="text-sm font-medium opacity-80">Total Balance</h3>
          <p className="mt-2 text-4xl font-bold tracking-tight">{formatCurrency(totalBalance)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <Link href="/dashboard/money/transactions" className="text-sm text-muted-foreground hover:text-zinc-900 dark:hover:text-white">View all</Link>
          </div>
          
          <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No recent transactions.</div>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {transactions.map((t: any) => (
                  <li key={t._id} className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                        {t.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{t.description}</p>
                        <p className="text-sm text-muted-foreground">{t.accountId?.name} • {formatDate(new Date(t.date))}</p>
                      </div>
                    </div>
                    <div className={`font-semibold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-white'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, t.currency)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Accounts</h2>
            <Link href="/dashboard/money/accounts" className="text-sm text-muted-foreground hover:text-zinc-900 dark:hover:text-white">Manage</Link>
          </div>
          
          <div className="rounded-xl border border-border bg-surface shadow-sm p-4 space-y-4">
            {accounts.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-4">No accounts created.</div>
            ) : (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
              accounts.map((acc: any) => (
                <div key={acc._id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">{acc.type}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(acc.balance, acc.currency)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
