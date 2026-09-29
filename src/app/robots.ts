import { MetadataRoute } from 'next';

const SITE_URL = "https://manageo.axiomixs.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/en/'],
      disallow: [
        '/api/',
        '/dashboard/',
        '/login/',
        '/register/',
        '/forgot-password/',
        '/reset-password/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
