"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  User,
  UserX,
  Sliders,
  Pause,
  Play,
  ArrowRightLeft,
  History,
  BarChart3,
  ExternalLink
} from "lucide-react";
import { createInvitation, getActiveInvitations, revokeInvitation, resendWorkspaceInvitation } from "@/actions/workspaceInvitation.actions";
import { renameWorkspace, archiveWorkspace, deleteWorkspace } from "@/actions/workspace.actions";
import { 
  getWorkspaceMembers, 
  updateMemberRole, 
  removeWorkspaceMember,
  toggleMemberStatus,
  transferWorkspaceOwnership
} from "@/actions/workspaceMember.actions";
import { getWorkspaceAuditLogs } from "@/actions/auditLog.actions";
import { getWorkspaceRoles } from "@/actions/workspaceRole.actions";
import { Role, IWorkspacePermissions, getDefaultPermissions } from "@/lib/workspacePermissions";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import WorkspaceRolesTab from "@/components/workspace/WorkspaceRolesTab";
import WorkspacePerformanceTab from "@/components/workspace/WorkspacePerformanceTab";
import MemberAvatar from "@/components/workspace/MemberAvatar";

export default function WorkspaceSettings({ activeWorkspace, initialSubTab = "members" }: { activeWorkspace: any; initialSubTab?: any }) {
  // Members state
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(null);

  // Invitations state
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [role, setRole] = useState<string>('member');
  const [inviteEmail, setInviteEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [maxUses, setMaxUses] = useState(1);
  const [showAdvancedPerms, setShowAdvancedPerms] = useState(false);
  const [customPerms, setCustomPerms] = useState<IWorkspacePermissions>(getDefaultPermissions('member'));
  const [copied, setCopied] = useState<string | null>(null);
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Custom Roles state
  const [customRoles, setCustomRoles] = useState<any[]>([]);

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

  // Audit Logs & Sub-tabs state
  const [activeSubTab, setActiveSubTab] = useState<'members' | 'performance' | 'roles' | 'audit'>(initialSubTab || 'members');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const handleSubTabChange = (tab: 'members' | 'performance' | 'roles' | 'audit') => {
    setActiveSubTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "workspace");
      url.searchParams.set("subtab", tab);
      window.history.replaceState(null, "", url.toString());
    }
  };

  // Ownership transfer state
  const [transferTarget, setTransferTarget] = useState<{ id: string; name: string } | null>(null);
  const [transferConfirmText, setTransferConfirmText] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");

  const isOwner = activeWorkspace?.role === "owner";
  const isAdmin = ["owner", "admin"].includes(activeWorkspace?.role);
  const isTeam = activeWorkspace?.type === "team";

  useEffect(() => {
    setName(activeWorkspace?.name || "");
    if (isTeam) {
      fetchInvitations();
      fetchMembers();
      fetchCustomRoles();
      if (activeSubTab === "audit") {
        fetchAuditLogs();
      }
    } else {
      setLoading(false);
      setMembersLoading(false);
    }
  }, [activeWorkspace?._id, activeSubTab]);

  useEffect(() => {
    const baseRole = role.startsWith("custom:") 
      ? (customRoles.find(cr => cr._id === role.replace("custom:", ""))?.baseRole || 'member')
      : (role as Role);
    setCustomPerms(getDefaultPermissions(baseRole));
  }, [role, customRoles]);

  const fetchCustomRoles = async () => {
    try {
      const data = await getWorkspaceRoles(activeWorkspace._id);
      setCustomRoles(data);
    } catch (err) {
      console.error("Failed to fetch custom roles:", err);
    }
  };

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
      const isCustomRole = role.startsWith("custom:");
      const selectedCustomRoleId = isCustomRole ? role.replace("custom:", "") : undefined;
      const selectedCustomRole = isCustomRole ? customRoles.find(r => r._id === selectedCustomRoleId) : null;
      const baseRoleForInvite = (selectedCustomRole ? selectedCustomRole.baseRole : (role as 'admin' | 'member' | 'viewer'));

      const res = await createInvitation({ 
        workspaceId: activeWorkspace._id, 
        role: baseRoleForInvite, 
        customRoleId: selectedCustomRoleId,
        customRoleName: selectedCustomRole?.name,
        email: inviteEmail.trim() || undefined,
        permissions: showAdvancedPerms ? customPerms : (selectedCustomRole ? selectedCustomRole.permissions : undefined),
        maxUses: Number(maxUses) || 1, 
        expiresInDays: Number(expiresInDays) || 7 
      });

      if (res.success) {
        setInvitations([{
          _id: res.invitationId || ('temp-' + Date.now()),
          token: res.token,
          email: inviteEmail.trim() || null,
          role: selectedCustomRole?.name || role,
          expiresAt: new Date(Date.now() + (Number(expiresInDays) || 7) * 24 * 60 * 60 * 1000).toISOString(),
          uses: 0,
          maxUses: Number(maxUses) || 1,
          createdBy: { name: 'You' }
        }, ...invitations]);

        const targetEmail = inviteEmail.trim();
        if (targetEmail) {
          if (res.emailSent) {
            setInviteMsg({ 
              type: 'success', 
              text: `Invitation email sent directly to ${targetEmail}! You can also copy and share the link.`
            });
          } else {
            setInviteMsg({ 
              type: 'success', 
              text: `Invitation created for ${targetEmail}. Please copy and share the link directly.`
            });
          }
        } else {
          setInviteMsg({ 
            type: 'success', 
            text: "General invitation link generated successfully. Copy and share the link."
          });
        }

        // Reset input
        setInviteEmail("");
      }
    } catch (err: any) {
      setInviteMsg({ type: 'error', text: err.message || "Failed to generate invitation" });
    } finally {
      setGenerating(false);
    }
  };

  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleResend = async (id: string, email: string) => {
    try {
      setResendingId(id);
      const res = await resendWorkspaceInvitation(id);
      if (res.success) {
        if (res.emailSent) {
          alert(`Invitation email resent successfully to ${email}!`);
        } else {
          alert(`New invitation link generated! Please copy the link.`);
        }
        await fetchInvitations();
      }
    } catch (err: any) {
      alert(err.message || "Failed to resend invitation email");
    } finally {
      setResendingId(null);
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

  const handleRoleChange = async (targetUserId: string, newRole: Role, customRoleId?: string | null) => {
    try {
      setMemberActionLoading(targetUserId);
      await updateMemberRole(activeWorkspace._id, targetUserId, newRole, undefined, customRoleId);
      await fetchMembers();
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

  const handleToggleStatus = async (targetUserId: string, newStatus: "active" | "suspended") => {
    const actionWord = newStatus === "suspended" ? "suspend" : "activate";
    if (!confirm(`Are you sure you want to ${actionWord} this member?`)) return;
    try {
      setMemberActionLoading(targetUserId);
      const res = await toggleMemberStatus(activeWorkspace._id, targetUserId, newStatus);
      if (res.success) {
        setMembers(members.map(m => (m.userId?._id === targetUserId || m.userId === targetUserId) ? { ...m, status: newStatus } : m));
      }
    } catch (err: any) {
      alert(err.message || "Failed to update member status");
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTarget) return;
    if (transferConfirmText.trim().toLowerCase() !== activeWorkspace.name.trim().toLowerCase()) {
      setTransferError(`Please type "${activeWorkspace.name}" exactly to confirm.`);
      return;
    }
    try {
      setTransferLoading(true);
      setTransferError("");
      const res = await transferWorkspaceOwnership(activeWorkspace._id, transferTarget.id);
      if (res.success) {
        alert("Workspace ownership transferred successfully. You are now an Admin.");
        window.location.reload();
      }
    } catch (err: any) {
      setTransferError(err.message || "Failed to transfer ownership");
    } finally {
      setTransferLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const res = await getWorkspaceAuditLogs(activeWorkspace._id);
      if (res.success && res.logs) {
        setAuditLogs(res.logs);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setAuditLoading(false);
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

      {/* Sub-tabs for Team Workspaces */}
      {isTeam && (
        <div className="relative w-full border-b border-surface-variant/30 pb-3">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => handleSubTabChange("members")}
              className={`inline-flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeSubTab === "members"
                  ? "bg-stitch-primary text-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users size={14} className="shrink-0" />
              <span className="truncate">Members</span>
            </button>
            <button
              onClick={() => handleSubTabChange("performance")}
              className={`inline-flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeSubTab === "performance"
                  ? "bg-stitch-primary text-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <BarChart3 size={14} className="shrink-0" />
              <span className="truncate">Performance</span>
            </button>
            <button
              onClick={() => handleSubTabChange("roles")}
              className={`inline-flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeSubTab === "roles"
                  ? "bg-stitch-primary text-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <ShieldCheck size={14} className="shrink-0" />
              <span className="truncate">Custom Roles</span>
            </button>
            <button
              onClick={() => handleSubTabChange("audit")}
              className={`inline-flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeSubTab === "audit"
                  ? "bg-stitch-primary text-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <History size={14} className="shrink-0" />
              <span className="truncate">Audit Log</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Team Members List (Visible for Team Workspaces when activeSubTab is 'members') */}
      {isTeam && activeSubTab === "members" && (
        <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 border-b border-surface-variant/30 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stitch-primary/10 text-stitch-primary flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
              <div>
                <h4 className="text-base font-semibold text-on-surface">Team Members</h4>
                <p className="text-xs text-slate-400">
                  {members.length} member{members.length !== 1 ? 's' : ''} with active or suspended access to this workspace.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/workspace/members"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-variant/40 hover:bg-white/5 text-xs text-stitch-primary font-semibold transition-all shrink-0"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Open Dedicated Page</span>
              <span className="sm:hidden">Full Page</span>
            </Link>
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
                  const isSuspended = member.status === "suspended";
                  const avatarSrc = user?.avatarPublicId
                    ? `/api/assets/${user.avatarPublicId}?resourceType=image`
                    : user?.avatarUrl || user?.image || member.avatarUrl || member.image || null;

                  return (
                    <div key={member._id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors ${isSuspended ? "opacity-60 bg-amber-500/[0.03]" : ""}`}>
                      <div className="flex items-center gap-3">
                        <MemberAvatar
                          name={user?.name}
                          avatarPublicId={user?.avatarPublicId}
                          avatarUrl={avatarSrc}
                          size="md"
                          shape="rounded"
                        />
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
                            {member.customRoleName && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                <ShieldCheck size={10} /> {member.customRoleName}
                              </span>
                            )}
                            {isSuspended && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                                <Pause size={10} /> Suspended
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
                              value={member.customRoleId ? `custom:${member.customRoleId}` : member.role}
                              disabled={memberActionLoading === user?._id || isSuspended}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val.startsWith("custom:")) {
                                  const cId = val.replace("custom:", "");
                                  const matched = customRoles.find(r => r._id === cId);
                                  handleRoleChange(user._id, (matched?.baseRole || "member") as Role, cId);
                                } else {
                                  handleRoleChange(user._id, val as Role, null);
                                }
                              }}
                              className="h-8 px-2.5 bg-black/20 border border-white/10 text-white text-xs rounded-lg outline-none focus:border-stitch-primary"
                            >
                              <optgroup label="Standard Roles" className="bg-neutral-900 text-slate-300">
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                                <option value="viewer">Viewer</option>
                              </optgroup>
                              {customRoles.length > 0 && (
                                <optgroup label="Custom Roles" className="bg-neutral-900 text-stitch-primary">
                                  {customRoles.map((cr) => (
                                    <option key={cr._id} value={`custom:${cr._id}`}>
                                      {cr.name} ({cr.baseRole})
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </select>

                            {/* Suspend / Resume Button */}
                            <button
                              onClick={() => handleToggleStatus(user._id, isSuspended ? "active" : "suspended")}
                              disabled={memberActionLoading === user?._id}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isSuspended
                                  ? "text-emerald-400 hover:bg-emerald-500/10"
                                  : "text-amber-400 hover:bg-amber-500/10"
                              }`}
                              title={isSuspended ? "Activate member access" : "Suspend member access"}
                            >
                              {memberActionLoading === user?._id ? (
                                <Loader2 size={14} className="animate-spin text-amber-400" />
                              ) : isSuspended ? (
                                <Play size={15} />
                              ) : (
                                <Pause size={15} />
                              )}
                            </button>

                            {/* Transfer Ownership Button (Only for workspace Owner) */}
                            {isOwner && !isSuspended && (
                              <button
                                onClick={() => {
                                  setTransferTarget({ id: user._id, name: user.name || user.email });
                                  setTransferConfirmText("");
                                  setTransferError("");
                                }}
                                disabled={memberActionLoading === user?._id}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                                title="Transfer workspace ownership to this member"
                              >
                                <ArrowRightLeft size={15} />
                              </button>
                            )}

                            {/* Remove Member Button */}
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
                            {member.customRoleName || member.role}
                          </span>
                        )}

                        {/* Direct Member Details / Slug Page Link */}
                        <Link
                          href={`/dashboard/workspace/members/${user?._id || member.userId}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-stitch-primary hover:bg-stitch-primary/10 transition-colors shrink-0"
                          title="View member performance & details"
                        >
                          <ExternalLink size={15} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2B. Activity & Audit Log Feed (Visible when activeSubTab is 'audit') */}
      {isTeam && activeSubTab === "audit" && (
        <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 border-b border-surface-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stitch-primary/10 text-stitch-primary flex items-center justify-center shrink-0">
                <History size={20} />
              </div>
              <div>
                <h4 className="text-base font-semibold text-on-surface">Workspace Activity & Audit Log</h4>
                <p className="text-xs text-slate-400">
                  Real-time timeline of invitations, role modifications, member actions, and workspace changes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/workspace/audit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-variant/40 hover:bg-white/5 text-xs text-stitch-primary font-semibold transition-all shrink-0"
              >
                <ExternalLink size={13} />
                <span className="hidden sm:inline">Open Dedicated Page</span>
                <span className="sm:hidden">Full Page</span>
              </Link>
              <button
                onClick={fetchAuditLogs}
                disabled={auditLoading}
                className="text-xs px-3 py-1.5 rounded-lg border border-surface-variant/40 text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              >
                {auditLoading ? <Loader2 size={12} className="animate-spin" /> : "Refresh"}
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {auditLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-stitch-primary" />
                <span>Loading activity log...</span>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No recorded activity for this workspace yet.
              </div>
            ) : (
              <div className="divide-y divide-surface-variant/20">
                {auditLogs.map((log: any) => {
                  const getActionBadgeColor = (action: string) => {
                    if (action.includes("CREATE") || action.includes("ACCEPT")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    if (action.includes("REMOVE") || action.includes("DELETE") || action.includes("REVOKE")) return "bg-rose-500/10 text-rose-400 border-rose-500/20";
                    if (action.includes("ROLE") || action.includes("STATUS")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
                    return "bg-stitch-primary/10 text-stitch-primary border-stitch-primary/20";
                  };

                  return (
                    <div key={log._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        <MemberAvatar
                          name={log.user?.name}
                          avatarUrl={log.user?.image}
                          size="sm"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white">
                              {log.user?.name || "System"}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getActionBadgeColor(log.action)}`}>
                              {log.action}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {log.details?.action === "MEMBER_ROLE_UPDATE"
                              ? `Changed role of user to ${log.details.newRole}`
                              : log.details?.action === "MEMBER_STATUS_CHANGE"
                              ? `Changed member status to ${log.details.newStatus}`
                              : log.details?.action === "WORKSPACE_OWNERSHIP_TRANSFERRED"
                              ? "Transferred workspace ownership"
                              : log.details?.email
                              ? `Invited ${log.details.email} as ${log.details?.role || "member"}`
                              : log.entityType}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0 sm:self-center" suppressHydrationWarning>
                        {formatDateTime(new Date(log.createdAt))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2C. Team Performance & Analytics Tab */}
      {isTeam && activeSubTab === "performance" && (
        <WorkspacePerformanceTab
          workspaceId={activeWorkspace._id}
          isOwnerOrAdmin={isAdmin}
        />
      )}

      {/* 2D. Custom Roles Tab */}
      {isTeam && activeSubTab === "roles" && (
        <WorkspaceRolesTab
          workspaceId={activeWorkspace._id}
          isOwnerOrAdmin={isAdmin}
          onRolesChanged={() => {
            fetchCustomRoles();
            fetchMembers();
          }}
        />
      )}

      {/* 3. Team Invitations Section */}
      {isTeam && activeSubTab === "members" && (
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
                      <optgroup label="Standard Roles" className="bg-neutral-900 text-slate-300">
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </optgroup>
                      {customRoles.length > 0 && (
                        <optgroup label="Custom Roles" className="bg-neutral-900 text-stitch-primary">
                          {customRoles.map((cr) => (
                            <option key={cr._id} value={`custom:${cr._id}`}>
                              {cr.name} ({cr.baseRole})
                            </option>
                          ))}
                        </optgroup>
                      )}
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
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customPerms.finance?.manage ?? false}
                          onChange={(e) => setCustomPerms({
                            ...customPerms,
                            finance: { ...customPerms.finance, view: true, manage: e.target.checked }
                          })}
                          className="rounded border-white/20 bg-black/40 text-stitch-primary focus:ring-0"
                        />
                        <span>Manage Finance & Invoices</span>
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
                          <span className="text-[10px] text-slate-400" suppressHydrationWarning>
                            Expires: {formatDate(invite.expiresAt)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Created by {invite.createdBy?.name || 'You'} • Uses: {invite.uses}/{invite.maxUses || '1'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                      {invite.email && isAdmin && (
                        <button
                          onClick={() => handleResend(invite._id, invite.email)}
                          disabled={resendingId === invite._id}
                          className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium border border-white/10 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                          title="Resend invitation email"
                        >
                          {resendingId === invite._id ? <Loader2 size={12} className="animate-spin text-stitch-primary" /> : <Mail size={12} />}
                          <span>Resend Email</span>
                        </button>
                      )}

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
      ) : null}
      {/* Transfer Ownership Modal */}
      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-stitch-surface border border-surface-variant/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Crown size={20} />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Transfer Workspace Ownership</h4>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to transfer the primary ownership of <strong>{activeWorkspace.name}</strong> to <strong>{transferTarget.name}</strong>.
              After this transfer, you will become an <strong>Admin</strong> and will no longer be able to delete the workspace or re-transfer ownership.
            </p>

            {transferError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {transferError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Type <strong>{activeWorkspace.name}</strong> to confirm:
              </label>
              <input
                type="text"
                value={transferConfirmText}
                onChange={(e) => setTransferConfirmText(e.target.value)}
                placeholder={activeWorkspace.name}
                className="w-full h-9 px-3 rounded-xl bg-black/30 border border-white/10 text-white text-xs outline-none focus:border-stitch-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-variant/20">
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransferOwnership}
                disabled={transferLoading || transferConfirmText.trim().toLowerCase() !== activeWorkspace.name.trim().toLowerCase()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {transferLoading && <Loader2 size={13} className="animate-spin" />}
                <span>Confirm Transfer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
