"use server";

import dbConnect from "@/lib/db";
import Routine from "@/models/Routine";
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

    if (data.reminderTime) {
      await createReminder({
        entityType: 'Routine',
        entityId: routine._id.toString(),
        remindAt: data.reminderTime
      });
    }

    revalidatePath("/dashboard/routines");
    revalidatePath("/dashboard/today");
    return { success: true, routine: JSON.parse(JSON.stringify(routine)) };
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

    const routine = await Routine.findOneAndUpdate({ _id: id, userId }, updateData, { new: true });
    
    if (data.reminderTime !== undefined && routine) {
      if (data.reminderTime === null || data.reminderTime === "") {
        await deleteRemindersByEntity('Routine', routine._id.toString());
      } else {
        await updateReminderTime('Routine', routine._id.toString(), data.reminderTime);
      }
    }
    
    revalidatePath("/dashboard/routines");
    revalidatePath("/dashboard/today");
    return { success: true, routine: JSON.parse(JSON.stringify(routine)) };
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
    
    revalidatePath("/dashboard/routines");
    revalidatePath("/dashboard/today");
    return { success: true, routine: JSON.parse(JSON.stringify(routine)) };
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
