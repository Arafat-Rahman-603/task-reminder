"use server";

import dbConnect from "@/lib/db";
import Routine from "@/models/Routine";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getRoutines() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { routines: [] };

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const routines = await Routine.find({ userId }).sort({ createdAt: -1 }).lean();
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

    const routine = await Routine.create({
      ...data,
      userId,
    });

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

    const routine = await Routine.findOneAndUpdate({ _id: id, userId }, data, { new: true });
    
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
    
    revalidatePath("/dashboard/routines");
    revalidatePath("/dashboard/today");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
