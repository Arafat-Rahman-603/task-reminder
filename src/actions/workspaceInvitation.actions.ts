"use server";

import dbConnect from "@/lib/db";
import WorkspaceInvitation from "@/models/WorkspaceInvitation";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import Workspace from "@/models/Workspace";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";
import { cookies } from "next/headers";

// Returns a secure random token and its hash
function generateToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

export async function createInvitation(data: { 
  workspaceId: string; 
  role: 'admin' | 'member' | 'viewer'; 
  email?: string;
  permissions?: Record<string, any>;
  maxUses?: number; 
  expiresInDays?: number 
}) {
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

  const normalizedEmail = data.email ? data.email.trim().toLowerCase() : undefined;

  const invitation = await WorkspaceInvitation.create({
    workspaceId: data.workspaceId,
    tokenHash,
    email: normalizedEmail,
    role: data.role,
    permissions: data.permissions || null,
    expiresAt,
    createdBy: userId,
    maxUses: data.maxUses || 1,
    uses: 0,
    isRevoked: false,
  });

  try {
    const { default: AuditLog } = await import("@/models/AuditLog");
    await AuditLog.create({
      userId,
      workspaceId: data.workspaceId,
      action: "INVITE_CREATE",
      entityType: "WorkspaceInvitation",
      entityId: invitation._id,
      details: { role: data.role, email: normalizedEmail, expiresAt, maxUses: data.maxUses || 1 }
    });
  } catch (e) {
    // Audit log error shouldn't block invite creation
  }

  return { success: true, token, invitationId: invitation._id.toString() };
}

export interface InvitationDetailsResult {
  valid: boolean;
  reason?: 'NOT_FOUND' | 'EXPIRED' | 'MAX_USES_REACHED' | 'REVOKED';
  invitation?: {
    role: string;
    expiresAt: string;
    intendedEmail?: string | null;
    email?: string | null;
    permissions?: Record<string, any> | null;
  };
  workspace?: {
    id: string;
    name: string;
    type: string;
    description?: string;
    memberCount: number;
  };
  inviter?: {
    name: string;
    email: string | null;
  };
  userState?: {
    isLoggedIn: boolean;
    user: {
      name?: string | null;
      email?: string | null;
    } | null;
    isMember: boolean;
    currentRole: string | null;
    emailMismatch?: boolean;
    intendedEmail?: string | null;
  };
}

export async function getInvitationDetails(token: string): Promise<InvitationDetailsResult> {
  if (!token || typeof token !== "string") {
    return { valid: false, reason: "NOT_FOUND" };
  }

  await dbConnect();

  // Ensure Workspace and User models are registered for populate
  void Workspace;
  void User;

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

  const invitation = await WorkspaceInvitation.findOne({ tokenHash })
    .populate('workspaceId', 'name type description isArchived')
    .populate('createdBy', 'name email')
    .lean();

  if (!invitation || !invitation.workspaceId || (invitation.workspaceId as any).isArchived) {
    return { valid: false, reason: "NOT_FOUND" };
  }

  if (invitation.isRevoked) {
    return {
      valid: false,
      reason: "REVOKED",
      workspace: {
        id: (invitation.workspaceId as any)._id?.toString() || "",
        name: (invitation.workspaceId as any).name || "Workspace",
        type: (invitation.workspaceId as any).type || "team",
        memberCount: 0,
      }
    };
  }

  if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
    return { 
      valid: false, 
      reason: "EXPIRED",
      workspace: {
        id: (invitation.workspaceId as any)._id?.toString() || "",
        name: (invitation.workspaceId as any).name || "Workspace",
        type: (invitation.workspaceId as any).type || "team",
        memberCount: 0,
      }
    };
  }

  if (invitation.maxUses && invitation.uses >= invitation.maxUses) {
    return { 
      valid: false, 
      reason: "MAX_USES_REACHED",
      workspace: {
        id: (invitation.workspaceId as any)._id?.toString() || "",
        name: (invitation.workspaceId as any).name || "Workspace",
        type: (invitation.workspaceId as any).type || "team",
        memberCount: 0,
      }
    };
  }

  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (session?.user as any)?.id;
  const currentUserEmail = session?.user?.email?.toLowerCase();

  const wsId = (invitation.workspaceId as any)._id || invitation.workspaceId;
  const memberCount = await WorkspaceMembership.countDocuments({ workspaceId: wsId });

  let isMember = false;
  let currentRole: string | null = null;

  if (currentUserId) {
    const membership = await WorkspaceMembership.findOne({ workspaceId: wsId, userId: currentUserId }).lean();
    if (membership && membership.status !== "suspended") {
      isMember = true;
      currentRole = membership.role;
    }
  }

  const emailMismatch = !!(
    invitation.email &&
    currentUserEmail &&
    invitation.email.toLowerCase() !== currentUserEmail
  );

  return {
    valid: true,
    invitation: {
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString(),
      intendedEmail: invitation.email || null,
      email: invitation.email || null,
      permissions: invitation.permissions || null,
    },
    workspace: {
      id: wsId.toString(),
      name: (invitation.workspaceId as any).name || "Workspace",
      type: (invitation.workspaceId as any).type || "team",
      description: (invitation.workspaceId as any).description,
      memberCount,
    },
    inviter: {
      name: (invitation.createdBy as any)?.name || "A team member",
      email: (invitation.createdBy as any)?.email || null,
    },
    userState: {
      isLoggedIn: !!currentUserId,
      user: session?.user ? {
        name: session.user.name,
        email: session.user.email,
      } : null,
      isMember,
      currentRole,
      emailMismatch,
      intendedEmail: invitation.email || null,
    }
  };
}

export async function acceptInvitation(token: string): Promise<{ success: boolean; workspaceId?: string; error?: string; message?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized: Please log in to accept this invitation." };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const userEmail = session.user.email?.toLowerCase();

    await dbConnect();

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    
    const invitation = await WorkspaceInvitation.findOne({ tokenHash });
    if (!invitation) {
      return { success: false, error: "Invalid or expired invitation." };
    }

    if (invitation.isRevoked) {
      return { success: false, error: "This invitation has been revoked by the workspace owner." };
    }

    if (invitation.maxUses && invitation.uses >= invitation.maxUses) {
      return { success: false, error: "Invitation usage limit reached." };
    }

    if (invitation.expiresAt < new Date()) {
      return { success: false, error: "Invitation has expired." };
    }

    // Strict email check if invitation was bound to a specific recipient email
    if (invitation.email && invitation.email.toLowerCase() !== userEmail) {
      return { 
        success: false, 
        error: `This invitation was sent specifically to ${invitation.email}. You are currently signed in as ${userEmail}.` 
      };
    }

    // Verify workspace is active and not archived
    const workspace = await Workspace.findById(invitation.workspaceId);
    if (!workspace || workspace.isArchived) {
      return { success: false, error: "This workspace is no longer active." };
    }

    // Check if already an active member
    const existing = await WorkspaceMembership.findOne({ workspaceId: invitation.workspaceId, userId });
    if (existing) {
      if (existing.status === "suspended") {
        existing.status = "active";
        existing.role = invitation.role;
        existing.permissions = invitation.permissions || null;
        await existing.save();
      }
      (await cookies()).set("activeWorkspaceId", invitation.workspaceId.toString(), { path: "/", httpOnly: true, sameSite: "lax" });
      return { success: true, workspaceId: invitation.workspaceId.toString(), message: "You are already a member of this workspace." };
    }

    // Check plan limits
    const currentMembers = await WorkspaceMembership.countDocuments({ workspaceId: invitation.workspaceId, status: "active" });
    const { PLAN_LIMITS } = await import("@/config/plans");
    const plan = workspace?.subscription?.plan || "free";
    // @ts-ignore
    const limit = PLAN_LIMITS[plan]?.maxMembers || 5;
    if (currentMembers >= limit) {
      return { success: false, error: "Workspace member limit reached for current plan." };
    }

    // Add membership
    await WorkspaceMembership.create({
      workspaceId: invitation.workspaceId,
      userId,
      role: invitation.role,
      permissions: invitation.permissions || null,
      status: "active",
      joinedAt: new Date(),
    });

    // Update uses & record acceptance
    invitation.uses += 1;
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = userId;
    await invitation.save();

    // Audit log
    try {
      const { default: AuditLog } = await import("@/models/AuditLog");
      await AuditLog.create({
        userId,
        workspaceId: invitation.workspaceId,
        action: "INVITE_ACCEPT",
        entityType: "WorkspaceMembership",
        details: { role: invitation.role, acceptedByEmail: userEmail }
      });
    } catch (e) {
      // Ignore audit log error
    }

    try {
      const { Notification } = await import("@/models/Notification");
      if (workspace) {
        await Notification.create({
          userId: workspace.ownerId,
          type: "WORKSPACE_INVITE",
          title: "New Workspace Member",
          body: `${session.user.name || session.user.email} has joined your workspace: ${workspace.name}`,
          entityType: "SYSTEM",
        });
      }
    } catch (e) {
      // Ignore notification errors
    }

    (await cookies()).set("activeWorkspaceId", invitation.workspaceId.toString(), { path: "/", httpOnly: true, sameSite: "lax" });

    return { success: true, workspaceId: invitation.workspaceId.toString() };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to accept invitation." };
  }
}

export async function switchAndOpenWorkspace(workspaceId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return { success: false, error: "Unauthorized" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  await dbConnect();
  const membership = await WorkspaceMembership.findOne({ workspaceId, userId, status: "active" });
  if (!membership) {
    return { success: false, error: "Not a member of this workspace" };
  }

  (await cookies()).set("activeWorkspaceId", workspaceId, { path: "/", httpOnly: true, sameSite: "lax" });
  return { success: true };
}

export async function getActiveInvitations(workspaceId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  await dbConnect();

  // Verify current user has access as owner or admin
  const membership = await WorkspaceMembership.findOne({ workspaceId, userId });
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return [];
  }

  const invites = await WorkspaceInvitation.find({ 
    workspaceId,
    isRevoked: { $ne: true },
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

export async function revokeInvitation(invitationId: string, workspaceId?: string) {
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

  invite.isRevoked = true;
  invite.revokedAt = new Date();
  invite.revokedBy = userId;
  await invite.save();

  try {
    const { default: AuditLog } = await import("@/models/AuditLog");
    await AuditLog.create({
      userId,
      workspaceId: invite.workspaceId,
      action: "INVITE_REVOKE",
      entityType: "WorkspaceInvitation",
      entityId: invite._id,
      details: { role: invite.role, email: invite.email }
    });
  } catch (e) {
    // Ignore audit log error
  }

  return { success: true };
}
