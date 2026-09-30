import { MetadataRoute } from 'next';

const SITE_URL = "http://localhost:3000";

// Only public routes
const routes = [
  "",
  "/features",
  "/pricing",
  "/security",
  "/contact",
  "/about",
  "/faq",
  "/terms",
  "/privacy",
  "/cookies",
  "/acceptable-use",
  "/financial-disclaimer"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  return routes.flatMap((route) => {
    return [
      {
        url: `${SITE_URL}${route}`,
        lastModified: currentDate,
        changeFrequency: 'weekly' as const,
        priority: route === "" ? 1 : 0.8,
        alternates: {
          languages: {
            es: `${SITE_URL}${route}`,
            en: `${SITE_URL}/en${route}`,
            'x-default': `${SITE_URL}${route}`,
          },
        },
      },
      {
        url: `${SITE_URL}/en${route}`,
        lastModified: currentDate,
        changeFrequency: 'weekly' as const,
        priority: route === "" ? 1 : 0.8,
        alternates: {
          languages: {
            es: `${SITE_URL}${route}`,
            en: `${SITE_URL}/en${route}`,
            'x-default': `${SITE_URL}${route}`,
          },
        },
      }
    ];
  });
}
