import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { hashMcpToken } from "@/lib/server-crypto";
import {
  OAUTH_CODE_TTL_MS,
  formatOAuthScopes,
  generateOpaqueToken,
  isValidOAuthRedirectUri,
  parseOAuthScopes,
  resolveOAuthClient,
} from "@/lib/oauth-mcp";
import { OAuthAuthCode } from "@/models/OAuthAuthCode";
import WorkspaceMembership from "@/models/WorkspaceMembership";

const AuthorizeDecisionSchema = z.object({
  decision: z.enum(["approve", "deny"]),
  clientId: z.string().trim().min(1),
  redirectUri: z.string().trim().min(1),
  codeChallenge: z.string().trim().min(43).max(128),
  codeChallengeMethod: z.literal("S256"),
  workspaceId: z.string().trim().optional(),
  scope: z.string().optional(),
  scopes: z
    .object({
      read: z.boolean(),
      write: z.boolean(),
      delete: z.boolean(),
      finance: z.boolean(),
    })
    .optional(),
  state: z.string().optional(),
  resource: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AuthorizeDecisionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid authorization parameters" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (!isValidOAuthRedirectUri(data.redirectUri)) {
    return NextResponse.json({ error: "Invalid redirect_uri" }, { status: 400 });
  }

  await dbConnect();

  const client = await resolveOAuthClient(data.clientId);
  if (!client || !client.redirectUris.includes(data.redirectUri)) {
    return NextResponse.json(
      { error: "Unknown client_id or unregistered redirect_uri" },
      { status: 400 }
    );
  }

  const redirectTarget = new URL(data.redirectUri);

  if (data.decision === "deny") {
    redirectTarget.searchParams.set("error", "access_denied");
    redirectTarget.searchParams.set(
      "error_description",
      "The user denied access to this Manageo workspace."
    );
    if (data.state) {
      redirectTarget.searchParams.set("state", data.state);
    }
    return NextResponse.json({ redirectTo: redirectTarget.toString() });
  }

  if (!data.workspaceId || !mongoose.Types.ObjectId.isValid(data.workspaceId)) {
    return NextResponse.json(
      { error: "A valid workspaceId must be selected." },
      { status: 400 }
    );
  }

  const membership = await WorkspaceMembership.findOne({
    workspaceId: data.workspaceId,
    userId: session.user.id,
    status: { $ne: "suspended" },
  }).lean();

  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden: you do not have access to this workspace." },
      { status: 403 }
    );
  }

  const resolvedScopes = data.scopes ?? parseOAuthScopes(data.scope).scopes;
  if (
    !resolvedScopes.read &&
    !resolvedScopes.write &&
    !resolvedScopes.delete &&
    !resolvedScopes.finance
  ) {
    return NextResponse.json(
      { error: "Select at least one permission scope to authorize." },
      { status: 400 }
    );
  }

  const rawCode = generateOpaqueToken("mgo_code_", 24);
  const scopeString = formatOAuthScopes(resolvedScopes, true);

  await OAuthAuthCode.create({
    codeHash: hashMcpToken(rawCode),
    clientId: client.clientId,
    userId: session.user.id,
    workspaceId: data.workspaceId,
    redirectUri: data.redirectUri,
    codeChallenge: data.codeChallenge,
    codeChallengeMethod: "S256",
    scopes: resolvedScopes,
    scopeString,
    resource: data.resource?.trim() || undefined,
    consumedAt: null,
    expiresAt: new Date(Date.now() + OAUTH_CODE_TTL_MS),
  });

  redirectTarget.searchParams.set("code", rawCode);
  if (data.state) {
    redirectTarget.searchParams.set("state", data.state);
  }

  return NextResponse.json({ redirectTo: redirectTarget.toString() });
}
