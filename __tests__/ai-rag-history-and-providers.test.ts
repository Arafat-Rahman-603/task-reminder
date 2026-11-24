import mongoose from "mongoose";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import PlatformAiConfig from "@/models/PlatformAiConfig";
import Task from "@/models/Task";
import Note from "@/models/Note";
import NoteGroup from "@/models/NoteGroup";
import VaultItem from "@/models/VaultItem";
import AiConversation from "@/models/AiConversation";
import AiMessage from "@/models/AiMessage";
import AiKnowledgeChunk from "@/models/AiKnowledgeChunk";
import { encryptServerSecret } from "@/lib/server-crypto";
import {
  computeLocalEmbedding,
  cosineSimilarity,
  invalidateKnowledgeCache,
  retrieveHybridContext,
} from "@/lib/ai/rag";
import {
  generateAgentTurn,
  resolveEffectiveAiTargets,
  validateLlmBaseUrl,
} from "@/lib/ai/llm-providers";
import { executeManageoTool } from "@/lib/ai/tools";
import {
  GET as listConversationsGet,
  POST as createConversationPost,
} from "@/app/api/ai/conversations/route";
import {
  GET as detailConversationGet,
  PATCH as patchConversationPatch,
  DELETE as deleteConversationDelete,
} from "@/app/api/ai/conversations/[id]/route";
import { POST as chatPost } from "@/app/api/ai/chat/route";

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

const mockActiveWsInfo = jest.fn();
jest.mock("@/actions/workspace.actions", () => ({
  getActiveWorkspaceInfo: () => mockActiveWsInfo(),
}));

describe("Hybrid Vector RAG, Multi-Provider Failover, DB Chat History, and Agent Graph", () => {
  let userAId: mongoose.Types.ObjectId;
  let userBId: mongoose.Types.ObjectId;
  let wsAId: mongoose.Types.ObjectId;
  let wsBId: mongoose.Types.ObjectId;
  const originalFetch = global.fetch;

  beforeAll(async () => {
    await dbConnect();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.OPENROUTER_API_KEY;
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      WorkspaceMembership.deleteMany({}),
      PlatformAiConfig.deleteMany({}),
      Task.deleteMany({}),
      Note.deleteMany({}),
      NoteGroup.deleteMany({}),
      VaultItem.deleteMany({}),
      AiConversation.deleteMany({}),
      AiMessage.deleteMany({}),
      AiKnowledgeChunk.deleteMany({}),
    ]);

    const userA = await User.create({
      name: "Alice Manageo",
      email: "alice@manageo.test",
      passwordHash: "hashed",
      preferences: {
        aiSettings: {
          useCustomProvider: false,
          permissionMode: "default_approved",
        },
      },
    });
    const userB = await User.create({
      name: "Bob Other",
      email: "bob@manageo.test",
      passwordHash: "hashed",
    });
    userAId = userA._id;
    userBId = userB._id;

    const wsA = await Workspace.create({
      name: "Alice Personal",
      type: "personal",
      ownerId: userAId,
    });
    const wsB = await Workspace.create({
      name: "Bob Personal",
      type: "personal",
      ownerId: userBId,
    });
    wsAId = wsA._id;
    wsBId = wsB._id;

    await WorkspaceMembership.create([
      { workspaceId: wsAId, userId: userAId, role: "owner", status: "active" },
      { workspaceId: wsBId, userId: userBId, role: "owner", status: "active" },
    ]);

    mockGetServerSession.mockResolvedValue({ user: { id: userAId.toString() } });
    mockActiveWsInfo.mockResolvedValue({
      activeWorkspace: { _id: wsAId.toString(), name: "Alice Personal", type: "personal" },
      workspaces: [],
    });
  });

  it("computes normalized 256-dim local vectors and retrieves tenant-scoped Hybrid RAG hits while excluding Vault", async () => {
    const v1 = computeLocalEmbedding("Deploy OpenRouter failover router to production");
    const v2 = computeLocalEmbedding("OpenRouter gateway retry and fallback model setup");
    const v3 = computeLocalEmbedding("Grocery list bananas and milk");
    expect(v1).toHaveLength(256);
    expect(cosineSimilarity(v1, v2)).toBeGreaterThan(cosineSimilarity(v1, v3));

    const ng = await NoteGroup.create({
      userId: userAId,
      workspaceId: wsAId,
      name: "Engineering",
      slug: "engineering",
    });

    await Task.create({
      userId: userAId,
      workspaceId: wsAId,
      slug: "deploy-openrouter-failover",
      title: "Deploy OpenRouter failover",
      description: "Configure automatic 503 fallback routing for Manageo AI.",
      status: "To Do",
      priority: "High",
    });
    await Note.create({
      userId: userAId,
      workspaceId: wsAId,
      groupId: ng._id,
      title: "Bangladesh Bank Invoice Audit",
      slug: "bd-bank-audit",
      date: new Date(),
      content: "Verify Q4 vendor settlement receipts.",
    });
    await Task.create({
      userId: userBId,
      workspaceId: wsBId,
      slug: "bob-secret-task",
      title: "Bob Private OpenRouter Key",
      status: "To Do",
      priority: "Urgent",
    });
    await VaultItem.create({
      userId: userAId,
      title: "Root SSH Password OpenRouter Secret",
      category: "Credentials",
      encryptedData: "ciphertext",
      iv: "iv",
      salt: "test-salt",
    });

    invalidateKnowledgeCache(userAId.toString(), wsAId.toString());
    const hits = await retrieveHybridContext({
      userId: userAId.toString(),
      workspaceId: wsAId.toString(),
      query: "OpenRouter failover routing",
      topK: 5,
    });

    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].title).toBe("Deploy OpenRouter failover");
    expect(hits.some((h) => h.title.includes("Bob Private"))).toBe(false);
    expect(hits.some((h) => h.title.includes("Root SSH Password"))).toBe(false);

    // Tool wrapper check
    const toolRes = await executeManageoTool(
      "search_workspace_knowledge",
      { query: "vendor settlement receipts", topK: 4 },
      { userId: userAId.toString(), workspaceId: wsAId.toString(), source: "assistant" }
    );
    expect(toolRes.ok).toBe(true);
    if (toolRes.ok) {
      const data = toolRes.data as { hits: Array<{ title: string }> };
      expect(data.hits.some((h) => h.title.includes("Bangladesh Bank"))).toBe(true);
    }
  });

  it("blocks cloud metadata SSRF URLs and resolves platform OpenRouter + user Ollama local models", async () => {
    expect(() => validateLlmBaseUrl("http://169.254.169.254/latest/meta-data")).toThrow(/Blocked/);
    expect(validateLlmBaseUrl("http://localhost:11434/v1/")).toBe("http://localhost:11434/v1");

    await PlatformAiConfig.create({
      key: "default",
      activeProvider: "openrouter",
      openrouterModel: "openai/gpt-4o-mini",
      openrouterFallbackModels: ["google/gemini-2.5-flash"],
      encryptedOpenrouterApiKey: encryptServerSecret("sk-or-v1-platform-secret"),
    });

    const platformTargets = await resolveEffectiveAiTargets(userAId.toString());
    expect(platformTargets.isUsingCustomUserProvider).toBe(false);
    expect(platformTargets.candidates[0].provider).toBe("openrouter");
    expect(platformTargets.candidates[0].model).toBe("openai/gpt-4o-mini");
    expect(platformTargets.candidates[1].model).toBe("google/gemini-2.5-flash");

    // Switch user to local Ollama in Settings
    await User.updateOne(
      { _id: userAId },
      {
        $set: {
          "preferences.aiSettings.useCustomProvider": true,
          "preferences.aiSettings.customProvider": "ollama",
          "preferences.aiSettings.customModel": "qwen2.5:7b",
          "preferences.aiSettings.customBaseUrl": "http://localhost:11434/v1",
        },
      }
    );

    const localTargets = await resolveEffectiveAiTargets(userAId.toString());
    expect(localTargets.isUsingCustomUserProvider).toBe(true);
    expect(localTargets.candidates[0].provider).toBe("ollama");
    expect(localTargets.candidates[0].model).toBe("qwen2.5:7b");
    expect(localTargets.candidates[0].isLocal).toBe(true);
  });

  it("automatically fails over when primary model returns 503 high demand", async () => {
    const fetchMock = jest
      .fn()
      // 1st attempt on primary -> 503
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () =>
          JSON.stringify({
            error: { message: "Model is currently experiencing high demand" },
          }),
      })
      // 2nd retry attempt on primary -> 503
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () =>
          JSON.stringify({
            error: { message: "Still experiencing high demand" },
          }),
      })
      // Fallback model succeeds cleanly!
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: "You have 2 pending tasks.",
                tool_calls: [],
              },
            },
          ],
        }),
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await generateAgentTurn(
      [
        {
          provider: "openrouter",
          model: "google/gemini-2.5-pro",
          apiKey: "sk-or-test",
          baseUrl: "https://openrouter.ai/api/v1",
          source: "platform",
        },
        {
          provider: "openrouter",
          model: "openai/gpt-4o-mini",
          apiKey: "sk-or-test",
          baseUrl: "https://openrouter.ai/api/v1",
          source: "platform",
        },
      ],
      "System prompt",
      [{ role: "user", content: "Which task are pending?" }]
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.modelUsed).toBe("openai/gpt-4o-mini");
    expect(result.text).toBe("You have 2 pending tasks.");

    // Verify 429 rate-limit skips double-retry and immediately fails over to the next free fallback model
    const rateLimitFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => JSON.stringify({ error: { message: "Rate limit exceeded" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: "Fast fallback OK", tool_calls: [] } }],
        }),
      });
    global.fetch = rateLimitFetch as unknown as typeof fetch;

    const rlResult = await generateAgentTurn(
      [
        {
          provider: "openrouter",
          model: "nvidia/nemotron-3.5-lightning:free",
          apiKey: "sk-or-test",
          baseUrl: "https://openrouter.ai/api/v1",
          source: "platform",
        },
        {
          provider: "openrouter",
          model: "google/gemma-4-26b-a4b-it:free",
          apiKey: "sk-or-test",
          baseUrl: "https://openrouter.ai/api/v1",
          source: "platform",
        },
      ],
      "System prompt",
      [{ role: "user", content: "Ping" }]
    );
    expect(rateLimitFetch).toHaveBeenCalledTimes(2);
    expect(rlResult.modelUsed).toBe("google/gemma-4-26b-a4b-it:free");
    expect(rlResult.text).toBe("Fast fallback OK");
  });

  it("persists DB chat conversations and messages across requests with strict user isolation", async () => {
    await PlatformAiConfig.create({
      key: "default",
      activeProvider: "openrouter",
      openrouterModel: "openai/gpt-4o-mini",
      encryptedOpenrouterApiKey: encryptServerSecret("sk-or-v1-test"),
    });

    await Task.create({
      userId: userAId,
      workspaceId: wsAId,
      slug: "pay-internet-bill",
      title: "Pay Internet Bill",
      status: "To Do",
      priority: "High",
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: "Pending task:\n- **Pay Internet Bill** (High priority)",
              tool_calls: [],
            },
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const chatReq = new NextRequest("http://localhost:3000/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "which task are pending",
        workspaceId: wsAId.toString(),
      }),
    });
    const chatRes = await chatPost(chatReq);
    expect(chatRes.status).toBe(200);
    const chatJson = await chatRes.json();
    expect(chatJson.status).toBe("completed");
    expect(chatJson.conversationId).toBeTruthy();
    expect(chatJson.reply).toContain("Pay Internet Bill");
    expect(chatJson.provider).toBe("openrouter");

    // Verify DB history list
    const listReq = new NextRequest(
      `http://localhost:3000/api/ai/conversations?workspaceId=${wsAId.toString()}`
    );
    const listRes = await listConversationsGet(listReq);
    const listJson = await listRes.json();
    expect(listJson.conversations).toHaveLength(1);
    expect(listJson.conversations[0].id).toBe(chatJson.conversationId);
    expect(listJson.conversations[0].messageCount).toBe(2);

    // Detail endpoint loads both messages
    const detailRes = await detailConversationGet(
      new NextRequest(`http://localhost:3000/api/ai/conversations/${chatJson.conversationId}`),
      { params: Promise.resolve({ id: chatJson.conversationId }) }
    );
    expect(detailRes.status).toBe(200);
    const detailJson = await detailRes.json();
    expect(detailJson.messages).toHaveLength(2);
    expect(detailJson.messages[0].role).toBe("user");
    expect(detailJson.messages[1].role).toBe("assistant");

    // Patch pin & rename
    const patchRes = await patchConversationPatch(
      new NextRequest(`http://localhost:3000/api/ai/conversations/${chatJson.conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Pending Task Review", isPinned: true }),
      }),
      { params: Promise.resolve({ id: chatJson.conversationId }) }
    );
    expect(patchRes.status).toBe(200);
    const patchJson = await patchRes.json();
    expect(patchJson.conversation.title).toBe("Pending Task Review");
    expect(patchJson.conversation.isPinned).toBe(true);

    // User B cannot read or delete User A's conversation
    mockGetServerSession.mockResolvedValue({ user: { id: userBId.toString() } });
    const forbiddenRes = await detailConversationGet(
      new NextRequest(`http://localhost:3000/api/ai/conversations/${chatJson.conversationId}`),
      { params: Promise.resolve({ id: chatJson.conversationId }) }
    );
    expect(forbiddenRes.status).toBe(404);

    // User A deletes conversation & cascades messages
    mockGetServerSession.mockResolvedValue({ user: { id: userAId.toString() } });
    const delRes = await deleteConversationDelete(
      new NextRequest(`http://localhost:3000/api/ai/conversations/${chatJson.conversationId}`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: chatJson.conversationId }) }
    );
    expect(delRes.status).toBe(200);
    expect(await AiMessage.countDocuments({ conversationId: chatJson.conversationId })).toBe(0);

    // Manual POST create conversation works too
    const createConvRes = await createConversationPost(
      new NextRequest("http://localhost:3000/api/ai/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Custom Thread", workspaceId: wsAId.toString() }),
      })
    );
    expect(createConvRes.status).toBe(200);
  });
});
