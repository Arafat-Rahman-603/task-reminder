"use client";

import { useState } from "react";
import Link from "next/link";
import { History, Users, BarChart3, ShieldCheck, Search, RefreshCw } from "lucide-react";
import { getWorkspaceAuditLogs } from "@/actions/auditLog.actions";
import { formatDateTime } from "@/lib/dateUtils";
import MemberAvatar from "@/components/workspace/MemberAvatar";

export interface WorkspaceAuditLogItem {
  _id: string;
  action: string;
  entityType?: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    image?: string;
  };
  details?: Record<string, unknown>;
  createdAt: string | Date;
}

interface AuditLogClientProps {
  workspace: {
    _id: string;
    name: string;
    [key: string]: unknown;
  };
  initialLogs: WorkspaceAuditLogItem[];
}

export default function AuditLogClient({ workspace, initialLogs }: AuditLogClientProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const res = await getWorkspaceAuditLogs(workspace._id);
      if (res.success && res.logs) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error("Failed to refresh audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("ACCEPT")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (action.includes("REMOVE") || action.includes("DELETE") || action.includes("REVOKE")) return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    if (action.includes("ROLE") || action.includes("STATUS")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (action.includes("OWNERSHIP")) return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    return "bg-stitch-primary/10 text-stitch-primary border-stitch-primary/20";
  };

  const filteredLogs = logs.filter((log: WorkspaceAuditLogItem) => {
    const action = (log.action || "").toLowerCase();
    const userName = (log.user?.name || "").toLowerCase();
    const userEmail = (log.user?.email || "").toLowerCase();
    const details = JSON.stringify(log.details || {}).toLowerCase();
    const q = search.toLowerCase();

    const matchesSearch = !q || action.includes(q) || userName.includes(q) || userEmail.includes(q) || details.includes(q);
    if (!matchesSearch) return false;

    if (categoryFilter === "all") return true;
    if (categoryFilter === "invitations") return action.includes("INVIT");
    if (categoryFilter === "roles") return action.includes("ROLE");
    if (categoryFilter === "members") return action.includes("MEMBER") || action.includes("STATUS");
    if (categoryFilter === "transfers") return action.includes("TRANSFER") || action.includes("OWNERSHIP");

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Navigation & Options Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-variant/30 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/dashboard/settings?tab=workspace" className="hover:text-stitch-primary transition-colors font-medium">
              Workspace Settings
            </Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">Activity & Audit Log</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-headline text-on-surface">
            Workspace Activity & Audit Log
          </h1>
        </div>

        {/* Option Navigation Bar */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
          <Link
            href="/dashboard/workspace/members"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Users size={13} />
            <span>Members</span>
          </Link>
          <Link
            href="/dashboard/workspace/performance"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <BarChart3 size={13} />
            <span>Performance</span>
          </Link>
          <Link
            href="/dashboard/workspace/roles"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ShieldCheck size={13} />
            <span>Custom Roles</span>
          </Link>
          <Link
            href="/dashboard/workspace/audit"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stitch-primary text-black shadow-sm"
          >
            <History size={13} />
            <span>Audit Log</span>
          </Link>
        </div>
      </div>

      {/* Filter & Refresh Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by actor, action, or details..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-black/20 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-stitch-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 bg-black/20 border border-white/10 text-slate-300 text-xs rounded-xl outline-none focus:border-stitch-primary shrink-0"
          >
            <option value="all" className="bg-neutral-900">All Event Types</option>
            <option value="invitations" className="bg-neutral-900">Invitations</option>
            <option value="roles" className="bg-neutral-900">Role Changes</option>
            <option value="members" className="bg-neutral-900">Member Status</option>
            <option value="transfers" className="bg-neutral-900">Ownership Transfers</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-surface-variant/40 hover:bg-white/5 text-xs text-slate-300 font-medium transition-all shrink-0"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-stitch-primary" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Audit Log Card */}
      <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-surface-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-stitch-primary" />
            <h3 className="text-sm font-bold text-on-surface">Audit Trail Events</h3>
          </div>
          <span className="text-xs text-slate-400">
            Showing {filteredLogs.length} events
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <p>No audit log events matched your search or filter.</p>
            {(search || categoryFilter !== "all") && (
              <button
                onClick={() => { setSearch(""); setCategoryFilter("all"); }}
                className="text-stitch-primary hover:underline font-semibold"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-surface-variant/20">
            {filteredLogs.map((log: WorkspaceAuditLogItem) => {
              return (
                <div key={log._id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors text-xs">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <MemberAvatar
                      name={log.user?.name}
                      avatarUrl={log.user?.image}
                      size="sm"
                    />

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">
                          {log.user?.name || "System Actor"}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        {log.details?.action === "MEMBER_ROLE_UPDATE"
                          ? `Changed role of user to ${log.details.newRole}`
                          : log.details?.action === "MEMBER_STATUS_CHANGE"
                          ? `Changed member status to ${log.details.newStatus}`
                          : log.details?.action === "WORKSPACE_OWNERSHIP_TRANSFERRED"
                          ? "Transferred workspace ownership"
                          : log.details?.email
                          ? `Invited ${log.details.email} as ${log.details?.role || "member"}`
                          : log.entityType || "Workspace event"}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] sm:text-[11px] text-slate-500 shrink-0 self-end sm:self-center font-mono" suppressHydrationWarning>
                    {formatDateTime(new Date(log.createdAt))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
