export type CloudinaryResourceType = "image" | "video" | "raw";

const IMAGE_EXT_REGEX = /\.(?:jpe?g|png|webp|gif|svg|bmp|avif|ico)$/i;
const VIDEO_OR_AUDIO_EXT_REGEX = /\.(?:mp4|webm|ogg|mov|mkv|mp3|wav|m4a|flac)$/i;
const RAW_EXT_REGEX = /\.(?:docx?|xlsx?|pptx?|csv|txt|md|json|log|xml|yml|yaml|zip|rar|7z)$/i;

/**
 * Strips query parameters and hash fragments before checking file extensions.
 */
export function stripUrlParams(input?: string | null): string {
  if (!input || typeof input !== "string") return "";
  return input.split("#")[0].split("?")[0].trim();
}

/**
 * Normalizes Cloudinary resource types (`"auto"` is only valid on upload, never delivery).
 */
export function normalizeAssetResourceType(
  resourceType?: string | null,
  filenameOrUrl?: string | null,
  mimeType?: string | null
): CloudinaryResourceType {
  const rt = (resourceType || "").trim().toLowerCase();
  const mime = (mimeType || "").trim().toLowerCase();
  const cleanName = stripUrlParams(filenameOrUrl);

  if (rt === "video" || mime.startsWith("video/") || mime.startsWith("audio/") || VIDEO_OR_AUDIO_EXT_REGEX.test(cleanName)) {
    return "video";
  }
  if (
    rt === "raw" ||
    (mime && !mime.startsWith("image/") && mime !== "application/pdf") ||
    RAW_EXT_REGEX.test(cleanName)
  ) {
    return "raw";
  }
  if (rt === "image" || mime.startsWith("image/") || mime === "application/pdf" || IMAGE_EXT_REGEX.test(cleanName) || /\.pdf$/i.test(cleanName)) {
    return "image";
  }
  return "image";
}

/**
 * Checks whether an attachment or file should render as an image thumbnail/preview.
 */
export function isImageAsset(input: {
  resourceType?: string | null;
  mimeType?: string | null;
  originalFilename?: string | null;
  url?: string | null;
}): boolean {
  const rt = (input.resourceType || "").trim().toLowerCase();
  const mime = (input.mimeType || "").trim().toLowerCase();
  if (rt === "image" || mime.startsWith("image/")) return true;
  if (mime === "application/pdf" || /\.pdf$/i.test(stripUrlParams(input.originalFilename || input.url))) {
    return false;
  }
  return (
    IMAGE_EXT_REGEX.test(stripUrlParams(input.originalFilename)) ||
    IMAGE_EXT_REGEX.test(stripUrlParams(input.url))
  );
}

/**
 * Builds the authenticated asset proxy URL for a Cloudinary asset.
 */
export function buildAssetProxyUrl(
  publicId?: string | null,
  fallbackUrl?: string | null,
  options?: { resourceType?: string | null; filename?: string | null; mimeType?: string | null }
): string {
  if (publicId && publicId.trim()) {
    const encodedPath = publicId
      .trim()
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/");
    const normalizedType = normalizeAssetResourceType(
      options?.resourceType,
      options?.filename || publicId,
      options?.mimeType
    );
    return `/api/assets/${encodedPath}?resourceType=${normalizedType}`;
  }
  return fallbackUrl || "";
}

/**
 * Resolves a user's avatar URL, prioritizing the authenticated Cloudinary proxy when `avatarPublicId` exists.
 */
export function resolveUserAvatarUrl(user?: {
  avatarPublicId?: string | null;
  avatarUrl?: string | null;
  image?: string | null;
} | null): string | null {
  if (!user) return null;
  if (user.avatarPublicId && user.avatarPublicId.trim()) {
    return buildAssetProxyUrl(user.avatarPublicId, user.avatarUrl || user.image, {
      resourceType: "image",
    });
  }
  return user.avatarUrl || user.image || null;
}
