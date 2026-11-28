import crypto from "crypto";
import type { NextRequest } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import type { IMcpKeyScopes } from "@/models/McpApiKey";
import { OAuthClient } from "@/models/OAuthClient";

export interface ResolvedOAuthClient {
  clientId: string;
  clientName: string;
  redirectUris: string[];
  tokenEndpointAuthMethod: "none" | "client_secret_post" | "client_secret_basic";
  scope: string;
  clientSecretHash?: string | null;
  isCimd?: boolean;
}

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
    client_id_metadata_document_supported: true,
    service_documentation: `${origin}/features`,
  };
}

const CimdMetadataSchema = z.object({
  client_id: z.string().trim().min(1),
  client_name: z.string().trim().min(1).max(120).optional(),
  redirect_uris: z.array(z.string().trim().min(1)).min(1).max(20),
  token_endpoint_auth_method: z.literal("none").optional(),
  scope: z.string().optional(),
});

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  // IPv6 private / link-local ranges
  const bareV6 = host.replace(/^\[|\]$/g, "");
  if (
    bareV6.startsWith("fc") ||
    bareV6.startsWith("fd") ||
    bareV6.startsWith("fe80:")
  ) {
    return true;
  }

  // IPv4 private / loopback / link-local ranges
  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4Match) {
    const a = Number(ipv4Match[1]);
    const b = Number(ipv4Match[2]);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }

  return false;
}

/**
 * Validate HTTPS URL-based client_id for OAuth Client ID Metadata Documents (CIMD).
 */
export function isSafeCimdUrl(rawUrl: string): boolean {
  if (!rawUrl || rawUrl.length > 2048) return false;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    if (!parsed.pathname || parsed.pathname === "/") return false;
    if (parsed.username || parsed.password || parsed.hash) return false;
    if (isPrivateOrLocalHost(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve an OAuth client either from local database registration (DCR / user-defined)
 * or dynamically from a verified HTTPS Client Identifier Metadata Document (CIMD).
 */
export async function resolveOAuthClient(
  clientId: string
): Promise<ResolvedOAuthClient | null> {
  if (!clientId) return null;

  await dbConnect();
  const dbClient = await OAuthClient.findOne({ clientId }).lean();
  if (dbClient) {
    return {
      clientId: dbClient.clientId,
      clientName: dbClient.clientName,
      redirectUris: dbClient.redirectUris,
      tokenEndpointAuthMethod: dbClient.tokenEndpointAuthMethod,
      scope: dbClient.scope,
      clientSecretHash: dbClient.clientSecretHash,
      isCimd: false,
    };
  }

  if (!isSafeCimdUrl(clientId)) {
    return null;
  }

  try {
    const res = await fetch(clientId, {
      headers: { Accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const text = await res.text();
    if (!text || text.length > 65536) return null;

    const json = JSON.parse(text) as unknown;
    const parsed = CimdMetadataSchema.safeParse(json);
    if (!parsed.success) return null;

    const doc = parsed.data;
    if (doc.client_id !== clientId) return null;
    if (!doc.redirect_uris.every((uri) => isValidOAuthRedirectUri(uri))) {
      return null;
    }

    const hostname = new URL(clientId).hostname;
    return {
      clientId: doc.client_id,
      clientName: doc.client_name || hostname,
      redirectUris: doc.redirect_uris,
      tokenEndpointAuthMethod: "none",
      scope: normalizeScopeTokens(doc.scope).join(" "),
      clientSecretHash: null,
      isCimd: true,
    };
  } catch {
    return null;
  }
}

/**
 * Build RFC 9728 WWW-Authenticate header for 401 MCP responses.
 */
export function buildWwwAuthenticateHeader(origin: string): string {
  return `Bearer realm="Manageo MCP", resource_metadata="${origin}/.well-known/oauth-protected-resource", scope="mcp:tools mcp:read mcp:write mcp:finance"`;
}
