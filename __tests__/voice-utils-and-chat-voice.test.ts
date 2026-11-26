import mongoose from "mongoose";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import PlatformAiConfig from "@/models/PlatformAiConfig";
import Task from "@/models/Task";
import AiConversation from "@/models/AiConversation";
import AiMessage from "@/models/AiMessage";
import { encryptServerSecret } from "@/lib/server-crypto";
import {
  stripMarkdownForSpeech,
  detectSpeechLang,
  splitTextForSpeech,
} from "@/lib/ai/voice-utils";
import { POST as chatPost } from "@/app/api/ai/chat/route";

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

const mockActiveWsInfo = jest.fn();
jest.mock("@/actions/workspace.actions", () => ({
  getActiveWorkspaceInfo: () => mockActiveWsInfo(),
}));

describe("Voice Mode Utilities & Voice Chat Agent Flow", () => {
  let userId: mongoose.Types.ObjectId;
  let workspaceId: mongoose.Types.ObjectId;
  const originalFetch = global.fetch;

  beforeAll(async () => {
    await dbConnect();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      WorkspaceMembership.deleteMany({}),
      PlatformAiConfig.deleteMany({}),
      Task.deleteMany({}),
      AiConversation.deleteMany({}),
      AiMessage.deleteMany({}),
    ]);

    const user = await User.create({
      name: "Voice Tester",
      email: "voice@manageo.test",
      passwordHash: "hashed",
    });
    userId = user._id;

    const ws = await Workspace.create({
      name: "Voice Workspace",
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

    await PlatformAiConfig.create({
      key: "default",
      activeProvider: "openrouter",
      openrouterModel: "nvidia/nemotron-3.5-lightning:free",
      encryptedOpenrouterApiKey: encryptServerSecret("sk-or-v1-voice-test"),
    });

    mockGetServerSession.mockResolvedValue({ user: { id: userId.toString() } });
    mockActiveWsInfo.mockResolvedValue({
      activeWorkspace: { _id: workspaceId.toString(), name: "Voice Workspace", type: "personal" },
      workspaces: [],
    });
  });

  it("strips markdown, URLs, and Mongo IDs cleanly for natural TTS output", () => {
    const raw =
      "## Done\nCreated task **Call Client** [6900a1b2c3d4e5f6a7b8c9d0] for `tomorrow`. Visit https://example.com";
    const cleaned = stripMarkdownForSpeech(raw);
    expect(cleaned).not.toContain("##");
    expect(cleaned).not.toContain("**");
    expect(cleaned).not.toContain("6900a1b2c3d4e5f6a7b8c9d0");
    expect(cleaned).not.toContain("https://example.com");
    expect(cleaned).toContain("Created task Call Client");
  });

  it("detects Bengali vs English speech language accurately", () => {
    expect(detectSpeechLang("আপনার দুটি কাজ বাকি আছে।", "en-US")).toBe("bn-BD");
    expect(detectSpeechLang("You have two pending tasks.", "en-US")).toBe("en-US");
  });

  it("splits long speech replies along sentence boundaries within max length", () => {
    const text =
      "First sentence is clear. Second sentence is also quite reasonable in length! Third sentence finishes cleanly. Fourth sentence adds extra detail for chunking verification.";
    const chunks = splitTextForSpeech(text, 65);
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    chunks.forEach((c) => expect(c.length).toBeLessThanOrEqual(65));
  });

  it("injects VOICE MODE ACTIVE prompt instruction when chat route receives voiceMode: true", async () => {
    let capturedSystemPrompt = "";
    global.fetch = jest.fn().mockImplementation(async (_url, init) => {
      const body = JSON.parse(String(init?.body || "{}"));
      capturedSystemPrompt = body?.messages?.[0]?.content || "";
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: "I created a high-priority task to review the budget tomorrow.",
                tool_calls: [],
              },
            },
          ],
        }),
      };
    }) as unknown as typeof fetch;

    const req = new NextRequest("http://localhost:3000/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Remind me to review the budget tomorrow",
        workspaceId: workspaceId.toString(),
        voiceMode: true,
      }),
    });

    const res = await chatPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("completed");
    expect(json.reply).toContain("review the budget");
    expect(capturedSystemPrompt).toContain("VOICE MODE ACTIVE");
  });
});
