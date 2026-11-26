import {
  detectSpeechLang,
  splitTextForSpeech,
  stripMarkdownForSpeech,
} from "@/lib/ai/voice-utils";

describe("Voice & Text-to-Speech Utilities", () => {
  it("strips markdown symbols, code blocks, URLs, and MongoDB ObjectIDs cleanly", () => {
    const raw = [
      "### Pending Tasks",
      "- [6acb027ad25f5d0d8e90030e] **Finish report** — check [docs](https://manageo.app/docs)",
      "Use `npm run dev` at https://example.com/path.",
      "```ts\nconst x = 1;\n```",
    ].join("\n");

    const spoken = stripMarkdownForSpeech(raw);
    expect(spoken).not.toContain("6acb027ad25f5d0d8e90030e");
    expect(spoken).not.toContain("https://");
    expect(spoken).not.toContain("**");
    expect(spoken).not.toContain("###");
    expect(spoken).toContain("Pending Tasks");
    expect(spoken).toContain("Finish report");
    expect(spoken).toContain("check docs");
    expect(spoken).toContain("code snippet");
  });

  it("detects Bengali vs English speech language accurately", () => {
    expect(detectSpeechLang("আপনার ৩টি টাস্ক বাকি আছে।", "en-US")).toBe("bn-BD");
    expect(detectSpeechLang("You have 3 pending tasks.", "bn-BD")).toBe("en-US");
    expect(detectSpeechLang("", "bn-BD")).toBe("bn-BD");
  });

  it("splits long responses into bounded sentence chunks without losing content", () => {
    const text =
      "First task is due tomorrow morning. Second task is reviewing the billing report with the team in Dhaka. Third task is updating all server environment secrets cleanly before deployment.";
    const chunks = splitTextForSpeech(text, 85);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    chunks.forEach((c) => expect(c.length).toBeLessThanOrEqual(85));
    expect(chunks.join(" ")).toContain("First task");
    expect(chunks.join(" ")).toContain("before deployment.");
  });
});
