import "dotenv/config";
const {
  initializeApp,
  getApps,
  cert: certFn,
  applicationDefault,
} = await import("firebase-admin/app");

console.log("=== FIREBASE ADMIN INIT VALIDATION ===\n");

const projectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

console.log(
  "FIREBASE_PROJECT_ID         :",
  projectId ? `SET (${projectId})` : "MISSING",
);
console.log(
  "FIREBASE_ADMIN_CLIENT_EMAIL :",
  clientEmail ? `SET (${clientEmail})` : "MISSING",
);
console.log(
  "FIREBASE_ADMIN_PRIVATE_KEY  :",
  privateKey
    ? `SET (${privateKey.length} chars, starts: ${privateKey.slice(0, 27)}..., ends: ...${privateKey.slice(-20)})`
    : "MISSING",
);
console.log("");

if (privateKey) {
  const normalized = privateKey.replace(/\\n/g, "\n");
  console.log("After \\n → newline: normalized length =", normalized.length);
  const hasBegin = normalized.includes("-----BEGIN PRIVATE KEY-----");
  const hasEnd = normalized.includes("-----END PRIVATE KEY-----");
  console.log("Contains BEGIN marker:", hasBegin);
  console.log("Contains END marker  :", hasEnd);
  console.log("");
}

if (projectId && clientEmail && privateKey) {
  try {
    const normalizedPk = privateKey.replace(/\\n/g, "\n");
    const app = initializeApp({
      credential: certFn({
        projectId,
        clientEmail,
        privateKey: normalizedPk,
      }),
    });
    console.log("✅ Firebase Admin SDK initialized successfully.");
    console.log("   App name:", app.name);
    process.exit(0);
  } catch (err) {
    console.error("❌ Firebase Admin SDK FAILED to initialize:");
    console.error("  ", err?.message || String(err));
    if (err?.stack) console.error(err.stack.split("\n").slice(0, 6).join("\n"));
    process.exit(1);
  }
} else {
  console.error("❌ Missing one or more required Admin env vars.");
  process.exit(1);
}
