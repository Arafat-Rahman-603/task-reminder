import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { hashMcpToken } from "@/lib/server-crypto";
import {
  OAUTH_ACCESS_TOKEN_TTL_SECONDS,
  OAUTH_REFRESH_TOKEN_TTL_SECONDS,
  generateOpaqueToken,
  oauthCorsHeaders,
  resolveOAuthClient,
  verifyPkceS256,
} from "@/lib/oauth-mcp";
import { OAuthAuthCode } from "@/models/OAuthAuthCode";
import { OAuthAccessToken } from "@/models/OAuthAccessToken";
import WorkspaceMembership from "@/models/WorkspaceMembership";

function tokenError(
  error: string,
  description: string,
  status = 400,
  headers = oauthCorsHeaders("POST, OPTIONS")
) {
  return NextResponse.json(
    { error, error_description: description },
    { status, headers }
  );
}

function normalizeResourceUrl(value?: string | null): string {
  return (value || "").trim().replace(/\/+$/, "");
}

async function parseTokenRequestBody(
  req: NextRequest
): Promise<Record<string, string> | null> {
  const contentType = req.headers.get("content-type")?.toLowerCase() || "";
  if (contentType.includes("application/json")) {
    try {
      const json = (await req.json()) as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const [key, value] of Object.entries(json)) {
        if (typeof value === "string") {
          out[key] = value;
        }
      }
      return out;
    } catch {
      return null;
    }
  }

  try {
    const rawText = await req.text();
    const params = new URLSearchParams(rawText);
    const out: Record<string, string> = {};
    params.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  } catch {
    return null;
  }
}

function extractClientCredentials(
  req: NextRequest,
  body: Record<string, string>
): { clientId?: string; clientSecret?: string } {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("basic ")) {
    try {
      const decoded = Buffer.from(authHeader.slice(6).trim(), "base64").toString("utf8");
      const sepIndex = decoded.indexOf(":");
      if (sepIndex !== -1) {
        const clientId = decodeURIComponent(decoded.slice(0, sepIndex));
        const clientSecret = decodeURIComponent(decoded.slice(sepIndex + 1));
        return { clientId, clientSecret };
      }
    } catch {
      // Fall back to body params
    }
  }

  return {
    clientId: body.client_id,
    clientSecret: body.client_secret,
  };
}

function constantTimeHashEquals(rawSecret: string, expectedHash: string): boolean {
  const actualHash = hashMcpToken(rawSecret);
  const a = Buffer.from(actualHash, "utf8");
  const b = Buffer.from(expectedHash, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: oauthCorsHeaders("POST, OPTIONS"),
  });
}

export async function POST(req: NextRequest) {
  const headers = oauthCorsHeaders("POST, OPTIONS");
  const body = await parseTokenRequestBody(req);
  if (!body) {
    return tokenError("invalid_request", "Malformed token request body.", 400, headers);
  }

  const grantType = body.grant_type;
  if (!grantType) {
    return tokenError("invalid_request", "Missing grant_type.", 400, headers);
  }

  const { clientId, clientSecret } = extractClientCredentials(req, body);
  if (!clientId) {
    return tokenError("invalid_client", "Missing client_id.", 401, headers);
  }

  await dbConnect();

  const client = await resolveOAuthClient(clientId);
  if (!client) {
    return tokenError("invalid_client", "Unknown OAuth client.", 401, headers);
  }

  if (client.tokenEndpointAuthMethod !== "none" || client.clientSecretHash) {
    if (
      !clientSecret ||
      !client.clientSecretHash ||
      !constantTimeHashEquals(clientSecret, client.clientSecretHash)
    ) {
      return tokenError("invalid_client", "Invalid client credentials.", 401, headers);
    }
  }

  if (grantType === "authorization_code") {
    const code = body.code;
    const redirectUri = body.redirect_uri;
    const codeVerifier = body.code_verifier;

    if (!code || !redirectUri || !codeVerifier) {
      return tokenError(
        "invalid_request",
        "code, redirect_uri, and code_verifier are required.",
        400,
        headers
      );
    }

    const codeHash = hashMcpToken(code);
    const authCode = await OAuthAuthCode.findOneAndUpdate(
      { codeHash, clientId: client.clientId, consumedAt: null },
      { $set: { consumedAt: new Date() } },
      { returnDocument: "before" }
    );

    if (!authCode) {
      return tokenError(
        "invalid_grant",
        "Authorization code is invalid or has already been used.",
        400,
        headers
      );
    }

    if (authCode.expiresAt.getTime() <= Date.now()) {
      return tokenError("invalid_grant", "Authorization code has expired.", 400, headers);
    }

    if (authCode.redirectUri !== redirectUri) {
      return tokenError("invalid_grant", "redirect_uri mismatch.", 400, headers);
    }

    if (!verifyPkceS256(codeVerifier, authCode.codeChallenge)) {
      return tokenError("invalid_grant", "PKCE code_verifier verification failed.", 400, headers);
    }

    if (
      authCode.resource &&
      body.resource &&
      normalizeResourceUrl(authCode.resource) !== normalizeResourceUrl(body.resource)
    ) {
      return tokenError("invalid_target", "Token resource mismatch.", 400, headers);
    }

    const membership = await WorkspaceMembership.findOne({
      workspaceId: authCode.workspaceId,
      userId: authCode.userId,
      status: { $ne: "suspended" },
    }).lean();

    if (!membership) {
      return tokenError(
        "invalid_grant",
        "User no longer has active access to the authorized workspace.",
        400,
        headers
      );
    }

    const accessToken = generateOpaqueToken("mgo_at_", 32);
    const refreshToken = generateOpaqueToken("mgo_rt_", 32);
    const now = Date.now();

    await OAuthAccessToken.create({
      tokenHash: hashMcpToken(accessToken),
      refreshTokenHash: hashMcpToken(refreshToken),
      clientId: client.clientId,
      userId: authCode.userId,
      workspaceId: authCode.workspaceId,
      scopes: authCode.scopes,
      scopeString: authCode.scopeString,
      resource: authCode.resource || normalizeResourceUrl(body.resource) || undefined,
      revokedAt: null,
      expiresAt: new Date(now + OAUTH_ACCESS_TOKEN_TTL_SECONDS * 1000),
      refreshExpiresAt: new Date(now + OAUTH_REFRESH_TOKEN_TTL_SECONDS * 1000),
    });

    return NextResponse.json(
      {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: OAUTH_ACCESS_TOKEN_TTL_SECONDS,
        refresh_token: refreshToken,
        scope: authCode.scopeString,
      },
      { status: 200, headers }
    );
  }

  if (grantType === "refresh_token") {
    const refreshToken = body.refresh_token;
    if (!refreshToken) {
      return tokenError("invalid_request", "Missing refresh_token.", 400, headers);
    }

    const existing = await OAuthAccessToken.findOneAndUpdate(
      {
        refreshTokenHash: hashMcpToken(refreshToken),
        clientId: client.clientId,
        revokedAt: null,
      },
      {
        $set: { revokedAt: new Date() },
        $unset: { refreshTokenHash: 1 },
      },
      { returnDocument: "before" }
    );

    if (!existing || existing.refreshExpiresAt.getTime() <= Date.now()) {
      return tokenError(
        "invalid_grant",
        "Refresh token is invalid, revoked, or expired.",
        400,
        headers
      );
    }

    const membership = await WorkspaceMembership.findOne({
      workspaceId: existing.workspaceId,
      userId: existing.userId,
      status: { $ne: "suspended" },
    }).lean();

    if (!membership) {
      return tokenError(
        "invalid_grant",
        "User no longer has active access to the authorized workspace.",
        400,
        headers
      );
    }

    const newAccessToken = generateOpaqueToken("mgo_at_", 32);
    const newRefreshToken = generateOpaqueToken("mgo_rt_", 32);
    const now = Date.now();

    await OAuthAccessToken.create({
      tokenHash: hashMcpToken(newAccessToken),
      refreshTokenHash: hashMcpToken(newRefreshToken),
      clientId: client.clientId,
      userId: existing.userId,
      workspaceId: existing.workspaceId,
      scopes: existing.scopes,
      scopeString: existing.scopeString,
      resource: existing.resource,
      revokedAt: null,
      expiresAt: new Date(now + OAUTH_ACCESS_TOKEN_TTL_SECONDS * 1000),
      refreshExpiresAt: new Date(now + OAUTH_REFRESH_TOKEN_TTL_SECONDS * 1000),
    });

    return NextResponse.json(
      {
        access_token: newAccessToken,
        token_type: "Bearer",
        expires_in: OAUTH_ACCESS_TOKEN_TTL_SECONDS,
        refresh_token: newRefreshToken,
        scope: existing.scopeString,
      },
      { status: 200, headers }
    );
  }

  return tokenError(
    "unsupported_grant_type",
    `Unsupported grant_type: ${grantType}`,
    400,
    headers
  );
}
