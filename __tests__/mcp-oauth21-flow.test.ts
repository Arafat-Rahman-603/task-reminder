import crypto from "crypto";
import mongoose from "mongoose";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import Task from "@/models/Task";
import { OAuthClient } from "@/models/OAuthClient";
import { OAuthAuthCode } from "@/models/OAuthAuthCode";
import { OAuthAccessToken } from "@/models/OAuthAccessToken";
import { GET as mcpGet, POST as mcpPost, DELETE as mcpDelete } from "@/app/api/mcp/route";
import { GET as protectedResourceGet } from "@/app/.well-known/oauth-protected-resource/[[...path]]/route";
import { GET as authServerGet } from "@/app/.well-known/oauth-authorization-server/[[...path]]/route";
import { GET as oidcGet } from "@/app/.well-known/openid-configuration/route";
import { POST as registerPost } from "@/app/api/oauth/register/route";
import { POST as decisionPost } from "@/app/api/oauth/authorize/decision/route";
import { POST as tokenPost } from "@/app/api/oauth/token/route";
import { POST as revokePost } from "@/app/api/oauth/revoke/route";

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

function makePkcePair() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

describe("Manageo MCP OAuth 2.1 Discovery, DCR, PKCE & Token Flow", () => {
  let userId: mongoose.Types.ObjectId;
  let workspaceId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await dbConnect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      WorkspaceMembership.deleteMany({}),
      Task.deleteMany({}),
      OAuthClient.deleteMany({}),
      OAuthAuthCode.deleteMany({}),
      OAuthAccessToken.deleteMany({}),
    ]);

    const user = await User.create({
      name: "OAuth Tester",
      email: "oauth-tester@manageo.test",
      passwordHash: "hashed",
    });
    userId = user._id;

    const ws = await Workspace.create({
      name: "OAuth Workspace",
      type: "personal",
      ownerId: userId,
    });
    workspaceId = ws._id;

    await WorkspaceMembership.create({
      workspaceId,
      userId,
      role: "owner",
      status: "active",
    });

    mockGetServerSession.mockResolvedValue({
      user: {
        id: userId.toString(),
        email: user.email,
        name: user.name,
      },
    });
  });

  it("returns 401 with RFC 9728 WWW-Authenticate header and serves well-known discovery metadata", async () => {
    const mcpReq = new NextRequest("https://manageo.example.com/api/mcp", {
      method: "GET",
    });
    const unauthRes = await mcpGet(mcpReq);
    expect(unauthRes.status).toBe(401);
    const wwwAuth = unauthRes.headers.get("www-authenticate");
    expect(wwwAuth).toContain('Bearer realm="Manageo MCP"');
    expect(wwwAuth).toContain(
      'resource_metadata="https://manageo.example.com/.well-known/oauth-protected-resource"'
    );

    const prRes = await protectedResourceGet(
      new NextRequest("https://manageo.example.com/.well-known/oauth-protected-resource/api/mcp"),
      { params: Promise.resolve({ path: ["api", "mcp"] }) }
    );
    expect(prRes.status).toBe(200);
    const prJson = await prRes.json();
    expect(prJson.resource).toBe("https://manageo.example.com/api/mcp");
    expect(prJson.authorization_servers).toEqual(["https://manageo.example.com"]);
    expect(prJson.scopes_supported).toContain("mcp:tools");

    const asRes = await authServerGet(
      new NextRequest("https://manageo.example.com/.well-known/oauth-authorization-server"),
      { params: Promise.resolve({}) }
    );
    expect(asRes.status).toBe(200);
    const asJson = await asRes.json();
    expect(asJson.issuer).toBe("https://manageo.example.com");
    expect(asJson.authorization_endpoint).toBe("https://manageo.example.com/oauth/authorize");
    expect(asJson.token_endpoint).toBe("https://manageo.example.com/api/oauth/token");
    expect(asJson.registration_endpoint).toBe("https://manageo.example.com/api/oauth/register");
    expect(asJson.code_challenge_methods_supported).toEqual(["S256"]);

    const oidcRes = await oidcGet(
      new NextRequest("https://manageo.example.com/.well-known/openid-configuration")
    );
    expect(oidcRes.status).toBe(200);
    const oidcJson = await oidcRes.json();
    expect(oidcJson.token_endpoint).toBe("https://manageo.example.com/api/oauth/token");
  });

  it("supports Dynamic Client Registration and rejects insecure redirect URIs", async () => {
    const badRes = await registerPost(
      new NextRequest("https://manageo.example.com/api/oauth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: "Evil Client",
          redirect_uris: ["http://evil.example.com/callback"],
        }),
      })
    );
    expect(badRes.status).toBe(400);
    const badJson = await badRes.json();
    expect(badJson.error).toBe("invalid_redirect_uri");

    const goodRes = await registerPost(
      new NextRequest("https://manageo.example.com/api/oauth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: "ChatGPT",
          redirect_uris: ["https://chatgpt.com/connector_platform_oauth_redirect"],
          token_endpoint_auth_method: "none",
        }),
      })
    );
    expect(goodRes.status).toBe(201);
    const goodJson = await goodRes.json();
    expect(goodJson.client_id).toMatch(/^mgo_client_/);
    expect(goodJson.redirect_uris).toEqual([
      "https://chatgpt.com/connector_platform_oauth_redirect",
    ]);
  });

  it("completes full PKCE OAuth flow, executes MCP tools, enforces scopes, refreshes, and revokes", async () => {
    const regRes = await registerPost(
      new NextRequest("https://manageo.example.com/api/oauth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: "ChatGPT Connector",
          redirect_uris: ["https://chatgpt.com/connector_platform_oauth_redirect"],
        }),
      })
    );
    const { client_id: clientId } = await regRes.json();
    const redirectUri = "https://chatgpt.com/connector_platform_oauth_redirect";

    // Deny decision emits access_denied + preserves state
    const { challenge: denyChallenge } = makePkcePair();
    const denyRes = await decisionPost(
      new NextRequest("https://manageo.example.com/api/oauth/authorize/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "deny",
          clientId,
          redirectUri,
          codeChallenge: denyChallenge,
          codeChallengeMethod: "S256",
          state: "deny-state-1",
        }),
      })
    );
    expect(denyRes.status).toBe(200);
    const denyPayload = await denyRes.json();
    const denyUrl = new URL(denyPayload.redirectTo);
    expect(denyUrl.searchParams.get("error")).toBe("access_denied");
    expect(denyUrl.searchParams.get("state")).toBe("deny-state-1");

    // Wrong PKCE verifier test (with separate single-use auth code)
    const pkceWrong = makePkcePair();
    const badAuthRes = await decisionPost(
      new NextRequest("https://manageo.example.com/api/oauth/authorize/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "approve",
          clientId,
          redirectUri,
          codeChallenge: pkceWrong.challenge,
          codeChallengeMethod: "S256",
          workspaceId: workspaceId.toString(),
          scopes: { read: true, write: true, delete: false, finance: false },
          state: "pkce-test",
        }),
      })
    );
    const badCode = new URL((await badAuthRes.json()).redirectTo).searchParams.get("code")!;
    const badExchange = await tokenPost(
      new NextRequest("https://manageo.example.com/api/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          code: badCode,
          redirect_uri: redirectUri,
          code_verifier: "wrong_verifier_string_that_is_over_43_characters_long_000",
        }).toString(),
      })
    );
    expect(badExchange.status).toBe(400);

    // Approve with PKCE S256 (read + write, without finance)
    const pkce = makePkcePair();
    const approveRes = await decisionPost(
      new NextRequest("https://manageo.example.com/api/oauth/authorize/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "approve",
          clientId,
          redirectUri,
          codeChallenge: pkce.challenge,
          codeChallengeMethod: "S256",
          workspaceId: workspaceId.toString(),
          scopes: { read: true, write: true, delete: false, finance: false },
          state: "state-xyz",
          resource: "https://manageo.example.com/api/mcp",
        }),
      })
    );
    expect(approveRes.status).toBe(200);
    const approvedUrl = new URL((await approveRes.json()).redirectTo);
    expect(approvedUrl.searchParams.get("state")).toBe("state-xyz");
    const authCode = approvedUrl.searchParams.get("code")!;
    expect(authCode).toMatch(/^mgo_code_/);

    // Exchange authorization code for Bearer + refresh token
    const tokenRes = await tokenPost(
      new NextRequest("https://manageo.example.com/api/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          code: authCode,
          redirect_uri: redirectUri,
          code_verifier: pkce.verifier,
          resource: "https://manageo.example.com/api/mcp",
        }).toString(),
      })
    );
    expect(tokenRes.status).toBe(200);
    const tokenJson = await tokenRes.json();
    expect(tokenJson.token_type).toBe("Bearer");
    expect(tokenJson.access_token).toMatch(/^mgo_at_/);
    expect(tokenJson.refresh_token).toMatch(/^mgo_rt_/);

    // Replaying the same authorization code must fail
    const replayRes = await tokenPost(
      new NextRequest("https://manageo.example.com/api/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          code: authCode,
          redirect_uri: redirectUri,
          code_verifier: pkce.verifier,
        }).toString(),
      })
    );
    expect(replayRes.status).toBe(400);

    // Call /api/mcp with OAuth access token: create_task succeeds
    const createTaskRes = await mcpPost(
      new NextRequest("https://manageo.example.com/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenJson.access_token}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "create_task",
            arguments: { title: "Ship ChatGPT OAuth MCP", priority: "High" },
          },
        }),
      })
    );
    expect(createTaskRes.status).toBe(200);
    const createdRpc = await createTaskRes.json();
    expect(createdRpc.result.isError).not.toBe(true);
    const createdPayload = JSON.parse(createdRpc.result.content[0].text);
    expect(createdPayload.task?.title).toBe("Ship ChatGPT OAuth MCP");

    // Scope enforcement: finance was disabled so get_finance_summary must fail with -32003
    const deniedFinanceRes = await mcpPost(
      new NextRequest("https://manageo.example.com/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenJson.access_token}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "get_finance_summary",
            arguments: {},
          },
        }),
      })
    );
    expect(deniedFinanceRes.status).toBe(200);
    const financeRpc = await deniedFinanceRes.json();
    expect(financeRpc.result.isError).toBe(true);
    expect(financeRpc.result.content[0].text).toContain("finance");

    // DELETE session termination works when authenticated
    const delRes = await mcpDelete(
      new NextRequest("https://manageo.example.com/api/mcp", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      })
    );
    expect(delRes.status).toBe(204);

    // Refresh token rotates and invalidates old refresh token
    const refreshRes = await tokenPost(
      new NextRequest("https://manageo.example.com/api/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: clientId,
          refresh_token: tokenJson.refresh_token,
        }).toString(),
      })
    );
    expect(refreshRes.status).toBe(200);
    const rotated = await refreshRes.json();
    expect(rotated.access_token).toMatch(/^mgo_at_/);
    expect(rotated.access_token).not.toBe(tokenJson.access_token);
    expect(rotated.refresh_token).not.toBe(tokenJson.refresh_token);

    // Old refresh token reuse fails
    const staleRefreshRes = await tokenPost(
      new NextRequest("https://manageo.example.com/api/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: clientId,
          refresh_token: tokenJson.refresh_token,
        }).toString(),
      })
    );
    expect(staleRefreshRes.status).toBe(400);

    // Revoke rotated access token -> MCP returns 401 + WWW-Authenticate
    const revokeRes = await revokePost(
      new NextRequest("https://manageo.example.com/api/oauth/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: rotated.access_token }).toString(),
      })
    );
    expect(revokeRes.status).toBe(200);

    const postRevokeMcp = await mcpPost(
      new NextRequest("https://manageo.example.com/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${rotated.access_token}`,
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/list" }),
      })
    );
    expect(postRevokeMcp.status).toBe(401);
    expect(postRevokeMcp.headers.get("www-authenticate")).toContain(
      "/.well-known/oauth-protected-resource"
    );
  });
});
