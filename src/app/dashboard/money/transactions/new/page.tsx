import { getAccounts } from "@/actions/account.actions";
import NewTransactionForm from "./NewTransactionForm";

export default async function NewTransactionPage() {
  const { accounts } = await getAccounts();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <a href="/dashboard/money" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </a>
        <h1 className="text-2xl font-bold tracking-tight">Add Transaction</h1>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm">
        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">You need an account before you can add a transaction.</p>
            <a href="/dashboard/money/accounts/new" className="text-sm font-medium text-blue-600 hover:underline">Create an account first</a>
          </div>
        ) : (
          <NewTransactionForm accounts={accounts} />
        )}
      </div>
    </div>
  );
}
