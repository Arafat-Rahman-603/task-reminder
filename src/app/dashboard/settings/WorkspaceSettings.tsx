"use client";

import { useState, useEffect } from "react";
import { Link2, Copy, Check, Plus, Trash2, Users, Building2, Edit2, AlertTriangle, Archive, Save, Loader2 } from "lucide-react";
import { createInvitation, getActiveInvitations, revokeInvitation } from "@/actions/workspaceInvitation.actions";
import { renameWorkspace, archiveWorkspace, deleteWorkspace } from "@/actions/workspace.actions";

export default function WorkspaceSettings({ activeWorkspace }: { activeWorkspace: any }) {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [copied, setCopied] = useState<string | null>(null);

  // Rename state
  const [name, setName] = useState(activeWorkspace?.name || "");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameMsg, setRenameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Danger zone state
  const [actionLoading, setActionLoading] = useState<'archive' | 'delete' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [dangerError, setDangerError] = useState("");

  const isOwner = activeWorkspace?.role === "owner";
  const isTeam = activeWorkspace?.type === "team";

  useEffect(() => {
    setName(activeWorkspace?.name || "");
    if (isTeam) {
      fetchInvitations();
    } else {
      setLoading(false);
    }
  }, [activeWorkspace?._id]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const data = await getActiveInvitations(activeWorkspace._id);
      setInvitations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || renameLoading) return;
    setRenameLoading(true);
    setRenameMsg(null);

    try {
      const res = await renameWorkspace(activeWorkspace._id, name.trim());
      if (res.success) {
        setRenameMsg({ type: 'success', text: "Workspace renamed successfully." });
        setIsRenaming(false);
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch (err: any) {
      setRenameMsg({ type: 'error', text: err.message || "Failed to rename workspace." });
    } finally {
      setRenameLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this workspace? It will be hidden from team navigation.")) return;
    setActionLoading('archive');
    setDangerError("");
    try {
      const res = await archiveWorkspace(activeWorkspace._id);
      if (res.success) {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setDangerError(err.message || "Failed to archive workspace.");
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (confirmName.trim() !== activeWorkspace.name.trim()) {
      setDangerError(`Please type "${activeWorkspace.name}" exactly to confirm deletion.`);
      return;
    }

    setActionLoading('delete');
    setDangerError("");
    try {
      const res = await deleteWorkspace(activeWorkspace._id);
      if (res.success) {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setDangerError(err.message || "Failed to delete workspace.");
      setActionLoading(null);
    }
  };

  const handleGenerate = async () => {
    if (generating) return;
    try {
      setGenerating(true);
      const res = await createInvitation({ workspaceId: activeWorkspace._id, role, maxUses: 1, expiresInDays: 7 });
      setInvitations([{
        _id: 'temp-' + Date.now(),
        token: res.token,
        role: role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        uses: 0,
        maxUses: 1,
        createdBy: { name: 'You' }
      }, ...invitations]);
    } catch (err: any) {
      alert(err.message || "Failed to generate invitation");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRevoke = async (id: string) => {
    if (id.startsWith('temp-')) {
      alert("Please refresh to revoke this newly created link");
      return;
    }
    try {
      await revokeInvitation(id);
      setInvitations(invitations.filter(i => i._id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to revoke invitation");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-on-surface mb-1">Workspace Settings</h3>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage workspace details, team members, and role permissions for <strong>{activeWorkspace.name}</strong>.
        </p>
      </div>

      {/* 1. Workspace Identity & Rename Card */}
      <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stitch-primary/10 text-stitch-primary flex items-center justify-center shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-on-surface">Workspace Name</h4>
              <p className="text-xs text-slate-400 capitalize">
                Type: {activeWorkspace.type} workspace • Your Role: <span className="text-stitch-primary font-medium">{activeWorkspace.role}</span>
              </p>
            </div>
          </div>

          {isOwner && isTeam && !isRenaming && (
            <button
              onClick={() => setIsRenaming(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-surface-variant/50 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all w-fit"
            >
              <Edit2 size={13} />
              Rename
            </button>
          )}
        </div>

        {renameMsg && (
          <div className={`p-2.5 mb-3 rounded-xl text-xs font-medium ${renameMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {renameMsg.text}
          </div>
        )}

        {isRenaming ? (
          <form onSubmit={handleRename} className="flex flex-col sm:flex-row gap-2 mt-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={60}
              placeholder="Workspace name"
              className="flex-1 h-9 px-3 rounded-xl bg-black/20 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-stitch-primary transition-all"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={renameLoading}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-stitch-primary text-black font-semibold text-xs hover:bg-stitch-primary/90 transition-all disabled:opacity-50"
              >
                {renameLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Save
              </button>
              <button
                type="button"
                onClick={() => { setIsRenaming(false); setName(activeWorkspace.name); }}
                className="h-9 px-3 rounded-xl border border-white/10 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm font-semibold text-slate-200">
            {activeWorkspace.name}
          </div>
        )}
      </div>

      {/* 2. Team Invitations (Visible only for Team Workspaces) */}
      {isTeam && (
        <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 border-b border-surface-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
              <div>
                <h4 className="text-base font-semibold text-on-surface">Team Invitations</h4>
                <p className="text-xs text-slate-400">Generate secure invite links to collaborate on this workspace.</p>
              </div>
            </div>

            {isOwner && (
              <div className="flex items-center gap-2">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="h-8 px-2.5 bg-black/20 border border-white/10 text-white text-xs rounded-lg outline-none focus:border-stitch-primary"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 h-8 px-3 bg-stitch-primary text-black font-semibold text-xs rounded-lg hover:bg-stitch-primary/90 transition-colors disabled:opacity-50"
                >
                  <Plus size={13} />
                  <span>{generating ? "Creating..." : "Invite Link"}</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-0">
            {loading ? (
              <div className="p-6 text-center text-slate-400 text-xs">Loading invitations...</div>
            ) : invitations.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">No active invitations found for this workspace.</div>
            ) : (
              <div className="divide-y divide-surface-variant/20">
                {invitations.map((invite) => (
                  <div key={invite._id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-7 h-7 rounded-lg bg-stitch-primary/10 text-stitch-primary flex items-center justify-center shrink-0">
                        <Link2 size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-xs text-white capitalize">{invite.role}</span>
                          <span className="text-[10px] text-slate-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                            Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Created by {invite.createdBy?.name || 'You'} • Uses: {invite.uses}/{invite.maxUses || '1'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {invite.token ? (
                        <button
                          onClick={() => handleCopy(invite.token)}
                          className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium border border-white/10 rounded-lg text-stitch-primary hover:bg-stitch-primary/10 transition-colors"
                        >
                          {copied === invite.token ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copied === invite.token ? "Copied" : "Copy Link"}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Security protected</span>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleRevoke(invite._id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Revoke invitation"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Danger Zone for Team Workspaces or Personal Workspace Info */}
      {isTeam && isOwner ? (
        <div className="border border-red-500/20 bg-red-500/[0.03] rounded-2xl p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-300">Danger Zone</h4>
              <p className="text-xs text-slate-400">
                Archiving or deleting this workspace removes shared team access. Your personal modules (Money, Vault) remain completely untouched.
              </p>
            </div>
          </div>

          {dangerError && (
            <div className="p-2.5 mb-4 rounded-xl text-xs font-medium bg-red-500/10 text-red-300 border border-red-500/20">
              {dangerError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleArchive}
              disabled={!!actionLoading}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
            >
              <Archive size={14} />
              <span>{actionLoading === 'archive' ? "Archiving..." : "Archive Workspace"}</span>
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={!!actionLoading}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-all disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>Delete Workspace</span>
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder={`Type "${activeWorkspace.name}"`}
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-black/40 border border-red-500/30 text-white text-xs w-full sm:w-48 outline-none focus:border-red-400"
                />
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={handleDelete}
                    disabled={!!actionLoading}
                    className="h-9 px-3 rounded-xl bg-red-500 text-white font-semibold text-xs hover:bg-red-600 transition-colors disabled:opacity-50 flex-1 sm:flex-none"
                  >
                    {actionLoading === 'delete' ? "Deleting..." : "Confirm"}
                  </button>
                  <button
                    onClick={() => { setConfirmDelete(false); setConfirmName(""); setDangerError(""); }}
                    className="h-9 px-3 rounded-xl border border-white/10 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-white/5 bg-white/[0.02] rounded-2xl p-5">
          <p className="text-xs text-slate-400">
            {isTeam 
              ? "Only the workspace owner has permission to rename, archive, or delete this team workspace."
              : "Personal Workspace is your personal operating system. It is strictly private to your account and cannot be deleted."}
          </p>
        </div>
      )}
    </div>
  );
}
