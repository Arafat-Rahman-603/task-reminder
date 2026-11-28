"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles,
  Plug,
  KeyRound,
  Copy,
  Check,
  Trash2,
  Power,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Cpu,
  Globe,
  Play,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Square,
  Mic,
} from "lucide-react";
import {
  getAiAndMcpSettings,
  updateAiSettings,
  testAiProviderConnection,
  createMcpApiKey,
  toggleMcpApiKeyStatus,
  updateMcpApiKeyScopes,
  revokeMcpApiKey,
  SafeMcpKeyInfo,
  SafeOAuthClientInfo,
  SafeOAuthSessionInfo,
} from "@/actions/mcp.actions";
import McpConnectionHub from "@/components/settings/McpConnectionHub";
import PlatformAiConfigCard from "@/components/admin/PlatformAiConfigCard";
import type { WorkspaceInfo } from "@/components/WorkspaceSwitcher";
import {
  getSharedVoiceAudioContext,
  selectBestSpeechVoice,
  unlockVoiceAudio,
  VOICE_SPEED_MULTIPLIER,
  type VoiceGender,
  type VoiceSpeed,
  type VoiceTone,
} from "@/lib/ai/voice-utils";

type CustomProviderId =
  | "openrouter"
  | "gemini"
  | "openai"
  | "groq"
  | "ollama"
  | "lmstudio"
  | "custom";

interface AiSettingsState {
  useCustomProvider: boolean;
  customProvider: CustomProviderId;
  customModel: string;
  customBaseUrl: string;
  hasCustomApiKey: boolean;
  permissionMode: "review" | "default_approved" | "turbo";
  voiceAutoSpeak: boolean;
  voiceGender: VoiceGender;
  voiceTone: VoiceTone;
  voiceSpeed: VoiceSpeed;
  voiceLang: "en-US" | "bn-BD";
}

const PROVIDER_DEFAULTS: Record<
  CustomProviderId,
  { label: string; baseUrl: string; defaultModel: string; needsKey: boolean }
> = {
  ollama: {
    label: "Ollama (Local)",
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.1",
    needsKey: false,
  },
  lmstudio: {
    label: "LM Studio (Local)",
    baseUrl: "http://localhost:1234/v1",
    defaultModel: "local-model",
    needsKey: false,
  },
  openrouter: {
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "nvidia/nemotron-3.5-lightning:free",
    needsKey: true,
  },
  gemini: {
    label: "Google Gemini",
    baseUrl: "",
    defaultModel: "gemini-4-argon",
    needsKey: true,
  },
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    needsKey: true,
  },
  groq: {
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    needsKey: true,
  },
  custom: {
    label: "Custom OpenAI-Compatible",
    baseUrl: "http://localhost:8000/v1",
    defaultModel: "custom-model",
    needsKey: false,
  },
};

export default function AiAndMcpSettings({
  activeWorkspace,
}: {
  activeWorkspace?: WorkspaceInfo | null;
}) {
  const [loading, setLoading] = useState(true);
  const [savingAi, setSavingAi] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [platformSummary, setPlatformSummary] = useState<{
    activeProvider: string;
    defaultModel: string;
  }>({ activeProvider: "openrouter", defaultModel: "openai/gpt-4o-mini" });
  const [hasPlatformEnvKey, setHasPlatformEnvKey] = useState(false);

  const [aiSettings, setAiSettings] = useState<AiSettingsState>({
    useCustomProvider: false,
    customProvider: "ollama",
    customModel: "llama3.1",
    customBaseUrl: "http://localhost:11434/v1",
    hasCustomApiKey: false,
    permissionMode: "default_approved",
    voiceAutoSpeak: true,
    voiceGender: "female",
    voiceTone: "friendly",
    voiceSpeed: "normal",
    voiceLang: "en-US",
  });
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState(false);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const previewRunIdRef = useRef(0);

  const [workspaces, setWorkspaces] = useState<
    Array<{ id: string; name: string; type: string; role: string }>
  >([]);
  const [keys, setKeys] = useState<SafeMcpKeyInfo[]>([]);
  const [oauthClients, setOauthClients] = useState<SafeOAuthClientInfo[]>([]);
  const [oauthSessions, setOauthSessions] = useState<SafeOAuthSessionInfo[]>([]);

  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyWorkspaceId, setNewKeyWorkspaceId] = useState(activeWorkspace?._id || "");
  const [newKeyScopes, setNewKeyScopes] = useState({
    read: true,
    write: true,
    delete: false,
    finance: true,
  });
  const [creatingKey, setCreatingKey] = useState(false);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const originUrl =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const applyLoadedData = useCallback(
    (res: Awaited<ReturnType<typeof getAiAndMcpSettings>>) => {
      if ("error" in res && res.error) {
        setErrorMsg(res.error);
        setLoading(false);
        return;
      }
      const ai = (res.aiSettings || {}) as Partial<AiSettingsState>;
      const customProvider = (ai.customProvider as CustomProviderId) || "ollama";
      setAiSettings({
        useCustomProvider: Boolean(ai.useCustomProvider),
        customProvider,
        customModel: ai.customModel || PROVIDER_DEFAULTS[customProvider].defaultModel,
        customBaseUrl: ai.customBaseUrl || PROVIDER_DEFAULTS[customProvider].baseUrl,
        hasCustomApiKey: Boolean(ai.hasCustomApiKey),
        permissionMode: ai.permissionMode || "default_approved",
        voiceAutoSpeak: ai.voiceAutoSpeak !== false,
        voiceGender: ai.voiceGender === "male" ? "male" : "female",
        voiceTone:
          ai.voiceTone === "professional" ||
          ai.voiceTone === "calm" ||
          ai.voiceTone === "energetic"
            ? ai.voiceTone
            : "friendly",
        voiceSpeed:
          ai.voiceSpeed === "slow" || ai.voiceSpeed === "fast"
            ? ai.voiceSpeed
            : "normal",
        voiceLang: ai.voiceLang === "bn-BD" ? "bn-BD" : "en-US",
      });
      setIsPlatformAdmin(Boolean(res.isPlatformAdmin));
      setHasPlatformEnvKey(Boolean(res.hasPlatformEnvKey));
      if (res.platformSummary) setPlatformSummary(res.platformSummary);
      const wsList = res.workspaces || [];
      setWorkspaces(wsList);
      setNewKeyWorkspaceId((prev) => prev || activeWorkspace?._id || wsList[0]?.id || "");
      setKeys(res.keys || []);
      setOauthClients(res.oauthClients || []);
      setOauthSessions(res.oauthSessions || []);
      setLoading(false);
    },
    [activeWorkspace?._id]
  );

  const loadData = useCallback(async () => {
    const res = await getAiAndMcpSettings();
    applyLoadedData(res);
  }, [applyLoadedData]);

  useEffect(() => {
    let cancelled = false;
    getAiAndMcpSettings()
      .then((res) => {
        if (!cancelled) applyLoadedData(res);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyLoadedData]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2000);
    } catch {
      // ignore
    }
  };

  const handleSelectCustomProvider = (prov: CustomProviderId) => {
    const def = PROVIDER_DEFAULTS[prov];
    setAiSettings((prev) => ({
      ...prev,
      customProvider: prov,
      customBaseUrl: def.baseUrl,
      customModel: def.defaultModel,
    }));
  };

  const stopVoicePreview = useCallback(() => {
    previewRunIdRef.current += 1;
    if (previewSourceRef.current) {
      try {
        previewSourceRef.current.onended = null;
        previewSourceRef.current.stop();
        previewSourceRef.current.disconnect();
      } catch {
        // ignore
      }
      previewSourceRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    setPreviewingVoice(false);
  }, []);

  useEffect(() => {
    return () => {
      stopVoicePreview();
    };
  }, [stopVoicePreview]);

  const handlePreviewVoice = async () => {
    if (previewingVoice) {
      stopVoicePreview();
      return;
    }

    stopVoicePreview();
    const runId = previewRunIdRef.current;
    unlockVoiceAudio();
    setPreviewingVoice(true);

    const sampleText =
      aiSettings.voiceLang === "bn-BD"
        ? "হ্যালো! আমি আপনার ম্যানেজিও ভয়েস অ্যাসিস্ট্যান্ট, আপনার কাজ গুছিয়ে দিতে প্রস্তুত।"
        : "Hi there! I am your Manageo voice assistant, ready to help with your workspace.";

    try {
      const res = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sampleText,
          lang: aiSettings.voiceLang,
          gender: aiSettings.voiceGender,
          tone: aiSettings.voiceTone,
          speed: aiSettings.voiceSpeed,
        }),
      });

      if (previewRunIdRef.current !== runId) return;

      if (res.ok) {
        const engineTag = res.headers.get("x-tts-engine") || "";
        const buf = await res.arrayBuffer();
        const ctx = getSharedVoiceAudioContext();
        if (ctx && buf.byteLength > 0 && previewRunIdRef.current === runId) {
          const decoded = await ctx.decodeAudioData(buf.slice(0));
          if (previewRunIdRef.current !== runId) return;
          const src = ctx.createBufferSource();
          src.buffer = decoded;
          if (engineTag === "google-fallback") {
            src.playbackRate.value = VOICE_SPEED_MULTIPLIER[aiSettings.voiceSpeed];
            if (aiSettings.voiceGender === "male" && "detune" in src) {
              src.detune.value = -165;
            }
          }
          src.connect(ctx.destination);
          previewSourceRef.current = src;
          src.onended = () => {
            if (previewSourceRef.current === src) previewSourceRef.current = null;
            if (previewRunIdRef.current === runId) setPreviewingVoice(false);
          };
          src.start(0);
          return;
        }
      }
    } catch {
      // Fallback cleanly to browser SpeechSynthesis below
    }

    if (
      previewRunIdRef.current === runId &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      const voices = window.speechSynthesis.getVoices?.() || [];
      const utter = new SpeechSynthesisUtterance(sampleText);
      const best = selectBestSpeechVoice(voices, aiSettings.voiceLang, aiSettings.voiceGender);
      if (best) {
        utter.voice = best;
        utter.lang = best.lang || aiSettings.voiceLang;
      } else {
        utter.lang = aiSettings.voiceLang;
      }
      utter.rate = VOICE_SPEED_MULTIPLIER[aiSettings.voiceSpeed];
      utter.pitch =
        aiSettings.voiceGender === "male"
          ? 0.88
          : aiSettings.voiceTone === "energetic"
          ? 1.08
          : 1.02;
      utter.onend = () => {
        if (previewRunIdRef.current === runId) setPreviewingVoice(false);
      };
      utter.onerror = () => {
        if (previewRunIdRef.current === runId) setPreviewingVoice(false);
      };
      try {
        window.speechSynthesis.speak(utter);
        return;
      } catch {
        // ignore
      }
    }

    if (previewRunIdRef.current === runId) {
      setPreviewingVoice(false);
    }
  };

  const handleSaveAi = async (clearKey = false) => {
    setSavingAi(true);
    setStatusMsg(null);
    setErrorMsg(null);
    const res = await updateAiSettings({
      useCustomProvider: aiSettings.useCustomProvider,
      customProvider: aiSettings.customProvider,
      customModel: aiSettings.customModel,
      customBaseUrl: aiSettings.customBaseUrl,
      customApiKey: clearKey ? undefined : apiKeyInput.trim() || undefined,
      clearCustomApiKey: clearKey,
      permissionMode: aiSettings.permissionMode,
      voiceAutoSpeak: aiSettings.voiceAutoSpeak,
      voiceGender: aiSettings.voiceGender,
      voiceTone: aiSettings.voiceTone,
      voiceSpeed: aiSettings.voiceSpeed,
      voiceLang: aiSettings.voiceLang,
    });
    setSavingAi(false);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to save AI preferences");
      return;
    }
    await loadData();
    setApiKeyInput("");
    setStatusMsg(clearKey ? "Custom API key cleared." : "AI settings saved.");
    window.dispatchEvent(new CustomEvent("manageo:ai-settings-updated"));
  };

  const handleTestCustomConnection = async () => {
    setTestingConn(true);
    setStatusMsg(null);
    setErrorMsg(null);
    const res = await testAiProviderConnection(
      aiSettings.useCustomProvider
        ? {
            provider: aiSettings.customProvider,
            model: aiSettings.customModel,
            baseUrl: aiSettings.customBaseUrl,
            apiKey: apiKeyInput.trim() || undefined,
          }
        : undefined
    );
    setTestingConn(false);
    if (!res.success) {
      setErrorMsg(res.error || "Connection test failed");
      return;
    }
    setStatusMsg(
      `Connected to ${res.provider} (${res.model}) in ${res.latencyMs}ms.`
    );
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !newKeyWorkspaceId) return;
    setCreatingKey(true);
    setErrorMsg(null);
    setRevealedToken(null);
    const res = await createMcpApiKey({
      name: newKeyName.trim(),
      workspaceId: newKeyWorkspaceId,
      scopes: newKeyScopes,
    });
    setCreatingKey(false);
    if (!res.success || !res.rawToken) {
      setErrorMsg(res.error || "Failed to create MCP API key");
      return;
    }
    setRevealedToken(res.rawToken);
    setNewKeyName("");
    await loadData();
  };

  const handleToggleKey = async (k: SafeMcpKeyInfo) => {
    await toggleMcpApiKeyStatus(k.id, !k.isActive);
    await loadData();
  };

  const handleScopeToggle = async (
    k: SafeMcpKeyInfo,
    scope: keyof SafeMcpKeyInfo["scopes"]
  ) => {
    const nextScopes = { ...k.scopes, [scope]: !k.scopes[scope] };
    await updateMcpApiKeyScopes(k.id, nextScopes);
    await loadData();
  };

  const handleRevokeKey = async (k: SafeMcpKeyInfo) => {
    await revokeMcpApiKey(k.id);
    await loadData();
  };

  const mcpEndpointUrl = `${originUrl}/api/mcp`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-on-surface-variant">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading AI &amp; MCP configuration...</span>
      </div>
    );
  }

  const activeProviderMeta = PROVIDER_DEFAULTS[aiSettings.customProvider];

  return (
    <div className="space-y-8 min-w-0">
      <div className="border-b border-surface-container-high pb-5">
        <div className="flex items-center gap-2 text-stitch-primary text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> AI Engine &amp; MCP Connector
        </div>
        <h3 className="text-xl font-bold text-on-surface mt-1">AI &amp; MCP Connector</h3>
        <p className="text-xs text-on-surface-variant mt-1">
          Manageo powers the built-in AI assistant automatically. Here you can customize permission rules, connect your own or local LLM (Ollama / LM Studio), and manage MCP API keys. Encrypted Vault items stay excluded.
        </p>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Platform Admin Default Provider Switch */}
      {isPlatformAdmin && <PlatformAiConfigCard />}

      {/* User AI Source & Permission Policy */}
      <section className="rounded-2xl bg-surface-container/60 border border-surface-container-high p-5 space-y-6">
        {/* Permission Policy */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface">
            Assistant Permission Policy
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: "review" as const,
                title: "Review",
                desc: "Ask before every create, edit, or delete.",
                icon: ShieldAlert,
              },
              {
                id: "default_approved" as const,
                title: "Default Approved",
                desc: "Auto-run reads & writes; confirm deletes.",
                icon: ShieldCheck,
              },
              {
                id: "turbo" as const,
                title: "Turbo",
                desc: "Execute all allowed actions immediately.",
                icon: Zap,
              },
            ].map((mode) => {
              const Icon = mode.icon;
              const active = aiSettings.permissionMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() =>
                    setAiSettings((prev) => ({ ...prev, permissionMode: mode.id }))
                  }
                  className={`text-left rounded-xl p-3.5 border transition-all ${
                    active
                      ? "border-stitch-primary bg-stitch-primary/10"
                      : "border-surface-container-high bg-surface-container-low/50 hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 ${
                        active ? "text-stitch-primary" : "text-on-surface-variant"
                      }`}
                    />
                    <span className="text-xs font-bold text-on-surface">{mode.title}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">
                    {mode.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model Source Toggle: Manageo Platform AI vs User Custom/Local Model */}
        <div className="space-y-3 border-t border-surface-container-high pt-5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-on-surface">Model Source</label>
            <span className="text-[11px] text-on-surface-variant">
              Platform:{" "}
              <strong className="text-on-surface capitalize">
                {platformSummary.activeProvider}
              </strong>{" "}
              ({hasPlatformEnvKey ? "Ready" : "Key needed by Admin"})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAiSettings((p) => ({ ...p, useCustomProvider: false }))}
              className={`text-left rounded-xl p-4 border transition-all ${
                !aiSettings.useCustomProvider
                  ? "border-stitch-primary bg-stitch-primary/10"
                  : "border-surface-container-high bg-surface-container-low/50 hover:bg-surface-container"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                <Globe className="w-4 h-4 text-stitch-primary" />
                Manageo Default AI (Recommended)
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5">
                Zero setup required. Uses Manageo&apos;s built-in cloud AI with automatic fallback.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setAiSettings((p) => ({ ...p, useCustomProvider: true }))}
              className={`text-left rounded-xl p-4 border transition-all ${
                aiSettings.useCustomProvider
                  ? "border-stitch-primary bg-stitch-primary/10"
                  : "border-surface-container-high bg-surface-container-low/50 hover:bg-surface-container"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                <Cpu className="w-4 h-4 text-stitch-primary" />
                Custom / Local Model (Ollama, OpenRouter, etc.)
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5">
                Bring your own OpenRouter, Gemini, OpenAI, Groq key or run a local model via Ollama / LM Studio.
              </p>
            </button>
          </div>

          {aiSettings.useCustomProvider && (
            <div className="rounded-xl bg-surface-container-low/70 border border-surface-container-high p-4 space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-on-surface-variant">
                    Provider
                  </label>
                  <select
                    value={aiSettings.customProvider}
                    onChange={(e) =>
                      handleSelectCustomProvider(e.target.value as CustomProviderId)
                    }
                    className="mt-1 w-full rounded-xl bg-surface-container border border-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-stitch-primary"
                  >
                    {(Object.keys(PROVIDER_DEFAULTS) as CustomProviderId[]).map((pid) => (
                      <option key={pid} value={pid}>
                        {PROVIDER_DEFAULTS[pid].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-on-surface-variant">
                    Model ID
                  </label>
                  <input
                    type="text"
                    value={aiSettings.customModel}
                    onChange={(e) =>
                      setAiSettings((p) => ({ ...p, customModel: e.target.value }))
                    }
                    placeholder={activeProviderMeta.defaultModel}
                    className="mt-1 w-full rounded-xl bg-surface-container border border-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-stitch-primary"
                  />
                </div>
              </div>

              {aiSettings.customProvider !== "gemini" && (
                <div>
                  <label className="text-[11px] font-semibold text-on-surface-variant">
                    Endpoint Base URL
                  </label>
                  <input
                    type="url"
                    value={aiSettings.customBaseUrl}
                    onChange={(e) =>
                      setAiSettings((p) => ({ ...p, customBaseUrl: e.target.value }))
                    }
                    placeholder={activeProviderMeta.baseUrl || "http://localhost:11434/v1"}
                    className="mt-1 w-full rounded-xl bg-surface-container border border-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-stitch-primary"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-on-surface-variant">
                  API Key{" "}
                  {!activeProviderMeta.needsKey
                    ? "(Optional for local servers)"
                    : aiSettings.hasCustomApiKey
                    ? "(Saved — enter new to replace)"
                    : "(Encrypted AES-256-GCM)"}
                </label>
                <div className="relative mt-1 flex items-center">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={
                      aiSettings.hasCustomApiKey
                        ? "••••••••••••••••••••••••"
                        : activeProviderMeta.needsKey
                        ? "Enter provider API key..."
                        : "Leave blank for local Ollama / LM Studio"
                    }
                    className="w-full rounded-xl bg-surface-container border border-surface-container-high pl-3 pr-9 py-2 text-xs text-on-surface focus:outline-none focus:border-stitch-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    aria-label="Toggle API key visibility"
                    className="absolute right-2.5 text-on-surface-variant hover:text-on-surface"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          {aiSettings.hasCustomApiKey && (
            <button
              type="button"
              onClick={() => handleSaveAi(true)}
              disabled={savingAi}
              className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-500 text-xs font-semibold hover:bg-red-500/10"
            >
              Clear Custom Key
            </button>
          )}
          <button
            type="button"
            onClick={handleTestCustomConnection}
            disabled={testingConn || savingAi}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container disabled:opacity-50"
          >
            {testingConn ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Test Model
          </button>
          <button
            type="button"
            onClick={() => handleSaveAi(false)}
            disabled={savingAi}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold hover:brightness-105 disabled:opacity-50"
          >
            {savingAi && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save AI Settings
          </button>
        </div>
      </section>

      {/* Voice Mode & Speech Persona */}
      <section
        id="voice-settings"
        className="rounded-2xl bg-surface-container/60 border border-surface-container-high p-4 sm:p-5 space-y-5 min-w-0"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-stitch-primary/15 text-stitch-primary flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-on-surface">
                Voice Mode &amp; Speech Persona
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Customize the voice gender, speaking tone, speed, and default language used by Manageo Voice Mode.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handlePreviewVoice()}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-10 rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container shrink-0 transition-colors"
          >
            {previewingVoice ? (
              <Square className="w-3.5 h-3.5 fill-current text-stitch-primary" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-stitch-primary" />
            )}
            <span>{previewingVoice ? "Stop Preview" : "Preview Voice"}</span>
          </button>
        </div>

        {/* Voice Type (Female / Male) */}
        <div className="space-y-2">
          <span className="block text-xs font-bold text-on-surface">Voice Type</span>
          <div
            role="group"
            aria-label="Voice type"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {(
              [
                {
                  id: "female" as const,
                  title: "Female Voice",
                  desc: "Natural warm female vocal persona (Ava / Nabanita / Aoede)",
                },
                {
                  id: "male" as const,
                  title: "Male Voice",
                  desc: "Natural balanced male vocal persona (Andrew / Pradeep / Charon)",
                },
              ] as const
            ).map((opt) => {
              const active = aiSettings.voiceGender === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setAiSettings((prev) => ({ ...prev, voiceGender: opt.id }))
                  }
                  className={`text-left rounded-xl p-3.5 min-h-11 border transition-all ${
                    active
                      ? "border-stitch-primary bg-stitch-primary/10"
                      : "border-surface-container-high bg-surface-container-low/50 hover:bg-surface-container"
                  }`}
                >
                  <div className="text-xs font-bold text-on-surface">{opt.title}</div>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Speaking Tone */}
        <div className="space-y-2">
          <span className="block text-xs font-bold text-on-surface">Speaking Tone</span>
          <div
            role="group"
            aria-label="Speaking tone"
            className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
          >
            {(
              [
                { id: "friendly" as const, label: "Friendly", hint: "Warm & casual" },
                { id: "professional" as const, label: "Professional", hint: "Crisp & direct" },
                { id: "calm" as const, label: "Calm", hint: "Gentle cadence" },
                { id: "energetic" as const, label: "Energetic", hint: "Upbeat & lively" },
              ] as const
            ).map((toneOpt) => {
              const active = aiSettings.voiceTone === toneOpt.id;
              return (
                <button
                  key={toneOpt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setAiSettings((prev) => ({ ...prev, voiceTone: toneOpt.id }))
                  }
                  className={`text-left rounded-xl px-3 py-2.5 min-h-11 border transition-all ${
                    active
                      ? "border-stitch-primary bg-stitch-primary/10"
                      : "border-surface-container-high bg-surface-container-low/50 hover:bg-surface-container"
                  }`}
                >
                  <div className="text-xs font-bold text-on-surface">{toneOpt.label}</div>
                  <div className="text-[11px] text-on-surface-variant mt-0.5">
                    {toneOpt.hint}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Speed & Default Language */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="block text-xs font-bold text-on-surface">Speaking Speed</span>
            <div
              role="group"
              aria-label="Speaking speed"
              className="grid grid-cols-3 gap-2"
            >
              {(
                [
                  { id: "slow" as const, label: "Slow" },
                  { id: "normal" as const, label: "Normal" },
                  { id: "fast" as const, label: "Fast" },
                ] as const
              ).map((sp) => {
                const active = aiSettings.voiceSpeed === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setAiSettings((prev) => ({ ...prev, voiceSpeed: sp.id }))
                    }
                    className={`rounded-xl px-3 py-2 min-h-11 sm:min-h-9 text-xs font-semibold border transition-all ${
                      active
                        ? "border-stitch-primary bg-stitch-primary text-on-primary"
                        : "border-surface-container-high bg-surface-container-low/60 text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {sp.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-bold text-on-surface">
              Default Voice Language
            </span>
            <div
              role="group"
              aria-label="Default voice language"
              className="grid grid-cols-2 gap-2"
            >
              {(
                [
                  { id: "en-US" as const, label: "English (EN)" },
                  { id: "bn-BD" as const, label: "বাংলা (BN)" },
                ] as const
              ).map((langOpt) => {
                const active = aiSettings.voiceLang === langOpt.id;
                return (
                  <button
                    key={langOpt.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setAiSettings((prev) => ({ ...prev, voiceLang: langOpt.id }))
                    }
                    className={`rounded-xl px-3 py-2 min-h-11 sm:min-h-9 text-xs font-semibold border transition-all ${
                      active
                        ? "border-stitch-primary bg-stitch-primary text-on-primary"
                        : "border-surface-container-high bg-surface-container-low/60 text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {langOpt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Auto-Speak Toggle & Save */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-container-high pt-4">
          <label className="inline-flex items-center gap-2.5 min-h-11 text-xs text-on-surface cursor-pointer select-none">
            <input
              type="checkbox"
              checked={aiSettings.voiceAutoSpeak}
              onChange={(e) =>
                setAiSettings((prev) => ({ ...prev, voiceAutoSpeak: e.target.checked }))
              }
              className="w-4 h-4 rounded border-surface-container-high accent-stitch-primary"
            />
            <span>Automatically speak AI replies aloud in Voice Mode</span>
          </label>

          <button
            type="button"
            onClick={() => handleSaveAi(false)}
            disabled={savingAi}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-10 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold hover:brightness-105 disabled:opacity-50 shrink-0"
          >
            {savingAi && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Voice Settings
          </button>
        </div>
      </section>

      {/* MCP API Keys */}
      <section className="rounded-2xl bg-surface-container/60 border border-surface-container-high p-5 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-stitch-primary/15 text-stitch-primary flex items-center justify-center">
            <Plug className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">MCP Connector &amp; API Keys</h4>
            <p className="text-xs text-on-surface-variant">
              Endpoint: <code className="text-stitch-primary">{mcpEndpointUrl}</code>
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreateKey}
          className="rounded-xl bg-surface-container-low/70 border border-surface-container-high p-4 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant">
                Client / Label Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Claude Desktop, Cursor, OpenClaw"
                required
                className="mt-1 w-full rounded-xl bg-surface-container border border-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-stitch-primary"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant">
                Default Workspace Scope
              </label>
              <select
                value={newKeyWorkspaceId}
                onChange={(e) => setNewKeyWorkspaceId(e.target.value)}
                className="mt-1 w-full rounded-xl bg-surface-container border border-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-stitch-primary"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} ({ws.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface">
              {(["read", "write", "delete", "finance"] as const).map((sc) => (
                <label key={sc} className="flex items-center gap-1.5 cursor-pointer capitalize">
                  <input
                    type="checkbox"
                    checked={newKeyScopes[sc]}
                    onChange={(e) =>
                      setNewKeyScopes((prev) => ({ ...prev, [sc]: e.target.checked }))
                    }
                    className="rounded accent-stitch-primary"
                  />
                  <span>{sc}</span>
                </label>
              ))}
            </div>
            <button
              type="submit"
              disabled={creatingKey || !newKeyName.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold hover:brightness-105 disabled:opacity-50"
            >
              {creatingKey ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Generate MCP Key
            </button>
          </div>
        </form>

        {revealedToken && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> Copy your MCP API key now — it will not be shown again:
              </span>
              <button
                type="button"
                onClick={() => handleCopy(revealedToken, "revealed")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-on-surface text-[11px] font-semibold border border-surface-container-high"
              >
                {copiedId === "revealed" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy Key
                  </>
                )}
              </button>
            </div>
            <code className="block w-full overflow-x-auto rounded-lg bg-surface-container-low px-3 py-2 text-xs text-on-surface select-all">
              {revealedToken}
            </code>
          </div>
        )}

        <div className="space-y-2.5">
          {keys.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-4">
              No MCP API keys yet. Generate one above to connect Claude Desktop, Cursor, or any MCP client.
            </p>
          ) : (
            keys.map((k) => (
              <div
                key={k.id}
                className="rounded-xl bg-surface-container-low/60 border border-surface-container-high p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-on-surface">{k.name}</span>
                    <code className="text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                      {k.keyPrefix}
                    </code>
                    <span className="text-[11px] text-on-surface-variant">
                      Workspace: {k.workspaceName}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        k.isActive
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-500/15 text-red-500"
                      }`}
                    >
                      {k.isActive ? "Active" : "Paused"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-on-surface-variant">
                    <span>Scopes:</span>
                    {(["read", "write", "delete", "finance"] as const).map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => handleScopeToggle(k, sc)}
                        className={`px-2 py-0.5 rounded-md border text-[10px] font-medium capitalize transition-colors ${
                          k.scopes[sc]
                            ? "border-stitch-primary/40 bg-stitch-primary/10 text-stitch-primary"
                            : "border-surface-container-high bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {sc}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleKey(k)}
                    title={k.isActive ? "Pause key" : "Resume key"}
                    className="p-2 rounded-lg border border-surface-container-high hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevokeKey(k)}
                    title="Revoke key"
                    className="p-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Interactive MCP Connection Hub (OAuth 2.1 + Platform Setup Guides) */}
      <McpConnectionHub
        originUrl={originUrl}
        oauthClients={oauthClients}
        oauthSessions={oauthSessions}
        revealedToken={revealedToken}
        onRefresh={loadData}
      />
    </div>
  );
}
