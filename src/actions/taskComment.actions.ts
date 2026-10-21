"use server";

import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import TaskComment from "@/models/TaskComment";
import User from "@/models/User";
import TaskHistory from "@/models/TaskHistory";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import { Notification } from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { notifyUserViaSSE } from "@/lib/notifications/sse-service";
import { sendPushNotification as sendFirebasePush } from "@/lib/notifications/firebase-server";
import { deleteAttachments } from "./cloudinary.actions";

export async function getTaskComments(taskId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized", comments: [] };
    }

    if (!Types.ObjectId.isValid(taskId)) {
      return { success: false, error: "Invalid task ID", comments: [] };
    }

    await dbConnect();
    void User;

    const task = await Task.findById(taskId).lean();
    if (!task) {
      return { success: false, error: "Task not found", comments: [] };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUserId = (session.user as any).id;

    // Verify workspace access if task is workspace-scoped
    if (task.workspaceId) {
      const membership = await WorkspaceMembership.findOne({
        workspaceId: task.workspaceId,
        userId: currentUserId,
        status: { $ne: "suspended" },
      });
      if (!membership && task.userId.toString() !== currentUserId) {
        return { success: false, error: "Access denied", comments: [] };
      }
    } else if (task.userId.toString() !== currentUserId) {
      return { success: false, error: "Access denied", comments: [] };
    }

    const comments = await TaskComment.find({ taskId: new Types.ObjectId(taskId) })
      .populate("userId", "name email image avatarUrl avatarPublicId")
      .sort({ createdAt: 1 })
      .lean();

    const formatted = (comments as any[]).map((c) => {
      const u = c.userId;
      const resolvedAvatar = u?.avatarUrl || (u?.avatarPublicId ? `/api/assets/${u.avatarPublicId}?resourceType=image` : u?.image) || "";
      return {
        _id: c._id.toString(),
        taskId: c.taskId.toString(),
        content: c.content,
        attachments: c.attachments || [],
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        user: {
          _id: u?._id ? u._id.toString() : "",
          name: u?.name || "Team Member",
          email: u?.email || "",
          image: resolvedAvatar,
          avatarUrl: u?.avatarUrl || null,
          avatarPublicId: u?.avatarPublicId || null,
        },
      };
    });

    return { success: true, comments: formatted };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to load comments", comments: [] };
  }
}

export async function addTaskComment(data: {
  taskId: string;
  content: string;
  attachments?: { url: string; publicId: string; resourceType?: string; originalFilename?: string }[];
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!data.content || !data.content.trim()) {
      return { success: false, error: "Comment content cannot be empty" };
    }

    if (!Types.ObjectId.isValid(data.taskId)) {
      return { success: false, error: "Invalid task ID" };
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUserId = (session.user as any).id;
    const currentUserName = session.user.name || session.user.email || "A teammate";

    const task = await Task.findById(data.taskId);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Verify membership if workspace task
    if (task.workspaceId) {
      const membership = await WorkspaceMembership.findOne({
        workspaceId: task.workspaceId,
        userId: currentUserId,
        status: { $ne: "suspended" },
      });
      if (!membership && task.userId.toString() !== currentUserId) {
        return { success: false, error: "You are not a member of this workspace" };
      }
    }

    const comment = await TaskComment.create({
      taskId: task._id,
      workspaceId: task.workspaceId || new Types.ObjectId(),
      userId: currentUserId,
      content: data.content.trim(),
      attachments: data.attachments || [],
    });

    // Record in Task History
    await TaskHistory.create({
      userId: currentUserId,
      taskId: task._id,
      taskTitle: task.title,
      action: "Commented on task",
    });

    // Notify task creator and assignee (if not commenter)
    const recipientsToNotify = new Set<string>();
    if (task.userId && task.userId.toString() !== currentUserId) {
      recipientsToNotify.add(task.userId.toString());
    }
    if (task.assigneeId && task.assigneeId.toString() !== currentUserId) {
      recipientsToNotify.add(task.assigneeId.toString());
    }

    for (const recipientId of recipientsToNotify) {
      try {
        const notif = await Notification.create({
          userId: recipientId,
          type: "TASK_COMMENT",
          title: `New Comment on "${task.title}"`,
          body: `${currentUserName}: "${data.content.trim().substring(0, 80)}"`,
          message: `${currentUserName}: "${data.content.trim().substring(0, 80)}"`,
          url: `/dashboard/tasks/${task.slug}`,
          link: `/dashboard/tasks/${task.slug}`,
          status: "SENT",
          sentAt: new Date(),
          isRead: false,
        });

        // Real-time SSE
        notifyUserViaSSE(recipientId, {
          type: "task_comment",
          notificationId: notif._id.toString(),
          title: `Comment on "${task.title}"`,
          message: `${currentUserName}: "${data.content.trim().substring(0, 80)}"`,
          link: `/dashboard/tasks/${task.slug}`,
        });

        // Firebase Push
        await sendFirebasePush({
          userId: recipientId,
          title: `Comment on "${task.title}"`,
          body: `${currentUserName}: "${data.content.trim().substring(0, 100)}"`,
          url: `/dashboard/tasks/${task.slug}`,
          type: "task_comment",
          entityId: task._id.toString(),
        });
      } catch (notifErr) {
        // Continue even if one notification fails
      }
    }

    revalidatePath(`/dashboard/tasks/${task.slug}`);

    // Return populated comment
    const populated = await TaskComment.findById(comment._id)
      .populate("userId", "name email image")
      .lean();

    const formatted = {
      _id: (populated as any)._id.toString(),
      taskId: (populated as any).taskId.toString(),
      content: (populated as any).content,
      attachments: (populated as any).attachments || [],
      createdAt: (populated as any).createdAt.toISOString(),
      user: {
        _id: (populated as any).userId?._id ? (populated as any).userId._id.toString() : currentUserId,
        name: (populated as any).userId?.name || currentUserName,
        email: (populated as any).userId?.email || "",
        image: (populated as any).userId?.image || "",
      },
    };

    return { success: true, comment: formatted };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add comment" };
  }
}

export async function deleteTaskComment(commentId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!Types.ObjectId.isValid(commentId)) {
      return { success: false, error: "Invalid comment ID" };
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUserId = (session.user as any).id;

    const comment = await TaskComment.findById(commentId);
    if (!comment) {
      return { success: false, error: "Comment not found" };
    }

    const task = await Task.findById(comment.taskId);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Permission: Comment author, or Task creator, or Workspace owner/admin
    const isAuthor = comment.userId.toString() === currentUserId;
    const isTaskOwner = task.userId.toString() === currentUserId;
    let isWsManager = false;

    if (task.workspaceId) {
      const membership = await WorkspaceMembership.findOne({
        workspaceId: task.workspaceId,
        userId: currentUserId,
      });
      if (membership && ["owner", "admin"].includes(membership.role)) {
        isWsManager = true;
      }
    }

    if (!isAuthor && !isTaskOwner && !isWsManager) {
      return { success: false, error: "You do not have permission to delete this comment" };
    }

    if (comment.attachments && comment.attachments.length > 0) {
      deleteAttachments(comment.attachments).catch(console.error);
    }

    await TaskComment.findByIdAndDelete(commentId);

    revalidatePath(`/dashboard/tasks/${task.slug}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete comment" };
  }
}
