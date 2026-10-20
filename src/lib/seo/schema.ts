import {
  getAbsoluteUrl,
  getRouteLabel,
  normalizePath,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/seo/site";

type Language = "es" | "en";

/** Escapes `<` so an untrusted string can never break out of the script tag. */
export function serializeJsonLd(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: {
      "@type": "ImageObject",
      url: getAbsoluteUrl("/logo.png"),
      width: 512,
      height: 512,
    },
    description: SITE_TAGLINE,
    slogan: SITE_TAGLINE,
    foundingDate: "2024",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@manageo.axiomixs.com",
        availableLanguage: ["Spanish", "English"],
      },
    ],
    knowsAbout: [
      "Productivity Software",
      "Personal Knowledge Management",
      "Task Management",
      "Financial Tracking",
      "Data Encryption",
      "Custom Databases",
    ],
  };
}

export function getWebSiteSchema(lang: Language) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: SITE_NAME,
    url: getAbsoluteUrl("/"),
    description: SITE_TAGLINE,
    inLanguage: lang,
    publisher: { "@type": "Organization", name: SITE_NAME },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function getWebApplicationSchema(lang: Language) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: getAbsoluteUrl("/"),
    applicationCategory: "ProductivityApplication",
    applicationSubCategory:
      lang === "es" ? "Productividad personal y para equipos" : "Personal and team productivity",
    operatingSystem: "Web, Windows, macOS, iOS, Android",
    browserRequirements: "Requires JavaScript",
    description:
      lang === "es"
        ? "Gestiona tareas, notas, ideas, boveda segura y tu dinero en un solo sistema operativo personal que se adapta a ti."
        : "Manage tasks, notes, ideas, a secure vault and your money in one personal operating system that adapts to you.",
    featureList:
      lang === "es"
        ? [
            "Gestor de tareas con recordatorios y prioridades",
            "Seguimiento de habitos y rutinas diarias",
            "Notas e ideas con soporte enriquecido",
            "Boveda segura cifrada con AES-256-GCM",
            "Seguimiento de cuentas, transacciones y presupuestos",
            "Secciones y bases de datos personalizadas",
            "Espacios de trabajo colaborativos en equipo",
            "Aplicacion Web Progresiva (PWA) instalable",
          ]
        : [
            "Task manager with smart reminders and priorities",
            "Habit and daily routine tracking",
            "Rich notes and fast idea capture",
            "AES-256-GCM encrypted secure vault",
            "Money, accounts, transactions and budgets",
            "Custom sections and dynamic databases",
            "Collaborative team workspaces",
            "Installable Progressive Web App (PWA)",
          ],
    inLanguage: lang,
    isAccessibleForFree: true,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "168",
      bestRating: "5",
      worstRating: "1",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description:
        lang === "es"
          ? "Acceso temprano gratuito con planes de pago opcionales."
          : "Free early access with optional paid plans.",
    },
  };
}

export function getRouteWebPageSchema({
  lang,
  path,
  title,
  description,
}: {
  lang: Language;
  path: string;
  title: string;
  description: string;
}) {
  const cleanPath = normalizePath(path);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: getAbsoluteUrl(cleanPath),
    inLanguage: lang,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: getAbsoluteUrl("/"),
    },
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
}

export function getBreadcrumbSchema(lang: Language, path: string) {
  const cleanPath = normalizePath(path);
  const isHome = cleanPath === "/";

  const items = isHome
    ? [{ name: getRouteLabel("/", lang), url: getAbsoluteUrl("/") }]
    : [
        { name: getRouteLabel("/", lang), url: getAbsoluteUrl("/") },
        { name: getRouteLabel(cleanPath, lang), url: getAbsoluteUrl(cleanPath) },
      ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getFaqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function getContactPageSchema(lang: Language) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: lang === "es" ? "Contacto de Manageo" : "Contact Manageo",
    description:
      lang === "es"
        ? "Ponte en contacto con el equipo de Manageo para soporte técnico, ventas y consultas."
        : "Get in touch with the Manageo team for technical support, sales, and general inquiries.",
    url: getAbsoluteUrl("/contact"),
    inLanguage: lang,
    mainEntity: {
      "@type": "Organization",
      name: SITE_NAME,
      telephone: "+8801753070584",
      email: "info@axiomixs.com",
      url: getAbsoluteUrl("/"),
    },
  };
}
