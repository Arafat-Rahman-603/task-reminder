"use server";

import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { calculateNewBalance } from "@/lib/finance";
import { z } from "zod";
import { deleteAttachments, deleteImage } from "./cloudinary.actions";
import { checkAccountLowBalance } from "./financialReminder.actions";

const createTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["income", "expense", "transfer"]),
  toAccountId: z.string().optional(), // required when type === 'transfer'
  receiptUrl: z.string().optional(),
  receiptPublicId: z.string().optional(),
  attachments: z.array(z.object({
    url: z.string(),
    publicId: z.string(),
    resourceType: z.string().optional(),
    originalFilename: z.string().optional()
  })).optional(),
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
  receiptUrl?: string;
  receiptPublicId?: string;
  attachments?: { url: string; publicId: string; resourceType?: string; originalFilename?: string; }[];
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

      // Low balance check on sender account
      await checkAccountLowBalance(userId, account._id.toString(), parseFloat(account.balance.toString()));

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
      receiptUrl: validated.receiptUrl,
      receiptPublicId: validated.receiptPublicId,
      attachments: validated.attachments,
    });

    await account.save();

    if (validated.type === "expense") {
      await checkAccountLowBalance(userId, account._id.toString(), newBalance);
    }

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

    // Guard against unbounded queries (e.g. limit=0)
    const safeLimit = limit && limit > 0 && limit <= 200 ? limit : 50;

    const transactions = await Transaction.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(safeLimit)
      .populate("accountId", "name")
      .lean();

    return { transactions: transactions.map(serializeDoc) };
  } catch (error) {
    return { transactions: [] };
  }
}

export async function getTransactionsByAccount(accountId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { transactions: [] };

    await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const transactions = await Transaction.find({ userId, accountId })
      .sort({ date: -1, createdAt: -1 })
      .populate("accountId", "name")
      .lean();

    return { transactions: transactions.map(serializeDoc) };
  } catch (error) {
    return { transactions: [] };
  }
}

export async function deleteTransaction(transactionId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const transaction = await Transaction.findOne({ _id: transactionId, userId });
    if (!transaction) throw new Error("Transaction not found");

    if (transaction.type === "transfer") {
      let linkedTx = null;
      if (transaction.transferId) {
        linkedTx = await Transaction.findOne({ _id: transaction.transferId, userId });
      } else {
        linkedTx = await Transaction.findOne({ transferId: transaction._id, userId });
      }

      const txAmount = parseFloat(transaction.amount.toString());

      if (linkedTx) {
        const isCurrentTxSender = !transaction.description.startsWith("Transfer from:");
        const senderTx = isCurrentTxSender ? transaction : linkedTx;
        const receiverTx = isCurrentTxSender ? linkedTx : transaction;

        const senderAccount = await Account.findOne({ _id: senderTx.accountId, userId });
        const receiverAccount = await Account.findOne({ _id: receiverTx.accountId, userId });

        if (senderAccount) {
          const curBal = parseFloat(senderAccount.balance.toString());
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          senderAccount.balance = calculateNewBalance(curBal, txAmount, "income").toString() as any;
          await senderAccount.save();
        }

        if (receiverAccount) {
          const curBal = parseFloat(receiverAccount.balance.toString());
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          receiverAccount.balance = calculateNewBalance(curBal, txAmount, "expense").toString() as any;
          await receiverAccount.save();
        }

        await Transaction.deleteOne({ _id: linkedTx._id, userId });
      }
    } else {
      const account = await Account.findOne({ _id: transaction.accountId, userId });
      if (account) {
        const currentBalance = parseFloat(account.balance.toString());
        const txAmount = parseFloat(transaction.amount.toString());
        const reverseType = transaction.type === "income" ? "expense" : "income";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        account.balance = calculateNewBalance(currentBalance, txAmount, reverseType).toString() as any;
        await account.save();
      }
    }

    await Transaction.deleteOne({ _id: transactionId, userId });

    if (transaction.attachments?.length > 0) deleteAttachments(transaction.attachments).catch(console.error);
    if (transaction.receiptPublicId) deleteImage(transaction.receiptPublicId).catch(console.error);

    revalidatePath("/dashboard/money");
    revalidatePath("/dashboard");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete transaction" };
  }
}

export async function updateTransactionAttachments(transactionId: string, attachments: { url: string; publicId: string; resourceType?: string; originalFilename?: string; }[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const oldTx = await Transaction.findOne({ _id: transactionId, userId });

    const transaction = await Transaction.findOneAndUpdate(
      { _id: transactionId, userId },
      { $set: { attachments } },
      { returnDocument: 'after' }
    );
    if (!transaction) throw new Error("Transaction not found");

    if (oldTx && transaction && oldTx.attachments) {
      const newAttIds = new Set(transaction.attachments?.map((a: any) => a.publicId) || []);
      const removedAtts = oldTx.attachments.filter((a: any) => !newAttIds.has(a.publicId));
      if (removedAtts.length > 0) deleteAttachments(removedAtts).catch(console.error);
    }

    revalidatePath("/dashboard/money");
    return { success: true, transaction: serializeDoc(transaction) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update attachments" };
  }
}
