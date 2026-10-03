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
        status: "NOT_CONFIGURED",
        permission: "unknown",
        subscribed: false,
        identitySynced: false,
        serviceWorkerReady: false,
        message: "Notification preferences not set up"
      });
    }

    // Check server-side subscription metadata
    const hasSubscriptionMetadata = !!pref.metadata?.onesignalSubscriptionId;
    const hasExternalId = !!pref.metadata?.onesignalExternalId;
    const isRecentSync = pref.metadata?.lastSyncAt 
      ? (Date.now() - new Date(pref.metadata.lastSyncAt).getTime()) < 24 * 60 * 60 * 1000 // Within 24 hours
      : false;

    // Determine overall health status
    let status: string;
    let message: string;

    if (!pref.pushEnabled) {
      status = "DISABLED";
      message = "Push notifications are disabled in settings";
    } else if (!hasSubscriptionMetadata || !hasExternalId) {
      status = "SERVER_SYNC_PROBLEM";
      message = "Server-side subscription synchronization is missing or stale";
    } else if (!isRecentSync) {
      status = "SYNC_STALE";
      message = "Subscription synchronization is stale (older than 24 hours)";
    } else {
      status = "HEALTHY";
      message = "Server-side notification synchronization is healthy";
    }

    return NextResponse.json({
      status,
      permission: "unknown", // Server cannot check browser permission
      subscribed: hasSubscriptionMetadata,
      identitySynced: hasExternalId,
      serviceWorkerReady: true, // Server cannot check this directly
      message,
      metadata: {
        hasSubscriptionMetadata,
        hasExternalId,
        lastSyncAt: pref.metadata?.lastSyncAt,
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
