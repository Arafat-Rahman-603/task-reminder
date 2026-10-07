import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPushNotification } from "@/lib/notifications/firebase-server";
import { NotificationPreference } from "@/models/NotificationPreference";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userIdStr = (session.user as any).id as string;
    const userId = new mongoose.Types.ObjectId(userIdStr);

    const pref = await NotificationPreference.findOne({ userId });
    
    if (!pref || !pref.pushEnabled) {
      return NextResponse.json(
        { error: "Push notifications are not enabled for this user" },
        { status: 400 }
      );
    }

    console.log('[Test Notification] Sending to userId:', userIdStr);

    const result = await sendPushNotification({
      userId: userIdStr,
      title: "Manageo Test Notification",
      body: "Push notifications are working correctly.",
      url: "/dashboard/settings/notifications",
      type: "SYSTEM",
    });

    if (!result || result.successCount === 0) {
      return NextResponse.json(
        { 
          error: "Notification sent, but no active FCM devices found for your user. Please try enabling notifications again.",
          userId: userIdStr,
          result
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Failed to send test notification:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send test notification" },
      { status: 500 }
    );
  }
}
