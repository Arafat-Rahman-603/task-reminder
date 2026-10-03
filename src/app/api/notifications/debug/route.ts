import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { NotificationPreference } from "@/models/NotificationPreference";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const pref = await NotificationPreference.findOne({ userId });

    if (!pref) {
      return NextResponse.json({ 
        error: "No notification preferences found",
        userId: userId.toString(),
        pushEnabled: false,
      });
    }

    return NextResponse.json({
      userId: userId.toString(),
      pushEnabled: pref.pushEnabled,
      taskReminders: pref.taskReminders,
      routineReminders: pref.routineReminders,
      quietHours: pref.quietHours,
      timezone: pref.timezone,
      metadata: pref.metadata || {},
      createdAt: pref.createdAt,
      updatedAt: pref.updatedAt,
    });
  } catch (error) {
    console.error("Failed to fetch notification debug info:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
