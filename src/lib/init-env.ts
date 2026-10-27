// Client-side environment shim to ensure process.env is defined for packages like next-auth/react
interface ProcessShim {
  process?: {
    env?: Record<string, string | undefined>;
  };
}

if (typeof globalThis !== "undefined") {
  const gt = globalThis as unknown as ProcessShim;
  if (!gt.process) {
    gt.process = { env: {} };
  }
  if (!gt.process.env) {
    gt.process.env = {};
  }
  if (!gt.process.env.NEXTAUTH_URL) {
    gt.process.env.NEXTAUTH_URL =
      (typeof window !== "undefined" && window.location && window.location.origin) ||
      "http://localhost:3000";
  }
  if (!gt.process.env.NEXTAUTH_URL_INTERNAL) {
    gt.process.env.NEXTAUTH_URL_INTERNAL = gt.process.env.NEXTAUTH_URL;
  }
  if (!gt.process.env.VERCEL_URL) {
    gt.process.env.VERCEL_URL = "";
  }
}

if (typeof window !== "undefined") {
  const w = window as unknown as Window & ProcessShim;
  const gt = globalThis as unknown as ProcessShim;
  if (!w.process) {
    w.process = gt.process || { env: {} };
  }
  if (!w.process.env) {
    w.process.env = gt.process?.env || {};
  }
  if (!w.process.env.NEXTAUTH_URL) {
    w.process.env.NEXTAUTH_URL = (w.location && w.location.origin) || "http://localhost:3000";
  }
}

export {};
