import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

/**
 * Trailing slashes are intentionally omitted (trailingSlash is disabled) so each
 * rule matches the real path. Private, transactional and API surfaces are kept
 * out of the index and also send `noindex` on the affected pages.
 */
const PRIVATE_ROUTES = [
  "/api/",
  "/dashboard",
  "/admin",
  "/workspaces",
  "/invite",
  "/offline",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_ROUTES,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
