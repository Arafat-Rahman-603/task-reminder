import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/seo/site";

/**
 * Public marketing/legal pages only, once per supported language.
 * Priorities, change frequencies and hreflang alternates are derived from
 * `PUBLIC_ROUTE_SEO`, so the sitemap can never drift from the page metadata.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return getSitemapEntries();
}
