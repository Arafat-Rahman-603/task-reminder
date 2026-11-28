import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { generateSignedAssetUrl } from "@/lib/cloudinary-url";
import { FOUNDER_FALLBACK_PUBLIC_ID } from "@/lib/ai/founder-profile";

export const dynamic = "force-dynamic";

interface CachedFounderAvatar {
  publicId: string;
  fallbackUrl: string | null;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedFounder: CachedFounderAvatar | null = null;

function buildFallbackPortraitSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" role="img" aria-label="Arafat Rahman">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#818cf8"/>
    </linearGradient>
  </defs>
  <rect width="240" height="240" rx="40" fill="url(#bg)"/>
  <circle cx="120" cy="108" r="56" fill="url(#accent)" fill-opacity="0.18" stroke="url(#accent)" stroke-width="2.5"/>
  <text x="120" y="122" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="40" font-weight="700" fill="#e2e8f0">AR</text>
  <text x="120" y="200" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="14" font-weight="600" fill="#94a3b8">Arafat Rahman</text>
</svg>`;
}

async function resolveFounderAvatarRecord(): Promise<CachedFounderAvatar> {
  if (cachedFounder && cachedFounder.expiresAt > Date.now()) {
    return cachedFounder;
  }

  let publicId = FOUNDER_FALLBACK_PUBLIC_ID;
  let fallbackUrl: string | null = null;

  try {
    await dbConnect();
    const user = (await User.findOne({
      $or: [
        { email: "arafat.rahman@gmail.com" },
        { email: "arafat.rahman.6003@gmail.com" },
        { name: /^arafat rahman$/i },
      ],
    })
      .select("avatarPublicId avatarUrl image")
      .lean()) as {
      avatarPublicId?: string;
      avatarUrl?: string;
      image?: string;
    } | null;

    if (user?.avatarPublicId) {
      publicId = user.avatarPublicId;
    }
    if (user?.image && /^https?:\/\//i.test(user.image)) {
      fallbackUrl = user.image;
    } else if (user?.avatarUrl && /^https?:\/\//i.test(user.avatarUrl)) {
      fallbackUrl = user.avatarUrl;
    }
  } catch {
    // Keep fallback publicId / SVG when DB is unavailable (e.g. offline/tests)
  }

  cachedFounder = {
    publicId,
    fallbackUrl,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  return cachedFounder;
}

export async function GET() {
  const { publicId, fallbackUrl } = await resolveFounderAvatarRecord();

  const hasCloudinary =
    Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
    process.env.CLOUDINARY_CLOUD_NAME !== "demo" &&
    Boolean(process.env.CLOUDINARY_API_SECRET) &&
    process.env.CLOUDINARY_API_SECRET !== "dummy_secret";

  if (hasCloudinary && publicId) {
    const signedUrl = generateSignedAssetUrl(
      publicId,
      "image",
      "authenticated"
    );
    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: {
        "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
      },
    });
  }

  if (fallbackUrl) {
    return NextResponse.redirect(fallbackUrl, {
      status: 302,
      headers: {
        "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
      },
    });
  }

  return new NextResponse(buildFallbackPortraitSvg(), {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
