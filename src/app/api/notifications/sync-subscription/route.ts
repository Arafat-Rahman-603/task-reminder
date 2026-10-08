import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { PushRegistration } from "@/models/PushRegistration";
import { NotificationPreference } from "@/models/NotificationPreference";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fcmToken, userAgent, platform } = body;

    if (!fcmToken) {
      return NextResponse.json({ error: "Missing fcmToken" }, { status: 400 });
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    // Update or create the push registration for this token
    await PushRegistration.findOneAndUpdate(
      { fcmToken },
      {
        $set: {
          userId,
          userAgent,
          platform,
          isActive: true,
          lastSeenAt: new Date()
        }
      },
      { upsert: true, returnDocument: "after" }
    );

    // Also update notification preference to ensure push is enabled
    const pref = await NotificationPreference.findOneAndUpdate(
      { userId },
      {
        $set: {
          pushEnabled: true,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    console.log('[Notification] FCM Token synced for user:', userId.toString());

    return NextResponse.json({ success: true, pref });
  } catch (error) {
    console.error("Failed to sync FCM subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
