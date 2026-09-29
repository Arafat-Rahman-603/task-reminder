import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false, // Enable in dev so we can test the install prompt
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkOnly', // NEVER cache API requests that contain sensitive authenticated data
    },
    {
      urlPattern: /\/dashboard\/.*/i,
      handler: 'NetworkOnly', // NEVER cache authenticated HTML pages
    }
  ]
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
