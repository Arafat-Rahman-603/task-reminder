import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  },
  webpack: (config, { webpack, isServer }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          fs: false,
          net: false,
          tls: false,
          child_process: false,
        },
      };
    }
    config.plugins.push(
      new webpack.DefinePlugin({
        "process.env.NEXTAUTH_URL": JSON.stringify(
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        ),
        "process.env.NEXTAUTH_URL_INTERNAL": JSON.stringify(
          process.env.NEXTAUTH_URL_INTERNAL || process.env.NEXTAUTH_URL || "http://localhost:3000"
        ),
        "process.env.VERCEL_URL": JSON.stringify(
          process.env.VERCEL_URL || ""
        ),
      })
    );
    return config;
  },
};

export default nextConfig;
