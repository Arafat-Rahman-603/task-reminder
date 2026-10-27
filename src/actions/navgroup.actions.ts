"use server";

import dbConnect from "@/lib/db";
import NavigationGroup from "@/models/NavigationGroup";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const serializeDoc = (doc: unknown) => JSON.parse(JSON.stringify(doc));

// Create a new empty group
export async function createNavGroup(name: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    const userId = session.user.id;

    const count = await NavigationGroup.countDocuments({ userId });

    const newGroup = await NavigationGroup.create({
      userId,
      name,
      sortOrder: count,
      items: []
    });

    revalidatePath("/dashboard");
    return { success: true, group: serializeDoc(newGroup) };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

interface NavGroupInputItem { id: string; type?: string; label: string; href: string; isHidden?: boolean; }
interface NavGroupInput { name: string; isCollapsed?: boolean; items: NavGroupInputItem[]; }
export async function updateNavGroupsBatch(groups: NavGroupInput[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    const userId = session.user.id;

    // Delete all existing groups for this user to ensure clean state
    await NavigationGroup.deleteMany({ userId });

    // Prepare all groups for insertion
    const newGroups = groups.map((g, i) => ({
      userId,
      name: g.name,
      sortOrder: i,
      isCollapsed: g.isCollapsed || false,
      items: g.items.map((item: NavGroupInputItem, itemIdx: number) => ({
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
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

export async function deleteNavGroup(groupId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    const userId = session.user.id;

    await NavigationGroup.findOneAndDelete({ _id: groupId, userId });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

export async function resetNavGroups() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    const userId = session.user.id;

    await NavigationGroup.deleteMany({ userId });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}
