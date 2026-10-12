import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import Workspace from "@/models/Workspace";
import dbConnect from "@/lib/db";
import { Types } from "mongoose";

export type Role = "owner" | "admin" | "member" | "viewer";

export interface IWorkspacePermissions {
  tasks?: { view?: boolean; create?: boolean; edit?: boolean; delete?: boolean; assign?: boolean };
  projects?: { view?: boolean; create?: boolean; edit?: boolean; delete?: boolean };
  routines?: { view?: boolean; manage?: boolean };
  customSections?: { view?: boolean; manage?: boolean };
  files?: { view?: boolean; upload?: boolean };
  members?: { view?: boolean; manage?: boolean };
  settings?: { manage?: boolean };
  auditLogs?: { view?: boolean };
}

export function getDefaultPermissions(role: Role): IWorkspacePermissions {
  if (role === "owner" || role === "admin") {
    return {
      tasks: { view: true, create: true, edit: true, delete: true, assign: true },
      projects: { view: true, create: true, edit: true, delete: true },
      routines: { view: true, manage: true },
      customSections: { view: true, manage: true },
      files: { view: true, upload: true },
      members: { view: true, manage: true },
      settings: { manage: role === "owner" },
      auditLogs: { view: true },
    };
  }

  if (role === "member") {
    return {
      tasks: { view: true, create: true, edit: true, delete: false, assign: true },
      projects: { view: true, create: true, edit: true, delete: false },
      routines: { view: true, manage: true },
      customSections: { view: true, manage: true },
      files: { view: true, upload: true },
      members: { view: true, manage: false },
      settings: { manage: false },
      auditLogs: { view: false },
    };
  }

  // viewer
  return {
    tasks: { view: true, create: false, edit: false, delete: false, assign: false },
    projects: { view: true, create: false, edit: false, delete: false },
    routines: { view: true, manage: false },
    customSections: { view: true, manage: false },
    files: { view: true, upload: false },
    members: { view: true, manage: false },
    settings: { manage: false },
    auditLogs: { view: false },
  };
}

export function hasModulePermission(
  membership: { role: string; permissions?: IWorkspacePermissions | null },
  module: keyof IWorkspacePermissions,
  action: string
): boolean {
  if (membership.role === "owner") return true;

  // If custom permissions exist for this module, consult them
  if (membership.permissions && membership.permissions[module]) {
    const modPerms = membership.permissions[module] as Record<string, boolean | undefined>;
    if (typeof modPerms[action] === "boolean") {
      return !!modPerms[action];
    }
  }

  // Fallback to role defaults
  const defaults = getDefaultPermissions(membership.role as Role);
  const modDefaults = defaults[module] as Record<string, boolean | undefined>;
  return !!modDefaults?.[action];
}

const roleHierarchy: Record<Role, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}

export async function ensurePersonalWorkspace(userId: string) {
  await dbConnect();
  const userObjId = new Types.ObjectId(userId);
  let ws = await Workspace.findOne({ ownerId: userObjId, type: "personal" });
  
  if (!ws) {
    try {
      ws = await Workspace.create({
        name: "Personal Workspace",
        type: "personal",
        ownerId: userObjId,
      });
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 11000) { // Duplicate key error from the partial index
        ws = await Workspace.findOne({ ownerId: userObjId, type: "personal" });
      } else {
        throw err;
      }
    }
  }

  if (ws) {
    const membership = await WorkspaceMembership.findOne({ workspaceId: ws._id, userId: userObjId });
    if (!membership) {
      try {
        await WorkspaceMembership.create({
          workspaceId: ws._id,
          userId: userObjId,
          role: "owner",
          permissions: getDefaultPermissions("owner"),
          status: "active",
        });
      } catch (err: unknown) {
        if ((err as { code?: number }).code !== 11000) throw err;
      }
    }
  }

  return ws;
}

export async function verifyWorkspaceAccess(
  workspaceId: string, 
  requiredRole: Role = "viewer",
  requiredModule?: keyof IWorkspacePermissions,
  requiredAction?: string
) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (!Types.ObjectId.isValid(workspaceId)) {
    throw new Error("Invalid workspace ID");
  }

  const membership = await WorkspaceMembership.findOne({
    workspaceId: new Types.ObjectId(workspaceId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userId: new Types.ObjectId((session.user as any).id)
  });

  if (!membership) {
    throw new Error("Not a member of this workspace");
  }

  if (membership.status === "suspended") {
    throw new Error("Workspace membership is suspended");
  }

  if (!hasPermission(membership.role as Role, requiredRole)) {
    throw new Error("Insufficient role permissions");
  }

  if (requiredModule && requiredAction) {
    if (!hasModulePermission(membership, requiredModule, requiredAction)) {
      throw new Error(`Insufficient permissions: cannot ${requiredAction} on ${requiredModule}`);
    }
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return { membership, user: session.user, workspace };
}
