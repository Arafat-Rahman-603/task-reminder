"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Loader2,
  Play,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getPlatformAiConfig,
  updatePlatformAiConfig,
  testAiProviderConnection,
} from "@/actions/mcp.actions";
import type { PlatformAiProviderId } from "@/models/PlatformAiConfig";

interface PlatformConfigState {
  activeProvider: PlatformAiProviderId;
  openrouterModel: string;
  openrouterFallbackModels: string[];
  hasOpenrouterDbKey: boolean;
  hasOpenrouterEnvKey: boolean;
  geminiModel: string;
  geminiFallbackModels: string[];
  hasGeminiDbKey: boolean;
  hasGeminiEnvKey: boolean;
  openaiModel: string;
  hasOpenaiDbKey: boolean;
  hasOpenaiEnvKey: boolean;
  groqModel: string;
  hasGroqDbKey: boolean;
  hasGroqEnvKey: boolean;
  customBaseUrl: string;
  customModel: string;
  hasCustomDbKey: boolean;
}

export default function PlatformAiConfigCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cfg, setCfg] = useState<PlatformConfigState>({
    activeProvider: "openrouter",
    openrouterModel: "nvidia/nemotron-3.5-lightning:free",
    openrouterFallbackModels: [
      "google/gemma-4-26b-a4b-it:free",
      "google/gemma-4-31b-it:free",
      "inclusionai/ling-3.2-flash:free",
      "openrouter/free",
    ],
    hasOpenrouterDbKey: false,
    hasOpenrouterEnvKey: false,
    geminiModel: "gemini-4-argon",
    geminiFallbackModels: ["gemini-4-hydrogen", "gemini-3.5-flash-lite"],
    hasGeminiDbKey: false,
    hasGeminiEnvKey: false,
    openaiModel: "gpt-4o-mini",
    hasOpenaiDbKey: false,
    hasOpenaiEnvKey: false,
    groqModel: "llama-3.3-70b-versatile",
    hasGroqDbKey: false,
    hasGroqEnvKey: false,
    customBaseUrl: "",
    customModel: "",
    hasCustomDbKey: false,
  });

  const [openrouterKey, setOpenrouterKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [fallbackText, setFallbackText] = useState(
    "google/gemma-4-26b-a4b-it:free, google/gemma-4-31b-it:free, inclusionai/ling-3.2-flash:free, openrouter/free"
  );

  useEffect(() => {
    let cancelled = false;
    getPlatformAiConfig()
      .then((res) => {
        if (cancelled) return;
        if ("config" in res && res.config) {
          setCfg(res.config);
          setFallbackText((res.config.openrouterFallbackModels || []).join(", "));
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    setErrorMsg(null);
    const fallbacks = fallbackText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await updatePlatformAiConfig({
      activeProvider: cfg.activeProvider,
      openrouterModel: cfg.openrouterModel,
      openrouterFallbackModels: fallbacks,
      openrouterApiKey: openrouterKey.trim() || undefined,
      geminiModel: cfg.geminiModel,
      geminiFallbackModels: cfg.geminiFallbackModels,
      geminiApiKey: geminiKey.trim() || undefined,
      openaiModel: cfg.openaiModel,
      openaiApiKey: openaiKey.trim() || undefined,
      groqModel: cfg.groqModel,
      groqApiKey: groqKey.trim() || undefined,
      customBaseUrl: cfg.customBaseUrl,
      customModel: cfg.customModel,
      customApiKey: customKey.trim() || undefined,
    });
    setSaving(false);

    if (!res.success) {
      setErrorMsg(res.error || "Failed to update platform AI settings");
      return;
    }

    setOpenrouterKey("");
    setGeminiKey("");
    setOpenaiKey("");
    setGroqKey("");
    setCustomKey("");
    const refreshed = await getPlatformAiConfig();
    if ("config" in refreshed && refreshed.config) {
      setCfg(refreshed.config);
    }
    setStatusMsg("Platform default AI provider updated for all Manageo users.");
    window.dispatchEvent(new CustomEvent("manageo:ai-settings-updated"));
  };

  const handleTest = async () => {
    setTesting(true);
    setStatusMsg(null);
    setErrorMsg(null);
    const res = await testAiProviderConnection();
    setTesting(false);
    if (!res.success) {
      setErrorMsg(res.error || "Connection test failed");
      return;
    }
    setStatusMsg(
      `Connected cleanly to ${res.provider} (${res.model}) in ${res.latencyMs}ms.`
    );
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface-container/60 border border-surface-container-high p-5 text-xs text-on-surface-variant flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading platform AI provider...
      </div>
    );
  }

  return (
    <section className="rounded-2xl bg-surface-container/60 border border-stitch-primary/30 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-stitch-primary/15 text-stitch-primary flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">
              Platform AI Engine (Admin Switch)
            </h4>
            <p className="text-xs text-on-surface-variant">
              Sets the default provider &amp; keys used across Manageo when users have not chosen a custom/local model.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowKeys((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface"
        >
          {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showKeys ? "Hide keys" : "Show keys"}
        </button>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Primary Provider Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface">Active Website AI Provider</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(
            [
              { id: "openrouter", label: "OpenRouter" },
              { id: "gemini", label: "Gemini" },
              { id: "openai", label: "OpenAI" },
              { id: "groq", label: "Groq" },
              { id: "custom", label: "Custom" },
            ] as const
          ).map((p) => {
            const active = cfg.activeProvider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setCfg((prev) => ({ ...prev, activeProvider: p.id }))}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  active
                    ? "border-stitch-primary bg-stitch-primary/15 text-stitch-primary"
                    : "border-surface-container-high bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* OpenRouter Panel */}
      <div className="rounded-xl bg-surface-container-low/70 border border-surface-container-high p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-on-surface">OpenRouter (Recommended)</span>
          <span className="text-[11px] text-on-surface-variant">
            {cfg.hasOpenrouterEnvKey
              ? "Detected in .env"
              : cfg.hasOpenrouterDbKey
              ? "Encrypted key in DB"
              : "No key yet"}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-on-surface-variant">Primary Model</label>
            <input
              type="text"
              value={cfg.openrouterModel}
              onChange={(e) => setCfg((p) => ({ ...p, openrouterModel: e.target.value }))}
              placeholder="openai/gpt-4o-mini"
              className="mt-1 w-full rounded-xl bg-surface-container border border-surface-container-high px-3 py-1.5 text-xs text-on-surface"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-on-surface-variant">
              OpenRouter API Key (optional override of .env)
            </label>
            <input
              type={showKeys ? "text" : "password"}
              value={openrouterKey}
              onChange={(e) => setOpenrouterKey(e.target.value)}
              placeholder={cfg.hasOpenrouterDbKey ? "Saved (enter to replace)" : "sk-or-v1-..."}
              className="mt-1 w-full rounded-xl bg-surface-container border border-surface-container-high px-3 py-1.5 text-xs text-on-surface"
            />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-medium text-on-surface-variant">
            Fallback Models (comma-separated, auto-used on 429/503)
          </label>
          <input
            type="text"
            value={fallbackText}
            onChange={(e) => setFallbackText(e.target.value)}
            className="mt-1 w-full rounded-xl bg-surface-container border border-surface-container-high px-3 py-1.5 text-xs text-on-surface"
          />
        </div>
      </div>

      {/* Gemini & Secondary Providers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl bg-surface-container-low/70 border border-surface-container-high p-3 space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="font-bold text-on-surface">Gemini</span>
            <span className="text-on-surface-variant">
              {cfg.hasGeminiEnvKey ? ".env" : cfg.hasGeminiDbKey ? "DB key" : "Unset"}
            </span>
          </div>
          <input
            type="text"
            value={cfg.geminiModel}
            onChange={(e) => setCfg((p) => ({ ...p, geminiModel: e.target.value }))}
            placeholder="gemini-4-argon"
            className="w-full rounded-lg bg-surface-container border border-surface-container-high px-2.5 py-1.5 text-xs text-on-surface"
          />
          <input
            type={showKeys ? "text" : "password"}
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIza... (optional)"
            className="w-full rounded-lg bg-surface-container border border-surface-container-high px-2.5 py-1.5 text-xs text-on-surface"
          />
        </div>

        <div className="rounded-xl bg-surface-container-low/70 border border-surface-container-high p-3 space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="font-bold text-on-surface">OpenAI</span>
            <span className="text-on-surface-variant">
              {cfg.hasOpenaiEnvKey ? ".env" : cfg.hasOpenaiDbKey ? "DB key" : "Unset"}
            </span>
          </div>
          <input
            type="text"
            value={cfg.openaiModel}
            onChange={(e) => setCfg((p) => ({ ...p, openaiModel: e.target.value }))}
            placeholder="gpt-4o-mini"
            className="w-full rounded-lg bg-surface-container border border-surface-container-high px-2.5 py-1.5 text-xs text-on-surface"
          />
          <input
            type={showKeys ? "text" : "password"}
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="sk-... (optional)"
            className="w-full rounded-lg bg-surface-container border border-surface-container-high px-2.5 py-1.5 text-xs text-on-surface"
          />
        </div>

        <div className="rounded-xl bg-surface-container-low/70 border border-surface-container-high p-3 space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="font-bold text-on-surface">Groq</span>
            <span className="text-on-surface-variant">
              {cfg.hasGroqEnvKey ? ".env" : cfg.hasGroqDbKey ? "DB key" : "Unset"}
            </span>
          </div>
          <input
            type="text"
            value={cfg.groqModel}
            onChange={(e) => setCfg((p) => ({ ...p, groqModel: e.target.value }))}
            placeholder="llama-3.3-70b-versatile"
            className="w-full rounded-lg bg-surface-container border border-surface-container-high px-2.5 py-1.5 text-xs text-on-surface"
          />
          <input
            type={showKeys ? "text" : "password"}
            value={groqKey}
            onChange={(e) => setGroqKey(e.target.value)}
            placeholder="gsk_... (optional)"
            className="w-full rounded-lg bg-surface-container border border-surface-container-high px-2.5 py-1.5 text-xs text-on-surface"
          />
        </div>
      </div>

      {cfg.activeProvider === "custom" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl bg-surface-container-low/70 border border-surface-container-high p-3">
          <input
            type="text"
            value={cfg.customBaseUrl}
            onChange={(e) => setCfg((p) => ({ ...p, customBaseUrl: e.target.value }))}
            placeholder="https://your-endpoint/v1"
            className="rounded-lg bg-surface-container border border-surface-container-high px-2.5 py-1.5 text-xs text-on-surface"
          />
          <input
            type="text"
            value={cfg.customModel}
            onChange={(e) => setCfg((p) => ({ ...p, customModel: e.target.value }))}
            placeholder="Model ID"
            className="rounded-lg bg-surface-container border border-surface-container-high px-2.5 py-1.5 text-xs text-on-surface"
          />
          <input
            type={showKeys ? "text" : "password"}
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            placeholder="Bearer Key (optional)"
            className="rounded-lg bg-surface-container border border-surface-container-high px-2.5 py-1.5 text-xs text-on-surface"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || saving}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-surface-container-high bg-surface-container-low text-xs font-semibold text-on-surface hover:bg-surface-container disabled:opacity-50"
        >
          {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          Test Connection
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stitch-primary text-stitch-on-primary text-xs font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Save Platform Config
        </button>
      </div>
    </section>
  );
}
