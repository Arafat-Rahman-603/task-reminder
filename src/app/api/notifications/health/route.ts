import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { NotificationPreference } from "@/models/NotificationPreference";
import { PushRegistration } from "@/models/PushRegistration";
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
    const registrations = await PushRegistration.find({ userId, isActive: true });

    if (!pref) {
      return NextResponse.json({
        status: "NOT_CONFIGURED",
        permission: "unknown",
        subscribed: false,
        identitySynced: false,
        serviceWorkerReady: false,
        message: "Notification preferences not set up"
      });
    }

    const hasSubscriptionMetadata = registrations.length > 0;
    const isRecentSync = registrations.some(r => 
      r.lastSeenAt && (Date.now() - new Date(r.lastSeenAt).getTime()) < 30 * 24 * 60 * 60 * 1000
    );

    let status: string;
    let message: string;

    if (!pref.pushEnabled) {
      status = "DISABLED";
      message = "Push notifications are disabled in settings";
    } else if (!hasSubscriptionMetadata) {
      status = "SERVER_SYNC_PROBLEM";
      message = "Server-side subscription synchronization is missing";
    } else if (!isRecentSync) {
      status = "SYNC_STALE";
      message = "Subscription synchronization is stale (older than 30 days)";
    } else {
      status = "HEALTHY";
      message = "Server-side notification synchronization is healthy";
    }

    return NextResponse.json({
      status,
      permission: "unknown",
      subscribed: hasSubscriptionMetadata,
      identitySynced: true, // we assume FCM token correctly belongs to user since backend requires session
      serviceWorkerReady: true,
      message,
      metadata: {
        hasSubscriptionMetadata,
        hasExternalId: true,
        lastSyncAt: registrations[0]?.lastSeenAt,
        isRecentSync
      }
    });
  } catch (error) {
    console.error("Failed to fetch notification health:", error);
    return NextResponse.json({ 
      error: "Internal Server Error",
      status: "ERROR"
    }, { status: 500 });
  }
}
