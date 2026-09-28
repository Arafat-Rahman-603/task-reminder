"use server";

import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  dueDate: z.string().optional(),
});

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: "Low" | "Medium" | "High" | "Urgent";
  dueDate?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    const validated = createTaskSchema.parse(data);
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const task = await Task.create({
      ...validated,
      userId,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
    });

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

export async function updateTask(taskId: string, data: {
  title?: string;
  description?: string;
  priority?: "Low" | "Medium" | "High" | "Urgent";
  dueDate?: string;
  status?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

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
