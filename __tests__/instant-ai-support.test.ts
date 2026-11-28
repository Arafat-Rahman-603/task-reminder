import mongoose from "mongoose";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import SupportTicket from "@/models/SupportTicket";
import { POST as supportPost } from "@/app/api/ai/support/route";

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

const mockGetActiveWorkspaceInfo = jest.fn();
jest.mock("@/actions/workspace.actions", () => ({
  getActiveWorkspaceInfo: () => mockGetActiveWorkspaceInfo(),
}));

const mockResolveEffectiveAiTargets = jest.fn();
const mockGenerateAgentTurn = jest.fn();
jest.mock("@/lib/ai/llm-providers", () => {
  const actual = jest.requireActual("@/lib/ai/llm-providers");
  return {
    ...actual,
    resolveEffectiveAiTargets: (...args: unknown[]) =>
      mockResolveEffectiveAiTargets(...args),
    generateAgentTurn: (...args: unknown[]) => mockGenerateAgentTurn(...args),
  };
});

describe("Instant AI Support Endpoint (/api/ai/support)", () => {
  let userId: mongoose.Types.ObjectId;
  let workspaceId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await dbConnect();
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();

    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      WorkspaceMembership.deleteMany({}),
      SupportTicket.deleteMany({}),
    ]);

    const user = await User.create({
      name: "Support Tester",
      email: "support-tester@manageo.test",
      passwordHash: "hashed",
      preferences: {
        modules: new Map([
          ["tasks", true],
          ["routines", false],
        ]),
      },
      subscription: { plan: "free", status: "active" },
    });
    userId = user._id;

    const ws = await Workspace.create({
      name: "Acme Team",
      type: "team",
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
      user: { id: userId.toString(), email: user.email, name: user.name },
    });

    mockGetActiveWorkspaceInfo.mockResolvedValue({
      activeWorkspace: {
        _id: workspaceId.toString(),
        name: "Acme Team",
        type: "team",
        role: "owner",
      },
    });
  });

  it("rejects unauthenticated requests with 401 and invalid payloads with 400", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const unauthRes = await supportPost(
      new NextRequest("http://localhost:3000/api/ai/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Help" }] }),
      })
    );
    expect(unauthRes.status).toBe(401);

    const badRes = await supportPost(
      new NextRequest("http://localhost:3000/api/ai/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      })
    );
    expect(badRes.status).toBe(400);
  });

  it("deflects solvable questions via LLM with enableTools=false and detects escalation tags cleanly", async () => {
    mockResolveEffectiveAiTargets.mockResolvedValue({
      candidates: [
        {
          provider: "openrouter",
          model: "test-model",
          apiKey: "sk-test",
          baseUrl: "https://openrouter.ai/api/v1",
          source: "platform",
        },
      ],
      permissionMode: "default_approved",
      voiceAutoSpeak: true,
      userName: "Support Tester",
      isUsingCustomUserProvider: false,
    });

    mockGenerateAgentTurn
      .mockResolvedValueOnce({
        text: "Go to **Settings -> AI & MCP Connector** to copy your MCP URL and create a User-Defined OAuth Client for ChatGPT.",
        toolCalls: [],
        providerUsed: "openrouter",
        modelUsed: "test-model",
      })
      .mockResolvedValueOnce({
        text: "I have prepared a priority billing ticket draft for our team to review your payment.\n[ESCALATE: category=billing | priority=high | subject=Plan upgrade payment issue]",
        toolCalls: [],
        providerUsed: "openrouter",
        modelUsed: "test-model",
      });

    // 1. Solvable MCP question -> no escalation
    const res1 = await supportPost(
      new NextRequest("http://localhost:3000/api/ai/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "How do I connect ChatGPT MCP?" }],
        }),
      })
    );
    expect(res1.status).toBe(200);
    const json1 = await res1.json();
    expect(json1.source).toBe("ai");
    expect(json1.suggestTicket).toBe(false);
    expect(json1.reply).toContain("Settings -> AI & MCP Connector");
    expect(
      json1.quickLinks.some((q: { href: string }) => q.href.includes("tab=ai-mcp"))
    ).toBe(true);
    expect(mockGenerateAgentTurn).toHaveBeenCalledWith(
      expect.any(Array),
      expect.stringContaining("Disabled modules in user preferences: routines"),
      expect.any(Array),
      { enableTools: false }
    );

    // 2. Billing escalation -> strips [ESCALATE: ...] tag and builds structured draft
    const res2 = await supportPost(
      new NextRequest("http://localhost:3000/api/ai/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: "My Pro plan payment was charged twice." },
          ],
        }),
      })
    );
    expect(res2.status).toBe(200);
    const json2 = await res2.json();
    expect(json2.source).toBe("ai");
    expect(json2.suggestTicket).toBe(true);
    expect(json2.reply).not.toContain("[ESCALATE:");
    expect(json2.ticketDraft.category).toBe("billing");
    expect(json2.ticketDraft.priority).toBe("high");
    expect(json2.ticketDraft.subject).toBe("Plan upgrade payment issue");
  });

  it("falls back to Manageo diagnostic knowledge base when LLM providers fail", async () => {
    mockResolveEffectiveAiTargets.mockRejectedValue(
      new Error("AI provider unavailable")
    );

    const res = await supportPost(
      new NextRequest("http://localhost:3000/api/ai/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: "Money module sidebar a dekhay na keno?",
            },
          ],
        }),
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.source).toBe("fallback");
    expect(json.reply).toContain("Team Workspace (Acme Team)");
    expect(json.reply).toContain("routines");
    expect(
      json.quickLinks.some((q: { href: string }) => q.href.includes("tab=personalization"))
    ).toBe(true);
  });

  it("identifies Arafat Rahman as founder and includes his portrait without Bengali bleed or unwanted ticket", async () => {
    mockResolveEffectiveAiTargets.mockRejectedValue(
      new Error("AI provider unavailable")
    );

    const res = await supportPost(
      new NextRequest("http://localhost:3000/api/ai/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Who made Manageo? Show Arafat Rahman photo" }],
        }),
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.reply).toContain("Arafat Rahman");
    expect(json.reply).toContain("/api/founder-avatar");
    expect(json.reply).not.toMatch(/[\u0980-\u09FF]/);
    expect(json.suggestTicket).toBe(false);
    expect(
      json.quickLinks.some((q: { href: string }) => q.href === "/about")
    ).toBe(true);
  });
});
