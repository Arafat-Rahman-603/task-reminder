"use client";

import { useState } from "react";
import { ShieldCheck, Check, X, Layers, Lock, AlertTriangle } from "lucide-react";

export interface OAuthConsentWorkspace {
  id: string;
  name: string;
  type: "personal" | "team";
  role: string;
}

export interface OAuthConsentScopes {
  read: boolean;
  write: boolean;
  delete: boolean;
  finance: boolean;
}

interface OAuthConsentCardProps {
  clientId: string;
  clientName: string;
  redirectHost: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  state?: string;
  resource?: string;
  userEmail?: string;
  userName?: string;
  workspaces: OAuthConsentWorkspace[];
  initialScopes: OAuthConsentScopes;
}

const SCOPE_OPTIONS: {
  key: keyof OAuthConsentScopes;
  label: string;
  description: string;
}[] = [
  {
    key: "read",
    label: "Read workspace data",
    description: "View tasks, routines, notes, ideas, custom sections, and summary insights.",
  },
  {
    key: "write",
    label: "Create & update items",
    description: "Create or modify tasks, toggle completions, and update notes or custom records.",
  },
  {
    key: "finance",
    label: "Access finance overview",
    description: "Read personal accounts, transactions, and record entries when authorized.",
  },
  {
    key: "delete",
    label: "Delete records",
    description: "Remove tasks or workspace items when explicitly instructed.",
  },
];

export function OAuthConsentCard({
  clientId,
  clientName,
  redirectHost,
  redirectUri,
  codeChallenge,
  codeChallengeMethod,
  state,
  resource,
  userEmail,
  userName,
  workspaces,
  initialScopes,
}: OAuthConsentCardProps) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(
    workspaces[0]?.id ?? ""
  );
  const [scopes, setScopes] = useState<OAuthConsentScopes>(initialScopes);
  const [submitting, setSubmitting] = useState<"approve" | "deny" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasAnyScope =
    scopes.read || scopes.write || scopes.delete || scopes.finance;

  async function submitDecision(decision: "approve" | "deny") {
    if (decision === "approve") {
      if (!selectedWorkspaceId) {
        setErrorMsg("Please select a workspace to connect.");
        return;
      }
      if (!hasAnyScope) {
        setErrorMsg("Enable at least one permission scope before authorizing.");
        return;
      }
    }

    setErrorMsg(null);
    setSubmitting(decision);

    try {
      const response = await fetch("/api/oauth/authorize/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          clientId,
          redirectUri,
          codeChallenge,
          codeChallengeMethod,
          workspaceId: selectedWorkspaceId,
          scopes,
          state,
          resource,
        }),
      });

      const payload = (await response.json()) as {
        redirectTo?: string;
        error?: string;
      };

      if (!response.ok || !payload.redirectTo) {
        setErrorMsg(payload.error || "Unable to complete authorization.");
        setSubmitting(null);
        return;
      }

      window.location.assign(payload.redirectTo);
    } catch {
      setErrorMsg("Network error while contacting Manageo authorization server.");
      setSubmitting(null);
    }
  }

  function toggleScope(key: keyof OAuthConsentScopes) {
    setScopes((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-outline-variant bg-surface-container p-6 sm:p-8 shadow-xl">
      <div className="flex items-start gap-3.5 mb-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-on-surface tracking-tight">
            Authorize {clientName}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            <span className="font-medium text-on-surface">{clientName}</span> wants to
            connect to your Manageo MCP server.
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span>Signed in as</span>
          <span className="font-medium text-on-surface truncate">
            {userName ? `${userName} (${userEmail})` : userEmail || "Manageo User"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Redirect destination</span>
          <span className="font-mono text-on-surface truncate">{redirectHost}</span>
        </div>
      </div>

      <div className="mb-5">
        <label
          htmlFor="oauth-workspace-select"
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
        >
          <Layers className="h-3.5 w-3.5" />
          Target Workspace
        </label>
        {workspaces.length === 0 ? (
          <div className="rounded-xl border border-error/40 bg-error/10 p-3 text-sm text-error">
            No active workspaces found for this account.
          </div>
        ) : (
          <select
            id="oauth-workspace-select"
            value={selectedWorkspaceId}
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-high px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-stitch-primary"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name} ({ws.type === "personal" ? "Personal" : "Team"} — {ws.role})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2.5">
          <Lock className="h-3.5 w-3.5" />
          Requested Permissions
        </div>
        <div className="space-y-2">
          {SCOPE_OPTIONS.map((item) => {
            const enabled = scopes[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleScope(item.key)}
                className={`w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                  enabled
                    ? "border-stitch-primary/60 bg-primary-container/25"
                    : "border-outline-variant bg-surface-container-low opacity-75"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    enabled
                      ? "border-stitch-primary bg-stitch-primary text-on-primary"
                      : "border-outline-variant bg-surface-container"
                  }`}
                >
                  {enabled && <Check className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-on-surface">
                    {item.label}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-2.5 text-xs text-on-surface-variant">
          Vault items and encrypted secrets are always excluded from MCP access.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-error/40 bg-error/10 px-3.5 py-2.5 text-sm text-error">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button
          type="button"
          disabled={submitting !== null}
          onClick={() => submitDecision("deny")}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-high px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-highest disabled:opacity-50 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
          {submitting === "deny" ? "Denying..." : "Deny"}
        </button>
        <button
          type="button"
          disabled={submitting !== null || workspaces.length === 0}
          onClick={() => submitDecision("approve")}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-stitch-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
        >
          <ShieldCheck className="h-4 w-4" />
          {submitting === "approve" ? "Authorizing..." : "Allow Access"}
        </button>
      </div>
    </div>
  );
}
