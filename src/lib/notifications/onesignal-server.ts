import { z } from "zod";

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
  
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    console.warn("OneSignal is not configured on the server. Skipping push notification.");
    return null;
  }

  const targetExternalIds = Array.isArray(userId) ? userId : [userId];

    let finalUrl = url;
    if (finalUrl && finalUrl.startsWith("/")) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://manageo.axiomixs.com';
      finalUrl = `${baseUrl}${finalUrl}`;
    }

    const payload = {
      app_id: appId,
      include_external_user_ids: targetExternalIds,
      target_channel: "push",
      collapse_id: collapseId,
      priority: 10,
      ios_interruption_level: "time_sensitive",
      headings: { en: title },
      contents: { en: body },
      url: finalUrl || undefined,
      data: {
        type,
        entityId,
        ...metadata,
      },
    };

  try {
    console.log('[OneSignal Server] Sending notification:', {
      targetExternalIds,
      type,
      entityId,
      collapseId
    });
    
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || (data.errors && (Array.isArray(data.errors) ? data.errors.length > 0 : Object.keys(data.errors).length > 0))) {
      console.error("[OneSignal Server] API error:", {
        status: response.status,
        errors: data.errors,
        targetExternalIds,
        recipients: data.recipients
      });
      
      // Log specific error for debugging
      const errorString = JSON.stringify(data.errors);
      if (errorString.includes("All included players are not subscribed") || errorString.includes("invalid_aliases")) {
        console.error("[OneSignal Server] Target users are not subscribed. External IDs:", targetExternalIds);
        console.error("[OneSignal Server] This typically means:");
        console.error("  1. The external_id is not set on any active subscription");
        console.error("  2. The subscription exists but is not opted in (push permission denied)");
        console.error("  3. The user cleared browser data and created a new subscription without re-login");
      }
      
      throw new Error(`OneSignal API error: ${JSON.stringify(data.errors || data)}`);
    }

    console.log('[OneSignal Server] Notification sent successfully:', {
      recipients: data.recipients,
      notificationId: data.id
    });
    
    return data;
  } catch (error) {
    console.error("[OneSignal Server] Failed to send push notification:", error);
    throw error;
  }
}
