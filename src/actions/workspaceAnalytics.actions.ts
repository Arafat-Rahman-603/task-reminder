"use server";

import dbConnect from "@/lib/db";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import Task from "@/models/Task";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUserId = (session.user as any).id;

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
    const dateFilter: any = { workspaceId };
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
    const evaluateTaskPerformance = (t: any): "on_time" | "late" | "overdue" | "pending" | "cancelled" => {
      if (isTaskCancelled(t.status)) return "cancelled";
      
      const hasDueDate = !!t.dueDate;
      const done = isTaskDone(t.status);

      if (done) {
        if (!hasDueDate) return "on_time"; // no deadline set, considered satisfied
        const finishTime = t.completedAt ? new Date(t.completedAt).getTime() : new Date(t.updatedAt).getTime();
        // Allow up to end of the due date day (23:59:59)
        const dueDateTime = new Date(t.dueDate);
        dueDateTime.setHours(23, 59, 59, 999);
        return finishTime <= dueDateTime.getTime() ? "on_time" : "late";
      }

      // Pending
      if (hasDueDate) {
        const dueDateTime = new Date(t.dueDate);
        dueDateTime.setHours(23, 59, 59, 999);
        if (dueDateTime.getTime() < now.getTime()) {
          return "overdue";
        }
      }

      return "pending";
    };

    const memberMetrics: MemberPerformanceMetric[] = rawMembers.map((m: any) => {
      const u = m.userId;
      const uId = u?._id?.toString() || m.userId?.toString();
      const resolvedAvatar = u?.avatarUrl || (u?.avatarPublicId ? `/api/assets/${u.avatarPublicId}?resourceType=image` : u?.image) || null;

      // Filter tasks assigned to this user
      const assignedTasks = tasks.filter((t: any) => t.assigneeId && t.assigneeId.toString() === uId);

      let onTimeCount = 0;
      let lateCount = 0;
      let overdueCount = 0;
      let completedCount = 0;
      let pendingCount = 0;
      let cancelledCount = 0;
      let totalCompletionHours = 0;
      let tasksWithHoursCount = 0;

      const memberTasksDetail: any[] = [];

      assignedTasks.forEach((t: any) => {
        const perfStatus = evaluateTaskPerformance(t);
        if (perfStatus === "on_time") onTimeCount++;
        if (perfStatus === "late") lateCount++;
        if (perfStatus === "overdue") overdueCount++;
        if (perfStatus === "cancelled") cancelledCount++;
        if (isTaskDone(t.status)) completedCount++;
        if (!isTaskDone(t.status) && !isTaskCancelled(t.status)) pendingCount++;

        // Turnaround calculation
        if (isTaskDone(t.status) && t.createdAt && (t.completedAt || t.updatedAt)) {
          const finishedAt = new Date(t.completedAt || t.updatedAt).getTime();
          const startedAt = new Date(t.createdAt).getTime();
          const diffHours = Math.max(0, (finishedAt - startedAt) / (1000 * 60 * 60));
          totalCompletionHours += diffHours;
          tasksWithHoursCount++;
        }

        memberTasksDetail.push({
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
        userId: uId,
        name: u?.name || "Team Member",
        email: u?.email || "",
        avatarUrl: resolvedAvatar,
        role: m.role,
        customRoleName: m.customRoleName || null,
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
    const unassignedTasks = tasks.filter((t: any) => !t.assigneeId);
    if (unassignedTasks.length > 0) {
      let unassignedDone = 0;
      let unassignedPending = 0;
      let unassignedOverdue = 0;
      const unassignedDetails: any[] = [];

      unassignedTasks.forEach((t: any) => {
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
  } catch (error: any) {
    console.error("Error in getWorkspaceMemberPerformance:", error);
    return { success: false, error: error.message || "Failed to calculate workspace performance" };
  }
}
