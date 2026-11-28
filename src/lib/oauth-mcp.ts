import crypto from "crypto";
import type { NextRequest } from "next/server";
import type { IMcpKeyScopes } from "@/models/McpApiKey";

export const OAUTH_SCOPES_SUPPORTED = [
  "mcp:tools",
  "mcp:read",
  "mcp:write",
  "mcp:delete",
  "mcp:finance",
  "offline_access",
] as const;

export const DEFAULT_OAUTH_SCOPE = "mcp:tools mcp:read mcp:write mcp:finance";
export const OAUTH_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OAUTH_ACCESS_TOKEN_TTL_SECONDS = 3600; // 1 hour
export const OAUTH_REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 3600; // 30 days

/**
 * Resolve the public origin (scheme + host) for OAuth discovery and WWW-Authenticate headers.
 */
export function resolvePublicOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (forwardedHost) {
    const proto = forwardedProto || "https";
    return `${proto}://${forwardedHost}`.replace(/\/+$/, "");
  }

  try {
    const parsed = new URL(req.url);
    if (parsed.origin && parsed.origin !== "null") {
      return parsed.origin.replace(/\/+$/, "");
    }
  } catch {
    // Fall through to host header or env
  }

  const host = req.headers.get("host")?.trim();
  if (host) {
    const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
    return `${isLocal ? "http" : "https"}://${host}`.replace(/\/+$/, "");
  }

  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Validate OAuth redirect URI per OAuth 2.1 security rules:
 * HTTPS required, except loopback HTTP for local development (RFC 8252), and no URL fragments.
 */
export function isValidOAuthRedirectUri(uri: string): boolean {
  if (!uri || uri.length > 2048) return false;
  try {
    const parsed = new URL(uri);
    if (parsed.hash) return false;
    if (parsed.protocol === "https:") return Boolean(parsed.hostname);
    if (parsed.protocol === "http:") {
      return (
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "[::1]"
      );
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Normalize raw OAuth scope strings into valid Manageo scope tokens.
 */
export function normalizeScopeTokens(rawScope?: string | null): string[] {
  const source = rawScope?.trim() || DEFAULT_OAUTH_SCOPE;
  const supported = new Set<string>(OAUTH_SCOPES_SUPPORTED);
  const tokens = source
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && supported.has(token));

  if (tokens.length === 0) {
    return DEFAULT_OAUTH_SCOPE.split(" ");
  }

  return Array.from(new Set(tokens));
}

/**
 * Parse OAuth scope string into Manageo IMcpKeyScopes flags.
 */
export function parseOAuthScopes(rawScope?: string | null): {
  scopes: IMcpKeyScopes;
  scopeString: string;
} {
  const tokens = normalizeScopeTokens(rawScope);
  const hasTools = tokens.includes("mcp:tools");
  const hasRead = tokens.includes("mcp:read") || hasTools;
  const hasWrite = tokens.includes("mcp:write") || hasTools;
  const hasDelete = tokens.includes("mcp:delete");
  const hasFinance = tokens.includes("mcp:finance");

  const scopes: IMcpKeyScopes = {
    read: hasRead,
    write: hasWrite,
    delete: hasDelete,
    finance: hasFinance,
  };

  return {
    scopes,
    scopeString: tokens.join(" "),
  };
}

/**
 * Format IMcpKeyScopes back into canonical OAuth scope string.
 */
export function formatOAuthScopes(scopes: IMcpKeyScopes, includeOffline = true): string {
  const tokens: string[] = ["mcp:tools"];
  if (scopes.read) tokens.push("mcp:read");
  if (scopes.write) tokens.push("mcp:write");
  if (scopes.delete) tokens.push("mcp:delete");
  if (scopes.finance) tokens.push("mcp:finance");
  if (includeOffline) tokens.push("offline_access");
  return tokens.join(" ");
}

/**
 * Verify RFC 7636 PKCE S256 challenge using constant-time comparison.
 */
export function verifyPkceS256(codeVerifier: string, expectedChallenge: string): boolean {
  if (!codeVerifier || !expectedChallenge) return false;
  if (codeVerifier.length < 43 || codeVerifier.length > 128) return false;
  if (!/^[A-Za-z0-9\-._~]+$/.test(codeVerifier)) return false;

  const computed = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const a = Buffer.from(computed, "utf8");
  const b = Buffer.from(expectedChallenge, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Generate cryptographically random URL-safe opaque token with prefix.
 */
export function generateOpaqueToken(prefix: string, byteLength = 32): string {
  return `${prefix}${crypto.randomBytes(byteLength).toString("base64url")}`;
}

/**
 * Build standard CORS + no-store headers for OAuth & well-known discovery endpoints.
 */
export function oauthCorsHeaders(methods = "GET, POST, OPTIONS"): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
  };
}

/**
 * RFC 9728 OAuth 2.0 Protected Resource Metadata for Manageo MCP.
 */
export function buildProtectedResourceMetadata(origin: string) {
  return {
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    scopes_supported: [...OAUTH_SCOPES_SUPPORTED],
    bearer_methods_supported: ["header"],
    resource_name: "Manageo MCP Server",
    resource_documentation: `${origin}/features`,
  };
}

/**
 * RFC 8414 OAuth 2.0 Authorization Server Metadata for Manageo MCP.
 */
export function buildAuthorizationServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    revocation_endpoint: `${origin}/api/oauth/revoke`,
    scopes_supported: [...OAUTH_SCOPES_SUPPORTED],
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: [
      "none",
      "client_secret_post",
      "client_secret_basic",
    ],
    code_challenge_methods_supported: ["S256"],
    service_documentation: `${origin}/features`,
  };
}

/**
 * Build RFC 9728 WWW-Authenticate header for 401 MCP responses.
 */
export function buildWwwAuthenticateHeader(origin: string): string {
  return `Bearer realm="Manageo MCP", resource_metadata="${origin}/.well-known/oauth-protected-resource", scope="mcp:tools mcp:read mcp:write mcp:finance"`;
}
