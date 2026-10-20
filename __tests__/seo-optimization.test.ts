import { describe, test, expect } from "@jest/globals";
import { getLocalizedMetadata, getNoIndexMetadata } from "@/lib/seo/metadata";
import {
  PUBLIC_ROUTES,
  PUBLIC_ROUTE_SEO,
  BASE_KEYWORDS,
  SITE_URL,
  getAlternateUrl,
  getSitemapEntries,
} from "@/lib/seo/site";
import {
  getOrganizationSchema,
  getWebSiteSchema,
  getWebApplicationSchema,
  getBreadcrumbSchema,
  getFaqSchema,
  getContactPageSchema,
  serializeJsonLd,
} from "@/lib/seo/schema";
import robots from "@/app/robots";

describe("SEO & Keyword Optimization Comprehensive Suite", () => {
  describe("Route SEO Configuration & Keyword Coverage", () => {
    test("every public route has complete SEO configurations in both ES and EN", () => {
      expect(PUBLIC_ROUTES.length).toBeGreaterThanOrEqual(12);

      PUBLIC_ROUTES.forEach((route) => {
        const config = PUBLIC_ROUTE_SEO[route];
        expect(config).toBeDefined();
        expect(config.changeFrequency).toBeDefined();
        expect(config.priority).toBeGreaterThan(0);

        // Spanish copy
        expect(config.localized.es.title.length).toBeGreaterThan(5);
        expect(config.localized.es.description.length).toBeGreaterThan(15);
        expect(config.localized.es.keywords.length).toBeGreaterThan(3);

        // English copy
        expect(config.localized.en.title.length).toBeGreaterThan(5);
        expect(config.localized.en.description.length).toBeGreaterThan(15);
        expect(config.localized.en.keywords.length).toBeGreaterThan(3);
      });
    });

    test("base keywords contain high-intent productivity and security terms", () => {
      expect(BASE_KEYWORDS.es).toContain("gestor de tareas");
      expect(BASE_KEYWORDS.es).toContain("boveda segura de contrasenas");
      expect(BASE_KEYWORDS.es).toContain("app de productividad todo en uno");

      expect(BASE_KEYWORDS.en).toContain("task manager");
      expect(BASE_KEYWORDS.en).toContain("secure vault app");
      expect(BASE_KEYWORDS.en).toContain("personal operating system");
    });
  });

  describe("Metadata Generation Engine", () => {
    test("generates localized metadata with canonical, hreflang, icons, and twitter cards", () => {
      const metaEs = getLocalizedMetadata({ lang: "es", path: "/features" });
      expect(metaEs.title).toContain("Manageo");
      expect(metaEs.description).toBeTruthy();
      expect(metaEs.keywords).toBeInstanceOf(Array);
      expect((metaEs.keywords as string[]).length).toBeGreaterThan(10);

      // Alternates & Canonical
      expect(metaEs.alternates?.canonical).toBe(getAlternateUrl("es", "/features"));
      expect(metaEs.alternates?.languages?.["es"]).toBe(getAlternateUrl("es", "/features"));
      expect(metaEs.alternates?.languages?.["en"]).toBe(getAlternateUrl("en", "/features"));
      expect(metaEs.alternates?.languages?.["x-default"]).toBe(getAlternateUrl("es", "/features"));

      // Standard Icons & Manifest
      expect(metaEs.icons).toBeDefined();
      expect(metaEs.manifest).toBe("/manifest.json");
      expect(metaEs.appleWebApp).toEqual({
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Manageo",
      });

      // OpenGraph & Twitter
      expect((metaEs.openGraph as Record<string, unknown>)?.type).toBe("website");
      expect((metaEs.openGraph as Record<string, unknown>)?.siteName).toBe("Manageo");
      expect((metaEs.twitter as Record<string, unknown>)?.card).toBe("summary_large_image");
    });

    test("generates noindex metadata for sensitive and authenticated surfaces", () => {
      const noIndexMeta = getNoIndexMetadata("Dashboard");
      expect(noIndexMeta.title).toBe("Dashboard | Manageo");
      expect(noIndexMeta.robots).toEqual(
        expect.objectContaining({
          index: false,
          follow: true,
          nocache: true,
        })
      );
    });
  });

  describe("Sitemap & Robots Rules", () => {
    test("sitemap includes entries for all public routes across all supported languages", () => {
      const entries = getSitemapEntries();
      expect(entries.length).toBe(PUBLIC_ROUTES.length * 2);

      const homeEs = entries.find((e) => e.url === `${SITE_URL}/`);
      expect(homeEs).toBeDefined();
      expect(homeEs?.priority).toBe(1);
      expect(homeEs?.changeFrequency).toBe("weekly");
      expect(homeEs?.alternates?.languages).toBeDefined();
    });

    test("robots.txt declares sitemap, host, and disallows private surfaces", () => {
      const rules = robots();
      expect(rules.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
      expect(rules.host).toBe(SITE_URL);

      const disallow = rules.rules;
      expect(disallow).toBeInstanceOf(Array);
      // @ts-expect-error test indexing
      expect(disallow[0].disallow).toContain("/dashboard");
      // @ts-expect-error test indexing
      expect(disallow[0].disallow).toContain("/login");
      // @ts-expect-error test indexing
      expect(disallow[0].disallow).toContain("/api/");
    });
  });

  describe("Structured Data (JSON-LD) Schemas", () => {
    test("Organization schema contains logo, contact point, and knowsAbout", () => {
      const org = getOrganizationSchema();
      expect(org["@type"]).toBe("Organization");
      expect(org.name).toBe("Manageo");
      expect(org.logo).toBeDefined();
      expect(org.contactPoint).toBeInstanceOf(Array);
      expect(org.knowsAbout).toContain("Productivity Software");
    });

    test("WebSite schema includes Sitelinks Searchbox potentialAction", () => {
      const site = getWebSiteSchema("en");
      expect(site["@type"]).toBe("WebSite");
      expect(site.potentialAction).toBeDefined();
      expect(site.potentialAction["@type"]).toBe("SearchAction");
    });

    test("WebApplication schema includes aggregate rating and features", () => {
      const app = getWebApplicationSchema("en");
      expect(app["@type"]).toBe("WebApplication");
      expect(app.aggregateRating?.ratingValue).toBe("4.9");
      expect(app.featureList.length).toBeGreaterThan(5);
      expect(app.offers).toBeDefined();
    });

    test("FAQ schema serializes valid Question and acceptedAnswer structures", () => {
      const faqs = [{ question: "¿Qué es?", answer: "Un sistema operativo." }];
      const schema = getFaqSchema(faqs);
      expect(schema["@type"]).toBe("FAQPage");
      expect(schema.mainEntity[0]["@type"]).toBe("Question");
      expect(schema.mainEntity[0].name).toBe("¿Qué es?");
      expect(schema.mainEntity[0].acceptedAnswer.text).toBe("Un sistema operativo.");

      const serialized = serializeJsonLd(schema as unknown as Record<string, unknown>);
      expect(serialized).not.toContain("<script");
    });

    test("BreadcrumbList generates 1-indexed itemListElement", () => {
      const breadcrumb = getBreadcrumbSchema("en", "/features");
      expect(breadcrumb["@type"]).toBe("BreadcrumbList");
      expect(breadcrumb.itemListElement[0].position).toBe(1);
      expect(breadcrumb.itemListElement[1].position).toBe(2);
      expect(breadcrumb.itemListElement[1].name).toBe("Features");
    });

    test("ContactPage schema includes organization details", () => {
      const contact = getContactPageSchema("en");
      expect(contact["@type"]).toBe("ContactPage");
      expect(contact.mainEntity.name).toBe("Manageo");
    });
  });
});
