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
    .filter((m: any) => m.workspaceId != null) // Avoid orphan memberships
    .map((m: any) => ({
      _id: m.workspaceId._id.toString(),
      name: m.workspaceId.name,
      type: m.workspaceId.type,
      role: m.role,
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
