"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ExternalLink,
  Search,
  Sparkles,
  CheckCheck,
  Briefcase
} from "lucide-react";
import { 
  getWorkspaceRoles, 
  createWorkspaceRole, 
  updateWorkspaceRole, 
  deleteWorkspaceRole 
} from "@/actions/workspaceRole.actions";
import { IWorkspacePermissions, getDefaultPermissions } from "@/lib/workspacePermissions";

export interface WorkspaceRoleItem {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  baseRole: "admin" | "member" | "viewer";
  permissions: IWorkspacePermissions;
  isSystem?: boolean;
  memberCount?: number;
  assignedUsersCount?: number;
  [key: string]: unknown;
}

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

const ROLE_PRESETS = [
  {
    title: "Finance Specialist",
    desc: "Oversees financial records, invoices, and budgets.",
    color: "cyan",
    baseRole: "member" as const,
    icon: Briefcase,
    permissions: {
      ...getDefaultPermissions("member"),
      finance: { view: true, manage: true },
    },
  },
  {
    title: "Project Coordinator",
    desc: "Assigns tasks, manages timelines, and oversees deliverables.",
    color: "emerald",
    baseRole: "admin" as const,
    icon: CheckCheck,
    permissions: {
      ...getDefaultPermissions("admin"),
      tasks: { view: true, create: true, edit: true, delete: true, assign: true },
      projects: { view: true, create: true, edit: true, delete: true },
    },
  },
  {
    title: "Compliance Auditor",
    desc: "Read-only access for compliance, governance, and audit tracking.",
    color: "purple",
    baseRole: "viewer" as const,
    icon: Shield,
    permissions: {
      ...getDefaultPermissions("viewer"),
      auditLogs: { view: true },
    },
  },
];

export default function WorkspaceRolesTab({
  workspaceId,
  isOwnerOrAdmin,
  onRolesChanged,
}: WorkspaceRolesTabProps) {
  const pathname = usePathname();
  const isDedicated = pathname === "/dashboard/workspace/roles";

  const [roles, setRoles] = useState<WorkspaceRoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<WorkspaceRoleItem | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("emerald");
  const [baseRole, setBaseRole] = useState<"admin" | "member" | "viewer">("member");
  const [permissions, setPermissions] = useState<IWorkspacePermissions>(getDefaultPermissions("member"));
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const refetchRoles = async () => {
    try {
      setLoading(true);
      const data = await getWorkspaceRoles(workspaceId);
      setRoles(data as unknown as WorkspaceRoleItem[]);
    } catch (err) {
      console.error("Failed to fetch custom roles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    getWorkspaceRoles(workspaceId)
      .then((data) => {
        if (!ignore) {
          setRoles(data as unknown as WorkspaceRoleItem[]);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to fetch custom roles:", err);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [workspaceId]);

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

  const applyPreset = (preset: typeof ROLE_PRESETS[0]) => {
    setEditingRole(null);
    setName(preset.title);
    setDescription(preset.desc);
    setColor(preset.color);
    setBaseRole(preset.baseRole);
    setPermissions(preset.permissions);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (r: WorkspaceRoleItem) => {
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

  const toggleAllModule = (module: keyof IWorkspacePermissions, actions: string[]) => {
    setPermissions((prev) => {
      const currentMod = (prev[module] as Record<string, boolean>) || {};
      const allActive = actions.every((act) => !!currentMod[act]);
      const newMod: Record<string, boolean> = { ...currentMod };
      actions.forEach((act) => {
        newMod[act] = !allActive;
      });
      return {
        ...prev,
        [module]: newMod,
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
          await refetchRoles();
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
          await refetchRoles();
          if (onRolesChanged) onRolesChanged();
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error.message || "Failed to save role");
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
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Failed to delete role");
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredRoles = roles.filter((r) =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.baseRole?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-surface-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stitch-primary/10 text-stitch-primary flex items-center justify-center shrink-0 ring-1 ring-stitch-primary/20">
            <Shield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-on-surface">Custom Roles & Permissions</h4>
              {!loading && roles.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/20">
                  {roles.length} {roles.length === 1 ? 'Role' : 'Roles'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Define custom business roles (e.g. Finance, Accountant, HR, Project Lead) with tailored permissions.
            </p>
          </div>
        </div>

        {/* 2 Buttons placed side-by-side (2 pase) on mobile and right-aligned on desktop */}
        <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-2.5 pt-1 sm:pt-0">
          <Link
            href={isDedicated ? "/dashboard/settings?tab=workspace&subtab=roles" : "/dashboard/workspace/roles"}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-surface-variant/40 hover:bg-white/5 text-xs text-stitch-primary font-semibold transition-all shrink-0"
          >
            {isDedicated ? (
              <>
                <Sliders size={13} />
                <span>Workspace Settings</span>
              </>
            ) : (
              <>
                <ExternalLink size={13} />
                <span>Open Dedicated Page</span>
              </>
            )}
          </Link>
          {isOwnerOrAdmin && (
            <button
              onClick={openCreateModal}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-stitch-primary text-black font-semibold text-xs hover:bg-stitch-primary/90 transition-all shadow-md shrink-0"
            >
              <Plus size={14} />
              <span>Create Custom Role</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        {/* Search bar when 2 or more roles exist */}
        {!loading && roles.length >= 2 && (
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search custom roles by title or authority tier..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-black/20 border border-surface-variant/30 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-stitch-primary transition-all"
            />
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-stitch-primary" />
            <span>Loading custom roles...</span>
          </div>
        ) : roles.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
              <Shield size={24} />
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-200">No custom roles created yet</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                Default system roles (Owner, Admin, Member, Viewer) are active. Create specialized roles or start quickly with a pre-configured template below.
              </p>
            </div>

            {/* Quick Starter Templates */}
            {isOwnerOrAdmin && (
              <div className="w-full max-w-xl pt-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stitch-primary mb-2.5 flex items-center justify-center gap-1.5">
                  <Sparkles size={12} />
                  <span>Quick Starter Presets</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
                  {ROLE_PRESETS.map((preset) => {
                    const IconComp = preset.icon;
                    return (
                      <button
                        key={preset.title}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="p-3 rounded-xl border border-surface-variant/30 bg-surface-container/40 hover:bg-surface-variant/30 hover:border-stitch-primary/40 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-lg bg-stitch-primary/10 text-stitch-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                            <IconComp size={13} />
                          </div>
                          <span className="font-semibold text-xs text-on-surface">{preset.title}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">{preset.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isOwnerOrAdmin && (
              <button
                onClick={openCreateModal}
                className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-surface-variant/40 text-xs font-semibold text-stitch-primary hover:bg-stitch-primary/10 transition-all"
              >
                <Plus size={14} /> Create Blank Role
              </button>
            )}
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            <p>No roles matching &quot;{searchQuery}&quot;</p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-2 text-stitch-primary hover:underline font-semibold"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoles.map((r) => {
              const colorInfo = (r.color && r.color in COLOR_CLASSES ? COLOR_CLASSES[r.color as keyof typeof COLOR_CLASSES] : undefined) || COLOR_CLASSES.emerald;
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {r.permissions?.tasks?.create && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Tasks: Create
                          </span>
                        )}
                        {r.permissions?.finance?.manage && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Finance: Full
                          </span>
                        )}
                        {r.permissions?.members?.manage && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Members: Admin
                          </span>
                        )}
                        {r.permissions?.settings?.manage && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Settings: Admin
                          </span>
                        )}
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
                    onChange={(e) => handleBaseRoleChange(e.target.value as "admin" | "member" | "viewer")}
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
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Tasks Module</span>
                      <button
                        type="button"
                        onClick={() => toggleAllModule("tasks", ["view", "create", "edit", "delete", "assign"])}
                        className="text-[10px] text-stitch-primary hover:underline font-medium"
                      >
                        Toggle All
                      </button>
                    </div>
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
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Projects</span>
                        <button
                          type="button"
                          onClick={() => toggleAllModule("projects", ["view", "create", "edit", "delete"])}
                          className="text-[10px] text-stitch-primary hover:underline font-medium"
                        >
                          Toggle All
                        </button>
                      </div>
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
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Routines</span>
                        <button
                          type="button"
                          onClick={() => toggleAllModule("routines", ["view", "manage"])}
                          className="text-[10px] text-stitch-primary hover:underline font-medium"
                        >
                          Toggle All
                        </button>
                      </div>
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
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Files & Attachments</span>
                        <button
                          type="button"
                          onClick={() => toggleAllModule("files", ["view", "upload"])}
                          className="text-[10px] text-stitch-primary hover:underline font-medium"
                        >
                          Toggle All
                        </button>
                      </div>
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
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Member Governance</span>
                        <button
                          type="button"
                          onClick={() => toggleAllModule("members", ["view", "manage"])}
                          className="text-[10px] text-stitch-primary hover:underline font-medium"
                        >
                          Toggle All
                        </button>
                      </div>
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

                  {/* Finance & Invoicing Module */}
                  <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Finance & Invoicing Module</span>
                      <button
                        type="button"
                        onClick={() => toggleAllModule("finance", ["view", "manage"])}
                        className="text-[10px] text-stitch-primary hover:underline font-medium"
                      >
                        Toggle All
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {[
                        { act: "view", label: "View Invoices & Billing" },
                        { act: "manage", label: "Manage Invoices & Budgets" },
                      ].map(({ act, label }) => {
                        const checked = !!permissions.finance?.[act as keyof typeof permissions.finance];
                        return (
                          <label key={act} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission("finance", act)}
                              className="rounded border-white/20 bg-white/5 text-stitch-primary focus:ring-0"
                            />
                            <span>{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Databases & Audit Logs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Custom Databases</span>
                        <button
                          type="button"
                          onClick={() => toggleAllModule("customSections", ["view", "manage"])}
                          className="text-[10px] text-stitch-primary hover:underline font-medium"
                        >
                          Toggle All
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {[
                          { act: "view", label: "View Records" },
                          { act: "manage", label: "Manage Schemas" },
                        ].map(({ act, label }) => {
                          const checked = !!permissions.customSections?.[act as keyof typeof permissions.customSections];
                          return (
                            <label key={act} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermission("customSections", act)}
                                className="rounded border-white/20 bg-white/5 text-stitch-primary focus:ring-0"
                              />
                              <span>{label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 space-y-1.5">
                      <span className="text-xs font-semibold text-white">Audit & Governance</span>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!permissions.auditLogs?.view}
                            onChange={() => togglePermission("auditLogs", "view")}
                            className="rounded border-white/20 bg-white/5 text-stitch-primary focus:ring-0"
                          />
                          <span>View Audit Logs</span>
                        </label>
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
