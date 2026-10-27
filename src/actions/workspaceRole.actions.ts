"use server";

import dbConnect from "@/lib/db";
import WorkspaceRole from "@/models/WorkspaceRole";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import AuditLog from "@/models/AuditLog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Types } from "mongoose";
import { IWorkspacePermissions, getDefaultPermissions } from "@/lib/workspacePermissions";

export async function getWorkspaceRoles(workspaceId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  const currentUserId = session.user.id;

  await dbConnect();

  // Verify caller belongs to this workspace
  const membership = await WorkspaceMembership.findOne({ workspaceId, userId: currentUserId });
  if (!membership) {
    throw new Error("You are not a member of this workspace");
  }

  const roles = await WorkspaceRole.find({ workspaceId })
    .populate("createdBy", "name email")
    .sort({ createdAt: 1 })
    .lean();

  // Get member counts for each role
  const rolesWithCount = await Promise.all(
    roles.map(async (r) => {
      const memberCount = await WorkspaceMembership.countDocuments({
        workspaceId,
        customRoleId: r._id,
        status: { $ne: "suspended" }
      });
      return {
        ...r,
        _id: r._id.toString(),
        workspaceId: r.workspaceId.toString(),
        memberCount,
      };
    })
  );

  return JSON.parse(JSON.stringify(rolesWithCount));
}

export async function createWorkspaceRole(data: {
  workspaceId: string;
  name: string;
  description?: string;
  color?: string;
  baseRole: "admin" | "member" | "viewer";
  permissions: IWorkspacePermissions;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (session.user as any).id;

  await dbConnect();

  // Verify caller is owner or admin
  const membership = await WorkspaceMembership.findOne({ workspaceId: data.workspaceId, userId: currentUserId });
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Unauthorized: Only workspace owners and admins can create custom roles");
  }

  const trimmedName = data.name.trim();
  if (!trimmedName || trimmedName.length > 50) {
    throw new Error("Role name must be between 1 and 50 characters");
  }

  // Check name uniqueness in this workspace
  const existing = await WorkspaceRole.findOne({
    workspaceId: data.workspaceId,
    name: { $regex: new RegExp(`^${trimmedName}$`, "i") }
  });
  if (existing) {
    throw new Error(`A role named "${trimmedName}" already exists in this workspace`);
  }

  const role = await WorkspaceRole.create({
    workspaceId: data.workspaceId,
    name: trimmedName,
    description: (data.description || "").trim(),
    color: data.color || "emerald",
    baseRole: data.baseRole || "member",
    permissions: data.permissions || getDefaultPermissions(data.baseRole || "member"),
    createdBy: currentUserId,
  });

  try {
    await AuditLog.create({
      userId: currentUserId,
      workspaceId: new Types.ObjectId(data.workspaceId),
      action: "ROLE_CREATE",
      entityType: "WorkspaceRole",
      entityId: role._id,
      details: {
        roleName: trimmedName,
        baseRole: data.baseRole,
        color: data.color,
      }
    });
  } catch {
    // Audit log should not block role creation
  }

  return { success: true, role: JSON.parse(JSON.stringify(role)) };
}

export async function updateWorkspaceRole(data: {
  workspaceId: string;
  roleId: string;
  name: string;
  description?: string;
  color?: string;
  permissions: IWorkspacePermissions;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (session.user as any).id;

  await dbConnect();

  const membership = await WorkspaceMembership.findOne({ workspaceId: data.workspaceId, userId: currentUserId });
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Unauthorized: Only workspace owners and admins can update custom roles");
  }

  const role = await WorkspaceRole.findOne({ _id: data.roleId, workspaceId: data.workspaceId });
  if (!role) {
    throw new Error("Custom role not found");
  }

  const trimmedName = data.name.trim();
  if (!trimmedName || trimmedName.length > 50) {
    throw new Error("Role name must be between 1 and 50 characters");
  }

  // Check unique name if changed
  if (role.name.toLowerCase() !== trimmedName.toLowerCase()) {
    const existing = await WorkspaceRole.findOne({
      workspaceId: data.workspaceId,
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
      _id: { $ne: role._id }
    });
    if (existing) {
      throw new Error(`A role named "${trimmedName}" already exists`);
    }
  }

  role.name = trimmedName;
  role.description = (data.description || "").trim();
  if (data.color) role.color = data.color;
  role.permissions = data.permissions;
  await role.save();

  // Synchronize all active members assigned to this custom role
  await WorkspaceMembership.updateMany(
    { workspaceId: data.workspaceId, customRoleId: role._id },
    {
      $set: {
        customRoleName: role.name,
        permissions: role.permissions,
      }
    }
  );

  try {
    await AuditLog.create({
      userId: currentUserId,
      workspaceId: new Types.ObjectId(data.workspaceId),
      action: "ROLE_UPDATE",
      entityType: "WorkspaceRole",
      entityId: role._id,
      details: {
        roleName: trimmedName,
      }
    });
  } catch {
    // Ignore audit log error
  }

  return { success: true, role: JSON.parse(JSON.stringify(role)) };
}

export async function deleteWorkspaceRole(workspaceId: string, roleId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (session.user as any).id;

  await dbConnect();

  const membership = await WorkspaceMembership.findOne({ workspaceId, userId: currentUserId });
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Unauthorized: Only workspace owners and admins can delete custom roles");
  }

  const role = await WorkspaceRole.findOne({ _id: roleId, workspaceId });
  if (!role) {
    throw new Error("Custom role not found");
  }

  // Reassign all members of this custom role back to base role defaults safely
  const fallbackPermissions = getDefaultPermissions(role.baseRole);
  await WorkspaceMembership.updateMany(
    { workspaceId, customRoleId: role._id },
    {
      $set: {
        role: role.baseRole,
        permissions: fallbackPermissions,
      },
      $unset: {
        customRoleId: 1,
        customRoleName: 1,
      }
    }
  );

  await WorkspaceRole.deleteOne({ _id: role._id });

  try {
    await AuditLog.create({
      userId: currentUserId,
      workspaceId: new Types.ObjectId(workspaceId),
      action: "ROLE_DELETE",
      entityType: "WorkspaceRole",
      entityId: role._id,
      details: {
        deletedRoleName: role.name,
        fallbackRole: role.baseRole,
      }
    });
  } catch {
    // Ignore audit log error
  }

  return { success: true };
}
