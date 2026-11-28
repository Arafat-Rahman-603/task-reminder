import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { isValidOAuthRedirectUri, parseOAuthScopes } from "@/lib/oauth-mcp";
import { OAuthClient } from "@/models/OAuthClient";
import "@/models/Workspace";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import { Logo } from "@/components/Logo";
import {
  OAuthConsentCard,
  type OAuthConsentWorkspace,
} from "@/components/ai/OAuthConsentCard";

export const dynamic = "force-dynamic";

interface AuthorizeSearchParams {
  client_id?: string;
  redirect_uri?: string;
  response_type?: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  resource?: string;
}

function buildReturnPath(params: AuthorizeSearchParams): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) {
      qs.set(key, value);
    }
  }
  const serialized = qs.toString();
  return serialized ? `/oauth/authorize?${serialized}` : "/oauth/authorize";
}

function OAuthErrorView({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <main className="min-h-screen bg-stitch-background text-on-surface flex flex-col items-center justify-center p-4">
      <div className="mb-6">
        <Logo variant="header" />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container p-6 shadow-xl text-center">
        <h1 className="text-lg font-semibold text-on-surface">{title}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">{message}</p>
      </div>
    </main>
  );
}

export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<AuthorizeSearchParams>;
}) {
  const params = await searchParams;
  const {
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: responseType,
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
    resource,
  } = params;

  if (!clientId || !redirectUri) {
    return (
      <OAuthErrorView
        title="Invalid Authorization Request"
        message="Required OAuth parameters (client_id and redirect_uri) are missing."
      />
    );
  }

  if (responseType !== "code") {
    return (
      <OAuthErrorView
        title="Unsupported Response Type"
        message="Only OAuth 2.1 authorization_code flow (response_type=code) is supported."
      />
    );
  }

  if (!codeChallenge || codeChallengeMethod !== "S256") {
    return (
      <OAuthErrorView
        title="PKCE S256 Required"
        message="OAuth 2.1 requires PKCE with code_challenge_method=S256."
      />
    );
  }

  if (!isValidOAuthRedirectUri(redirectUri)) {
    return (
      <OAuthErrorView
        title="Invalid Redirect URI"
        message="The provided redirect_uri does not meet OAuth 2.1 security requirements."
      />
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    const returnTo = buildReturnPath(params);
    redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  }

  await dbConnect();

  const client = await OAuthClient.findOne({ clientId }).lean();
  if (!client || !client.redirectUris.includes(redirectUri)) {
    return (
      <OAuthErrorView
        title="Unrecognized OAuth Client"
        message="This client_id or redirect_uri is not registered with Manageo."
      />
    );
  }

  const memberships = await WorkspaceMembership.find({
    userId: session.user.id,
    status: { $ne: "suspended" },
  })
    .populate("workspaceId", "name type isArchived")
    .lean();

  const workspaces: OAuthConsentWorkspace[] = [];
  for (const membership of memberships) {
    const ws = membership.workspaceId as
      | { _id?: { toString(): string }; name?: string; type?: "personal" | "team"; isArchived?: boolean }
      | null
      | undefined;
    if (!ws?._id || ws.isArchived) continue;
    workspaces.push({
      id: ws._id.toString(),
      name: ws.name || "Workspace",
      type: ws.type === "team" ? "team" : "personal",
      role: membership.role || "member",
    });
  }

  workspaces.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === "personal" ? -1 : 1;
  });

  const { scopes } = parseOAuthScopes(scope || client.scope);
  const redirectHost = new URL(redirectUri).host;

  return (
    <main className="min-h-screen bg-stitch-background text-on-surface flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="mb-6">
        <Logo variant="header" />
      </div>
      <OAuthConsentCard
        clientId={client.clientId}
        clientName={client.clientName}
        redirectHost={redirectHost}
        redirectUri={redirectUri}
        codeChallenge={codeChallenge}
        codeChallengeMethod="S256"
        state={state}
        resource={resource}
        userEmail={session.user.email || undefined}
        userName={session.user.name || undefined}
        workspaces={workspaces}
        initialScopes={scopes}
      />
    </main>
  );
}
