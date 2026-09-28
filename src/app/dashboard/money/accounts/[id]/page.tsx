import { getAccountById } from "@/actions/account.actions";
import { getTransactionsByAccount } from "@/actions/transaction.actions";
import AccountDetailClient from "./AccountDetailClient";
import { notFound } from "next/navigation";


export default async function AccountDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const accountId = params.id;
  const [{ account }, { transactions }] = await Promise.all([
    getAccountById(accountId),
    getTransactionsByAccount(accountId)
  ]);

  if (!account) {
    notFound();
  }

  return (
    <div className="w-full min-h-full max-w-lg mx-auto md:max-w-4xl">
      <AccountDetailClient account={account} transactions={transactions} />
    </div>
  );
}
