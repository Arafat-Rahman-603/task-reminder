import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "1234567890",
  api_secret: process.env.CLOUDINARY_API_SECRET || "dummy_secret",
  secure: true,
  analytics: false,
});

/**
 * Internal system-only Cloudinary asset deletion for background cron jobs (e.g. Trash purge).
 * This module is NOT marked "use server" and is NEVER exposed as a Next.js Server Action or public endpoint.
 * It requires a valid system authorization token (matching CRON_SECRET) to prevent unauthorized internal invocations.
 */
export async function systemDeleteAttachments(
  attachments: { publicId: string }[] | undefined,
  systemAuthToken?: string
): Promise<{ success: boolean; deletedCount: number; errors: string[] }> {
  if (!attachments || !attachments.length) {
    return { success: true, deletedCount: 0, errors: [] };
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || systemAuthToken !== cronSecret) {
    throw new Error("Unauthorized system operation: invalid or missing system authorization token");
  }

  let deletedCount = 0;
  const errors: string[] = [];

  for (const att of attachments) {
    if (att.publicId) {
      try {
        const res = await cloudinary.uploader.destroy(att.publicId);
        if (res.result === "ok" || res.result === "not found") {
          deletedCount++;
        } else {
          throw new Error(`Cloudinary returned status: ${res.result}`);
        }
      } catch (err: unknown) {
        console.error(`System failed to delete attachment ${att.publicId}:`, err);
        errors.push(`Asset ${att.publicId}: ${err instanceof Error ? err.message : "Deletion failed"}`);
        throw err; // Rethrow to allow purge worker to track partial failure and schedule retry
      }
    }
  }

  return { success: errors.length === 0, deletedCount, errors };
}

export async function systemDeleteImage(
  publicId: string,
  systemAuthToken?: string
): Promise<{ success: boolean; error?: string }> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || systemAuthToken !== cronSecret) {
    throw new Error("Unauthorized system operation: invalid or missing system authorization token");
  }

  try {
    const res = await cloudinary.uploader.destroy(publicId);
    if (res.result === "ok" || res.result === "not found") {
      return { success: true };
    }
    return { success: false, error: `Cloudinary returned: ${res.result}` };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete image" };
  }
}
