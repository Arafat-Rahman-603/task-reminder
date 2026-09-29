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

  const payload = {
    app_id: appId,
    include_aliases: {
      external_id: targetExternalIds,
    },
    target_channel: "push",
    collapse_id: collapseId,
    headings: { en: title },
    contents: { en: body },
    url: url || undefined,
    data: {
      type,
      entityId,
      ...metadata,
    },
  };

  try {
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OneSignal API error:", data);
      throw new Error(`OneSignal API error: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    console.error("Failed to send push notification via OneSignal:", error);
    throw error;
  }
}
