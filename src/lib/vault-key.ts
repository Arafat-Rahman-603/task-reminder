import crypto from "crypto";

/**
 * Retrieve the Vault master secret from the environment.
 * Fails closed if NEXTAUTH_SECRET is not configured or is whitespace.
 * Never silently falls back to hardcoded strings.
 */
export function getVaultSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("Vault configuration error: NEXTAUTH_SECRET is not configured. Vault operations fail closed.");
  }
  return secret;
}

/**
 * Derives the deterministic Vault master key for a user:
 * sha256(userId + NEXTAUTH_SECRET)
 * Strictly preserves backward compatibility with all existing encrypted records.
 * Fails closed if NEXTAUTH_SECRET is missing or empty.
 */
export function deriveVaultKey(userId: string): string {
  if (!userId || typeof userId !== "string") {
    throw new Error("Vault key derivation requires a valid userId");
  }
  const secret = getVaultSecret();
  return crypto.createHash("sha256").update(userId + secret).digest("hex");
}
