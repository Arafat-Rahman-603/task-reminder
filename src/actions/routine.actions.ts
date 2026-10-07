"use server";

import dbConnect from "@/lib/db";
import Routine from "@/models/Routine";
import RoutineHistory from "@/models/RoutineHistory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Reminder from "@/models/Reminder";
import { revalidatePath } from "next/cache";
import { createReminder, updateReminderTime, deleteRemindersByEntity } from "./reminder.actions";

export async function getRoutines() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { routines: [] };

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const routines = await Routine.find({ userId }).sort({ createdAt: -1 }).lean();

    const routineIds = routines.map((r: any) => r._id);
    const reminders = await Reminder.find({ entityType: 'Routine', entityId: { $in: routineIds }, status: 'pending' }).lean();
    const reminderMap = new Map();
    reminders.forEach((r: any) => reminderMap.set(r.entityId.toString(), r));
    routines.forEach((r: any) => {
      r.reminder = reminderMap.get(r._id.toString()) || null;
    });

    return { routines: JSON.parse(JSON.stringify(routines)) };
  } catch (error) {
    return { routines: [] };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createRoutine(data: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const insertData = { ...data, userId };
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateRoutine(id: string, data: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const updateData = { ...data };
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }

    const routine = await Routine.findOneAndUpdate({ _id: id, userId }, updateData, { returnDocument: 'after' });
    
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const routine = await Routine.findOne({ _id: routineId, userId });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    await Routine.findOneAndDelete({ _id: id, userId });
    
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
    const userId = (session.user as any).id;
    const history = await RoutineHistory.find({ routineId, userId }).sort({ occurrenceDate: -1 }).lean();
    return { history: JSON.parse(JSON.stringify(history)) };
  } catch (error) {
    return { history: [] };
  }
}





async function syncRoutineHistory(routine: any, userId: string) {
  try {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const allCompleted = routine.items && routine.items.length > 0 && routine.items.every((i: any) => i.isCompleted);
    const status = allCompleted ? "Completed" : "Scheduled";
    
    await RoutineHistory.findOneAndUpdate(
      { routineId: routine._id, userId, occurrenceDate: startOfDay },
      {
        routineName: routine.name,
        scheduledTime: routine.startTime || null,
        status,
        completedAt: allCompleted ? new Date() : null,
        items: routine.items ? routine.items.map((i: any) => ({ title: i.title, isCompleted: i.isCompleted })) : [],
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const routine = await Routine.findOne({ _id: id, userId }).lean();
    if (!routine) return null;
    return JSON.parse(JSON.stringify(routine));
  } catch (error) {
    return null;
  }
}
export async function getRoutineStats(routineId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return null;
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const history = await RoutineHistory.find({ routineId, userId }).sort({ occurrenceDate: 1 }).lean();
    
    const total = history.length;
    const completed = history.filter((h: any) => h.status === "Completed").length;
    const missed = history.filter((h: any) => h.status === "Missed").length;
    const pending = history.filter((h: any) => h.status === "Scheduled").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate current streak (consecutive completed days backwards from today)
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    const sortedCompleted = history.filter((h: any) => h.status === "Completed").sort((a: any, b: any) => new Date(a.occurrenceDate).getTime() - new Date(b.occurrenceDate).getTime());
    
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
    
    // Current streak: check if the most recent completed is today or yesterday
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

    const lastCompleted = history.filter((h: any) => h.status === "Completed").slice(-1)[0] || null;
    const nextScheduled = history.find((h: any) => h.status === "Scheduled") || null;

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
  } catch (error) {
    return null;
  }
}
