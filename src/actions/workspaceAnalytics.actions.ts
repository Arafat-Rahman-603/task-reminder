"use server";

import dbConnect from "@/lib/db";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import Task from "@/models/Task";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDefaultPermissions, Role, IWorkspacePermissions } from "@/lib/workspacePermissions";

export interface MemberPerformanceMetric {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  customRoleName: string | null;
  assignedCount: number;
  completedCount: number;
  pendingCount: number;
  cancelledCount: number;
  completionRate: number;
  onTimeCompletedCount: number;
  lateCompletedCount: number;
  currentlyOverdueCount: number;
  onTimeRate: number | null;
  avgCompletionHours: number | null;
  productivityStatus: "Top Performer" | "On Track" | "Needs Attention" | "No Tasks";
  tasks: Array<{
    _id: string;
    title: string;
    slug: string;
    status: string;
    priority: string;
    dueDate?: string | null;
    completedAt?: string | null;
    performanceStatus: "on_time" | "late" | "overdue" | "pending" | "cancelled";
  }>;
}

export interface WorkspacePerformanceSummary {
  totalTasks: number;
  totalCompleted: number;
  totalPending: number;
  totalCancelled: number;
  overallCompletionRate: number;
  totalOnTime: number;
  totalLate: number;
  overallOnTimeRate: number;
  totalCurrentlyOverdue: number;
  activeMembersCount: number;
  topPerformerName: string | null;
  members: MemberPerformanceMetric[];
}

export async function getWorkspaceMemberPerformance(
  workspaceId: string,
  timeRange: "7d" | "30d" | "all" = "all"
): Promise<{ success: boolean; data?: WorkspacePerformanceSummary; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }
        const currentUserId = session.user.id;

    await dbConnect();

    // Verify caller is owner or admin of the team workspace
    const callerMembership = await WorkspaceMembership.findOne({ workspaceId, userId: currentUserId });
    if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
      return {
        success: false,
        error: "Unauthorized: Only workspace owners and admins can view team performance metrics"
      };
    }

    // Date range filter
    const dateFilter: Record<string, unknown> = { workspaceId };
    const now = new Date();
    if (timeRange === "7d") {
      const past7d = new Date();
      past7d.setDate(past7d.getDate() - 7);
      dateFilter.createdAt = { $gte: past7d };
    } else if (timeRange === "30d") {
      const past30d = new Date();
      past30d.setDate(past30d.getDate() - 30);
      dateFilter.createdAt = { $gte: past30d };
    }

    // Query active members of the workspace
    const rawMembers = await WorkspaceMembership.find({ workspaceId, status: "active" })
      .populate("userId", "name email image avatarUrl avatarPublicId")
      .lean();

    // Query tasks
    const tasks = await Task.find(dateFilter)
      .select("title slug status priority dueDate completedAt createdAt updatedAt assigneeId")
      .sort({ createdAt: -1 })
      .lean();

    let totalOnTimeAll = 0;
    let totalLateAll = 0;
    let totalOverdueAll = 0;
    let totalCompletedAll = 0;
    let totalPendingAll = 0;
    let totalCancelledAll = 0;

    const isTaskDone = (s?: string) => s === "Completed" || s === "Done";
    const isTaskCancelled = (s?: string) => s === "Cancelled";

    // Helper to evaluate on-time vs late vs overdue
    interface AnalyticsTask {
      _id: { toString(): string };
      title: string;
      slug: string;
      status?: string;
      priority?: string;
      dueDate?: Date | string;
      completedAt?: Date | string;
      createdAt?: Date | string;
      updatedAt?: Date | string;
      assigneeId?: { toString(): string } | null;
    }
    const evaluateTaskPerformance = (t: AnalyticsTask): "on_time" | "late" | "overdue" | "pending" | "cancelled" => {
      if (isTaskCancelled(t.status)) return "cancelled";
      
      const hasDueDate = !!t.dueDate;
      const done = isTaskDone(t.status);

      if (done) {
        if (!hasDueDate) return "on_time"; // no deadline set, considered satisfied
        const finishTime = t.completedAt ? new Date(t.completedAt).getTime() : new Date(t.updatedAt || 0).getTime();
        // Allow up to end of the due date day (23:59:59)
        const dueDateTime = new Date(t.dueDate!);
        dueDateTime.setHours(23, 59, 59, 999);
        return finishTime <= dueDateTime.getTime() ? "on_time" : "late";
      }

      // Pending
      if (hasDueDate) {
        const dueDateTime = new Date(t.dueDate!);
        dueDateTime.setHours(23, 59, 59, 999);
        if (dueDateTime.getTime() < now.getTime()) {
          return "overdue";
        }
      }

      return "pending";
    };

    const memberMetrics: MemberPerformanceMetric[] = (rawMembers as unknown as Array<Record<string, unknown> & { userId?: { _id?: { toString(): string }; email?: string; avatarPublicId?: string; avatarUrl?: string; image?: string; name?: string }; role?: string; customRoleId?: { name?: string } }>).map((m) => {
      const u = m.userId;
      const uId: string = u?._id?.toString() || (m.userId ? String(m.userId) : "");
      const resolvedAvatar = (u?.avatarPublicId ? `/api/assets/${u.avatarPublicId}?resourceType=image` : u?.avatarUrl || u?.image) || null;

      // Filter tasks assigned to this user
      const assignedTasks = (tasks as unknown as AnalyticsTask[]).filter((t) => t.assigneeId && t.assigneeId.toString() === uId);

      let onTimeCount = 0;
      let lateCount = 0;
      let overdueCount = 0;
      let completedCount = 0;
      let pendingCount = 0;
      let cancelledCount = 0;
      let totalCompletionHours = 0;
      let tasksWithHoursCount = 0;

      const memberTasksDetail: MemberPerformanceMetric["tasks"] = [];

      assignedTasks.forEach((t) => {
        const perfStatus = evaluateTaskPerformance(t);
        if (perfStatus === "on_time") onTimeCount++;
        if (perfStatus === "late") lateCount++;
        if (perfStatus === "overdue") overdueCount++;
        if (perfStatus === "cancelled") cancelledCount++;
        if (isTaskDone(t.status)) completedCount++;
        if (!isTaskDone(t.status) && !isTaskCancelled(t.status)) pendingCount++;

        // Turnaround calculation
        if (isTaskDone(t.status) && t.createdAt && (t.completedAt || t.updatedAt)) {
          const finishedAt = new Date((t.completedAt || t.updatedAt)!).getTime();
          const startedAt = new Date(t.createdAt!).getTime();
          const diffHours = Math.max(0, (finishedAt - startedAt) / (1000 * 60 * 60));
          totalCompletionHours += diffHours;
          tasksWithHoursCount++;
        }

        memberTasksDetail.push({
          _id: t._id.toString(),
          title: t.title,
          slug: t.slug,
          status: t.status || "Pending",
          priority: t.priority || "Medium",
          dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
          completedAt: t.completedAt ? new Date(t.completedAt).toISOString() : null,
          performanceStatus: perfStatus,
        });
      });

      totalOnTimeAll += onTimeCount;
      totalLateAll += lateCount;
      totalOverdueAll += overdueCount;
      totalCompletedAll += completedCount;
      totalPendingAll += pendingCount;
      totalCancelledAll += cancelledCount;

      const evaluatedCompleted = onTimeCount + lateCount;
      const onTimeRate = evaluatedCompleted > 0 
        ? Math.round((onTimeCount / evaluatedCompleted) * 100)
        : (completedCount > 0 ? 100 : null);

      const completionRate = assignedTasks.length > 0 
        ? Math.round((completedCount / assignedTasks.length) * 100) 
        : 0;

      const avgHours = tasksWithHoursCount > 0 
        ? Math.round((totalCompletionHours / tasksWithHoursCount) * 10) / 10 
        : null;

      // Productivity status
      let productivityStatus: "Top Performer" | "On Track" | "Needs Attention" | "No Tasks" = "On Track";
      if (assignedTasks.length === 0) {
        productivityStatus = "No Tasks";
      } else if (overdueCount >= 2 || (onTimeRate !== null && onTimeRate < 60)) {
        productivityStatus = "Needs Attention";
      } else if (onTimeRate !== null && onTimeRate >= 85 && overdueCount === 0 && completedCount >= 2) {
        productivityStatus = "Top Performer";
      }

      return {
        userId: uId || "",
        name: u?.name || "Team Member",
        email: u?.email || "",
        avatarUrl: resolvedAvatar,
        role: (m.role as string) || "member",
        customRoleName: typeof m.customRoleName === "string" ? m.customRoleName : null,
        assignedCount: assignedTasks.length,
        completedCount,
        pendingCount,
        cancelledCount,
        completionRate,
        onTimeCompletedCount: onTimeCount,
        lateCompletedCount: lateCount,
        currentlyOverdueCount: overdueCount,
        onTimeRate,
        avgCompletionHours: avgHours,
        productivityStatus,
        tasks: memberTasksDetail,
      };
    });

    // Also include Unassigned tasks if any exist
    const unassignedTasks = (tasks as unknown as AnalyticsTask[]).filter((t) => !t.assigneeId);
    if (unassignedTasks.length > 0) {
      let unassignedDone = 0;
      let unassignedPending = 0;
      let unassignedOverdue = 0;
      const unassignedDetails: unknown[] = [];

      unassignedTasks.forEach((t) => {
        const perfStatus = evaluateTaskPerformance(t);
        if (perfStatus === "overdue") unassignedOverdue++;
        if (isTaskDone(t.status)) unassignedDone++;
        if (!isTaskDone(t.status) && !isTaskCancelled(t.status)) unassignedPending++;

        unassignedDetails.push({
          _id: t._id.toString(),
          title: t.title,
          slug: t.slug,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
          completedAt: t.completedAt ? new Date(t.completedAt).toISOString() : null,
          performanceStatus: perfStatus,
        });
      });

      totalOverdueAll += unassignedOverdue;
      totalCompletedAll += unassignedDone;
      totalPendingAll += unassignedPending;
    }

    // Sort members by completedCount desc, then onTimeRate desc
    memberMetrics.sort((a, b) => {
      if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;
      return (b.onTimeRate || 0) - (a.onTimeRate || 0);
    });

    const evaluatedAllCompleted = totalOnTimeAll + totalLateAll;
    const overallOnTimeRate = evaluatedAllCompleted > 0
      ? Math.round((totalOnTimeAll / evaluatedAllCompleted) * 100)
      : (totalCompletedAll > 0 ? 100 : 0);

    const overallCompletionRate = tasks.length > 0
      ? Math.round((totalCompletedAll / tasks.length) * 100)
      : 0;

    const topPerformer = memberMetrics.find(m => m.productivityStatus === "Top Performer" && m.completedCount >= 2);

    return {
      success: true,
      data: {
        totalTasks: tasks.length,
        totalCompleted: totalCompletedAll,
        totalPending: totalPendingAll,
        totalCancelled: totalCancelledAll,
        overallCompletionRate,
        totalOnTime: totalOnTimeAll,
        totalLate: totalLateAll,
        overallOnTimeRate,
        totalCurrentlyOverdue: totalOverdueAll,
        activeMembersCount: rawMembers.length,
        topPerformerName: topPerformer?.name || (memberMetrics[0]?.completedCount > 0 ? memberMetrics[0].name : null),
        members: memberMetrics,
      }
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error in getWorkspaceMemberPerformance:", error);
    return { success: false, error: err.message || "Failed to calculate workspace performance" };
  }
}

export async function getSingleMemberPerformance(
  workspaceId: string,
  targetUserId: string
): Promise<{
  success: boolean;
  data?: {
    member: MemberPerformanceMetric;
    joinedAt: string;
    status: string;
    workspaceName: string;
    permissions?: Record<string, unknown> | IWorkspacePermissions;
    permissionSource?: string;
  };
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUserId = (session.user as any).id;

    await dbConnect();

    // Verify caller is part of this workspace
    const callerMembership = await WorkspaceMembership.findOne({ workspaceId, userId: currentUserId });
    if (!callerMembership) {
      return { success: false, error: "Unauthorized: You are not a member of this workspace" };
    }

    // Call full performance calculation for 'all' time
    const summaryRes = await getWorkspaceMemberPerformance(workspaceId, "all");
    if (!summaryRes.success || !summaryRes.data) {
      return { success: false, error: summaryRes.error || "Failed to load member metrics" };
    }

    const matchedMember = summaryRes.data.members.find(m => m.userId === targetUserId);
    if (!matchedMember) {
      return { success: false, error: "Member not found in this workspace" };
    }

    const targetMembership: Record<string, unknown> & { role?: string; customRoleId?: { name?: string; permissions?: Record<string, unknown> }; permissions?: Record<string, unknown>; createdAt?: Date; status?: string; workspaceId?: { name?: string } } | null = await WorkspaceMembership.findOne({ workspaceId, userId: targetUserId })
      .populate("workspaceId", "name type")
      .populate("customRoleId")
      .lean();

    const effectiveRole = (targetMembership?.role as Role) || "member";
    const effectivePermissions = 
      targetMembership?.customRoleId?.permissions ||
      targetMembership?.permissions ||
      getDefaultPermissions(effectiveRole);

    const permissionSource = targetMembership?.customRoleId?.name
      ? `Custom Role (${targetMembership.customRoleId.name})`
      : targetMembership?.permissions && Object.keys(targetMembership.permissions).length > 0
      ? "Individual Overrides"
      : `Default ${effectiveRole.toUpperCase()} Policy`;

    return {
      success: true,
      data: {
        member: matchedMember,
        joinedAt: targetMembership?.createdAt ? new Date(targetMembership.createdAt).toISOString() : new Date().toISOString(),
        status: targetMembership?.status || "active",
        workspaceName: targetMembership?.workspaceId?.name || "Workspace",
        permissions: effectivePermissions,
        permissionSource,
      }
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error in getSingleMemberPerformance:", err);
    return { success: false, error: error.message || "Failed to load member details" };
  }
}

