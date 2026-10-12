"use client";

import { useState, useEffect } from "react";
import { 
  Link2, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Users, 
  Building2, 
  Edit2, 
  AlertTriangle, 
  Archive, 
  Save, 
  Loader2, 
  Mail, 
  Shield, 
  ShieldCheck, 
  Crown, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  UserX,
  Sliders
} from "lucide-react";
import { createInvitation, getActiveInvitations, revokeInvitation } from "@/actions/workspaceInvitation.actions";
import { renameWorkspace, archiveWorkspace, deleteWorkspace } from "@/actions/workspace.actions";
import { getWorkspaceMembers, updateMemberRole, removeWorkspaceMember } from "@/actions/workspaceMember.actions";
import { Role, IWorkspacePermissions, getDefaultPermissions } from "@/lib/workspacePermissions";

export default function WorkspaceSettings({ activeWorkspace }: { activeWorkspace: any }) {
  // Members state
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(null);

  // Invitations state
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [inviteEmail, setInviteEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [maxUses, setMaxUses] = useState(1);
  const [showAdvancedPerms, setShowAdvancedPerms] = useState(false);
  const [customPerms, setCustomPerms] = useState<IWorkspacePermissions>(getDefaultPermissions('member'));
  const [copied, setCopied] = useState<string | null>(null);
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
  const isAdmin = ["owner", "admin"].includes(activeWorkspace?.role);
  const isTeam = activeWorkspace?.type === "team";

  useEffect(() => {
    setName(activeWorkspace?.name || "");
    if (isTeam) {
      fetchInvitations();
      fetchMembers();
    } else {
      setLoading(false);
      setMembersLoading(false);
    }
  }, [activeWorkspace?._id]);

  useEffect(() => {
    setCustomPerms(getDefaultPermissions(role));
  }, [role]);

  const fetchMembers = async () => {
    try {
      setMembersLoading(true);
      const data = await getWorkspaceMembers(activeWorkspace._id);
      setMembers(data);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const data = await getActiveInvitations(activeWorkspace._id);
      setInvitations(data);
    } catch (err) {
      console.error("Failed to fetch invitations:", err);
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generating) return;
    setInviteMsg(null);

    try {
      setGenerating(true);
      const res = await createInvitation({ 
        workspaceId: activeWorkspace._id, 
        role, 
        email: inviteEmail.trim() || undefined,
        permissions: showAdvancedPerms ? customPerms : undefined,
        maxUses: Number(maxUses) || 1, 
        expiresInDays: Number(expiresInDays) || 7 
      });

      if (res.success) {
        setInvitations([{
          _id: res.invitationId || ('temp-' + Date.now()),
          token: res.token,
          email: inviteEmail.trim() || null,
          role,
          expiresAt: new Date(Date.now() + (Number(expiresInDays) || 7) * 24 * 60 * 60 * 1000).toISOString(),
          uses: 0,
          maxUses: Number(maxUses) || 1,
          createdBy: { name: 'You' }
        }, ...invitations]);

        setInviteMsg({ 
          type: 'success', 
          text: inviteEmail.trim() 
            ? `Invitation created for ${inviteEmail.trim()}. Share the link with them.`
            : "General invitation link generated successfully."
        });

        // Reset input
        setInviteEmail("");
      }
    } catch (err: any) {
      setInviteMsg({ type: 'error', text: err.message || "Failed to generate invitation" });
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

  const handleRoleChange = async (targetUserId: string, newRole: Role) => {
    try {
      setMemberActionLoading(targetUserId);
      await updateMemberRole(activeWorkspace._id, targetUserId, newRole);
      setMembers(members.map(m => m.userId?._id === targetUserId ? { ...m, role: newRole } : m));
    } catch (err: any) {
      alert(err.message || "Failed to update member role");
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleRemoveMember = async (targetUserId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this workspace? They will lose access immediately.`)) {
      return;
    }
    try {
      setMemberActionLoading(targetUserId);
      await removeWorkspaceMember(activeWorkspace._id, targetUserId);
      setMembers(members.filter(m => m.userId?._id !== targetUserId));
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    } finally {
      setMemberActionLoading(null);
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
              <h4 className="text-base font-semibold text-on-surface">Workspace Identity</h4>
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

      {/* 2. Team Members List (Visible for Team Workspaces) */}
      {isTeam && (
        <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 border-b border-surface-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stitch-primary/10 text-stitch-primary flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
              <div>
                <h4 className="text-base font-semibold text-on-surface">Team Members</h4>
                <p className="text-xs text-slate-400">
                  {members.length} member{members.length !== 1 ? 's' : ''} with active access to this workspace.
                </p>
              </div>
            </div>
          </div>

          <div>
            {membersLoading ? (
              <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                <span>Loading team members...</span>
              </div>
            ) : members.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">No active members found.</div>
            ) : (
              <div className="divide-y divide-surface-variant/20">
                {members.map((member) => {
                  const user = member.userId;
                  const isThisOwner = member.role === "owner";
                  const canManageThisMember = isAdmin && !isThisOwner && member.userId?._id !== activeWorkspace.ownerId;

                  return (
                    <div key={member._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-stitch-surface-container flex items-center justify-center text-stitch-primary text-xs font-bold border border-white/10 uppercase">
                          {user?.name ? user.name.slice(0, 2) : user?.email ? user.email.slice(0, 2) : "U"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white">
                              {user?.name || "Team Member"}
                            </span>
                            {isThisOwner && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                                <Crown size={11} /> Owner
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {user?.email || "No email available"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {isThisOwner ? (
                          <span className="text-xs text-slate-400 italic px-2">Workspace Owner</span>
                        ) : canManageThisMember ? (
                          <>
                            <select
                              value={member.role}
                              disabled={memberActionLoading === user?._id}
                              onChange={(e) => handleRoleChange(user._id, e.target.value as Role)}
                              className="h-8 px-2.5 bg-black/20 border border-white/10 text-white text-xs rounded-lg outline-none focus:border-stitch-primary"
                            >
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                              <option value="viewer">Viewer</option>
                            </select>

                            <button
                              onClick={() => handleRemoveMember(user._id, user.name || user.email)}
                              disabled={memberActionLoading === user?._id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Remove member from workspace"
                            >
                              {memberActionLoading === user?._id ? (
                                <Loader2 size={14} className="animate-spin text-red-400" />
                              ) : (
                                <UserX size={15} />
                              )}
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-medium text-slate-300 capitalize px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
                            {member.role}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Team Invitations Section */}
      {isTeam && (
        <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 border-b border-surface-variant/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
              <div>
                <h4 className="text-base font-semibold text-on-surface">Invite New Member</h4>
                <p className="text-xs text-slate-400">
                  Send a secure, tokenized invitation link. You can restrict the invite to a specific email address and customize permissions.
                </p>
              </div>
            </div>

            {inviteMsg && (
              <div className={`p-2.5 mt-3 rounded-xl text-xs font-medium ${inviteMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {inviteMsg.text}
              </div>
            )}

            {isAdmin && (
              <form onSubmit={handleGenerate} className="mt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Recipient Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com (leave blank for any)"
                      className="w-full h-9 px-3 rounded-xl bg-black/20 border border-white/10 text-white text-xs outline-none focus:border-stitch-primary"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full h-9 px-2.5 bg-black/20 border border-white/10 text-white text-xs rounded-xl outline-none focus:border-stitch-primary"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Expires In
                    </label>
                    <select
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(Number(e.target.value))}
                      className="w-full h-9 px-2.5 bg-black/20 border border-white/10 text-white text-xs rounded-xl outline-none focus:border-stitch-primary"
                    >
                      <option value={1}>1 Day</option>
                      <option value={7}>7 Days</option>
                      <option value={30}>30 Days</option>
                    </select>
                  </div>
                </div>

                {/* Granular Permission Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedPerms(!showAdvancedPerms)}
                    className="inline-flex items-center gap-1.5 text-xs text-stitch-primary hover:text-stitch-primary/80 transition-colors"
                  >
                    <Sliders size={12} />
                    <span>{showAdvancedPerms ? "Hide Granular Permissions" : "Customize Module Permissions"}</span>
                    {showAdvancedPerms ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {showAdvancedPerms && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-black/30 border border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customPerms.tasks?.create ?? true}
                          onChange={(e) => setCustomPerms({
                            ...customPerms,
                            tasks: { ...customPerms.tasks, create: e.target.checked }
                          })}
                          className="rounded border-white/20 bg-black/40 text-stitch-primary focus:ring-0"
                        />
                        <span>Create Tasks</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customPerms.tasks?.delete ?? false}
                          onChange={(e) => setCustomPerms({
                            ...customPerms,
                            tasks: { ...customPerms.tasks, delete: e.target.checked }
                          })}
                          className="rounded border-white/20 bg-black/40 text-stitch-primary focus:ring-0"
                        />
                        <span>Delete Tasks</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customPerms.routines?.manage ?? true}
                          onChange={(e) => setCustomPerms({
                            ...customPerms,
                            routines: { ...customPerms.routines, manage: e.target.checked }
                          })}
                          className="rounded border-white/20 bg-black/40 text-stitch-primary focus:ring-0"
                        />
                        <span>Manage Routines</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customPerms.customSections?.manage ?? true}
                          onChange={(e) => setCustomPerms({
                            ...customPerms,
                            customSections: { ...customPerms.customSections, manage: e.target.checked }
                          })}
                          className="rounded border-white/20 bg-black/40 text-stitch-primary focus:ring-0"
                        />
                        <span>Manage Databases</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customPerms.files?.upload ?? true}
                          onChange={(e) => setCustomPerms({
                            ...customPerms,
                            files: { ...customPerms.files, upload: e.target.checked }
                          })}
                          className="rounded border-white/20 bg-black/40 text-stitch-primary focus:ring-0"
                        />
                        <span>Upload Files</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customPerms.members?.manage ?? false}
                          onChange={(e) => setCustomPerms({
                            ...customPerms,
                            members: { ...customPerms.members, manage: e.target.checked }
                          })}
                          className="rounded border-white/20 bg-black/40 text-stitch-primary focus:ring-0"
                        />
                        <span>Invite Members</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={generating}
                    className="inline-flex items-center gap-1.5 h-9 px-4 bg-stitch-primary text-black font-semibold text-xs rounded-xl hover:bg-stitch-primary/90 transition-colors disabled:opacity-50"
                  >
                    {generating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    <span>{generating ? "Creating Invitation..." : "Create Invitation Link"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Active Invitations List */}
          <div className="p-0">
            <div className="px-5 py-3 bg-white/[0.01] border-b border-surface-variant/20 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Invitations ({invitations.length})
              </span>
            </div>

            {loading ? (
              <div className="p-6 text-center text-slate-400 text-xs">Loading invitations...</div>
            ) : invitations.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">No pending invitations for this workspace.</div>
            ) : (
              <div className="divide-y divide-surface-variant/20">
                {invitations.map((invite) => (
                  <div key={invite._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-7 h-7 rounded-lg bg-stitch-primary/10 text-stitch-primary flex items-center justify-center shrink-0">
                        <Link2 size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-xs text-white capitalize">{invite.role}</span>
                          {invite.email ? (
                            <span className="text-[11px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                              Restricted: {invite.email}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md">
                              General Link
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
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
                      {isAdmin && (
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

      {/* 4. Danger Zone for Team Workspaces */}
      {isTeam && isOwner ? (
        <div className="border border-red-500/20 bg-red-500/[0.03] rounded-2xl p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-300">Danger Zone</h4>
              <p className="text-xs text-slate-400">
                Archiving or deleting this workspace removes shared team access. Your personal modules (Money, Vault) remain completely untouched and private.
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
