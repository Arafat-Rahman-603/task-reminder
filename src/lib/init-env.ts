// Client-side environment shim to ensure process.env is defined for packages like next-auth/react
if (typeof globalThis !== "undefined") {
  const gt = globalThis as any;
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
  const w = window as any;
  if (!w.process) {
    w.process = (globalThis as any).process || { env: {} };
  }
  if (!w.process.env) {
    w.process.env = (globalThis as any).process?.env || {};
  }
  if (!w.process.env.NEXTAUTH_URL) {
    w.process.env.NEXTAUTH_URL = (w.location && w.location.origin) || "http://localhost:3000";
  }
}

export {};
