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

// Update entire groups array (for reordering, moving items)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateNavGroupsBatch(groups: any[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    // Check if these are the default groups being saved for the first time
    const areDefaults = groups.some(g => g._id && String(g._id).startsWith('default-'));
    
    if (areDefaults) {
      // Prevent duplicating defaults if they fire multiple times quickly
      await NavigationGroup.deleteMany({ userId });
      // First save of defaults: convert to real records
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        await NavigationGroup.create({
          userId,
          name: g.name,
          sortOrder: i,
          isCollapsed: g.isCollapsed || false,
          items: g.items.map((item: any, itemIdx: number) => ({
            ...item,
            sortOrder: itemIdx
          }))
        });
      }
    } else {
      // Bulk update existing groups
      const updates = groups.map((g, index) => ({
        updateOne: {
          filter: { _id: g._id, userId },
          update: { 
            $set: { 
              sortOrder: index,
              name: g.name,
              items: g.items.map((item: any, itemIdx: number) => ({
                id: item.id,
                type: item.type,
                label: item.label,
                href: item.href,
                sortOrder: itemIdx,
                isHidden: item.isHidden || false
              }))
            } 
          }
        }
      }));

      if (updates.length > 0) {
        await NavigationGroup.bulkWrite(updates);
      }
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
