import { MetadataRoute } from 'next';

const SITE_URL = "http://localhost:3000";

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
