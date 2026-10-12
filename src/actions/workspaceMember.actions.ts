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

  const members = await WorkspaceMembership.find({ workspaceId, status: { $ne: "suspended" } })
    .populate("userId", "name email image")
    .sort({ role: 1, joinedAt: 1 })
    .lean();

  const flattened = (members as any[]).map((m) => ({
    ...m,
    name: m.userId?.name,
    email: m.userId?.email,
    image: m.userId?.image,
  }));

  return JSON.parse(JSON.stringify(flattened));
}

export async function updateMemberRole(
  workspaceId: string, 
  targetUserId: string, 
  newRole: Role, 
  customPermissions?: IWorkspacePermissions
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
  targetMembership.role = newRole;
  targetMembership.permissions = customPermissions || getDefaultPermissions(newRole);
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
        newRole,
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
