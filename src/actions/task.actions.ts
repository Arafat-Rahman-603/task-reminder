"use server";

import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import Reminder from "@/models/Reminder";
import TaskHistory from "@/models/TaskHistory";
import { z } from "zod";
import { createReminder, updateReminderTime, deleteRemindersByEntity } from "./reminder.actions";
import { deleteAttachments } from "./cloudinary.actions";
import { Notification } from "@/models/Notification";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional(),
  notes: z.string().max(10000).optional(),
  status: z.enum(["Inbox", "Planned", "In Progress", "Completed", "Cancelled", "Backlog", "To Do", "In Review", "Done", "Blocked", "Problem/Error"]).optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  startDate: z.string().optional(),
  startTime: z.string().optional(),
  recurringSchedule: z.string().optional(),
  tags: z.array(z.string()).optional(),
  reminderTime: z.string().optional(),
  assigneeId: z.string().optional(),
  attachments: z.array(z.object({
    url: z.string(),
    publicId: z.string(),
    resourceType: z.string().optional(),
    originalFilename: z.string().optional()
  })).optional(),
});

export async function createTask(data: z.infer<typeof createTaskSchema>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    const validated = createTaskSchema.parse(data);
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    // Get active workspace
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    // Generate unique slug scoped to workspace
    let baseSlug = validated.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = 'task';
    let slug = baseSlug;
    let counter = 1;
    while (await Task.findOne({ workspaceId: activeWorkspace._id, slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const task = await Task.create({
      ...validated,
      userId,
      workspaceId: activeWorkspace._id,
      assigneeId: validated.assigneeId,
      slug,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
    });

    await TaskHistory.create({
      userId,
      taskId: task._id,
      taskTitle: task.title,
      action: "Created task",
    });

    if (validated.assigneeId && validated.assigneeId !== userId) {
      await Notification.create({
        userId: validated.assigneeId,
        type: "TASK_ASSIGNED",
        title: "New Task Assigned",
        body: "You have been assigned to task: ",
        entityType: "TASK",
        entityId: task._id.toString(),
        url: "/dashboard/tasks/",
      });
    }

    if (validated.reminderTime) {
      await createReminder({
        entityType: 'Task',
        entityId: task._id.toString(),
        remindAt: validated.reminderTime
      });
    }
    const taskObj = task.toObject();
    const reminder = await Reminder.findOne({ entityType: 'Task', entityId: task._id.toString(), status: 'pending' }).lean();
    taskObj.reminder = reminder || null;

    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard/today");
    return { success: true, task: JSON.parse(JSON.stringify(taskObj)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create task" };
  }
}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTasks(filters?: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { tasks: [] };

    await dbConnect();
    const userId = (session.user as any).id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return { tasks: [] };

    let query: any = { workspaceId: activeWorkspace._id };
    
    // If filters are provided, translate them securely using the filterTranslator
    if (filters && Object.keys(filters).length > 0) {
      const { taskFilterFromDashboardFilters } = await import('@/lib/filterTranslators');
      // We pass workspaceId instead of userId to filter translator, or we just mix it in
      query = { ...taskFilterFromDashboardFilters(userId, filters), workspaceId: activeWorkspace._id };
      delete query.userId; // ensure we override legacy userId filter
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 }).lean();

    const taskIds = tasks.map((t: any) => t._id);
    const reminders = await Reminder.find({ entityType: 'Task', entityId: { $in: taskIds }, status: 'pending' }).lean();
    const reminderMap = new Map();
    reminders.forEach((r: any) => reminderMap.set(r.entityId.toString(), r));
    tasks.forEach((t: any) => {
      t.reminder = reminderMap.get(t._id.toString()) || null;
    });

    return { tasks: JSON.parse(JSON.stringify(tasks)) };
  } catch (error) {
    return { tasks: [] };
  }
}

export async function updateTaskStatus(taskId: string, status: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const oldTask = await Task.findOne({ _id: taskId, workspaceId: activeWorkspace._id });
    await Task.findOneAndUpdate({ _id: taskId, workspaceId: activeWorkspace._id }, { status, completedAt: status === "Completed" ? new Date() : null });
    
    if (oldTask && oldTask.status !== status) {
      await TaskHistory.create({
        userId,
        taskId,
        taskTitle: oldTask.title,
        action: `Status changed to ${status}`,
        field: "status",
        previousValue: oldTask.status,
        newValue: status
      });

      const notifyUserId = oldTask.assigneeId?.toString() === userId ? oldTask.userId : oldTask.assigneeId;
      if (notifyUserId && notifyUserId.toString() !== userId) {
        await Notification.create({
          userId: notifyUserId,
          type: "TASK_STATUS_CHANGED",
          title: "Task Status Updated",
          body: `Task "" is now ${status}`,
          entityType: "TASK",
          entityId: taskId,
          url: "/dashboard/tasks/",
        });
      }
    }
    
    if (status === "Completed") {
      await deleteRemindersByEntity('Task', taskId);
      const today = new Date();
      const eod = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 50, 0);
      if (today.getTime() > eod.getTime()) {
        eod.setMinutes(today.getMinutes() + 10);
      }
      await Reminder.create({
        userId,
        entityType: 'Task',
        entityId: taskId,
        remindAt: eod,
        notificationType: 'in-app',
        metadata: { isCompletionCongrats: true }
      });
    }

    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard/today");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTaskBySlug(slug: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return null;

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return null;

    const task: any = await Task.findOne({ workspaceId: activeWorkspace._id, slug }).lean();
    if (!task) return null;

    const reminder = await Reminder.findOne({ entityType: 'Task', entityId: task._id, status: 'pending' }).lean();
    task.reminder = reminder || null;

    return JSON.parse(JSON.stringify(task));
  } catch (error) {
    return null;
  }
}

export async function updateTask(taskId: string, data: Partial<z.infer<typeof createTaskSchema>> & { status?: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const updateData: Record<string, unknown> = { ...data };
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    
    // Automatically set completedAt
    if (data.status === "Completed") {
      updateData.completedAt = new Date();
    } else if (data.status) {
      updateData.completedAt = null;
    }

    const oldTask = await Task.findOne({ _id: taskId, workspaceId: activeWorkspace._id });

    const task = await Task.findOneAndUpdate(
      { _id: taskId, workspaceId: activeWorkspace._id },
      updateData,
      { returnDocument: 'after' }
    );

    // Clean up removed attachments
    if (oldTask && task && oldTask.attachments) {
      const newAttIds = new Set(task.attachments?.map((a: any) => a.publicId) || []);
      const removedAtts = oldTask.attachments.filter((a: any) => !newAttIds.has(a.publicId));
      if (removedAtts.length > 0) {
        // Do not await, let it run in background
        deleteAttachments(removedAtts).catch(console.error);
      }
    }

    if (oldTask && task) {
      if (oldTask.title !== task.title) await TaskHistory.create({ userId, taskId, taskTitle: task.title, action: "Title changed", field: "title", previousValue: oldTask.title, newValue: task.title });
      if (oldTask.priority !== task.priority) await TaskHistory.create({ userId, taskId, taskTitle: task.title, action: `Priority changed to ${task.priority}`, field: "priority", previousValue: oldTask.priority, newValue: task.priority });
      if (oldTask.status !== task.status) await TaskHistory.create({ userId, taskId, taskTitle: task.title, action: `Status changed to ${task.status}`, field: "status", previousValue: oldTask.status, newValue: task.status });
    }

    if (!task) throw new Error("Task not found or access denied");

    // Sync reminders
    if (data.status === "Completed" || data.status === "Cancelled") {
      await deleteRemindersByEntity('Task', taskId);
      
      if (data.status === "Completed") {
        const today = new Date();
        const eod = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 50, 0);
        if (today.getTime() > eod.getTime()) {
          eod.setMinutes(today.getMinutes() + 10);
        }
        await Reminder.create({
          userId,
          entityType: 'Task',
          entityId: taskId,
          remindAt: eod,
          notificationType: 'in-app',
          metadata: { isCompletionCongrats: true }
        });
      }
    } else if (data.reminderTime !== undefined) {
      if (data.reminderTime === null || data.reminderTime === "") {
        await deleteRemindersByEntity('Task', taskId);
      } else {
        await updateReminderTime('Task', taskId, data.reminderTime);
      }
    }
    const taskObj = task.toObject();
    const reminder = await Reminder.findOne({ entityType: 'Task', entityId: task._id.toString(), status: 'pending' }).lean();
    taskObj.reminder = reminder || null;

    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard/today");
    return { success: true, task: JSON.parse(JSON.stringify(taskObj)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTask(taskId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const task = await Task.findOneAndDelete({ _id: taskId, workspaceId: activeWorkspace._id });
    if (!task) throw new Error("Task not found or access denied");

    if (task.attachments?.length > 0) {
      deleteAttachments(task.attachments).catch(console.error);
    }

    // Delete associated reminders
    await deleteRemindersByEntity('Task', taskId);

    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard/today");
    revalidatePath("/dashboard");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function getTaskHistory(taskId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { history: [] };
    await dbConnect();
    const userId = (session.user as any).id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return { history: [] };

    const task = await Task.findOne({ _id: taskId, workspaceId: activeWorkspace._id });
    if (!task) return { history: [] };

    const history = await TaskHistory.find({ taskId }).sort({ timestamp: -1 }).lean();
    return { history: JSON.parse(JSON.stringify(history)) };
  } catch (error) {
    return { history: [] };
  }
}






