import { getAccounts } from "@/actions/account.actions";
import NewTransactionForm from "./NewTransactionForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewTransactionPage() {
  const { accounts } = await getAccounts();

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
          <h1 className="text-xl font-bold tracking-tight text-on-surface">Add Transaction</h1>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl border border-surface-container-high p-5 shadow-lg">
        <NewTransactionForm accounts={accounts} />
      </div>
    </div>
  );
}
