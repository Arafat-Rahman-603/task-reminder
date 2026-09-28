"use server";

import dbConnect from "@/lib/db";
import DashboardBlock from "@/models/custom/DashboardBlock";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeDoc = (doc: any) => JSON.parse(JSON.stringify(doc));

export async function getDashboardBlocks(sectionId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { blocks: [] };

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const blocks = await DashboardBlock.find({ sectionId, userId, isActive: true })
      .sort({ order: 1 })
      .lean();

    return { blocks: blocks.map(serializeDoc) };
  } catch (error) {
    return { blocks: [] };
  }
}

export async function createDashboardBlock(sectionId: string, data: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const block = await DashboardBlock.create({
      ...data,
      sectionId,
      userId,
    });

    revalidatePath("/dashboard", "layout");
    return { success: true, block: serializeDoc(block) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDashboardBlock(blockId: string, data: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const block = await DashboardBlock.findOneAndUpdate(
      { _id: blockId, userId },
      { $set: data },
      { new: true }
    ).lean();

    if (!block) throw new Error("Block not found");

    revalidatePath("/dashboard", "layout");
    return { success: true, block: serializeDoc(block) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDashboardBlock(blockId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    await DashboardBlock.findOneAndDelete({ _id: blockId, userId });

    revalidatePath("/dashboard", "layout");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reorderDashboardBlocks(sectionId: string, blockIds: string[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    // Bulk update orders
    const updates = blockIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, sectionId, userId },
        update: { $set: { order: index } }
      }
    }));

    if (updates.length > 0) {
      await DashboardBlock.bulkWrite(updates);
    }

    revalidatePath("/dashboard", "layout");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
