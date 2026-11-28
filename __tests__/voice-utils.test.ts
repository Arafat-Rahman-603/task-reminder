import {
  detectSpeechLang,
  getSharedVoiceAudioContext,
  getVoiceToneInstruction,
  mergeStreamingTranscript,
  selectBestSpeechVoice,
  splitTextForSpeech,
  stripMarkdownForSpeech,
  unlockVoiceAudio,
  VOICE_SPEED_MULTIPLIER,
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

  it("prefers neural/natural voices matching selected male or female gender", () => {
    const mockVoices = [
      { name: "Microsoft David Desktop", lang: "en-US" },
      { name: "Microsoft Andrew Online (Natural) - English (United States)", lang: "en-US" },
      { name: "Microsoft Aria Online (Natural) - English (United States)", lang: "en-US" },
      { name: "Microsoft Pradeep Online (Natural) - Bengali (Bangladesh)", lang: "bn-BD" },
      { name: "Microsoft Nabanita Online (Natural) - Bengali (Bangladesh)", lang: "bn-BD" },
    ] as unknown as SpeechSynthesisVoice[];

    expect(selectBestSpeechVoice(mockVoices, "en-US", "female")?.name).toContain("Aria");
    expect(selectBestSpeechVoice(mockVoices, "en-US", "male")?.name).toContain("Andrew");
    expect(selectBestSpeechVoice(mockVoices, "bn-BD", "female")?.name).toContain("Nabanita");
    expect(selectBestSpeechVoice(mockVoices, "bn-BD", "male")?.name).toContain("Pradeep");

    const onlyFrench = [{ name: "Thomas", lang: "fr-FR" }] as unknown as SpeechSynthesisVoice[];
    expect(selectBestSpeechVoice(onlyFrench, "en-US", "female")).toBeUndefined();
  });

  it("exposes clear tone instructions and speed multipliers", () => {
    expect(getVoiceToneInstruction("professional")).toContain("formal");
    expect(getVoiceToneInstruction("calm")).toContain("calm");
    expect(getVoiceToneInstruction("energetic")).toContain("energetic");
    expect(VOICE_SPEED_MULTIPLIER.slow).toBeLessThan(VOICE_SPEED_MULTIPLIER.normal);
    expect(VOICE_SPEED_MULTIPLIER.fast).toBeGreaterThan(VOICE_SPEED_MULTIPLIER.normal);
  });

  it("merges streaming Gemini Live transcript fragments smoothly without duplicating prefixes", () => {
    let acc = "";
    acc = mergeStreamingTranscript(acc, "Hello");
    acc = mergeStreamingTranscript(acc, "there");
    acc = mergeStreamingTranscript(acc, "!");
    expect(acc).toBe("Hello there!");

    // Cumulative chunk replaces smoothly
    expect(mergeStreamingTranscript("Hello", "Hello world")).toBe("Hello world");
    // Punctuation attaches cleanly
    expect(mergeStreamingTranscript("Task created", ".")).toBe("Task created.");
  });

  it("handles unlockVoiceAudio and getSharedVoiceAudioContext safely in SSR/node", () => {
    expect(() => unlockVoiceAudio()).not.toThrow();
    expect(getSharedVoiceAudioContext()).toBeNull();
  });
});
