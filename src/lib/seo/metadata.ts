import type { Metadata } from "next";
import {
  BASE_KEYWORDS,
  getAbsoluteUrl,
  getAlternateUrl,
  getRouteSeo,
  normalizePath,
  OG_LOCALES,
  SITE_NAME,
  SITE_URL,
  SOCIAL_IMAGE_ALT,
  SOCIAL_OG_IMAGE_PATH,
  SOCIAL_TWITTER_IMAGE_PATH,
} from "@/lib/seo/site";

type Language = "es" | "en";

interface MetadataProps {
  lang: Language;
  path: string;
  title?: string;
  description?: string;
  keywords?: string[];
  noindex?: boolean;
}

function dedupeKeywords(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

/**
 * Search-console verification tokens are optional: add the matching env var and
 * the meta tag is emitted automatically, without hardcoding account-specific codes.
 */
function getVerification(): Metadata["verification"] {
  const google = process.env.GOOGLE_SITE_VERIFICATION;
  const bing = process.env.BING_SITE_VERIFICATION;
  if (!google && !bing) return undefined;

  const verification: NonNullable<Metadata["verification"]> = {};
  if (google) verification.google = google;
  if (bing) verification.other = { "msvalidate.01": bing };
  return verification;
}

export function getLocalizedMetadata({
  lang,
  path,
  title,
  description,
  keywords = [],
  noindex = false,
}: MetadataProps): Metadata {
  const cleanPath = normalizePath(path);
  const routeSeo = getRouteSeo(cleanPath, lang);
  const currentTitle = routeSeo?.title || (title ? `${title} | ${SITE_NAME}` : `${SITE_NAME}`);
  const currentDescription = routeSeo?.description || description || "";
  const currentKeywords = dedupeKeywords([
    ...BASE_KEYWORDS[lang],
    ...(routeSeo?.keywords || []),
    ...keywords,
  ]);

  const esUrl = getAlternateUrl("es", cleanPath);
  const enUrl = getAlternateUrl("en", cleanPath);
  const currentUrl = lang === "en" ? enUrl : esUrl;

  const alternates = {
    canonical: currentUrl,
    languages: {
      es: esUrl,
      en: enUrl,
      'x-default': esUrl,
    },
  };

  const robots = noindex
    ? {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
          noimageindex: true,
        },
      }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large" as const,
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      };

  const verification = getVerification();

  return {
    title: currentTitle,
    description: currentDescription,
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: `${SITE_URL}/` }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: routeSeo?.category || "software",
    keywords: currentKeywords,
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates,
    robots,
    ...(verification ? { verification } : {}),
    icons: {
      icon: [
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
      shortcut: "/favicon.ico",
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: SITE_NAME,
    },
    openGraph: {
      title: currentTitle,
      description: currentDescription,
      url: currentUrl,
      siteName: SITE_NAME,
      locale: OG_LOCALES[lang],
      alternateLocale: [OG_LOCALES[lang === "es" ? "en" : "es"]],
      type: "website",
      images: [
        {
          url: getAbsoluteUrl(SOCIAL_OG_IMAGE_PATH),
          width: 1200,
          height: 630,
          alt: SOCIAL_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: currentTitle,
      description: currentDescription,
      creator: "@ManageoApp",
      site: "@ManageoApp",
      images: [{ url: getAbsoluteUrl(SOCIAL_TWITTER_IMAGE_PATH), alt: SOCIAL_IMAGE_ALT }],
    },
  };
}

/**
 * Metadata for pages that must never be indexed: authentication, invitation and
 * device-state routes. They stay crawlable (follow) so link equity still flows,
 * but are excluded from the index and from caches.
 */
export function getNoIndexMetadata(title: string, description?: string): Metadata {
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    metadataBase: new URL(SITE_URL),
    robots: {
      index: false,
      follow: true,
      nocache: true,
      googleBot: {
        index: false,
        follow: true,
        noimageindex: true,
      },
    },
  };
}
