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

    let pref = await NotificationPreference.findOne({ userId });
    
    if (!pref) {
      pref = await NotificationPreference.create({
        userId,
        pushEnabled: false,
        taskReminders: true,
        routineReminders: true,
        budgetAlerts: true,
        investmentReminders: true,
        dailySummary: false,
        quietHours: {
          enabled: false,
          start: "22:00",
          end: "07:00",
        },
        timezone: "UTC",
      });
    }

    return NextResponse.json({ preferences: pref });
  } catch (error) {
    console.error("Failed to fetch notification preferences:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    const updated = await NotificationPreference.findOneAndUpdate(
      { userId },
      { $set: body },
      { returnDocument: 'after', upsert: true }
    );

    return NextResponse.json({ preferences: updated });
  } catch (error) {
    console.error("Failed to update notification preferences:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
