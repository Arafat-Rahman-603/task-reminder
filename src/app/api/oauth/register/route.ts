import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { hashMcpToken } from "@/lib/server-crypto";
import {
  generateOpaqueToken,
  isValidOAuthRedirectUri,
  normalizeScopeTokens,
  oauthCorsHeaders,
} from "@/lib/oauth-mcp";
import { OAuthClient } from "@/models/OAuthClient";

const RegisterClientSchema = z.object({
  client_name: z.string().trim().min(1).max(120).optional(),
  redirect_uris: z.array(z.string().trim().min(1)).min(1).max(10),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
  token_endpoint_auth_method: z
    .enum(["none", "client_secret_post", "client_secret_basic"])
    .optional(),
  scope: z.string().optional(),
  client_uri: z.string().url().optional(),
  logo_uri: z.string().url().optional(),
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: oauthCorsHeaders("POST, OPTIONS"),
  });
}

export async function POST(req: NextRequest) {
  const headers = oauthCorsHeaders("POST, OPTIONS");

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_client_metadata", error_description: "Malformed JSON body." },
      { status: 400, headers }
    );
  }

  const parsed = RegisterClientSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_client_metadata",
        error_description: "Invalid dynamic client registration payload.",
      },
      { status: 400, headers }
    );
  }

  const data = parsed.data;

  for (const uri of data.redirect_uris) {
    if (!isValidOAuthRedirectUri(uri)) {
      return NextResponse.json(
        {
          error: "invalid_redirect_uri",
          error_description: `Invalid or insecure redirect_uri: ${uri}`,
        },
        { status: 400, headers }
      );
    }
  }

  const supportedGrants = new Set(["authorization_code", "refresh_token"]);
  const requestedGrants = (data.grant_types || ["authorization_code", "refresh_token"]).filter(
    (grant) => supportedGrants.has(grant)
  );
  if (!requestedGrants.includes("authorization_code")) {
    return NextResponse.json(
      {
        error: "invalid_client_metadata",
        error_description: "authorization_code grant type is required.",
      },
      { status: 400, headers }
    );
  }

  const responseTypes = (data.response_types || ["code"]).filter((rt) => rt === "code");
  if (responseTypes.length === 0) {
    return NextResponse.json(
      {
        error: "invalid_client_metadata",
        error_description: "code response_type is required.",
      },
      { status: 400, headers }
    );
  }

  const authMethod = data.token_endpoint_auth_method || "none";
  const scope = normalizeScopeTokens(data.scope).join(" ");
  const clientName = data.client_name || "MCP Client";
  const clientId = generateOpaqueToken("mgo_client_", 18);

  let clientSecret: string | undefined;
  let clientSecretHash: string | null = null;
  if (authMethod !== "none") {
    clientSecret = generateOpaqueToken("mgo_cs_", 24);
    clientSecretHash = hashMcpToken(clientSecret);
  }

  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  await dbConnect();
  await OAuthClient.create({
    clientId,
    clientSecretHash,
    clientName,
    redirectUris: data.redirect_uris,
    grantTypes: requestedGrants,
    responseTypes,
    tokenEndpointAuthMethod: authMethod,
    scope,
    clientUri: data.client_uri,
    logoUri: data.logo_uri,
    registeredByIp: forwardedFor,
  });

  const nowSeconds = Math.floor(Date.now() / 1000);
  const responsePayload: Record<string, unknown> = {
    client_id: clientId,
    client_id_issued_at: nowSeconds,
    client_name: clientName,
    redirect_uris: data.redirect_uris,
    grant_types: requestedGrants,
    response_types: responseTypes,
    token_endpoint_auth_method: authMethod,
    scope,
  };

  if (clientSecret) {
    responsePayload.client_secret = clientSecret;
    responsePayload.client_secret_expires_at = 0;
  }

  return NextResponse.json(responsePayload, { status: 201, headers });
}
