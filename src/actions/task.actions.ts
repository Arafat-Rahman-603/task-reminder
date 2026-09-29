"use server";

import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createReminder } from "./reminder.actions";

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

    if (validated.reminderTime) {
      await createReminder({
        entityType: 'Task',
        entityId: task._id.toString(),
        remindAt: validated.reminderTime
      });
    }

    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard/today");
    return { success: true, task: JSON.parse(JSON.stringify(task)) };
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { userId };
    
    // Simple filter support
    if (filters?.status) query.status = filters.status;

    const tasks = await Task.find(query).sort({ dueDate: 1, createdAt: -1 }).lean();

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

    await Task.findOneAndUpdate({ _id: taskId, userId }, { status });
    
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

    const task = await Task.findOne({ userId, slug }).lean();
    if (!task) return null;

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

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      updateData,
      { new: true }
    );

    if (!task) throw new Error("Task not found or access denied");

    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard/today");
    return { success: true, task: JSON.parse(JSON.stringify(task)) };
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

    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard/today");
    revalidatePath("/dashboard");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
