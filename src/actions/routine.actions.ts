"use server";

import dbConnect from "@/lib/db";
import Routine from "@/models/Routine";
import RoutineHistory from "@/models/RoutineHistory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Reminder from "@/models/Reminder";
import { revalidatePath } from "next/cache";
import { deleteRemindersByEntity } from "./reminder.actions";

export async function getRoutines() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { routines: [] };

    await dbConnect();
    const _userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return { routines: [] };

    const routines = await Routine.find({ workspaceId: activeWorkspace._id }).sort({ createdAt: -1 }).lean();

    const routineIds = routines.map((r) => r._id);
    const reminders = await Reminder.find({ entityType: 'Routine', entityId: { $in: routineIds }, status: 'pending' }).lean();
    const reminderMap = new Map();
    reminders.forEach((r: { entityId: { toString(): string } }) => reminderMap.set(r.entityId.toString(), r));
    routines.forEach((r: { _id: { toString(): string }; reminder?: unknown }) => {
      r.reminder = reminderMap.get(r._id.toString()) || null;
    });

    return { routines: JSON.parse(JSON.stringify(routines)) };
  } catch {
    return { routines: [] };
  }
}

export interface RoutineStepItem {
  title: string;
  durationMinutes?: number;
  startTime?: string;
  endTime?: string;
  isCompleted?: boolean;
  remindAtStart?: boolean;
  remindAtEnd?: boolean;
}

export interface RoutineInput {
  name: string;
  description?: string;
  startDate?: string | Date;
  startTime?: string;
  endTime?: string;
  reminderTime?: string | Date | null;
  recurrence?: string;
  schedule?: string[];
  items?: RoutineStepItem[];
  [key: string]: unknown;
}

export async function createRoutine(data: RoutineInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    const userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const insertData = { ...data, userId, workspaceId: activeWorkspace._id };
    if (data.startDate) {
      insertData.startDate = new Date(data.startDate);
    }
    
    const routine = await Routine.create(insertData);

    const now = new Date();
    const baseDate = data.startDate ? new Date(data.startDate) : now;
    let tickTime;
    
    if (data.reminderTime) {
      tickTime = new Date(data.reminderTime);
    } else if (data.startTime) {
      const [h, m] = data.startTime.split(':').map(Number);
      tickTime = new Date(baseDate);
      tickTime.setHours(h, m, 0, 0);
      if (tickTime < now) tickTime.setDate(tickTime.getDate() + 1);
    } else {
      tickTime = new Date(baseDate);
      tickTime.setHours(0, 0, 0, 0);
      if (tickTime < now) tickTime.setDate(tickTime.getDate() + 1);
    }

    await Reminder.create({
      userId,
      entityType: 'Routine',
      entityId: routine._id.toString(),
      remindAt: tickTime,
      notificationType: 'in-app',
      metadata: { isMainReminder: true, skipNotification: !data.reminderTime }
    });

    // Schedule step reminders
    if (data.startDate && data.items) {
      const baseDateStr = new Date(data.startDate).toISOString().split('T')[0];
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        if (item.remindAtStart && item.startTime) {
          const dt = new Date(`${baseDateStr}T${item.startTime}:00`);
          if (!isNaN(dt.getTime())) {
            await Reminder.create({
              userId,
              entityType: 'Routine',
              entityId: routine._id.toString(),
              remindAt: dt,
              notificationType: 'in-app',
              metadata: { isStepReminder: true, stepIndex: i, type: 'start', title: item.title }
            });
          }
        }
        if (item.remindAtEnd && item.endTime) {
          const dt = new Date(`${baseDateStr}T${item.endTime}:00`);
          if (!isNaN(dt.getTime())) {
            await Reminder.create({
              userId,
              entityType: 'Routine',
              entityId: routine._id.toString(),
              remindAt: dt,
              notificationType: 'in-app',
              metadata: { isStepReminder: true, stepIndex: i, type: 'end', title: item.title }
            });
          }
        }
      }
    }
    
    const routineObj = routine.toObject();
    const reminder = await Reminder.findOne({ entityType: 'Routine', entityId: routine._id.toString(), status: 'pending', 'metadata.isMainReminder': true }).lean();
    routineObj.reminder = reminder || null;

    revalidatePath("/dashboard/routines");
    revalidatePath("/dashboard/today");
    return { success: true, routine: JSON.parse(JSON.stringify(routineObj)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateRoutine(id: string, data: Partial<RoutineInput>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    const userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const updateData = { ...data };
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }

    const routine = await Routine.findOneAndUpdate({ _id: id, workspaceId: activeWorkspace._id }, updateData, { returnDocument: 'after' });
    
    await Reminder.deleteMany({ userId, entityType: 'Routine', entityId: routine._id.toString(), status: 'pending' });

    const now = new Date();
    const baseDate = data.startDate ? new Date(data.startDate) : now;
    let tickTime;
    
    if (data.reminderTime) {
      tickTime = new Date(data.reminderTime);
    } else if (data.startTime) {
      const [h, m] = data.startTime.split(':').map(Number);
      tickTime = new Date(baseDate);
      tickTime.setHours(h, m, 0, 0);
      if (tickTime < now) tickTime.setDate(tickTime.getDate() + 1);
    } else {
      tickTime = new Date(baseDate);
      tickTime.setHours(0, 0, 0, 0);
      if (tickTime < now) tickTime.setDate(tickTime.getDate() + 1);
    }

    await Reminder.create({
      userId,
      entityType: 'Routine',
      entityId: routine._id.toString(),
      remindAt: tickTime,
      notificationType: 'in-app',
      metadata: { isMainReminder: true, skipNotification: !data.reminderTime }
    });
    
    if (data.startDate && data.items) {
      const baseDateStr = new Date(data.startDate).toISOString().split('T')[0];
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        if (item.remindAtStart && item.startTime) {
          const dt = new Date(`${baseDateStr}T${item.startTime}:00`);
          if (!isNaN(dt.getTime())) {
            await Reminder.create({
              userId,
              entityType: 'Routine',
              entityId: routine._id.toString(),
              remindAt: dt,
              notificationType: 'in-app',
              metadata: { isStepReminder: true, stepIndex: i, type: 'start', title: item.title }
            });
          }
        }
        if (item.remindAtEnd && item.endTime) {
          const dt = new Date(`${baseDateStr}T${item.endTime}:00`);
          if (!isNaN(dt.getTime())) {
            await Reminder.create({
              userId,
              entityType: 'Routine',
              entityId: routine._id.toString(),
              remindAt: dt,
              notificationType: 'in-app',
              metadata: { isStepReminder: true, stepIndex: i, type: 'end', title: item.title }
            });
          }
        }
      }
    }

    const routineObj = routine.toObject();
    const reminder = await Reminder.findOne({ entityType: 'Routine', entityId: routine._id.toString(), status: 'pending', 'metadata.isMainReminder': true }).lean();
    routineObj.reminder = reminder || null;
    
    revalidatePath("/dashboard/routines");
    revalidatePath("/dashboard/today");
    return { success: true, routine: JSON.parse(JSON.stringify(routineObj)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleRoutineItem(routineId: string, itemIndex: number, isCompleted: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    const _userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const routine = await Routine.findOne({ _id: routineId, workspaceId: activeWorkspace._id });
    if (!routine) throw new Error("Routine not found");

    if (routine.items && routine.items[itemIndex]) {
      routine.items[itemIndex].isCompleted = isCompleted;
      await routine.save();
    }
    const routineObj = routine.toObject();
    const reminder = await Reminder.findOne({ entityType: 'Routine', entityId: routine._id.toString(), status: 'pending', 'metadata.isMainReminder': true }).lean();
    routineObj.reminder = reminder || null;
    
    revalidatePath("/dashboard/routines");
    revalidatePath("/dashboard/today");
    return { success: true, routine: JSON.parse(JSON.stringify(routineObj)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteRoutine(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    const _userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const { moveToTrash } = await import("@/actions/trash.actions");
    await moveToTrash("Routine", id);
    
    // Delete associated reminders
    await deleteRemindersByEntity('Routine', id);
    
    revalidatePath("/dashboard/routines");
    revalidatePath("/dashboard/today");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getRoutineHistory(routineId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { history: [] };
    await dbConnect();
    const _userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return { history: [] };

    // Verify routine belongs to the active workspace
    const routine = await Routine.findOne({ _id: routineId, workspaceId: activeWorkspace._id });
    if (!routine) return { history: [] };

    // Fetch history for the routine, disregarding the actor's userId
    const history = await RoutineHistory.find({ routineId }).sort({ occurrenceDate: -1 }).lean();
    return { history: JSON.parse(JSON.stringify(history)) };
  } catch {
    return { history: [] };
  }
}





async function _syncRoutineHistory(routine: { _id: unknown; name: string; startTime?: string | null; items?: Array<{ title: string; isCompleted?: boolean }> }, userId: string) {
  try {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const allCompleted = routine.items && routine.items.length > 0 && routine.items.every((i: { isCompleted?: boolean }) => i.isCompleted);
    const status = allCompleted ? "Completed" : "Scheduled";
    
    await RoutineHistory.findOneAndUpdate(
      { routineId: routine._id, userId, occurrenceDate: startOfDay },
      {
        routineName: routine.name,
        scheduledTime: routine.startTime || null,
        status,
        completedAt: allCompleted ? new Date() : null,
        items: routine.items ? routine.items.map((i: { title: string; isCompleted?: boolean }) => ({ title: i.title, isCompleted: i.isCompleted })) : [],
        timestamp: new Date()
      },
      { upsert: true }
    );
  } catch (error) {
    console.error("Failed to sync routine history:", error);
  }
}


export async function getRoutineById(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return null;
    await dbConnect();
    const _userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return null;

    const routine = await Routine.findOne({ _id: id, workspaceId: activeWorkspace._id }).lean();
    if (!routine) return null;
    return JSON.parse(JSON.stringify(routine));
  } catch {
    return null;
  }
}
export async function getRoutineStats(routineId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return null;
    await dbConnect();
    const _userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return null;

    // Verify routine belongs to active workspace first
    const routine = await Routine.findOne({ _id: routineId, workspaceId: activeWorkspace._id });
    if (!routine) return null;

    // Fetch history regardless of userId as per Phase 1.1 docs
    const history = await RoutineHistory.find({ routineId }).sort({ occurrenceDate: 1 }).lean();
    
    interface RoutineHistoryDoc { status: string; occurrenceDate: Date | string; [key: string]: unknown; }
    const typedHistory = history as unknown as RoutineHistoryDoc[];
    const total = typedHistory.length;
    const completed = typedHistory.filter((h) => h.status === "Completed").length;
    const missed = typedHistory.filter((h) => h.status === "Missed").length;
    const pending = typedHistory.filter((h) => h.status === "Scheduled").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    const sortedCompleted = typedHistory.filter((h) => h.status === "Completed").sort((a, b) => new Date(a.occurrenceDate).getTime() - new Date(b.occurrenceDate).getTime());
    
    for (let i = 0; i < sortedCompleted.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedCompleted[i - 1].occurrenceDate);
        const curr = new Date(sortedCompleted[i].occurrenceDate);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    }
    
    if (sortedCompleted.length > 0) {
      const lastDate = new Date(sortedCompleted[sortedCompleted.length - 1].occurrenceDate);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastDateNorm = new Date(lastDate);
      lastDateNorm.setUTCHours(0, 0, 0, 0);
      
      if (lastDateNorm.getTime() >= yesterday.getTime()) {
        currentStreak = tempStreak;
      }
    }

    const lastCompleted = typedHistory.filter((h) => h.status === "Completed").slice(-1)[0] || null;
    const nextScheduled = typedHistory.find((h) => h.status === "Scheduled") || null;

    return {
      total,
      completed,
      missed,
      pending,
      completionRate,
      currentStreak,
      bestStreak,
      lastCompleted: lastCompleted ? JSON.parse(JSON.stringify(lastCompleted)) : null,
      nextScheduled: nextScheduled ? JSON.parse(JSON.stringify(nextScheduled)) : null,
    };
  } catch {
    return null;
  }
}


