"use server";

import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { calculateNewBalance } from "@/lib/finance";
import { z } from "zod";

const createTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["income", "expense", "transfer"]),
  toAccountId: z.string().optional(), // required when type === 'transfer'
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeDoc = (doc: any) => {
  const obj = JSON.parse(JSON.stringify(doc));
  if (obj.amount && obj.amount.$numberDecimal) {
    obj.amount = obj.amount.$numberDecimal;
  }
  return obj;
};

export async function createTransaction(data: {
  amount: number;
  currency?: string;
  date: string;
  accountId: string;
  categoryId?: string;
  description: string;
  type: "income" | "expense" | "transfer";
  toAccountId?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    const validated = createTransactionSchema.parse(data);
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    // Validate source account belongs to user
    const account = await Account.findOne({ _id: validated.accountId, userId });
    if (!account) {
      throw new Error("Account not found or access denied");
    }

    const currentBalance = parseFloat(account.balance.toString());

    if (validated.type === "transfer") {
      // Transfer: requires toAccountId
      if (!validated.toAccountId) {
        throw new Error("toAccountId is required for transfer");
      }
      const toAccount = await Account.findOne({ _id: validated.toAccountId, userId });
      if (!toAccount) {
        throw new Error("Destination account not found or access denied");
      }

      const toBalance = parseFloat(toAccount.balance.toString());

      // Deduct from source
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      account.balance = calculateNewBalance(currentBalance, validated.amount, "expense").toString() as any;
      // Add to destination
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toAccount.balance = calculateNewBalance(toBalance, validated.amount, "income").toString() as any;

      // Create two linked transaction records
      const [txOut] = await Promise.all([
        Transaction.create({
          userId,
          amount: validated.amount.toString(),
          currency: validated.currency,
          date: new Date(validated.date),
          accountId: validated.accountId,
          categoryId: validated.categoryId,
          description: validated.description,
          type: "transfer",
        }),
      ]);
      const txIn = await Transaction.create({
        userId,
        amount: validated.amount.toString(),
        currency: validated.currency,
        date: new Date(validated.date),
        accountId: validated.toAccountId,
        description: `Transfer from: ${validated.description}`,
        type: "transfer",
        transferId: txOut._id,
      });
      // Link them
      txOut.transferId = txIn._id;
      await Promise.all([account.save(), toAccount.save(), txOut.save()]);

      revalidatePath("/dashboard/money");
      revalidatePath("/dashboard");
      return { success: true, transaction: serializeDoc(txOut) };
    }

    // Income or Expense
    const newBalance = calculateNewBalance(currentBalance, validated.amount, validated.type as "income" | "expense");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account.balance = newBalance.toString() as any;

    const transaction = await Transaction.create({
      userId,
      amount: validated.amount.toString(),
      currency: validated.currency,
      date: new Date(validated.date),
      accountId: validated.accountId,
      categoryId: validated.categoryId,
      description: validated.description,
      type: validated.type,
    });

    await account.save();

    revalidatePath("/dashboard/money");
    revalidatePath("/dashboard");
    return { success: true, transaction: serializeDoc(transaction) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create transaction" };
  }
}

export async function getRecentTransactions(limit = 10) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { transactions: [] };

    await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const transactions = await Transaction.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .populate("accountId", "name")
      .lean();

    return { transactions: transactions.map(serializeDoc) };
  } catch (error) {
    return { transactions: [] };
  }
}
