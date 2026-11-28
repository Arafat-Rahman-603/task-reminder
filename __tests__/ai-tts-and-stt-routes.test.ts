import mongoose from "mongoose";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import PlatformAiConfig from "@/models/PlatformAiConfig";
import { encryptServerSecret } from "@/lib/server-crypto";
import { POST as ttsPost } from "@/app/api/ai/tts/route";
import { GET as sttGet, POST as sttPost } from "@/app/api/ai/stt/route";

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));

describe("AI Neural TTS & STT Routes", () => {
  let userId: mongoose.Types.ObjectId;
  const originalFetch = global.fetch;

  beforeAll(async () => {
    await dbConnect();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
  });

  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), PlatformAiConfig.deleteMany({})]);
    const user = await User.create({
      name: "Voice Route Tester",
      email: "tts-stt@manageo.test",
      passwordHash: "hashed",
    });
    userId = user._id;
    mockGetServerSession.mockResolvedValue({ user: { id: userId.toString() } });
  });

  describe("POST /api/ai/tts", () => {
    it("returns 401 when unauthenticated", async () => {
      mockGetServerSession.mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost:3000/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Hello world" }),
      });
      const res = await ttsPost(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 when text has no speakable content after markdown cleanup", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "https://example.com [6900a1b2c3d4e5f6a7b8c9d0]" }),
      });
      const res = await ttsPost(req);
      expect(res.status).toBe(400);
    });

    it("synthesizes concatenated audio/mpeg chunks cleanly for OpenRouter/default setups (EN & BN)", async () => {
      const capturedUrls: string[] = [];
      global.fetch = jest.fn().mockImplementation(async (url) => {
        capturedUrls.push(String(url));
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => Uint8Array.from([0xff, 0xf3, 0x84, 0xc4]).buffer,
        };
      }) as unknown as typeof fetch;

      const req = new NextRequest("http://localhost:3000/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "**আপনার ২টি টাস্ক বাকি আছে।** প্রথম টাস্ক আজ শেষ করুন [6900a1b2c3d4e5f6a7b8c9d0]",
          lang: "en-US",
          gender: "male",
          tone: "calm",
          speed: "slow",
        }),
      });

      const res = await ttsPost(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("audio/mpeg");
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect(bytes.byteLength).toBeGreaterThanOrEqual(4);
      const usedEngine = res.headers.get("x-tts-engine");
      expect(["edge-neural", "google-fallback"]).toContain(usedEngine);
      if (usedEngine === "google-fallback") {
        expect(capturedUrls[0]).toContain("tl=bn");
        expect(capturedUrls[0]).not.toContain("6900a1b2c3d4e5f6a7b8c9d0");
        expect(capturedUrls[0]).not.toContain("**");
      }
    });

    it("uses OpenAI Neural TTS with gender voice selection when a genuine OpenAI key is configured", async () => {
      await PlatformAiConfig.create({
        key: "default",
        activeProvider: "openai",
        encryptedOpenaiApiKey: encryptServerSecret("sk-proj-test-openai-key"),
      });

      let hitOpenAi = false;
      let sentVoice = "";
      global.fetch = jest.fn().mockImplementation(async (url, init) => {
        if (String(url).includes("api.openai.com/v1/audio/speech")) {
          hitOpenAi = true;
          const body = JSON.parse(String(init?.body || "{}"));
          sentVoice = body.voice;
        }
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => Uint8Array.from([0x49, 0x44, 0x33, 0x03]).buffer,
        };
      }) as unknown as typeof fetch;

      const req = new NextRequest("http://localhost:3000/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "You have two tasks due today.",
          gender: "male",
          tone: "professional",
          speed: "fast",
        }),
      });

      const res = await ttsPost(req);
      expect(res.status).toBe(200);
      expect(hitOpenAi).toBe(true);
      expect(sentVoice).toBe("onyx");
      expect(res.headers.get("content-type")).toBe("audio/mpeg");
    });
  });

  describe("GET & POST /api/ai/stt", () => {
    it("reports available=false when no Groq/OpenAI/Gemini key is configured", async () => {
      const res = await sttGet();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ available: false, provider: null });
    });

    it("transcribes uploaded audio via Groq Whisper when Groq key is configured", async () => {
      await PlatformAiConfig.create({
        key: "default",
        activeProvider: "groq",
        encryptedGroqApiKey: encryptServerSecret("gsk_test_groq_key"),
      });

      const availRes = await sttGet();
      const availData = await availRes.json();
      expect(availData).toEqual({ available: true, provider: "groq" });

      let calledGroqUrl = "";
      global.fetch = jest.fn().mockImplementation(async (url) => {
        calledGroqUrl = String(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ text: "Create a task for tomorrow" }),
        };
      }) as unknown as typeof fetch;

      const form = new FormData();
      form.append("audio", new Blob(["fake-audio"], { type: "audio/webm" }), "voice.webm");
      form.append("lang", "en-US");

      const req = new NextRequest("http://localhost:3000/api/ai/stt", {
        method: "POST",
        body: form,
      });

      const postRes = await sttPost(req);
      expect(postRes.status).toBe(200);
      const postData = await postRes.json();
      expect(calledGroqUrl).toContain("api.groq.com/openai/v1/audio/transcriptions");
      expect(postData.text).toBe("Create a task for tomorrow");
    });
  });
});
