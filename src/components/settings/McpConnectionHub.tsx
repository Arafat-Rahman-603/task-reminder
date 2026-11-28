"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
  Loader2,
  Plus,
  ShieldCheck,
  Terminal,
  Trash2,
  Unplug,
  AlertTriangle,
} from "lucide-react";
import {
  createUserOAuthClient,
  deleteUserOAuthClient,
  revokeUserOAuthSession,
  type SafeOAuthClientInfo,
  type SafeOAuthSessionInfo,
} from "@/actions/mcp.actions";

type PlatformTabId = "chatgpt" | "claude" | "cursor" | "cli";

const PLATFORM_TABS: ReadonlyArray<{ id: PlatformTabId; label: string }> = [
  { id: "chatgpt", label: "ChatGPT" },
  { id: "claude", label: "Claude Web & Desktop" },
  { id: "cursor", label: "Cursor / Windsurf" },
  { id: "cli", label: "CLI / Custom HTTP" },
];

interface McpConnectionHubProps {
  originUrl: string;
  oauthClients: SafeOAuthClientInfo[];
  oauthSessions: SafeOAuthSessionInfo[];
  revealedToken: string | null;
  onRefresh: () => Promise<void>;
}

export default function McpConnectionHub({
  originUrl,
  oauthClients,
  oauthSessions,
  revealedToken,
  onRefresh,
}: McpConnectionHubProps) {
  const uid = useId();
  const [selectedTab, setSelectedTab] = useState<PlatformTabId>("chatgpt");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const tabRefs = useRef<Record<PlatformTabId, HTMLButtonElement | null>>({
    chatgpt: null,
    claude: null,
    cursor: null,
    cli: null,
  });
  const panelRefs = useRef<Record<PlatformTabId, HTMLDivElement | null>>({
    chatgpt: null,
    claude: null,
    cursor: null,
    cli: null,
  });

  // Sync tab state if browser Find-in-Page opens a hidden="until-found" panel
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    for (const tab of PLATFORM_TABS) {
      const el = panelRefs.current[tab.id];
      if (!el) continue;
      const onBeforeMatch = () => setSelectedTab(tab.id);
      el.addEventListener("beforematch", onBeforeMatch);
      cleanups.push(() => el.removeEventListener("beforematch", onBeforeMatch));
    }
    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  const [clientName, setClientName] = useState("");
  const [redirectUrisText, setRedirectUrisText] = useState(
    "https://chatgpt.com/connector_platform_oauth_redirect"
  );
  const [useClientSecret, setUseClientSecret] = useState(true);
  const [creatingClient, setCreatingClient] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [revealedClientCreds, setRevealedClientCreds] = useState<{
    clientName: string;
    clientId: string;
    clientSecret?: string;
  } | null>(null);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  const isLocalOrigin =
    originUrl.includes("localhost") || originUrl.includes("127.0.0.1");

  const mcpUrl = `${originUrl}/api/mcp`;
  const authUrl = `${originUrl}/oauth/authorize`;
  const tokenUrl = `${originUrl}/api/oauth/token`;
  const registerUrl = `${originUrl}/api/oauth/register`;
  const tokenPlaceholder = revealedToken || "<YOUR_MANAGEO_MCP_API_KEY>";

  const claudeDesktopJson = JSON.stringify(
    {
      mcpServers: {
        manageo: {
          command: "npx",
          args: [
            "-y",
            "mcp-remote",
            mcpUrl,
            "--header",
            `Authorization: Bearer ${tokenPlaceholder}`,
          ],
        },
      },
    },
    null,
    2
  );

  const cursorJson = JSON.stringify(
    {
      mcpServers: {
        manageo: {
          url: mcpUrl,
          headers: {
            Authorization: `Bearer ${tokenPlaceholder}`,
          },
        },
      },
    },
    null,
    2
  );

  const claudeCliCommand = `claude mcp add --transport http manageo "${mcpUrl}" --header "Authorization: Bearer ${tokenPlaceholder}"`;

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((curr) => (curr === key ? null : curr)), 2000);
    } catch {
      // Clipboard write unavailable
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % PLATFORM_TABS.length;
    else if (e.key === "ArrowLeft")
      nextIndex = (currentIndex - 1 + PLATFORM_TABS.length) % PLATFORM_TABS.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = PLATFORM_TABS.length - 1;

    if (nextIndex !== null) {
      e.preventDefault();
      const targetTab = PLATFORM_TABS[nextIndex];
      setSelectedTab(targetTab.id);
      tabRefs.current[targetTab.id]?.focus();
    }
  };

  const appendRedirectUri = (uri: string) => {
    const existing = redirectUrisText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!existing.includes(uri)) {
      setRedirectUrisText(existing.length > 0 ? `${existing.join("\n")}\n${uri}` : uri);
    }
  };

  const handleCreateOAuthClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const uris = redirectUrisText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!clientName.trim() || uris.length === 0) {
      setClientError("Provide a client name and at least one Redirect URI.");
      return;
    }

    setCreatingClient(true);
    setClientError(null);
    setRevealedClientCreds(null);

    const res = await createUserOAuthClient({
      clientName: clientName.trim(),
      redirectUris: uris,
      useClientSecret,
    });

    setCreatingClient(false);
    if (!res.success || !res.clientId) {
      setClientError(res.error || "Failed to create OAuth client");
      return;
    }

    setRevealedClientCreds({
      clientName: clientName.trim(),
      clientId: res.clientId,
      clientSecret: res.clientSecret,
    });
    setClientName("");
    await onRefresh();
  };

  const handleDeleteClient = async (id: string) => {
    setBusyActionId(`client-${id}`);
    setClientError(null);
    const res = await deleteUserOAuthClient(id);
    setBusyActionId(null);
    if (!res.success) {
      setClientError(res.error || "Failed to delete OAuth client");
      return;
    }
    await onRefresh();
  };

  const handleRevokeSession = async (id: string) => {
    setBusyActionId(`session-${id}`);
    setClientError(null);
    const res = await revokeUserOAuthSession(id);
    setBusyActionId(null);
    if (!res.success) {
      setClientError(res.error || "Failed to disconnect OAuth app");
      return;
    }
    await onRefresh();
  };

  const nameInputId = `${uid}-oauth-client-name`;
  const redirectInputId = `${uid}-oauth-redirect-uris`;
  const redirectHintId = `${uid}-oauth-redirect-hint`;
  const secretCheckboxId = `${uid}-oauth-use-secret`;

  return (
    <div className="space-y-6">
      {/* 1. Interactive Platform Connection Guide */}
      <section className="rounded-2xl bg-surface-container/60 border border-surface-container-high p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stitch-primary/15 text-stitch-primary flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-on-surface">
                Connect External AI Apps (ChatGPT, Claude, Cursor)
              </h4>
              <p className="text-xs text-on-surface-variant">
                Supports OAuth 2.1 (User-Defined Client, DCR &amp; CIMD) and MCP API keys.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start sm:self-center px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> Vault Always Excluded
          </span>
        </div>

        {isLocalOrigin && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Local URL detected ({originUrl}):</span>{" "}
              Cloud clients like ChatGPT Web and Claude.ai require a deployed public{" "}
              <code className="font-mono">https://</code> domain (or HTTPS tunnel). Local tools like
              Cursor or Claude Desktop work with localhost as well.
            </div>
          </div>
        )}

        {/* Quick Copy Endpoints Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {[
            { id: "endpoint-mcp", label: "MCP Server URL", value: mcpUrl },
            { id: "endpoint-auth", label: "OAuth Authorization URL", value: authUrl },
            { id: "endpoint-token", label: "OAuth Token URL", value: tokenUrl },
            { id: "endpoint-register", label: "OAuth Registration URL (DCR)", value: registerUrl },
          ].map((item) => (
            <div
              key={item.id}
              className="rounded-xl bg-surface-container-low/80 border border-surface-container-high px-3 py-2.5 flex items-center justify-between gap-2 min-w-0"
            >
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {item.label}
                </div>
                <code className="block text-xs text-on-surface truncate font-mono mt-0.5">
                  {item.value}
                </code>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(item.value, item.id)}
                aria-label={`Copy ${item.label}`}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container border border-surface-container-high text-[11px] font-medium text-on-surface hover:border-stitch-primary/50"
              >
                {copiedKey === item.id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Accessible Tabs (modern-web-guidance: single row, no padding/weight shift, aria-selected underline) */}
        <div>
          <div
            role="tablist"
            aria-label="MCP Client Setup Guides"
            className="flex overflow-x-auto border-b border-surface-container-high"
          >
            {PLATFORM_TABS.map((tab, index) => {
              const isSelected = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  id={`${uid}-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setSelectedTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  className="relative flex-none px-3.5 py-2.5 text-xs font-medium text-on-surface-variant hover:text-on-surface aria-selected:text-stitch-primary aria-selected:after:content-[''] aria-selected:after:absolute aria-selected:after:inset-x-0 aria-selected:after:bottom-0 aria-selected:after:border-b-2 aria-selected:after:border-stitch-primary focus-visible:outline-2 focus-visible:outline-stitch-primary focus-visible:-outline-offset-2 cursor-pointer transition-colors"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* All panels share one grid cell; padding/border lives on inner child wrapper */}
          <div className="mt-3 grid">
            {/* ChatGPT Tab Panel */}
            <div
              ref={(el) => {
                panelRefs.current.chatgpt = el;
              }}
              role="tabpanel"
              aria-labelledby={`${uid}-tab-chatgpt`}
              tabIndex={selectedTab === "chatgpt" ? 0 : undefined}
              className="col-start-1 row-start-1"
              {...(selectedTab !== "chatgpt" ? { hidden: "until-found" as never } : {})}
            >
              <div className="rounded-xl bg-surface-container-low/70 border border-surface-container-high p-4 space-y-3 text-xs text-on-surface">
                <p className="font-semibold text-on-surface">
                  Connecting Manageo inside ChatGPT Custom MCP Connectors
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-on-surface-variant leading-relaxed">
                  <li>
                    In ChatGPT, open <strong className="text-on-surface">Settings → Apps &amp; Connectors → Create</strong> (enable Developer Mode if prompted) and paste the{" "}
                    <strong className="text-on-surface">MCP Server URL</strong>:{" "}
                    <code className="px-1.5 py-0.5 rounded bg-surface-container text-stitch-primary font-mono">
                      {mcpUrl}
                    </code>
                    .
                  </li>
                  <li>
                    For <strong className="text-on-surface">Authentication → OAuth</strong>, ChatGPT shows 3 registration options:
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>
                        <strong className="text-on-surface">User-Defined OAuth Client (Always works):</strong> Copy the{" "}
                        <em>Redirect URL</em> shown in ChatGPT (e.g.{" "}
                        <code className="font-mono text-on-surface">https://chatgpt.com/connector/oauth/...</code>), create a client in the{" "}
                        <strong className="text-on-surface">OAuth 2.1 Clients</strong> form directly below, and paste your generated{" "}
                        <strong className="text-on-surface">Client ID</strong> and <strong className="text-on-surface">Client Secret</strong> into ChatGPT.
                      </li>
                      <li>
                        <strong className="text-on-surface">CIMD or Dynamic Client Registration (DCR):</strong> Supported automatically via{" "}
                        <code className="font-mono text-on-surface">/.well-known/oauth-authorization-server</code> once deployed on HTTPS.
                      </li>
                    </ul>
                  </li>
                  <li>
                    Click <strong className="text-on-surface">Connect</strong>. Manageo opens its consent screen where you choose your Workspace &amp; permissions and click{" "}
                    <strong className="text-on-surface">Allow Access</strong>.
                  </li>
                </ol>
              </div>
            </div>

            {/* Claude Tab Panel */}
            <div
              ref={(el) => {
                panelRefs.current.claude = el;
              }}
              role="tabpanel"
              aria-labelledby={`${uid}-tab-claude`}
              tabIndex={selectedTab === "claude" ? 0 : undefined}
              className="col-start-1 row-start-1"
              {...(selectedTab !== "claude" ? { hidden: "until-found" as never } : {})}
            >
              <div className="rounded-xl bg-surface-container-low/70 border border-surface-container-high p-4 space-y-3 text-xs text-on-surface">
                <p className="font-semibold text-on-surface">
                  Connecting Manageo to Claude.ai (Web) or Claude Desktop
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-on-surface-variant leading-relaxed">
                  <li>
                    <strong className="text-on-surface">Claude.ai Web (OAuth):</strong> Go to{" "}
                    <strong className="text-on-surface">Settings → Integrations → Add Custom Integration</strong> and enter{" "}
                    <code className="font-mono text-stitch-primary">{mcpUrl}</code>. Claude discovers OAuth automatically (or add{" "}
                    <code className="font-mono text-on-surface">https://claude.ai/api/mcp/auth_callback</code> in an OAuth client below).
                  </li>
                  <li>
                    <strong className="text-on-surface">Claude Desktop (API Key):</strong> Generate an MCP API key below and paste this into{" "}
                    <code className="font-mono text-on-surface">claude_desktop_config.json</code>:
                  </li>
                </ol>
                <div className="rounded-lg bg-surface-container border border-surface-container-high overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-surface-container-high">
                    <span className="text-[11px] font-medium text-on-surface-variant">
                      claude_desktop_config.json
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(claudeDesktopJson, "snippet-claude-desktop")}
                      aria-label="Copy Claude Desktop JSON config"
                      className="inline-flex items-center gap-1 text-[11px] text-stitch-primary hover:underline"
                    >
                      {copiedKey === "snippet-claude-desktop" ? (
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
                  <pre className="p-3 text-[11px] text-on-surface-variant overflow-x-auto leading-relaxed">
                    <code>{claudeDesktopJson}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Cursor / Windsurf Tab Panel */}
            <div
              ref={(el) => {
                panelRefs.current.cursor = el;
              }}
              role="tabpanel"
              aria-labelledby={`${uid}-tab-cursor`}
              tabIndex={selectedTab === "cursor" ? 0 : undefined}
              className="col-start-1 row-start-1"
              {...(selectedTab !== "cursor" ? { hidden: "until-found" as never } : {})}
            >
              <div className="rounded-xl bg-surface-container-low/70 border border-surface-container-high p-4 space-y-3 text-xs text-on-surface">
                <p className="font-semibold text-on-surface">
                  Connecting Manageo to Cursor, Windsurf, or Antigravity
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-on-surface-variant leading-relaxed">
                  <li>
                    Generate an <strong className="text-on-surface">MCP API Key</strong> in the API Keys section below.
                  </li>
                  <li>
                    Open your editor&apos;s <strong className="text-on-surface">MCP Settings</strong> (<code className="font-mono">.cursor/mcp.json</code> or{" "}
                    <code className="font-mono">mcp_config.json</code>) and add:
                  </li>
                </ol>
                <div className="rounded-lg bg-surface-container border border-surface-container-high overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-surface-container-high">
                    <span className="text-[11px] font-medium text-on-surface-variant">
                      Streamable HTTP (mcpServers JSON)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(cursorJson, "snippet-cursor")}
                      aria-label="Copy Cursor mcpServers JSON"
                      className="inline-flex items-center gap-1 text-[11px] text-stitch-primary hover:underline"
                    >
                      {copiedKey === "snippet-cursor" ? (
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
                  <pre className="p-3 text-[11px] text-on-surface-variant overflow-x-auto leading-relaxed">
                    <code>{cursorJson}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* CLI / Custom HTTP Tab Panel */}
            <div
              ref={(el) => {
                panelRefs.current.cli = el;
              }}
              role="tabpanel"
              aria-labelledby={`${uid}-tab-cli`}
              tabIndex={selectedTab === "cli" ? 0 : undefined}
              className="col-start-1 row-start-1"
              {...(selectedTab !== "cli" ? { hidden: "until-found" as never } : {})}
            >
              <div className="rounded-xl bg-surface-container-low/70 border border-surface-container-high p-4 space-y-3 text-xs text-on-surface">
                <div className="flex items-center gap-2 font-semibold text-on-surface">
                  <Terminal className="w-3.5 h-3.5 text-stitch-primary" />
                  <span>Claude Code CLI &amp; Streamable HTTP Clients</span>
                </div>
                <p className="text-on-surface-variant">
                  Run this command in your terminal to add Manageo as an HTTP MCP server:
                </p>
                <div className="rounded-lg bg-surface-container border border-surface-container-high overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-surface-container-high">
                    <span className="text-[11px] font-medium text-on-surface-variant">
                      Claude Code CLI
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(claudeCliCommand, "snippet-cli")}
                      aria-label="Copy Claude Code CLI command"
                      className="inline-flex items-center gap-1 text-[11px] text-stitch-primary hover:underline"
                    >
                      {copiedKey === "snippet-cli" ? (
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
                  <pre className="p-3 text-[11px] text-on-surface-variant overflow-x-auto leading-relaxed">
                    <code>{claudeCliCommand}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. User-Defined OAuth 2.1 Clients (For ChatGPT Manual / Pre-Defined OAuth Client) */}
      <section className="rounded-2xl bg-surface-container/60 border border-surface-container-high p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-stitch-primary/15 text-stitch-primary flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">
              OAuth 2.1 Clients (User-Defined OAuth Client)
            </h4>
            <p className="text-xs text-on-surface-variant">
              Create a Client ID &amp; Secret when connecting with &ldquo;User-Defined OAuth Client&rdquo; in ChatGPT or other OAuth apps.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreateOAuthClient}
          className="rounded-xl bg-surface-container-low/70 border border-surface-container-high p-4 space-y-3"
        >
          <div className="space-y-3">
            <div>
              <label
                htmlFor={nameInputId}
                className="block text-[11px] font-semibold text-on-surface-variant mb-1"
              >
                App / Connector Name
              </label>
              <input
                id={nameInputId}
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. ChatGPT MCP Connector"
                required
                className="w-full rounded-xl bg-surface-container border border-surface-container-high px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-stitch-primary"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <label
                  htmlFor={redirectInputId}
                  className="text-[11px] font-semibold text-on-surface-variant"
                >
                  Redirect / Callback URI(s)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      appendRedirectUri("https://chatgpt.com/connector_platform_oauth_redirect")
                    }
                    className="px-2 py-1 rounded-md border border-surface-container-high bg-surface-container text-[10px] font-medium text-on-surface hover:border-stitch-primary/50"
                  >
                    + ChatGPT Global Redirect
                  </button>
                  <button
                    type="button"
                    onClick={() => appendRedirectUri("https://claude.ai/api/mcp/auth_callback")}
                    className="px-2 py-1 rounded-md border border-surface-container-high bg-surface-container text-[10px] font-medium text-on-surface hover:border-stitch-primary/50"
                  >
                    + Claude.ai Redirect
                  </button>
                </div>
              </div>
              <p id={redirectHintId} className="text-[11px] text-on-surface-variant mb-1.5">
                Paste the exact Redirect URL from your AI app (e.g.{" "}
                <code className="font-mono text-on-surface">https://chatgpt.com/connector/oauth/&lt;id&gt;</code>
                ). Separate multiple URIs with new lines or commas.
              </p>
              <textarea
                id={redirectInputId}
                aria-describedby={redirectHintId}
                rows={2}
                value={redirectUrisText}
                onChange={(e) => setRedirectUrisText(e.target.value)}
                required
                className="w-full rounded-xl bg-surface-container border border-surface-container-high px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-stitch-primary"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label
              htmlFor={secretCheckboxId}
              className="flex items-center gap-2 text-xs text-on-surface cursor-pointer"
            >
              <input
                id={secretCheckboxId}
                type="checkbox"
                checked={useClientSecret}
                onChange={(e) => setUseClientSecret(e.target.checked)}
                className="rounded accent-stitch-primary"
              />
              <span>Generate Client Secret (Recommended for User-Defined OAuth Client)</span>
            </label>

            <button
              type="submit"
              disabled={creatingClient || !clientName.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold hover:brightness-105 disabled:opacity-50"
            >
              {creatingClient ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Create OAuth Client
            </button>
          </div>
        </form>

        {clientError && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-500">
            {clientError}
          </div>
        )}

        {revealedClientCreds && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2.5">
            <div className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Save OAuth Credentials for {revealedClientCreds.clientName} — the Client Secret is
              only shown once:
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low px-3 py-2 border border-surface-container-high">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase text-on-surface-variant">
                    Client ID
                  </div>
                  <code className="text-xs font-mono text-on-surface break-all">
                    {revealedClientCreds.clientId}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(revealedClientCreds.clientId, "revealed-cid")}
                  aria-label="Copy generated Client ID"
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container border border-surface-container-high text-[11px] font-semibold text-on-surface"
                >
                  {copiedKey === "revealed-cid" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              </div>

              {revealedClientCreds.clientSecret && (
                <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low px-3 py-2 border border-surface-container-high">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase text-on-surface-variant">
                      Client Secret
                    </div>
                    <code className="text-xs font-mono text-on-surface break-all">
                      {revealedClientCreds.clientSecret}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(revealedClientCreds.clientSecret || "", "revealed-cs")
                    }
                    aria-label="Copy generated Client Secret"
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container border border-surface-container-high text-[11px] font-semibold text-on-surface"
                  >
                    {copiedKey === "revealed-cs" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {oauthClients.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-3">
              No custom OAuth clients yet. Create one above if ChatGPT asks for a Client ID &amp;
              Client Secret.
            </p>
          ) : (
            oauthClients.map((c) => (
              <div
                key={c.id}
                className="rounded-xl bg-surface-container-low/60 border border-surface-container-high p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-on-surface">{c.clientName}</span>
                    <code className="text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono">
                      {c.clientId}
                    </code>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stitch-primary/12 text-stitch-primary font-semibold">
                      {c.hasSecret ? "Confidential (Secret)" : "Public (PKCE)"}
                    </span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant truncate">
                    Redirects: {c.redirectUris.join(", ")}
                  </div>
                  {c.clientSecretPrefix && (
                    <div className="text-[10px] text-on-surface-variant font-mono">
                      Secret prefix: {c.clientSecretPrefix}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(c.clientId, `cid-${c.id}`)}
                    aria-label={`Copy Client ID for ${c.clientName}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-surface-container-high hover:bg-surface-container text-[11px] font-medium text-on-surface"
                  >
                    {copiedKey === `cid-${c.id}` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy ID
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={busyActionId === `client-${c.id}`}
                    onClick={() => handleDeleteClient(c.id)}
                    aria-label={`Delete OAuth client ${c.clientName}`}
                    className="p-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 3. Connected OAuth Apps / Active Grants */}
      <section className="rounded-2xl bg-surface-container/60 border border-surface-container-high p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-stitch-primary/15 text-stitch-primary flex items-center justify-center shrink-0">
            <ExternalLink className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">Connected OAuth Apps</h4>
            <p className="text-xs text-on-surface-variant">
              Active OAuth 2.1 sessions authorized for your Manageo workspaces.
            </p>
          </div>
        </div>

        {oauthSessions.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-3">
            No active OAuth app connections yet. Authorized ChatGPT or Claude connections appear here.
          </p>
        ) : (
          <div className="space-y-2.5">
            {oauthSessions.map((s) => (
              <div
                key={s.id}
                className="rounded-xl bg-surface-container-low/60 border border-surface-container-high p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-on-surface">{s.clientName}</span>
                    <span className="text-[11px] text-on-surface-variant">
                      Workspace: {s.workspaceName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                      Connected
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-on-surface-variant">
                    <span>Granted scopes:</span>
                    {(["read", "write", "finance", "delete"] as const)
                      .filter((sc) => s.scopes[sc])
                      .map((sc) => (
                        <span
                          key={sc}
                          className="px-1.5 py-0.5 rounded bg-surface-container border border-surface-container-high capitalize text-on-surface"
                        >
                          {sc}
                        </span>
                      ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={busyActionId === `session-${s.id}`}
                  onClick={() => handleRevokeSession(s.id)}
                  aria-label={`Disconnect ${s.clientName}`}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/25 bg-red-500/5 hover:bg-red-500/15 text-xs font-medium text-red-500 disabled:opacity-50"
                >
                  <Unplug className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Native Accordion FAQ (modern-web-guidance: native <details>/<summary>, no headings in summary, marker before text) */}
      <section className="rounded-2xl bg-surface-container/60 border border-surface-container-high p-5 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          MCP Setup &amp; Troubleshooting FAQ
        </div>
        <div className="space-y-2">
          <details className="group rounded-xl bg-surface-container-low/70 border border-surface-container-high">
            <summary className="list-none [&::-webkit-details-marker]:hidden flex items-center gap-2 cursor-pointer px-3.5 py-2.5 text-xs font-semibold text-on-surface select-none">
              <ChevronRight
                className="w-3.5 h-3.5 shrink-0 text-on-surface-variant transition-transform group-open:rotate-90"
                aria-hidden="true"
              />
              <span>Why does ChatGPT show User-Defined OAuth Client vs. DCR vs. CIMD?</span>
            </summary>
            <div className="px-3.5 pb-3 pt-0.5 text-xs text-on-surface-variant leading-relaxed">
              Manageo supports all three modes: <strong className="text-on-surface">CIMD</strong>{" "}
              (via <code className="font-mono">client_id_metadata_document_supported: true</code>),{" "}
              <strong className="text-on-surface">DCR</strong> (via{" "}
              <code className="font-mono">/api/oauth/register</code>), and{" "}
              <strong className="text-on-surface">User-Defined OAuth Client</strong>. If ChatGPT
              shows DCR/CIMD as unavailable (or if you prefer manual credentials), choose{" "}
              <strong className="text-on-surface">User-Defined OAuth Client</strong>, copy
              ChatGPT&apos;s Redirect URL into the form above, and paste the generated Client ID &amp;
              Client Secret back into ChatGPT.
            </div>
          </details>

          <details className="group rounded-xl bg-surface-container-low/70 border border-surface-container-high">
            <summary className="list-none [&::-webkit-details-marker]:hidden flex items-center gap-2 cursor-pointer px-3.5 py-2.5 text-xs font-semibold text-on-surface select-none">
              <ChevronRight
                className="w-3.5 h-3.5 shrink-0 text-on-surface-variant transition-transform group-open:rotate-90"
                aria-hidden="true"
              />
              <span>When should I use OAuth vs. an MCP API Key?</span>
            </summary>
            <div className="px-3.5 pb-3 pt-0.5 text-xs text-on-surface-variant leading-relaxed">
              Use <strong className="text-on-surface">OAuth 2.1</strong> for web connectors like
              ChatGPT and Claude.ai that open a browser sign-in window. Use{" "}
              <strong className="text-on-surface">MCP API Keys</strong> (
              <code className="font-mono">mgo_live_...</code>) for local desktop/editor configs like
              Cursor, Windsurf, Claude Desktop, or CLI scripts.
            </div>
          </details>

          <details className="group rounded-xl bg-surface-container-low/70 border border-surface-container-high">
            <summary className="list-none [&::-webkit-details-marker]:hidden flex items-center gap-2 cursor-pointer px-3.5 py-2.5 text-xs font-semibold text-on-surface select-none">
              <ChevronRight
                className="w-3.5 h-3.5 shrink-0 text-on-surface-variant transition-transform group-open:rotate-90"
                aria-hidden="true"
              />
              <span>Can external AI apps access my Vault secrets?</span>
            </summary>
            <div className="px-3.5 pb-3 pt-0.5 text-xs text-on-surface-variant leading-relaxed">
              No. Vault passwords, encrypted items, and private secrets are strictly excluded from all
              MCP tools and OAuth scopes. Only the workspace and permissions you explicitly approve
              are shared.
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
