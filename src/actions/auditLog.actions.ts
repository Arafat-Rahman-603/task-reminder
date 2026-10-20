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
      .populate("userId", "name email image")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const formatted = (logs as any[]).map((log) => ({
      _id: log._id.toString(),
      action: log.action,
      entityType: log.entityType,
      details: log.details || {},
      createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
      user: {
        _id: log.userId?._id ? log.userId._id.toString() : "",
        name: log.userId?.name || "System",
        email: log.userId?.email || "",
        image: log.userId?.image || "",
      },
    }));

    return { success: true, logs: formatted };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch audit logs", logs: [] };
  }
}
