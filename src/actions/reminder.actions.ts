"use server";

import dbConnect from "@/lib/db";
import Reminder from "@/models/Reminder";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createReminder(data: {
  entityType: 'Task' | 'Event' | 'Habit' | 'Goal' | 'Subscription' | 'Document' | 'CustomRecord' | 'Routine' | 'Idea';
  entityId: string;
  remindAt: string;
  notificationType?: 'email' | 'push' | 'in-app';
  metadata?: any;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const reminder = await Reminder.create({
      userId,
      entityType: data.entityType,
      entityId: data.entityId,
      remindAt: new Date(data.remindAt),
      notificationType: data.notificationType || 'in-app',
      metadata: data.metadata
    });

    revalidatePath("/dashboard");
    return { success: true, reminder: JSON.parse(JSON.stringify(reminder)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPendingReminders() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { reminders: [] };

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    // Get all pending reminders up to now + 24 hours
    const next24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const reminders = await Reminder.find({
      userId,
      status: 'pending',
      remindAt: { $lte: next24Hours }
    }).sort({ remindAt: 1 }).lean();

    return { reminders: JSON.parse(JSON.stringify(reminders)) };
  } catch (error) {
    return { reminders: [] };
  }
}

export async function dismissReminder(reminderId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    await Reminder.findOneAndUpdate({ _id: reminderId, userId }, { status: 'dismissed' });
    
    revalidatePath("/dashboard");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteRemindersByEntity(entityType: string, entityId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    await Reminder.deleteMany({ userId, entityType, entityId });
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateReminderTime(entityType: string, entityId: string, remindAt: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const existing = await Reminder.findOne({ userId, entityType, entityId, status: 'pending' });
    if (existing) {
      existing.remindAt = new Date(remindAt);
      await existing.save();
    } else {
      await Reminder.create({
        userId,
        entityType,
        entityId,
        remindAt: new Date(remindAt),
        notificationType: 'in-app'
      });
    }

    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
