import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Notification, INotification } from "@/models/Notification";
import { processDueReminders } from "@/lib/notifications/reminder-processor";
import { notifyUserViaSSE } from "@/lib/notifications/sse-service";
import mongoose from "mongoose";
import { z } from "zod";

// Schema for external/FCM-to-DB notification sync
const FCMNotificationSchema = z.object({
  title: z.string(),
  body: z.string(),
  type: z.string().optional(),
  entityId: z.string().optional(),
  notificationId: z.string().optional(),
  url: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const body = await req.json();

    const parsed = FCMNotificationSchema.safeParse(body);
    if (!parsed.success) {
      console.error("[FCM Sync] Invalid notification payload:", parsed.error);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { title, body: message, type, entityId, notificationId, url } = parsed.data;

    // Idempotency check: if notificationId or matching record exists, return it
    if (notificationId) {
      let objectId: mongoose.Types.ObjectId | null = null;
      if (mongoose.Types.ObjectId.isValid(notificationId)) {
        objectId = new mongoose.Types.ObjectId(notificationId);
      }
      const existing = await Notification.findOne({
        userId,
        $or: [
          ...(objectId ? [{ _id: objectId }] : []),
          { "metadata.notificationId": notificationId },
          { "metadata.reminderId": notificationId },
        ],
      });
      if (existing) {
        console.log("[FCM Sync] Notification already exists, skipping:", notificationId);
        return NextResponse.json({ success: true, exists: true, id: existing._id.toString() });
      }
    }

    // Map FCM type to Notification enum
    const typeMap: Record<string, INotification["type"]> = {
      "TASK_REMINDER": "TASK_REMINDER",
      "ROUTINE_REMINDER": "ROUTINE_REMINDER",
      "BUDGET_ALERT": "BUDGET_ALERT",
      "INVESTMENT_REMINDER": "INVESTMENT_REMINDER",
      "DAILY_SUMMARY": "DAILY_SUMMARY",
      "MORNING_SUMMARY": "MORNING_SUMMARY",
      "SYSTEM": "SYSTEM",
      "CUSTOM_REMINDER": "CUSTOM_REMINDER",
      "EVENT_REMINDER": "EVENT_REMINDER",
      "HABIT_REMINDER": "HABIT_REMINDER",
      "GOAL_REMINDER": "GOAL_REMINDER",
      "SUBSCRIPTION_REMINDER": "SUBSCRIPTION_REMINDER",
      "DOCUMENT_REMINDER": "DOCUMENT_REMINDER",
    };

    const notificationType = type ? typeMap[type.toUpperCase()] || "SYSTEM" : "SYSTEM";

    // Create notification record
    const notification = await Notification.create({
      userId,
      type: notificationType,
      title,
      body: message,
      url,
      entityType: type ? (type.toUpperCase() as any) : undefined,
      entityId,
      status: "SENT",
      sentAt: new Date(),
      deliveredAt: new Date(),
      metadata: {
        notificationId,
        source: "FCM",
      },
    });

    console.log("[FCM Sync] Notification created:", notification._id);
    notifyUserViaSSE(userId.toString(), {
      type: "NOTIFICATION_CREATED",
      notificationId: notification._id.toString(),
    });
    return NextResponse.json({ success: true, id: notification._id.toString() });
  } catch (error) {
    console.error("[FCM Sync] Failed to create notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userIdStr = (session.user as any).id as string;
    const userId = new mongoose.Types.ObjectId(userIdStr);

    const dbNotifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const notifications = dbNotifications.map((n: any) => ({
      id: n._id.toString(),
      type: n.type.toLowerCase(),
      priority: n.metadata?.priority || 'medium',
      title: n.title,
      message: n.body,
      link: n.url || null,
      date: n.createdAt,
      read: !!n.readAt
    }));

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Mark as read or unread
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const body = await req.json();

    if (body.action === 'markAllRead') {
      await Notification.updateMany(
        { userId, readAt: { $exists: false } },
        { $set: { readAt: new Date() } }
      );
      notifyUserViaSSE(userId.toString(), { type: 'NOTIFICATIONS_READ', all: true });
      return NextResponse.json({ success: true });
    }

    const { id, read } = body;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await Notification.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), userId },
      { $set: { readAt: read ? new Date() : null } }
    );

    notifyUserViaSSE(userId.toString(), { type: 'NOTIFICATION_UPDATED', id, read });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Delete notification
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId((session.user as any).id);
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const id = url.searchParams.get("id");

    if (action === 'deleteAll') {
      await Notification.deleteMany({ userId });
      notifyUserViaSSE(userId.toString(), { type: 'NOTIFICATIONS_DELETED', all: true });
      return NextResponse.json({ success: true });
    }

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await Notification.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id), userId });
    notifyUserViaSSE(userId.toString(), { type: 'NOTIFICATIONS_DELETED', id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
