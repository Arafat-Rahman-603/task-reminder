import { Types } from "mongoose";

export type ItemVisibility = "workspace" | "private" | "restricted";
export type ItemEditableBy = "workspace" | "creator_only" | "restricted";

export interface PermissionItem {
  userId: any;
  visibility?: ItemVisibility;
  visibleToMembers?: any[];
  editableBy?: ItemEditableBy;
  editableByMembers?: any[];
}

/**
 * Checks whether the current user has permission to view an item.
 * - Workspace owners and admins can view all items in the workspace.
 * - The creator (userId) can always view their own items.
 * - 'workspace' visibility (or legacy items with no visibility set) is visible to all active workspace members.
 * - 'restricted' is visible to creator, admins, and members explicitly in visibleToMembers.
 * - 'private' is only visible to the creator, owner, and admins.
 */
export function canUserViewItem({
  item,
  userId,
  userRole,
}: {
  item: PermissionItem;
  userId: string;
  userRole?: string;
}): boolean {
  if (userRole === "owner" || userRole === "admin") return true;
  const creatorId = String(item.userId?._id || item.userId || "");
  if (creatorId && creatorId === userId) return true;

  const visibility: ItemVisibility = item.visibility || "workspace";
  if (visibility === "workspace") return true;

  if (visibility === "restricted") {
    const allowed = (item.visibleToMembers || []).map((m: any) =>
      String(m?._id || m)
    );
    return allowed.includes(userId);
  }

  // 'private'
  return false;
}

/**
 * Checks whether the current user has permission to edit or delete an item.
 * - Viewers can NEVER edit or delete items.
 * - Workspace owners and admins can edit and delete items.
 * - The creator (userId) can always edit and delete their own items.
 * - 'workspace' editableBy (or legacy items) can be edited by any workspace member who can view it.
 * - 'restricted' can be edited by members explicitly in editableByMembers, creator, and admins.
 * - 'creator_only' can only be edited by creator, owner, and admins.
 */
export function canUserEditItem({
  item,
  userId,
  userRole,
}: {
  item: PermissionItem;
  userId: string;
  userRole?: string;
}): boolean {
  if (userRole === "viewer") return false;
  if (userRole === "owner" || userRole === "admin") return true;
  const creatorId = String(item.userId?._id || item.userId || "");
  if (creatorId && creatorId === userId) return true;

  const editableBy: ItemEditableBy = item.editableBy || "workspace";
  if (editableBy === "workspace") return true;

  if (editableBy === "restricted") {
    const allowed = (item.editableByMembers || []).map((m: any) =>
      String(m?._id || m)
    );
    return allowed.includes(userId);
  }

  // 'creator_only'
  return false;
}

/**
 * Builds a MongoDB filter clause that restricts queries based on user visibility.
 */
export function buildVisibilityMongoFilter(userId: string, userRole?: string) {
  if (userRole === "owner" || userRole === "admin") {
    return {};
  }

  const userObjId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;

  const conditions: any[] = [
    { userId: userObjId || userId },
    { visibility: "workspace" },
    { visibility: { $exists: false } },
    { visibility: null },
  ];

  if (userObjId) {
    conditions.push({
      visibility: "restricted",
      visibleToMembers: userObjId,
    });
  }

  return { $or: conditions };
}
