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

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional(),
  notes: z.string().max(10000).optional(),
  status: z.enum(["Inbox", "Planned", "In Progress", "Completed", "Cancelled"]).optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  startDate: z.string().optional(),
  startTime: z.string().optional(),
  recurringSchedule: z.string().optional(),
  tags: z.array(z.string()).optional(),
  reminderTime: z.string().optional(),
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

    // Generate unique slug
    let baseSlug = validated.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = 'task';
    let slug = baseSlug;
    let counter = 1;
    while (await Task.findOne({ userId, slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const task = await Task.create({
      ...validated,
      userId,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    let query: any = { userId };
    
    // If filters are provided, translate them securely using the filterTranslator
    if (filters && Object.keys(filters).length > 0) {
      const { taskFilterFromDashboardFilters } = await import('@/lib/filterTranslators');
      query = taskFilterFromDashboardFilters(userId, filters);
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

    const oldTask = await Task.findOne({ _id: taskId, userId });
    await Task.findOneAndUpdate({ _id: taskId, userId }, { status, completedAt: status === "Completed" ? new Date() : null });
    
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

    const task: any = await Task.findOne({ userId, slug }).lean();
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

    const updateData: Record<string, unknown> = { ...data };
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    
    // Automatically set completedAt
    if (data.status === "Completed") {
      updateData.completedAt = new Date();
    } else if (data.status) {
      updateData.completedAt = null;
    }

    const oldTask = await Task.findOne({ _id: taskId, userId });

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      updateData,
      { returnDocument: 'after' }
    );

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

    const task = await Task.findOneAndDelete({ _id: taskId, userId });
    if (!task) throw new Error("Task not found or access denied");

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
    const history = await TaskHistory.find({ taskId, userId }).sort({ timestamp: -1 }).lean();
    return { history: JSON.parse(JSON.stringify(history)) };
  } catch (error) {
    return { history: [] };
  }
}

