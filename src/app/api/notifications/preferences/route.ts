import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { NotificationPreference } from "@/models/NotificationPreference";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(req: Request) {
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
      // Get client timezone from query param if provided
      const url = new URL(req.url);
      const clientTimezone = url.searchParams.get('timezone');

      pref = await NotificationPreference.create({
        userId,
        pushEnabled: false,
        taskReminders: true,
        routineReminders: true,
        dailyOverview: {
          enabled: true,
          time: "00:00",
        },
        morningSummary: {
          enabled: true,
          time: "07:00",
        },
        quietHours: {
          enabled: false,
          start: "22:00",
          end: "07:00",
        },
        timezone: clientTimezone || "UTC",
      });
    } else {
      let needsSave = false;
      if (!pref.dailyOverview) {
        pref.dailyOverview = { enabled: true, time: "00:00" };
        needsSave = true;
      }
      if (!pref.morningSummary) {
        pref.morningSummary = { enabled: true, time: "07:00" };
        needsSave = true;
      }
      if (needsSave) {
        await pref.save();
      }
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

    // Sync timezone to User model if it was changed
    if (body.timezone) {
      await User.findByIdAndUpdate(userId, {
        $set: { "preferences.timezone": body.timezone }
      });
    }

    return NextResponse.json({ preferences: updated });
  } catch (error) {
    console.error("Failed to update notification preferences:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
