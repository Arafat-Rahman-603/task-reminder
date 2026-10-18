import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import { getFinancialReminders } from "@/actions/financialReminder.actions";
import { getAccounts } from "@/actions/account.actions";
import Investment from "@/models/Investment";
import Debt from "@/models/Debt";
import Goal from "@/models/Goal";
import FinancialRemindersClient from "./FinancialRemindersClient";
import mongoose from "mongoose";

export const metadata = {
  title: "Financial Reminders & Upcoming Payments | Manageo",
  description: "Track bills, recurring subscriptions, loan installments, and investment milestones.",
};

export default async function FinancialRemindersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = new mongoose.Types.ObjectId((session.user as any).id);

  await dbConnect();

  const [remindersRes, accountsRes, investments, debts, goals] = await Promise.all([
    getFinancialReminders({ status: "all" }),
    getAccounts(),
    Investment.find({ userId }).select("assetName assetType currency").lean(),
    Debt.find({ userId, status: "Active" }).select("name type outstandingAmount currency").lean(),
    Goal.find({ userId, status: { $ne: "Achieved" } }).select("title progress").lean(),
  ]);

  const serializedInvestments = JSON.parse(JSON.stringify(investments));
  const serializedDebts = JSON.parse(JSON.stringify(debts));
  const serializedGoals = JSON.parse(JSON.stringify(goals));

  return (
    <div className="w-full min-h-full max-w-lg mx-auto md:max-w-5xl">
      <FinancialRemindersClient
        initialReminders={remindersRes.success ? (remindersRes.reminders || []) : []}
        accounts={accountsRes.accounts || []}
        investments={serializedInvestments}
        debts={serializedDebts}
        goals={serializedGoals}
      />
    </div>
  );
}
