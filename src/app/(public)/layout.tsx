import { headers } from "next/headers";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { getRouteSeo, DEFAULT_LANGUAGE } from "@/lib/seo/site";
import {
  getBreadcrumbSchema,
  getRouteWebPageSchema,
  serializeJsonLd,
} from "@/lib/seo/schema";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers();
  const lang = (reqHeaders.get("x-language") || DEFAULT_LANGUAGE) as "es" | "en";
  const path = reqHeaders.get("x-pathname") || "/";
  const seo = getRouteSeo(path, lang);

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0e1a] text-slate-100 selection:bg-sky-500/20 selection:text-sky-300 font-sans antialiased">
      {seo && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: serializeJsonLd(
                getRouteWebPageSchema({
                  lang,
                  path,
                  title: seo.title,
                  description: seo.description,
                })
              ),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: serializeJsonLd(getBreadcrumbSchema(lang, path)),
            }}
          />
        </>
      )}
      <PublicHeader />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
