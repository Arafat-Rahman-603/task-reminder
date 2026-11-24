"use client";

import { useState, useEffect, useCallback } from "react";
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
  Terminal,
  Plus,
} from "lucide-react";
import {
  getAiAndMcpSettings,
  updateAiSettings,
  createMcpApiKey,
  toggleMcpApiKeyStatus,
  updateMcpApiKeyScopes,
  revokeMcpApiKey,
  SafeMcpKeyInfo,
} from "@/actions/mcp.actions";
import type { WorkspaceInfo } from "@/components/WorkspaceSwitcher";

interface AiSettingsState {
  hasCustomApiKey: boolean;
  preferredModel: "gemini-4-hydrogen" | "gemini-4-argon" | "gemini-3.5-flash-lite";
  permissionMode: "review" | "default_approved" | "turbo";
  voiceAutoSpeak: boolean;
}

export default function AiAndMcpSettings({
  activeWorkspace,
}: {
  activeWorkspace?: WorkspaceInfo | null;
}) {
  const [loading, setLoading] = useState(true);
  const [savingAi, setSavingAi] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [aiSettings, setAiSettings] = useState<AiSettingsState>({
    hasCustomApiKey: false,
    preferredModel: "gemini-4-hydrogen",
    permissionMode: "default_approved",
    voiceAutoSpeak: true,
  });
  const [hasServerEnvKey, setHasServerEnvKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);

  const [workspaces, setWorkspaces] = useState<
    Array<{ id: string; name: string; type: string; role: string }>
  >([]);
  const [keys, setKeys] = useState<SafeMcpKeyInfo[]>([]);

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
      setAiSettings({
        hasCustomApiKey: Boolean(ai.hasCustomApiKey),
        preferredModel: ai.preferredModel || "gemini-4-hydrogen",
        permissionMode: ai.permissionMode || "default_approved",
        voiceAutoSpeak: ai.voiceAutoSpeak !== false,
      });
      setHasServerEnvKey(Boolean(res.hasServerEnvKey));
      const wsList = res.workspaces || [];
      setWorkspaces(wsList);
      setNewKeyWorkspaceId((prev) => prev || activeWorkspace?._id || wsList[0]?.id || "");
      setKeys(res.keys || []);
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
      // ignore clipboard denial
    }
  };

  const handleSaveAi = async (clearKey = false) => {
    setSavingAi(true);
    setStatusMsg(null);
    setErrorMsg(null);
    const res = await updateAiSettings({
      geminiApiKey: clearKey ? undefined : apiKeyInput.trim() || undefined,
      clearGeminiApiKey: clearKey,
      preferredModel: aiSettings.preferredModel,
      permissionMode: aiSettings.permissionMode,
      voiceAutoSpeak: aiSettings.voiceAutoSpeak,
    });
    setSavingAi(false);
    if (!res.success) {
      setErrorMsg(res.error || "Failed to save AI settings");
      return;
    }
    if (res.aiSettings) {
      const updated = res.aiSettings as Partial<AiSettingsState>;
      setAiSettings({
        hasCustomApiKey: Boolean(updated.hasCustomApiKey),
        preferredModel: updated.preferredModel || "gemini-4-hydrogen",
        permissionMode: updated.permissionMode || "default_approved",
        voiceAutoSpeak: updated.voiceAutoSpeak !== false,
      });
    }
    setApiKeyInput("");
    setStatusMsg(clearKey ? "Custom Gemini API key cleared." : "AI Assistant preferences saved.");
    window.dispatchEvent(new CustomEvent("manageo:ai-settings-updated"));
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
  const tokenPlaceholder = revealedToken || "<YOUR_MANAGEO_MCP_API_KEY>";

  const claudeDesktopJson = JSON.stringify(
    {
      mcpServers: {
        manageo: {
          command: "npx",
          args: [
            "-y",
            "mcp-remote",
            mcpEndpointUrl,
            "--header",
            `Authorization: Bearer ${tokenPlaceholder}`,
          ],
        },
      },
    },
    null,
    2
  );

  const streamableHttpJson = JSON.stringify(
    {
      mcpServers: {
        manageo: {
          url: mcpEndpointUrl,
          headers: {
            Authorization: `Bearer ${tokenPlaceholder}`,
          },
        },
      },
    },
    null,
    2
  );

  const claudeCodeCli = `claude mcp add --transport http manageo "${mcpEndpointUrl}" --header "Authorization: Bearer ${tokenPlaceholder}"`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-on-surface-variant">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading AI &amp; MCP configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-high pb-5">
        <div>
          <div className="flex items-center gap-2 text-stitch-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> AI Assistant &amp; External Agent Connector
          </div>
          <h3 className="text-xl font-bold text-on-surface mt-1">AI &amp; MCP Connector</h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Configure your Gemini AI Assistant modes and connect external agents (Claude Desktop, Cursor, Claude Code) via Manageo&apos;s Streamable HTTP MCP server. Encrypted Vault secrets stay excluded.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-600 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Section 1: AI Assistant Settings */}
      <section className="rounded-2xl bg-surface-container/60 border border-surface-container-high p-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stitch-primary/15 text-stitch-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-on-surface">Manageo AI Assistant</h4>
              <p className="text-xs text-on-surface-variant">
                Text &amp; Live Voice assistant accessible via the floating launcher or Ctrl + J.
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              aiSettings.hasCustomApiKey || hasServerEnvKey
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            }`}
          >
            {aiSettings.hasCustomApiKey
              ? "Encrypted Personal Key Active"
              : hasServerEnvKey
              ? "Server Key Active"
              : "Gemini Key Required"}
          </span>
        </div>

        {/* Permission Modes */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-on-surface">Default Permission Policy</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: "review" as const,
                title: "Review",
                desc: "Ask before every create, edit, or delete action.",
                icon: ShieldAlert,
              },
              {
                id: "default_approved" as const,
                title: "Default Approved",
                desc: "Auto-approve reads & writes; ask confirmation before deletes.",
                icon: ShieldCheck,
              },
              {
                id: "turbo" as const,
                title: "Turbo",
                desc: "Execute reads, writes, and soft-deletes immediately without prompts.",
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
                      ? "border-stitch-primary bg-stitch-primary/10 shadow-sm"
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

        {/* Model & API Key */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface">Preferred Gemini Model</label>
            <select
              value={aiSettings.preferredModel}
              onChange={(e) =>
                setAiSettings((prev) => ({
                  ...prev,
                  preferredModel: e.target.value as AiSettingsState["preferredModel"],
                }))
              }
              className="w-full rounded-xl bg-surface-container-low border border-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-stitch-primary"
            >
              <option value="gemini-4-hydrogen">Gemini 4 Hydrogen (Recommended Flash)</option>
              <option value="gemini-4-argon">Gemini 4 Argon (Fastest &amp; Efficient)</option>
              <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface">
              Gemini API Key {aiSettings.hasCustomApiKey ? "(Saved — enter new to replace)" : ""}
            </label>
            <div className="relative flex items-center">
              <input
                type={showKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={
                  aiSettings.hasCustomApiKey
                    ? "••••••••••••••••••••••••"
                    : "AIza... (encrypted with AES-256-GCM)"
                }
                className="w-full rounded-xl bg-surface-container-low border border-surface-container-high pl-3 pr-9 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-stitch-primary"
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer">
            <input
              type="checkbox"
              checked={aiSettings.voiceAutoSpeak}
              onChange={(e) =>
                setAiSettings((prev) => ({ ...prev, voiceAutoSpeak: e.target.checked }))
              }
              className="rounded border-surface-container-high accent-stitch-primary"
            />
            Speak replies aloud in Voice mode
          </label>

          <div className="flex items-center gap-2">
            {aiSettings.hasCustomApiKey && (
              <button
                type="button"
                onClick={() => handleSaveAi(true)}
                disabled={savingAi}
                className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-500 text-xs font-semibold hover:bg-red-500/10 transition-colors"
              >
                Clear Key
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSaveAi(false)}
              disabled={savingAi}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stitch-primary text-stitch-on-primary text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {savingAi && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save AI Settings
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: MCP API Keys */}
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

        {/* Create New Key Form */}
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stitch-primary text-stitch-on-primary text-xs font-semibold hover:opacity-90 disabled:opacity-50"
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

        {/* One-time reveal banner */}
        {revealedToken && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
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

        {/* Active Key List */}
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
                    {k.lastUsedAt && (
                      <span className="ml-2">
                        Last used: {new Date(k.lastUsedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleKey(k)}
                    title={k.isActive ? "Pause key" : "Resume key"}
                    className="p-2 rounded-lg border border-surface-container-high hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevokeKey(k)}
                    title="Revoke key"
                    className="p-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Section 3: Client Connection Snippets */}
      <section className="rounded-2xl bg-surface-container/60 border border-surface-container-high p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
          <Terminal className="w-4 h-4 text-stitch-primary" />
          Quick Connect Snippets
        </div>

        <div className="space-y-3">
          {[
            {
              id: "claude-cli",
              title: "Claude Code CLI (Streamable HTTP)",
              code: claudeCodeCli,
            },
            {
              id: "http-json",
              title: "Cursor / Antigravity / Windsurf (mcpServers JSON)",
              code: streamableHttpJson,
            },
            {
              id: "claude-desktop",
              title: "Claude Desktop (via mcp-remote stdio bridge)",
              code: claudeDesktopJson,
            },
          ].map((snippet) => (
            <div
              key={snippet.id}
              className="rounded-xl bg-surface-container-low border border-surface-container-high overflow-hidden"
            >
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-surface-container-high">
                <span className="text-[11px] font-semibold text-on-surface">{snippet.title}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(snippet.code, snippet.id)}
                  className="inline-flex items-center gap-1 text-[11px] text-stitch-primary hover:underline"
                >
                  {copiedId === snippet.id ? (
                    <>
                      <Check className="w-3 h-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 text-[11px] text-on-surface-variant overflow-x-auto leading-relaxed">
                <code>{snippet.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
