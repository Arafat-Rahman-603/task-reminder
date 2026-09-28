declare module "next-pwa" {
  import { NextConfig } from "next";

  export default function withPWAInit(config: {
    dest: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    runtimeCaching?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buildExcludes?: any[];
    publicExcludes?: string[];
  }): (nextConfig: NextConfig) => NextConfig;
}
