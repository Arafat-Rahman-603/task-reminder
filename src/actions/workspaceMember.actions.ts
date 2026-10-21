"use server";

import dbConnect from "@/lib/db";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import Workspace from "@/models/Workspace";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, IWorkspacePermissions, getDefaultPermissions } from "@/lib/workspace";
import AuditLog from "@/models/AuditLog";
import { Types } from "mongoose";

export async function getWorkspaceMembers(workspaceId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (session.user as any).id;

  await dbConnect();

  // Verify caller is a member
  const callerMembership = await WorkspaceMembership.findOne({ workspaceId, userId: currentUserId });
  if (!callerMembership) {
    throw new Error("You are not a member of this workspace");
  }

  // Ensure User model is loaded for populate
  void User;

  const members = await WorkspaceMembership.find({ workspaceId })
    .populate("userId", "name email image avatarUrl avatarPublicId")
    .sort({ role: 1, joinedAt: 1 })
    .lean();

  const flattened = (members as any[]).map((m) => {
    const user = m.userId;
    const resolvedAvatar = user?.avatarUrl || (user?.avatarPublicId ? `/api/assets/${user.avatarPublicId}?resourceType=image` : user?.image) || null;
    return {
      ...m,
      name: user?.name,
      email: user?.email,
      image: resolvedAvatar,
      avatarUrl: user?.avatarUrl || null,
      avatarPublicId: user?.avatarPublicId || null,
      status: m.status || "active",
      userId: user ? {
        ...user,
        image: resolvedAvatar,
        avatarUrl: user.avatarUrl || null,
        avatarPublicId: user.avatarPublicId || null,
      } : m.userId,
    };
  });

  return JSON.parse(JSON.stringify(flattened));
}

export async function updateMemberRole(
  workspaceId: string, 
  targetUserId: string, 
  newRole: Role, 
  customPermissions?: IWorkspacePermissions,
  customRoleId?: string | null
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (session.user as any).id;

  if (currentUserId === targetUserId) {
    throw new Error("You cannot change your own role");
  }

  await dbConnect();

  // Verify caller permissions
  const callerMembership = await WorkspaceMembership.findOne({ workspaceId, userId: currentUserId });
  if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
    throw new Error("Unauthorized: Only workspace owners and admins can manage member roles");
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace || workspace.isArchived) {
    throw new Error("Workspace not found or archived");
  }

  // Invariant: Workspace owner's role cannot be modified by anyone
  if (workspace.ownerId.toString() === targetUserId) {
    throw new Error("The workspace owner's role cannot be modified");
  }

  // Admin cannot promote anyone to owner
  if (newRole === "owner" && callerMembership.role !== "owner") {
    throw new Error("Only the current workspace owner can transfer ownership");
  }

  const targetMembership = await WorkspaceMembership.findOne({ workspaceId, userId: targetUserId });
  if (!targetMembership) {
    throw new Error("Member not found in this workspace");
  }

  // Admin cannot modify another admin or owner
  if (callerMembership.role === "admin" && ["owner", "admin"].includes(targetMembership.role)) {
    throw new Error("Admins cannot modify the role of other admins or the workspace owner");
  }

  const prevRole = targetMembership.role;

  if (customRoleId) {
    const WorkspaceRole = (await import("@/models/WorkspaceRole")).default;
    const roleDoc = await WorkspaceRole.findOne({ _id: customRoleId, workspaceId });
    if (!roleDoc) {
      throw new Error("Custom role not found");
    }
    targetMembership.role = roleDoc.baseRole;
    targetMembership.customRoleId = roleDoc._id;
    targetMembership.customRoleName = roleDoc.name;
    targetMembership.permissions = roleDoc.permissions;
  } else {
    targetMembership.role = newRole;
    targetMembership.customRoleId = null;
    targetMembership.customRoleName = null;
    targetMembership.permissions = customPermissions || getDefaultPermissions(newRole);
  }

  await targetMembership.save();

  // Audit Log
  try {
    await AuditLog.create({
      userId: currentUserId,
      workspaceId: new Types.ObjectId(workspaceId),
      action: "MEMBER_ROLE_UPDATE",
      entityType: "WorkspaceMembership",
      entityId: targetMembership._id,
      details: {
        targetUserId,
        previousRole: prevRole,
        newRole: targetMembership.role,
        customRoleId: targetMembership.customRoleId,
        customRoleName: targetMembership.customRoleName,
        hasCustomPermissions: !!customPermissions,
      }
    });
  } catch (e) {
    // Ignore audit log error
  }

  return { success: true };
}

export async function removeWorkspaceMember(workspaceId: string, targetUserId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (session.user as any).id;

  await dbConnect();

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace || workspace.isArchived) {
    throw new Error("Workspace not found or archived");
  }

  // Invariant: Workspace OWNER cannot be removed!
  if (workspace.ownerId.toString() === targetUserId) {
    throw new Error("The workspace owner cannot be removed from their workspace");
  }

  const callerMembership = await WorkspaceMembership.findOne({ workspaceId, userId: currentUserId });
  if (!callerMembership) {
    throw new Error("Unauthorized");
  }

  // If removing someone else, must be owner or admin
  const isSelfLeaving = currentUserId === targetUserId;
  if (!isSelfLeaving && !["owner", "admin"].includes(callerMembership.role)) {
    throw new Error("Unauthorized: Only workspace owners and admins can remove members");
  }

  const targetMembership = await WorkspaceMembership.findOne({ workspaceId, userId: targetUserId });
  if (!targetMembership) {
    throw new Error("Member not found in this workspace");
  }

  // Admin cannot remove another admin
  if (!isSelfLeaving && callerMembership.role === "admin" && targetMembership.role === "admin") {
    throw new Error("Admins cannot remove other admins");
  }

  await WorkspaceMembership.findByIdAndDelete(targetMembership._id);

  // Audit Log
  try {
    await AuditLog.create({
      userId: currentUserId,
      workspaceId: new Types.ObjectId(workspaceId),
      action: "MEMBER_REMOVE",
      entityType: "WorkspaceMembership",
      details: {
        targetUserId,
        isSelfLeaving,
      }
    });
  } catch (e) {
    // Ignore audit log error
  }

  return { success: true };
}

export async function toggleMemberStatus(
  workspaceId: string,
  targetUserId: string,
  newStatus: "active" | "suspended"
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (session.user as any).id;

  if (currentUserId === targetUserId) {
    throw new Error("You cannot change your own membership status");
  }

  await dbConnect();

  const callerMembership = await WorkspaceMembership.findOne({ workspaceId, userId: currentUserId });
  if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
    throw new Error("Unauthorized: Only workspace owners and admins can suspend or activate members");
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace || workspace.isArchived) {
    throw new Error("Workspace not found or archived");
  }

  // Workspace owner cannot be suspended
  if (workspace.ownerId.toString() === targetUserId) {
    throw new Error("The workspace owner cannot be suspended");
  }

  const targetMembership = await WorkspaceMembership.findOne({ workspaceId, userId: targetUserId });
  if (!targetMembership) {
    throw new Error("Member not found in this workspace");
  }

  if (callerMembership.role === "admin" && ["owner", "admin"].includes(targetMembership.role)) {
    throw new Error("Admins cannot change the status of other admins or the workspace owner");
  }

  targetMembership.status = newStatus;
  await targetMembership.save();

  try {
    await AuditLog.create({
      userId: currentUserId,
      workspaceId: new Types.ObjectId(workspaceId),
      action: "UPDATE",
      entityType: "WorkspaceMembership",
      entityId: targetMembership._id,
      details: {
        action: "MEMBER_STATUS_CHANGE",
        targetUserId,
        newStatus,
      },
    });
  } catch (e) {
    // Ignore audit log error
  }

  return { success: true, status: newStatus };
}

export async function transferWorkspaceOwnership(
  workspaceId: string,
  newOwnerUserId: string
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (session.user as any).id;

  if (currentUserId === newOwnerUserId) {
    throw new Error("You are already the owner of this workspace");
  }

  await dbConnect();

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace || workspace.isArchived) {
    throw new Error("Workspace not found or archived");
  }

  if (workspace.ownerId.toString() !== currentUserId) {
    throw new Error("Only the current workspace owner can transfer ownership");
  }

  const targetMembership = await WorkspaceMembership.findOne({
    workspaceId,
    userId: newOwnerUserId,
  });

  if (!targetMembership) {
    throw new Error("Target user is not a member of this workspace");
  }

  if (targetMembership.status === "suspended") {
    throw new Error("Cannot transfer ownership to a suspended member");
  }

  // 1. Update workspace ownerId
  workspace.ownerId = new Types.ObjectId(newOwnerUserId);
  await workspace.save();

  // 2. Demote current owner to admin
  const currentOwnerMembership = await WorkspaceMembership.findOne({
    workspaceId,
    userId: currentUserId,
  });
  if (currentOwnerMembership) {
    currentOwnerMembership.role = "admin";
    currentOwnerMembership.permissions = getDefaultPermissions("admin");
    await currentOwnerMembership.save();
  }

  // 3. Promote target user to owner
  targetMembership.role = "owner";
  targetMembership.permissions = getDefaultPermissions("owner");
  await targetMembership.save();

  // 4. Record Audit Log
  try {
    await AuditLog.create({
      userId: currentUserId,
      workspaceId: new Types.ObjectId(workspaceId),
      action: "SETTINGS_CHANGE",
      entityType: "Workspace",
      entityId: workspace._id,
      details: {
        action: "WORKSPACE_OWNERSHIP_TRANSFERRED",
        previousOwnerId: currentUserId,
        newOwnerId: newOwnerUserId,
      },
    });
  } catch (e) {
    // Ignore audit log error
  }

  // 5. Notify the new owner
  try {
    const { Notification } = await import("@/models/Notification");
    await Notification.create({
      userId: newOwnerUserId,
      type: "SYSTEM_ALERT",
      title: "Workspace Ownership Transferred",
      body: `You are now the Owner of "${workspace.name}".`,
      message: `You are now the Owner of "${workspace.name}".`,
      url: "/dashboard/settings",
      link: "/dashboard/settings",
      status: "SENT",
      sentAt: new Date(),
    });
  } catch (e) {
    // Ignore notification error
  }

  return { success: true };
}
