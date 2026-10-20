import type { Metadata } from "next";
import { getLocalizedMetadata } from "@/lib/seo/metadata";
import { getServerLanguage } from "@/lib/seo/server-language";
import {
  getOrganizationSchema,
  getWebSiteSchema,
  getWebApplicationSchema,
  serializeJsonLd,
} from "@/lib/seo/schema";
import LandingPageClient from "./LandingPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLanguage();
  return getLocalizedMetadata({
    lang,
    path: "/",
    // Using defaults defined in getLocalizedMetadata for home page
  });
}

export default async function Page() {
  const lang = await getServerLanguage();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(getOrganizationSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(getWebSiteSchema(lang)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(getWebApplicationSchema(lang)) }}
      />
      <LandingPageClient />
    </>
  );
}
