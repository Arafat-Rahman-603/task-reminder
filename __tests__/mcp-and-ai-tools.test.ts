import mongoose from "mongoose";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import McpApiKey from "@/models/McpApiKey";
import Task from "@/models/Task";
import TrashItem from "@/models/TrashItem";
import Account from "@/models/Account";
import {
  encryptServerSecret,
  decryptServerSecret,
  generateMcpToken,
  hashMcpToken,
} from "@/lib/server-crypto";
import { sanitizePreferencesForClient } from "@/lib/sanitize-preferences";
import { MANAGEO_TOOLS, shouldRequireApproval } from "@/lib/ai/tools";
import { GET as mcpGet, POST as mcpPost } from "@/app/api/mcp/route";
import { POST as toolExecutePost } from "@/app/api/ai/tool-execute/route";

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

describe("AI Assistant Permission Gates & Streamable HTTP MCP Server", () => {
  let userId: mongoose.Types.ObjectId;
  let workspaceId: mongoose.Types.ObjectId;
  let rawMcpToken: string;
  let restrictedToken: string;

  beforeAll(async () => {
    await dbConnect();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      WorkspaceMembership.deleteMany({}),
      McpApiKey.deleteMany({}),
      Task.deleteMany({}),
      TrashItem.deleteMany({}),
      Account.deleteMany({}),
    ]);

    const user = await User.create({
      name: "Test Owner",
      email: "owner@manageo.test",
      passwordHash: "hashed",
      preferences: {
        aiSettings: {
          encryptedGeminiApiKey: encryptServerSecret("AIzaTestSecretKey123"),
          hasCustomApiKey: true,
          preferredModel: "gemini-4-hydrogen",
          permissionMode: "default_approved",
          voiceAutoSpeak: true,
        },
      },
    });
    userId = user._id;

    const ws = await Workspace.create({
      name: "Personal Workspace",
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

    const fullKey = generateMcpToken();
    rawMcpToken = fullKey.rawToken;
    await McpApiKey.create({
      userId,
      workspaceId,
      name: "Full Access Test Client",
      keyPrefix: fullKey.keyPrefix,
      keyHash: fullKey.keyHash,
      scopes: { read: true, write: true, delete: true, finance: true },
      isActive: true,
    });

    const limitedKey = generateMcpToken();
    restrictedToken = limitedKey.rawToken;
    await McpApiKey.create({
      userId,
      workspaceId,
      name: "Read/Write No-Delete No-Finance Client",
      keyPrefix: limitedKey.keyPrefix,
      keyHash: limitedKey.keyHash,
      scopes: { read: true, write: true, delete: false, finance: false },
      isActive: true,
    });
  });

  it("encrypts/decrypts server secrets, hashes MCP tokens, and strips encryptedGeminiApiKey from client prefs", () => {
    const encrypted = encryptServerSecret("AIzaSyDummySecretKey");
    expect(encrypted).not.toContain("AIzaSyDummySecretKey");
    expect(decryptServerSecret(encrypted)).toBe("AIzaSyDummySecretKey");

    const tok = generateMcpToken();
    expect(tok.rawToken.startsWith("mgo_live_")).toBe(true);
    expect(hashMcpToken(tok.rawToken)).toBe(tok.keyHash);

    const safe = sanitizePreferencesForClient({
      aiSettings: {
        encryptedGeminiApiKey: encrypted,
        preferredModel: "gemini-4-argon",
        permissionMode: "default_approved",
      },
    });
    const safeAi = safe.aiSettings as Record<string, unknown>;
    expect(safeAi.encryptedGeminiApiKey).toBeUndefined();
    expect(safeAi.hasCustomApiKey).toBe(true);
  });

  it("enforces shouldRequireApproval accurately for review, default_approved, and turbo modes", () => {
    // review asks for write & delete
    expect(shouldRequireApproval("read", "review")).toBe(false);
    expect(shouldRequireApproval("write", "review")).toBe(true);
    expect(shouldRequireApproval("delete", "review")).toBe(true);

    // default_approved auto-runs read & write, asks before delete
    expect(shouldRequireApproval("read", "default_approved")).toBe(false);
    expect(shouldRequireApproval("write", "default_approved")).toBe(false);
    expect(shouldRequireApproval("delete", "default_approved")).toBe(true);

    // turbo runs all without prompts
    expect(shouldRequireApproval("read", "turbo")).toBe(false);
    expect(shouldRequireApproval("write", "turbo")).toBe(false);
    expect(shouldRequireApproval("delete", "turbo")).toBe(false);
  });

  it("excludes encrypted Vault items from all exposed AI/MCP tools", () => {
    const vaultTool = MANAGEO_TOOLS.find((t) => t.name.toLowerCase().includes("vault"));
    expect(vaultTool).toBeUndefined();
  });

  it("rejects unauthenticated MCP requests and serves initialize/tools/resources/prompts when authorized", async () => {
    const unauthReq = new NextRequest("http://localhost:3000/api/mcp", { method: "GET" });
    const unauthRes = await mcpGet(unauthReq);
    expect(unauthRes.status).toBe(401);

    const getReq = new NextRequest("http://localhost:3000/api/mcp", {
      method: "GET",
      headers: { Authorization: `Bearer ${rawMcpToken}` },
    });
    const getRes = await mcpGet(getReq);
    expect(getRes.status).toBe(200);
    const meta = await getRes.json();
    expect(meta.status).toBe("ready");
    expect(meta.toolCount).toBe(MANAGEO_TOOLS.length);

    const initReq = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${rawMcpToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        { jsonrpc: "2.0", id: 1, method: "initialize" },
        { jsonrpc: "2.0", id: 2, method: "tools/list" },
        { jsonrpc: "2.0", id: 3, method: "resources/list" },
        { jsonrpc: "2.0", id: 4, method: "prompts/list" },
      ]),
    });
    const initRes = await mcpPost(initReq);
    expect(initRes.status).toBe(200);
    const batch = await initRes.json();
    expect(Array.isArray(batch)).toBe(true);
    expect(batch).toHaveLength(4);
    expect(batch[0].result.serverInfo.name).toBe("manageo-mcp-server");
    expect(batch[1].result.tools.length).toBe(MANAGEO_TOOLS.length);
  });

  it("executes full CRUD via MCP (tasks + trash + finance balance ledger) and enforces scopes", async () => {
    const acc = await Account.create({
      userId,
      name: "Main Checking",
      type: "checking",
      currency: "USD",
      balance: mongoose.Types.Decimal128.fromString("1000"),
      isActive: true,
    });

    const callRpc = async (token: string, name: string, args: Record<string, unknown>) => {
      const req = new NextRequest("http://localhost:3000/api/mcp", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "call-1",
          method: "tools/call",
          params: { name, arguments: args },
        }),
      });
      const res = await mcpPost(req);
      return (await res.json()).result;
    };

    // 1. Create Task via MCP
    const createRes = await callRpc(rawMcpToken, "create_task", {
      title: "MCP Created Task",
      priority: "High",
    });
    expect(createRes.isError).toBe(false);
    const createdTaskId = createRes.structuredContent.task.id;

    // 2. Restricted key cannot delete or touch finance
    const blockedDelete = await callRpc(restrictedToken, "delete_task", { taskId: createdTaskId });
    expect(blockedDelete.isError).toBe(true);
    expect(blockedDelete.content[0].text).toContain("delete");

    const blockedFinance = await callRpc(restrictedToken, "create_transaction", {
      accountId: acc._id.toString(),
      type: "expense",
      amount: 50,
      description: "Blocked Coffee",
    });
    expect(blockedFinance.isError).toBe(true);
    expect(blockedFinance.content[0].text).toContain("finance");

    // 3. Record expense via full MCP key & verify calculateNewBalance ledger update
    const txRes = await callRpc(rawMcpToken, "create_transaction", {
      accountId: acc._id.toString(),
      type: "expense",
      amount: 125.5,
      description: "Cloud Hosting",
    });
    expect(txRes.isError).toBe(false);
    expect(txRes.structuredContent.account.newBalance).toBe(874.5);

    // 4. Reverse/delete transaction & verify balance restores cleanly
    const delTxRes = await callRpc(rawMcpToken, "delete_transaction", {
      transactionId: txRes.structuredContent.transaction.id,
    });
    expect(delTxRes.isError).toBe(false);
    expect(delTxRes.structuredContent.newAccountBalance).toBe(1000);

    // 5. Soft-delete task & verify TrashItem creation
    const delTaskRes = await callRpc(rawMcpToken, "delete_task", { taskId: createdTaskId });
    expect(delTaskRes.isError).toBe(false);
    const trashRecord = await TrashItem.findOne({ entityId: createdTaskId }).lean();
    expect(trashRecord).not.toBeNull();
    expect(trashRecord?.entityType).toBe("Task");
  });

  it("gates AI Assistant tool execution according to Review, Default Approved, and Turbo modes", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: userId.toString() } });

    const exec = async (payload: Record<string, unknown>) => {
      const req = new NextRequest("http://localhost:3000/api/ai/tool-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return (await toolExecutePost(req)).json();
    };

    // Review pauses on create_task
    const reviewCreate = await exec({
      toolName: "create_task",
      args: { title: "Review Gate Task" },
      workspaceId: workspaceId.toString(),
      permissionMode: "review",
    });
    expect(reviewCreate.status).toBe("requires_approval");

    // Default Approved auto-executes create_task
    const approvedCreate = await exec({
      toolName: "create_task",
      args: { title: "Auto Approved Task" },
      workspaceId: workspaceId.toString(),
      permissionMode: "default_approved",
    });
    expect(approvedCreate.status).toBe("executed");
    expect(approvedCreate.ok).toBe(true);
    const taskId = approvedCreate.data.task.id;

    // Default Approved pauses on delete_task
    const approvedDelete = await exec({
      toolName: "delete_task",
      args: { taskId },
      workspaceId: workspaceId.toString(),
      permissionMode: "default_approved",
    });
    expect(approvedDelete.status).toBe("requires_approval");

    // Turbo auto-executes delete_task
    const turboDelete = await exec({
      toolName: "delete_task",
      args: { taskId },
      workspaceId: workspaceId.toString(),
      permissionMode: "turbo",
    });
    expect(turboDelete.status).toBe("executed");
    expect(turboDelete.ok).toBe(true);
  });
});
