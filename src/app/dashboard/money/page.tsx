/* eslint-disable @typescript-eslint/no-explicit-any -- Unavoidable dynamic db payload */
import { getAccounts } from "@/actions/account.actions";
import { getRecentTransactions } from "@/actions/transaction.actions";
import MoneyClient from "./MoneyClient";

export default async function MoneyDashboard() {
  const [{ accounts }, { transactions }] = await Promise.all([
    getAccounts(),
    getRecentTransactions(0)
  ]);

  // After serializeDoc, balance is a string (from Decimal128 $numberDecimal). Must parseFloat.
  const totalBalance = accounts.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance || "0"), 0);

  return (
    <div className="w-full min-h-full max-w-lg mx-auto md:max-w-4xl">
      <MoneyClient 
        totalBalance={totalBalance} 
        transactions={transactions} 
        accounts={accounts} 
      />
    </div>
  );
}
