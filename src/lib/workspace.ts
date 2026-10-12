import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import Workspace from "@/models/Workspace";
import dbConnect from "@/lib/db";
import { Types } from "mongoose";

import {
  Role,
  IWorkspacePermissions,
  getDefaultPermissions,
  hasModulePermission,
  roleHierarchy,
  hasPermission,
} from "./workspacePermissions";

export * from "./workspacePermissions";


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
