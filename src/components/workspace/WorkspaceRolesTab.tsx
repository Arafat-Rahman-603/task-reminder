"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Check, 
  Loader2, 
  AlertCircle, 
  X,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { 
  getWorkspaceRoles, 
  createWorkspaceRole, 
  updateWorkspaceRole, 
  deleteWorkspaceRole 
} from "@/actions/workspaceRole.actions";
import { IWorkspacePermissions, getDefaultPermissions } from "@/lib/workspacePermissions";

interface WorkspaceRolesTabProps {
  workspaceId: string;
  isOwnerOrAdmin: boolean;
  onRolesChanged?: () => void;
}

const COLOR_CLASSES: Record<string, { badge: string; border: string; bg: string }> = {
  emerald: { badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", border: "border-emerald-500/30", bg: "bg-emerald-500" },
  blue: { badge: "text-blue-400 bg-blue-500/10 border-blue-500/20", border: "border-blue-500/30", bg: "bg-blue-500" },
  amber: { badge: "text-amber-400 bg-amber-500/10 border-amber-500/20", border: "border-amber-500/30", bg: "bg-amber-500" },
  purple: { badge: "text-purple-400 bg-purple-500/10 border-purple-500/20", border: "border-purple-500/30", bg: "bg-purple-500" },
  rose: { badge: "text-rose-400 bg-rose-500/10 border-rose-500/20", border: "border-rose-500/30", bg: "bg-rose-500" },
  cyan: { badge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", border: "border-cyan-500/30", bg: "bg-cyan-500" },
  indigo: { badge: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", border: "border-indigo-500/30", bg: "bg-indigo-500" },
  slate: { badge: "text-slate-400 bg-slate-500/10 border-slate-500/20", border: "border-slate-500/30", bg: "bg-slate-500" },
};

export default function WorkspaceRolesTab({
  workspaceId,
  isOwnerOrAdmin,
  onRolesChanged,
}: WorkspaceRolesTabProps) {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("emerald");
  const [baseRole, setBaseRole] = useState<"admin" | "member" | "viewer">("member");
  const [permissions, setPermissions] = useState<IWorkspacePermissions>(getDefaultPermissions("member"));
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, [workspaceId]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await getWorkspaceRoles(workspaceId);
      setRoles(data);
    } catch (err) {
      console.error("Failed to fetch custom roles:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setName("");
    setDescription("");
    setColor("emerald");
    setBaseRole("member");
    setPermissions(getDefaultPermissions("member"));
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (r: any) => {
    setEditingRole(r);
    setName(r.name);
    setDescription(r.description || "");
    setColor(r.color || "emerald");
    setBaseRole(r.baseRole || "member");
    setPermissions(r.permissions || getDefaultPermissions(r.baseRole || "member"));
    setFormError("");
    setModalOpen(true);
  };

  const handleBaseRoleChange = (newBase: "admin" | "member" | "viewer") => {
    setBaseRole(newBase);
    // When creating, update default permissions according to base role
    if (!editingRole) {
      setPermissions(getDefaultPermissions(newBase));
    }
  };

  const togglePermission = (module: keyof IWorkspacePermissions, action: string) => {
    setPermissions((prev) => {
      const currentMod = (prev[module] as Record<string, boolean>) || {};
      const updatedMod = {
        ...currentMod,
        [action]: !currentMod[action],
      };
      return {
        ...prev,
        [module]: updatedMod,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Role name is required");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError("");

      if (editingRole) {
        const res = await updateWorkspaceRole({
          workspaceId,
          roleId: editingRole._id,
          name: name.trim(),
          description: description.trim(),
          color,
          permissions,
        });
        if (res.success) {
          setModalOpen(false);
          await fetchRoles();
          if (onRolesChanged) onRolesChanged();
        }
      } else {
        const res = await createWorkspaceRole({
          workspaceId,
          name: name.trim(),
          description: description.trim(),
          color,
          baseRole,
          permissions,
        });
        if (res.success) {
          setModalOpen(false);
          await fetchRoles();
          if (onRolesChanged) onRolesChanged();
        }
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to save role");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete role "${roleName}"? Any members currently assigned to it will revert to their base role authority.`)) {
      return;
    }
    try {
      setDeleteLoading(roleId);
      const res = await deleteWorkspaceRole(workspaceId, roleId);
      if (res.success) {
        setRoles(roles.filter((r) => r._id !== roleId));
        if (onRolesChanged) onRolesChanged();
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete role");
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-surface-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stitch-primary/10 text-stitch-primary flex items-center justify-center shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <h4 className="text-base font-semibold text-on-surface">Custom Roles & Permissions</h4>
            <p className="text-xs text-slate-400">
              Define custom business roles (e.g. Finance, Accountant, HR, Project Lead) with tailored permissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <Link
            href="/dashboard/workspace/roles"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-surface-variant/40 hover:bg-white/5 text-xs text-stitch-primary font-semibold transition-all"
          >
            <ExternalLink size={13} />
            <span>Open Dedicated Page</span>
          </Link>
          {isOwnerOrAdmin && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stitch-primary text-black font-semibold text-xs hover:bg-stitch-primary/90 transition-all shadow-md shrink-0"
            >
              <Plus size={14} />
              Create Custom Role
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-stitch-primary" />
            <span>Loading custom roles...</span>
          </div>
        ) : roles.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
              <Shield size={24} />
            </div>
            <div>
              <p className="font-medium text-slate-300">No custom roles created yet</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                Default system roles (Owner, Admin, Member, Viewer) are active. You can create specialized roles like Finance, HR, or Lead to grant specific permissions.
              </p>
            </div>
            {isOwnerOrAdmin && (
              <button
                onClick={openCreateModal}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-variant/40 text-xs font-medium text-stitch-primary hover:bg-stitch-primary/10 transition-all"
              >
                <Plus size={13} /> Add First Custom Role
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((r) => {
              const colorInfo = COLOR_CLASSES[r.color] || COLOR_CLASSES.emerald;
              return (
                <div
                  key={r._id}
                  className="rounded-xl border border-surface-variant/40 bg-surface-container/50 p-4 flex flex-col justify-between space-y-3 hover:border-surface-variant/70 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3 h-3 rounded-full ${colorInfo.bg}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-on-surface">{r.name}</h5>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${colorInfo.badge}`}>
                            {r.baseRole.toUpperCase()} TIER
                          </span>
                        </div>
                        {r.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.description}</p>
                        )}
                      </div>
                    </div>

                    {isOwnerOrAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(r)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                          title="Edit role"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(r._id, r.name)}
                          disabled={deleteLoading === r._id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete role"
                        >
                          {deleteLoading === r._id ? (
                            <Loader2 size={13} className="animate-spin text-rose-400" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Summary of permissions & Details link */}
                  <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-stitch-primary" />
                      <span>{r.memberCount || 0} active {r.memberCount === 1 ? "member" : "members"}</span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="flex items-center gap-2">
                        {r.permissions?.tasks?.create && <span className="text-emerald-400">Tasks: Create</span>}
                        {r.permissions?.members?.manage && <span className="text-amber-400">Members: Manage</span>}
                        {r.permissions?.settings?.manage && <span className="text-rose-400">Settings: Admin</span>}
                      </div>

                      <Link
                        href={`/dashboard/workspace/roles/${r._id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-stitch-primary hover:underline shrink-0 ml-auto"
                      >
                        <span>Details</span>
                        <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface-container border border-surface-variant/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-variant/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-stitch-primary/10 text-stitch-primary flex items-center justify-center">
                  <Sliders size={16} />
                </div>
                <h4 className="text-base font-bold text-on-surface">
                  {editingRole ? `Edit Role: ${editingRole.name}` : "Create New Custom Role"}
                </h4>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Role Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Finance Manager, Lead Accountant, HR Specialist"
                  required
                  maxLength={50}
                  className="w-full h-9 px-3 rounded-xl bg-black/30 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-stitch-primary transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of duties and access level"
                  maxLength={150}
                  className="w-full h-9 px-3 rounded-xl bg-black/30 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-stitch-primary transition-all"
                />
              </div>

              {/* Color & Base Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Badge Color</label>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {Object.keys(COLOR_CLASSES).map((cKey) => {
                      const c = COLOR_CLASSES[cKey];
                      return (
                        <button
                          key={cKey}
                          type="button"
                          onClick={() => setColor(cKey)}
                          className={`w-6 h-6 rounded-full ${c.bg} transition-all flex items-center justify-center ${
                            color === cKey ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100"
                          }`}
                        >
                          {color === cKey && <Check size={12} className="text-black stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Base Authority Tier</label>
                  <select
                    value={baseRole}
                    disabled={!!editingRole}
                    onChange={(e) => handleBaseRoleChange(e.target.value as any)}
                    className="w-full h-9 px-2.5 bg-black/30 border border-white/10 text-white text-xs rounded-xl outline-none focus:border-stitch-primary"
                  >
                    <option value="member">Member Tier (Standard Worker)</option>
                    <option value="admin">Admin Tier (Team Overseer)</option>
                    <option value="viewer">Viewer Tier (Read-Only)</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions Editor */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stitch-primary">
                  Module Permissions
                </label>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {/* Tasks */}
                  <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 space-y-1.5">
                    <span className="text-xs font-semibold text-white">Tasks Module</span>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {["view", "create", "edit", "delete", "assign"].map((act) => {
                        const checked = !!permissions.tasks?.[act as keyof typeof permissions.tasks];
                        return (
                          <label key={act} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission("tasks", act)}
                              className="rounded border-white/20 bg-white/5 text-stitch-primary focus:ring-0"
                            />
                            <span className="capitalize">{act}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Projects & Routines */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 space-y-1.5">
                      <span className="text-xs font-semibold text-white">Projects</span>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {["view", "create", "edit", "delete"].map((act) => {
                          const checked = !!permissions.projects?.[act as keyof typeof permissions.projects];
                          return (
                            <label key={act} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermission("projects", act)}
                                className="rounded border-white/20 bg-white/5 text-stitch-primary focus:ring-0"
                              />
                              <span className="capitalize">{act}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 space-y-1.5">
                      <span className="text-xs font-semibold text-white">Routines</span>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {["view", "manage"].map((act) => {
                          const checked = !!permissions.routines?.[act as keyof typeof permissions.routines];
                          return (
                            <label key={act} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermission("routines", act)}
                                className="rounded border-white/20 bg-white/5 text-stitch-primary focus:ring-0"
                              />
                              <span className="capitalize">{act}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Files & Members */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 space-y-1.5">
                      <span className="text-xs font-semibold text-white">Files & Attachments</span>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {["view", "upload"].map((act) => {
                          const checked = !!permissions.files?.[act as keyof typeof permissions.files];
                          return (
                            <label key={act} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermission("files", act)}
                                className="rounded border-white/20 bg-white/5 text-stitch-primary focus:ring-0"
                              />
                              <span className="capitalize">{act}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 space-y-1.5">
                      <span className="text-xs font-semibold text-white">Member Governance</span>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {["view", "manage"].map((act) => {
                          const checked = !!permissions.members?.[act as keyof typeof permissions.members];
                          return (
                            <label key={act} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermission("members", act)}
                                className="rounded border-white/20 bg-white/5 text-stitch-primary focus:ring-0"
                              />
                              <span className="capitalize">{act}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-variant/30">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stitch-primary text-black font-semibold text-xs hover:bg-stitch-primary/90 transition-all disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  {editingRole ? "Save Changes" : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
