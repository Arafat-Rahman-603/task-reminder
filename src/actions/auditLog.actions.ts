"use server";

import dbConnect from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyWorkspaceAccess } from "@/lib/workspace";
import { Types } from "mongoose";

export async function getWorkspaceAuditLogs(workspaceId: string, limit = 50) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    if (!Types.ObjectId.isValid(workspaceId)) {
      throw new Error("Invalid workspace ID");
    }

    // Verify caller is at least a member with audit log view access, or admin/owner
    await verifyWorkspaceAccess(workspaceId, "member", "auditLogs", "view");

    await dbConnect();
    void User; // Ensure User schema is registered for populate

    const logs = await AuditLog.find({ workspaceId: new Types.ObjectId(workspaceId) })
      .populate("userId", "name email image avatarUrl avatarPublicId")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    interface AuditLogDoc {
  _id: { toString(): string };
  action: string;
  entityType: string;
  details?: Record<string, unknown>;
  createdAt?: string | Date;
  userId?: {
    _id?: { toString(): string };
    name?: string;
    email?: string;
    image?: string;
    avatarUrl?: string;
    avatarPublicId?: string;
  };
}
    const formatted = (logs as unknown as AuditLogDoc[]).map((log) => {
      const u = log.userId;
      const resolvedAvatar = u?.avatarUrl || (u?.avatarPublicId ? `/api/assets/${u.avatarPublicId}?resourceType=image` : u?.image) || "";
      return {
        _id: log._id.toString(),
        action: log.action,
        entityType: log.entityType,
        details: log.details || {},
        createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
        user: {
          _id: u?._id ? u._id.toString() : "",
          name: u?.name || "System",
          email: u?.email || "",
          image: resolvedAvatar,
          avatarUrl: u?.avatarUrl || null,
          avatarPublicId: u?.avatarPublicId || null,
        },
      };
    });

    return { success: true, logs: formatted };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || "Failed to fetch audit logs", logs: [] };
  }
}
