import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPushNotification } from "@/lib/notifications/onesignal-server";
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

    const result = await sendPushNotification({
      userId: userIdStr,
      title: "Manageo Test Notification",
      body: "Push notifications are working correctly.",
      url: "/dashboard/settings/notifications",
      type: "SYSTEM",
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Failed to send test notification:", error);
    return NextResponse.json(
      { error: "Failed to send test notification", details: error.message },
      { status: 500 }
    );
  }
}
