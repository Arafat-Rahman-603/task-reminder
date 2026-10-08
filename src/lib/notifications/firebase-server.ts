import { z } from "zod";
import { getAdminMessaging } from "@/lib/firebaseAdmin";
import dbConnect from "@/lib/db";
import { PushRegistration } from "@/models/PushRegistration";
import mongoose from "mongoose";

const SendPushSchema = z.object({
  userId: z.string().or(z.array(z.string())),
  title: z.string(),
  body: z.string(),
  url: z.string().optional(),
  type: z.string().optional(),
  entityId: z.string().optional(),
  collapseId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type SendPushInput = z.infer<typeof SendPushSchema>;

export async function sendPushNotification(input: SendPushInput) {
  const parsed = SendPushSchema.safeParse(input);
  if (!parsed.success) {
    console.error("Invalid push notification payload:", parsed.error);
    throw new Error("Invalid push notification payload");
  }

  const { userId, title, body, url, type, entityId, collapseId, metadata } = parsed.data;

  const messaging = getAdminMessaging();
  if (!messaging) {
    console.warn("Firebase Admin messaging is not configured. Skipping push notification.");
    return null;
  }

  const targetUserIds = Array.isArray(userId) ? userId : [userId];

  let finalUrl = url;
  if (finalUrl && finalUrl.startsWith("/")) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    finalUrl = `${baseUrl}${finalUrl}`;
  }

  try {
    await dbConnect();

    const objectIds = targetUserIds.map((id) => new mongoose.Types.ObjectId(id));
    const registrations = await PushRegistration.find({
      userId: { $in: objectIds },
      isActive: true,
    });

    if (!registrations.length) {
      console.log("[Firebase Server] No active FCM registrations found for users:", targetUserIds);
      return null;
    }

    const tokens = registrations.map((reg) => reg.fcmToken);

    console.log("[Firebase Server] Sending notification to", tokens.length, "devices:", {
      targetUserIds,
      type,
      entityId,
      collapseId,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const iconUrl = `${baseUrl}/icon-192x192.png`;
    const badgeUrl = `${baseUrl}/favicon-32x32.png`;

function getTTLForType(type?: string): string {
  switch (type) {
    case "task_reminder":
    case "routine_reminder":
      return "14400"; // 4 hours
    case "morning_summary":
      return "21600"; // 6 hours
    case "daily_overview":
      return "43200"; // 12 hours
    default:
      return "86400"; // 24 hours
  }
}

    const message = {
      tokens,
      notification: {
        title,
        body,
      },
      webpush: {
        headers: {
          Urgency: "high",
          TTL: getTTLForType(type),
        },
        notification: {
          title,
          body,
          icon: iconUrl,
          badge: badgeUrl,
          tag: collapseId || entityId || "manageo-notification",
        },
        fcmOptions: {
          link: finalUrl || `${baseUrl}/dashboard`,
        },
      },
      android: {
        priority: "high" as const,
        ttl: parseInt(getTTLForType(type)) * 1000,
        notification: {
          priority: "high" as const,
          defaultSound: true,
          channelId: "manageo-reminders",
        },
      },
      data: {
        title,
        body,
        icon: iconUrl,
        badge: badgeUrl,
        type: type || "",
        entityId: entityId || "",
        notificationId: collapseId || "",
        url: finalUrl || `${baseUrl}/dashboard`,
        ...(metadata
          ? Object.fromEntries(
            Object.entries(metadata).map(([k, v]) => [k, String(v)])
          )
          : {}),
      },
    };

    const response = await messaging.sendEachForMulticast(message);

    console.log("[Firebase Server] Notification sent:", {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp: { success: boolean; error?: unknown }, idx: number) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.error("[Firebase Server] Error for token", tokens[idx], resp.error);
        }
      });

      if (failedTokens.length > 0) {
        console.log("[Firebase Server] Deactivating", failedTokens.length, "invalid tokens");
        await PushRegistration.updateMany(
          { fcmToken: { $in: failedTokens } },
          { $set: { isActive: false } }
        );
      }
    }

    return response;
  } catch (error) {
    console.error("[Firebase Server] Failed to send push notification:", error);
    throw error;
  }
}
