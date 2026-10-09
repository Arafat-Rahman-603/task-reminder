"use server";

import dbConnect from "@/lib/db";
import WorkspaceInvitation from "@/models/WorkspaceInvitation";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

// Returns a secure random token and its hash
function generateToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

export async function createInvitation(data: { workspaceId: string; role: 'admin' | 'member' | 'viewer'; maxUses?: number; expiresInDays?: number }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  await dbConnect();

  // Verify the current user is owner or admin
  const membership = await WorkspaceMembership.findOne({ workspaceId: data.workspaceId, userId });
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error("Unauthorized to create invitations");
  }

  const { token, tokenHash } = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7));

  await WorkspaceInvitation.create({
    workspaceId: data.workspaceId,
    tokenHash,
    role: data.role,
    expiresAt,
    createdBy: userId,
    maxUses: data.maxUses || 1,
  });

  return { success: true, token };
}

export async function acceptInvitation(token: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  await dbConnect();

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const invitation = await WorkspaceInvitation.findOne({ tokenHash });
  if (!invitation) throw new Error("Invalid or expired invitation");

  if (invitation.maxUses && invitation.uses >= invitation.maxUses) {
    throw new Error("Invitation usage limit reached");
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error("Invitation has expired");
  }

  // Check if already a member
  const existing = await WorkspaceMembership.findOne({ workspaceId: invitation.workspaceId, userId });
  if (existing) {
    return { success: true, workspaceId: invitation.workspaceId.toString(), message: "Already a member" };
  }

  // Check plan limits
  const Workspace = (await import("@/models/Workspace")).default;
  const workspace = await Workspace.findById(invitation.workspaceId);
  const currentMembers = await WorkspaceMembership.countDocuments({ workspaceId: invitation.workspaceId });
  const { PLAN_LIMITS } = await import("@/config/plans");
  const plan = workspace?.subscription?.plan || "free";
  // @ts-ignore
  const limit = PLAN_LIMITS[plan]?.maxMembers || 1;
  if (currentMembers >= limit) {
    throw new Error("Workspace member limit reached for current plan");
  }

  // Add membership
  await WorkspaceMembership.create({
    workspaceId: invitation.workspaceId,
    userId,
    role: invitation.role,
  });

  // Update uses
  invitation.uses += 1;
  await invitation.save();

  try {
    const { Notification } = await import("@/models/Notification");
    const Workspace = (await import("@/models/Workspace")).default;
    const ws = await Workspace.findById(invitation.workspaceId);
    if (ws) {
      await Notification.create({
        userId: ws.ownerId,
        type: "WORKSPACE_INVITE",
        title: "New Workspace Member",
        body: "A new user has joined your workspace: ",
        entityType: "SYSTEM",
      });
    }
  } catch (e) {
    // Ignore notification errors
  }

  return { success: true, workspaceId: invitation.workspaceId.toString() };
}

export async function getActiveInvitations(workspaceId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  await dbConnect();

  // Verify current user has access
  const membership = await WorkspaceMembership.findOne({ workspaceId, userId });
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return [];
  }

  const invites = await WorkspaceInvitation.find({ 
    workspaceId,
    expiresAt: { $gt: new Date() },
    $expr: {
      $or: [
        { $eq: ["$maxUses", null] },
        { $lt: ["$uses", "$maxUses"] }
      ]
    }
  }).populate('createdBy', 'name email').sort({ createdAt: -1 }).lean();

  return JSON.parse(JSON.stringify(invites));
}

export async function revokeInvitation(invitationId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  await dbConnect();

  const invite = await WorkspaceInvitation.findById(invitationId);
  if (!invite) throw new Error("Invitation not found");

  const membership = await WorkspaceMembership.findOne({ workspaceId: invite.workspaceId, userId });
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error("Unauthorized to revoke invitations");
  }

  await WorkspaceInvitation.findByIdAndDelete(invitationId);
  return { success: true };
}


