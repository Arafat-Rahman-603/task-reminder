import type { Metadata } from "next";

const SITE_URL = "https://manageo.axiomixs.com";

type Language = "es" | "en";

interface MetadataProps {
  lang: Language;
  path: string;
  title?: string;
  description?: string;
  noindex?: boolean;
}

const DEFAULT_TITLE = {
  es: "Gestiona todo en un solo lugar | Manageo",
  en: "Manage Everything in One Place | Manageo",
};

const DEFAULT_DESCRIPTION = {
  es: "Un Sistema Operativo Personal flexible que se adapta a ti. Gestiona tu vida diaria, haz un seguimiento de tu dinero, concéntrate en tus objetivos y captura ideas—todo en un espacio de trabajo bellamente unificado.",
  en: "A flexible Personal Operating System that adapts to you. Manage your daily life, track your money, focus on your goals, and capture ideas—all in a beautifully unified workspace.",
};

export function getLocalizedMetadata({ lang, path, title, description, noindex = false }: MetadataProps): Metadata {
  const currentTitle = title ? `${title} | Manageo` : DEFAULT_TITLE[lang];
  const currentDescription = description || DEFAULT_DESCRIPTION[lang];

  // Clean path
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const isHome = cleanPath === '/' || cleanPath === '';

  const esUrl = isHome ? `${SITE_URL}/` : `${SITE_URL}${cleanPath}`;
  const enUrl = isHome ? `${SITE_URL}/en/` : `${SITE_URL}/en${cleanPath}`;

  const currentUrl = lang === 'en' ? enUrl : esUrl;

  const alternates = {
    canonical: currentUrl,
    languages: {
      es: esUrl,
      en: enUrl,
      'x-default': esUrl,
    },
  };

  const robots = noindex
    ? { index: false, follow: false }
    : { index: true, follow: true };

  return {
    title: currentTitle,
    description: currentDescription,
    alternates,
    robots,
    openGraph: {
      title: currentTitle,
      description: currentDescription,
      url: currentUrl,
      siteName: "Manageo",
      locale: lang === 'es' ? 'es_ES' : 'en_US',
      type: "website",
      // images: [{ url: `${SITE_URL}/opengraph-image.png` }],
    },
    twitter: {
      card: "summary_large_image",
      title: currentTitle,
      description: currentDescription,
    },
  };
}
