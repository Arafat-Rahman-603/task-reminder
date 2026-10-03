import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { NotificationPreference } from "@/models/NotificationPreference";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionId, externalId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = new mongoose.Types.ObjectId((session.user as any).id);

    // Update or create notification preference with subscription info
    const pref = await NotificationPreference.findOneAndUpdate(
      { userId },
      {
        $set: {
          pushEnabled: true,
          // Store subscription metadata for debugging
          'metadata.onesignalSubscriptionId': subscriptionId,
          'metadata.onesignalExternalId': externalId,
          'metadata.lastSyncAt': new Date().toISOString(),
          // Clear any previous delivery error so cron will retry
          'metadata.deliveryError': null,
          'metadata.errorMessage': null,
        },
      },
      { upsert: true, new: true }
    );

    console.log('[Notification] Subscription synced for user:', userId.toString(), 'subscriptionId:', subscriptionId);

    return NextResponse.json({ success: true, pref });
  } catch (error) {
    console.error("Failed to sync subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
