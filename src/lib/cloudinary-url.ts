import { v2 as cloudinary } from "cloudinary";
import { normalizeAssetResourceType } from "./media-utils";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "1234567890",
  api_secret: process.env.CLOUDINARY_API_SECRET || "dummy_secret",
  secure: true,
  analytics: false,
});

/**
 * Generates a signed Cloudinary delivery URL for an authenticated asset.
 */
export function generateSignedAssetUrl(
  publicId: string,
  resourceType?: string | null,
  deliveryType: "authenticated" | "upload" = "authenticated"
): string {
  const normalizedType = normalizeAssetResourceType(resourceType, publicId);
  return cloudinary.url(publicId, {
    type: deliveryType,
    sign_url: deliveryType === "authenticated",
    resource_type: normalizedType,
    secure: true,
    analytics: false,
    urlAnalytics: false,
  });
}
