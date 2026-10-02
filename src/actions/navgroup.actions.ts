"use server";

import dbConnect from "@/lib/db";
import NavigationGroup from "@/models/NavigationGroup";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeDoc = (doc: any) => JSON.parse(JSON.stringify(doc));

// Create a new empty group
export async function createNavGroup(name: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const count = await NavigationGroup.countDocuments({ userId });

    const newGroup = await NavigationGroup.create({
      userId,
      name,
      sortOrder: count,
      items: []
    });

    revalidatePath("/dashboard");
    return { success: true, group: serializeDoc(newGroup) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateNavGroupsBatch(groups: any[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    // Delete all existing groups for this user to ensure clean state
    await NavigationGroup.deleteMany({ userId });

    // Prepare all groups for insertion
    const newGroups = groups.map((g, i) => ({
      userId,
      name: g.name,
      sortOrder: i,
      isCollapsed: g.isCollapsed || false,
      items: g.items.map((item: any, itemIdx: number) => ({
        id: item.id,
        type: item.type,
        label: item.label,
        href: item.href,
        sortOrder: itemIdx,
        isHidden: item.isHidden || false
      }))
    }));

    if (newGroups.length > 0) {
      await NavigationGroup.insertMany(newGroups);
    }

    revalidatePath("/dashboard");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteNavGroup(groupId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    await NavigationGroup.findOneAndDelete({ _id: groupId, userId });

    revalidatePath("/dashboard");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetNavGroups() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    await NavigationGroup.deleteMany({ userId });

    revalidatePath("/dashboard");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
