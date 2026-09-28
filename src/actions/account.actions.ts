"use server";

import dbConnect from "@/lib/db";
import Account from "@/models/Account";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeDoc = (doc: any) => {
  const obj = JSON.parse(JSON.stringify(doc));
  if (obj.balance && obj.balance.$numberDecimal) {
    obj.balance = obj.balance.$numberDecimal;
  }
  return obj;
};

export async function createAccount(data: {
  name: string;
  type: string;
  currency?: string;
  balance: number;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const account = await Account.create({
      ...data,
      userId,
      balance: data.balance.toString(),
    });

    revalidatePath("/dashboard/money");
    return { success: true, account: serializeDoc(account) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create account" };
  }
}

export async function getAccounts() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { accounts: [] };

    await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const accounts = await Account.find({ userId }).sort({ createdAt: -1 }).lean();

    return { accounts: accounts.map(serializeDoc) };
  } catch (error) {
    return { accounts: [] };
  }
}
