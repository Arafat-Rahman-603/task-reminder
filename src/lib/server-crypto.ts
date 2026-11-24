import crypto from "crypto";

const SECRET_SALT = "manageo-ai-secret-salt-v1";

function getDerivationSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET ||
    process.env.MANAGEO_ENCRYPTION_KEY ||
    "manageo-local-dev-secret-change-in-prod"
  );
}

function deriveAesKey(): Buffer {
  return crypto.scryptSync(getDerivationSecret(), SECRET_SALT, 32);
}

/**
 * Encrypts sensitive server-side secrets (such as user-provided Gemini API keys) with AES-256-GCM.
 */
export function encryptServerSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const key = deriveAesKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts a secret produced by `encryptServerSecret`.
 */
export function decryptServerSecret(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted secret payload");
  }
  const [ivHex, authTagHex, cipherHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(cipherHex, "hex");

  const key = deriveAesKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Hashes an MCP API token with SHA-256 so raw tokens are never stored in MongoDB.
 */
export function hashMcpToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Generates a high-entropy Manageo MCP API key (`mgo_live_<48-hex-chars>`).
 */
export function generateMcpToken(): {
  rawToken: string;
  keyPrefix: string;
  keyHash: string;
} {
  const secretPart = crypto.randomBytes(24).toString("hex");
  const rawToken = `mgo_live_${secretPart}`;
  const keyPrefix = `${rawToken.slice(0, 14)}...`;
  const keyHash = hashMcpToken(rawToken);
  return { rawToken, keyPrefix, keyHash };
}
