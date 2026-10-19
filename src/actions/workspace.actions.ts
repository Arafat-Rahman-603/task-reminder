"use server";

import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import Workspace from "@/models/Workspace";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function setActiveWorkspace(workspaceId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  await dbConnect();
  
  // Verify membership
  const membership = await WorkspaceMembership.findOne({ workspaceId, userId });
  if (!membership) {
    throw new Error("Not a member of this workspace");
  }

  (await cookies()).set("activeWorkspaceId", workspaceId, { path: "/", httpOnly: true, sameSite: "lax" });
  return { success: true };
}

export async function getActiveWorkspaceInfo() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  await dbConnect();
  
  // Get all memberships
  let memberships = await WorkspaceMembership.find({ userId }).populate("workspaceId").lean();
  
  if (!memberships.some((m: any) => m.workspaceId?.type === "personal")) {
    const { ensurePersonalWorkspace } = await import('@/lib/workspace');
    await ensurePersonalWorkspace(userId);
    memberships = await WorkspaceMembership.find({ userId }).populate("workspaceId").lean();
  }
  
  const workspaces = memberships
    .filter((m: any) => m.workspaceId != null && !m.workspaceId.isArchived) // Avoid orphan & archived memberships
    .map((m: any) => ({
      _id: m.workspaceId._id.toString(),
      name: m.workspaceId.name,
      type: m.workspaceId.type,
      role: m.role,
      subscription: m.workspaceId.subscription || { plan: "free" },
    }));

  let activeId = (await cookies()).get("activeWorkspaceId")?.value;
  
  // Validate activeId is in the user's workspaces
  if (!activeId || !workspaces.find(w => w._id === activeId)) {
    // Default to personal workspace
    const personal = workspaces.find(w => w.type === "personal");
    activeId = personal ? personal._id : (workspaces[0]?._id || null);
  }

  const activeWorkspace = workspaces.find(w => w._id === activeId);

  return { workspaces, activeWorkspace };
}

export async function createWorkspace(data: { name: string; description?: string }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  if (!data.name || data.name.trim().length === 0) {
    throw new Error("Workspace name is required");
  }

  await dbConnect();

  // Create Workspace
  const workspace = await Workspace.create({
    name: data.name.trim(),
    description: data.description?.trim(),
    ownerId: userId,
    type: "team",
  });

  // Create Membership
  await WorkspaceMembership.create({
    workspaceId: workspace._id,
    userId: userId,
    role: "owner",
  });

  // Automatically switch to it
  (await cookies()).set("activeWorkspaceId", workspace._id.toString(), { path: "/", httpOnly: true, sameSite: "lax" });

  return { success: true, workspaceId: workspace._id.toString() };
}

export async function renameWorkspace(workspaceId: string, newName: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  const trimmed = newName?.trim();
  if (!trimmed || trimmed.length < 2 || trimmed.length > 60) {
    throw new Error("Workspace name must be between 2 and 60 characters.");
  }

  await dbConnect();
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new Error("Workspace not found.");

  // Check permission: Must be owner
  const membership = await WorkspaceMembership.findOne({ workspaceId, userId });
  if (!membership || membership.role !== "owner") {
    throw new Error("Only the workspace owner can rename this workspace.");
  }

  workspace.name = trimmed;
  await workspace.save();

  return { success: true, name: trimmed };
}

export async function archiveWorkspace(workspaceId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  await dbConnect();
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new Error("Workspace not found.");

  if (workspace.type === "personal") {
    throw new Error("Personal Workspace cannot be archived or deleted.");
  }

  if (workspace.ownerId.toString() !== userId.toString()) {
    throw new Error("Only the workspace owner can archive this workspace.");
  }

  workspace.isArchived = true;
  workspace.archivedAt = new Date();
  await workspace.save();

  // Find personal workspace to switch to
  const personalWorkspace = await Workspace.findOne({ ownerId: userId, type: "personal" });
  const fallbackId = personalWorkspace ? personalWorkspace._id.toString() : null;

  if (fallbackId) {
    (await cookies()).set("activeWorkspaceId", fallbackId, { path: "/", httpOnly: true, sameSite: "lax" });
  }

  return { success: true, switchedToWorkspaceId: fallbackId };
}

export async function deleteWorkspace(workspaceId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  await dbConnect();
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new Error("Workspace not found.");

  if (workspace.type === "personal") {
    throw new Error("Personal Workspace cannot be archived or deleted.");
  }

  if (workspace.ownerId.toString() !== userId.toString()) {
    throw new Error("Only the workspace owner can delete this workspace.");
  }

  // Delete memberships and invitations for this workspace
  await WorkspaceMembership.deleteMany({ workspaceId });
  const WorkspaceInvitation = (await import("@/models/WorkspaceInvitation")).default;
  await WorkspaceInvitation.deleteMany({ workspaceId });

  // Delete workspace
  await Workspace.findByIdAndDelete(workspaceId);

  // Switch to personal workspace
  const personalWorkspace = await Workspace.findOne({ ownerId: userId, type: "personal" });
  const fallbackId = personalWorkspace ? personalWorkspace._id.toString() : null;

  if (fallbackId) {
    (await cookies()).set("activeWorkspaceId", fallbackId, { path: "/", httpOnly: true, sameSite: "lax" });
  }

  return { success: true, switchedToWorkspaceId: fallbackId };
}

export async function requestUpgrade(workspaceId: string, plan: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // @ts-ignore
  const userId = session.user.id;

  await dbConnect();
  const WorkspaceMembership = (await import("@/models/WorkspaceMembership")).default;
  const membership = await WorkspaceMembership.findOne({ workspaceId, userId });
  if (!membership || membership.role !== "owner") {
    throw new Error("Only the workspace owner can request an upgrade");
  }

  const UpgradeRequest = (await import("@/models/UpgradeRequest")).default;
  const existing = await UpgradeRequest.findOne({ workspaceId, status: "pending" });
  if (existing) {
    throw new Error("An upgrade request is already pending");
  }

  await UpgradeRequest.create({
    workspaceId,
    requestedBy: userId,
    requestedPlan: plan,
  });

  return { success: true };
}
