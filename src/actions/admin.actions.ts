"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import UpgradeRequest from "@/models/UpgradeRequest";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return false;
  // @ts-ignore
  const userId = session.user.id;
  await dbConnect();
  const user = await User.findById(userId);
  if (!user || !user.isPlatformAdmin) return false;
  return true;
}

export async function getAdminStats() {
  if (!(await checkAdmin())) throw new Error("Unauthorized");
  await dbConnect();

  const totalUsers = await User.countDocuments();
  const totalWorkspaces = await Workspace.countDocuments();
  const pendingUpgrades = await UpgradeRequest.countDocuments({ status: "pending" });

  return { totalUsers, totalWorkspaces, pendingUpgrades };
}

export async function getUpgradeRequests() {
  if (!(await checkAdmin())) throw new Error("Unauthorized");
  await dbConnect();
  
  const requests = await UpgradeRequest.find()
    .populate("workspaceId", "name type")
    .populate("requestedBy", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(requests));
}

export async function updateUpgradeRequestStatus(requestId: string, status: "approved" | "rejected", adminNotes?: string) {
  if (!(await checkAdmin())) throw new Error("Unauthorized");
  await dbConnect();

  const request = await UpgradeRequest.findById(requestId);
  if (!request) throw new Error("Request not found");

  request.status = status;
  if (adminNotes) request.adminNotes = adminNotes;
  await request.save();

  if (status === "approved") {
    // Apply plan upgrade to workspace
    const workspace = await Workspace.findById(request.workspaceId);
    if (workspace) {
      workspace.subscription = {
        plan: request.requestedPlan,
        status: "active"
      };
      await workspace.save();
    }
  }

  return { success: true };
}
