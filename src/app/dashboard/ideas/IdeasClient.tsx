"use client";
import { formatDate } from "@/lib/dateUtils";

import { useState, useTransition } from "react";
import { createIdea, deleteIdea, updateIdeaStatus } from "@/actions/idea.actions";
import { useRouter } from "next/navigation";
import { Lightbulb, Plus, Trash2, ArrowRight, CheckCircle2, Archive, Inbox, Target, Search, X, Paperclip, Lock, Users, Shield } from "lucide-react";
import { FilterSystem, FilterDefinition } from "@/components/ui/FilterSystem";
import { AttachmentUpload } from "@/components/ui/AttachmentUpload";
import Link from "next/link";

const STATUS_CONFIG = {
  Inbox: { label: "Inbox", color: "text-stitch-secondary", bg: "bg-secondary/20", icon: Inbox },
  Exploring: { label: "Exploring", color: "text-stitch-primary", bg: "bg-primary/20", icon: Lightbulb },
  Planned: { label: "Planned", color: "text-tertiary", bg: "bg-tertiary/20", icon: Target },
  "In Progress": { label: "In Progress", color: "text-success", bg: "bg-success/20", icon: CheckCircle2 },
  Archived: { label: "Archived", color: "text-on-surface-variant", bg: "bg-surface-variant/40", icon: Archive },
};



// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IdeasAny = any;
function IdeaCard({ idea, onDelete, onStatusChange }: { idea: IdeasAny; onDelete: (id: string) => void; onStatusChange: (id: string, status: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const config = STATUS_CONFIG[idea.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.Inbox;
  const Icon = config.icon;

  const handleDelete = () => {
    if (idea.canEdit === false) {
      alert("Permission denied: You do not have permission to delete this idea.");
      return;
    }
    if (!confirm(`Delete "${idea.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteIdea(idea._id);
      if (res && !res.success) {
        alert(res.error || "Failed to delete idea");
        return;
      }
      onDelete(idea._id);
    });
  };

  const handleAdvance = () => {
    if (idea.canEdit === false) {
      alert("Permission denied: You do not have permission to modify this idea.");
      return;
    }
    const statuses = Object.keys(STATUS_CONFIG);
    const currentIdx = statuses.indexOf(idea.status);
    const nextStatus = statuses[Math.min(currentIdx + 1, statuses.length - 2)]; // Never auto-archive
    startTransition(async () => {
      const res = await updateIdeaStatus(idea._id, nextStatus);
      if (res && !res.success) {
        alert(res.error || "Failed to update idea");
        return;
      }
      onStatusChange(idea._id, nextStatus);
    });
  };

  return (
    <article className={`group relative rounded-2xl bg-surface-container/70 backdrop-blur-xl p-4 shadow-md border border-surface-container-high transition-all duration-200 hover:bg-surface-container/90 ${isPending ? 'opacity-50' : ''}`}>
      <div className="flex flex-col gap-2.5">
        {/* Status Badge + Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${config.bg} ${config.color}`}>
              <Icon className="w-[11px] h-[11px]" />
              {config.label}
            </span>
            {idea.canEdit === false && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Read-only access">
                <Lock className="w-2.5 h-2.5" /> View Only
              </span>
            )}
            {idea.visibility === "restricted" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/20" title="Restricted to specific members">
                <Users className="w-2.5 h-2.5" /> Restricted
              </span>
            )}
            {idea.visibility === "private" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-container-high text-on-surface-variant border border-surface-variant/40" title="Visible only to creator">
                <Lock className="w-2.5 h-2.5" /> Private
              </span>
            )}
          </div>
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            {idea.canEdit !== false ? (
              <button
                onClick={handleDelete}
                aria-label="Delete idea"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
              >
                <Trash2 className="w-[13px] h-[13px]" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Title */}
        <Link href={`/dashboard/ideas/${idea.slug}`} className="hover:underline">
          <h3 className="text-sm font-semibold text-on-surface leading-snug">{idea.title}</h3>
        </Link>

        {/* Description */}
        {idea.description && (
          <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{idea.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-surface-container-high">
          <span suppressHydrationWarning className="text-[10px] text-on-surface-variant">
            {formatDate(idea.createdAt)}
          </span>
          {idea.status !== "In Progress" && idea.status !== "Archived" && idea.canEdit !== false && (
            <button
              onClick={handleAdvance}
              className="text-[11px] font-semibold text-stitch-primary hover:text-primary-fixed transition-colors flex items-center gap-1"
            >
              Advance <ArrowRight className="w-[11px] h-[11px]" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}



export default function IdeasClient({ 
  initialIdeas, 
  initialBlocks: _initialBlocks = [],
  workspaceMembers = [],
  isTeamWorkspace: initialIsTeamWorkspace,
}: { 
  initialIdeas: IdeasAny[];
  initialBlocks?: IdeasAny[];
  workspaceMembers?: IdeasAny[];
  isTeamWorkspace?: boolean;
}) {
  const isTeamWorkspace = initialIsTeamWorkspace ?? (workspaceMembers && workspaceMembers.length > 1);
  const router = useRouter();
  const [ideas, setIdeas] = useState(initialIdeas);
  const [activeStatus, setActiveStatus] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const [attachments, setAttachments] = useState<IdeasAny[]>([]);

  // Permissions state
  const [visibility, setVisibility] = useState<'workspace' | 'private' | 'restricted'>('workspace');
  const [visibleToMembers, setVisibleToMembers] = useState<string[]>([]);
  const [editableBy, setEditableBy] = useState<'workspace' | 'creator_only' | 'restricted'>('workspace');
  const [editableByMembers, setEditableByMembers] = useState<string[]>([]);

  const IDEAS_FILTERS: FilterDefinition[] = [
    {
      id: "status",
      label: "Status",
      type: "select",
      options: Object.keys(STATUS_CONFIG).map(s => ({ value: s, label: STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label }))
    },
    {
      id: "date",
      label: "Custom Date Range",
      type: "date-range"
    }
  ];

  const handleDelete = (id: string) => {
    setIdeas(prev => prev.filter(i => i._id !== id));
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    setIdeas(prev => prev.map(i => i._id === id ? { ...i, status: newStatus } : i));
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    const title = formData.get("title") as string;
    
    // Custom Validation
    if (!title || title.trim() === "") {
      setError("Cannot add idea yet. Missing required field: Title. Please complete it to continue.");
      setLoading(false);
      return;
    }

    const res = await createIdea({
      title,
      description: formData.get("description") as string,
      status: (formData.get("status") as string) || "Inbox",
      visibility,
      visibleToMembers,
      editableBy,
      editableByMembers,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (res.success) {
      setIdeas(prev => [res.idea, ...prev]);
      form.reset();
      setAttachments([]);
      setVisibility('workspace');
      setVisibleToMembers([]);
      setEditableBy('workspace');
      setEditableByMembers([]);
      setShowAddForm(false);
      router.refresh();
    } else {
      setError(res.error || "Failed to capture idea");
    }
    setLoading(false);
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchesTabStatus = activeStatus === "all" || idea.status === activeStatus;
    const matchesFilterStatus = !filters.status || idea.status === filters.status;
    const matchesSearch = !searchQuery || 
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Custom Date Range
    let matchesDate = true;
    if (idea.createdAt && (filters.date_start || filters.date_end)) {
      const created = new Date(idea.createdAt);
      if (filters.date_start) {
        const start = new Date(filters.date_start);
        start.setHours(0, 0, 0, 0);
        if (created < start) matchesDate = false;
      }
      if (filters.date_end) {
        const end = new Date(filters.date_end);
        end.setHours(23, 59, 59, 999);
        if (created > end) matchesDate = false;
      }
    }
    
    return matchesTabStatus && matchesFilterStatus && matchesSearch && matchesDate;
  });

  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = ideas.filter(i => i.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col w-full text-on-surface space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-wider uppercase text-stitch-primary">Ideas</span>
          <h2 className="text-xl font-bold tracking-tight text-on-surface">Idea Pipeline</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ideas..."
              className="w-full pl-10 pr-4 h-10 text-sm rounded-xl bg-surface-container-low/70 backdrop-blur-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:bg-surface-container/90 transition-all border border-surface-variant/40"
            />
          </div>
          <FilterSystem 
            filters={IDEAS_FILTERS} 
            appliedState={filters}
            onApply={(newFilters) => setFilters(newFilters)} 
          />
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl bg-primary-container text-on-primary-container font-medium text-xs shadow-md hover:bg-stitch-primary hover:text-on-primary transition-all active:scale-95"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? "Cancel" : "New Idea"}
          </button>
        </div>
      </div>

      {/* Hardcoded Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-surface-container/60 backdrop-blur-xl rounded-2xl shadow-sm border border-surface-container-high flex flex-col justify-center">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant mb-1">Total Ideas</span>
          <span className="text-2xl font-bold text-on-surface">{ideas.length}</span>
        </div>
        <div className="p-4 bg-surface-container/60 backdrop-blur-xl rounded-2xl shadow-sm border border-surface-container-high flex flex-col justify-center">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant mb-1 flex items-center gap-1.5"><Inbox className="w-3 h-3"/> Inbox</span>
          <span className="text-2xl font-bold text-stitch-secondary">{statusCounts['Inbox'] || 0}</span>
        </div>
        <div className="p-4 bg-surface-container/60 backdrop-blur-xl rounded-2xl shadow-sm border border-surface-container-high flex flex-col justify-center">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant mb-1 flex items-center gap-1.5"><Lightbulb className="w-3 h-3 text-stitch-primary"/> Exploring</span>
          <span className="text-2xl font-bold text-stitch-primary">{statusCounts['Exploring'] || 0}</span>
        </div>
        <div className="p-4 bg-surface-container/60 backdrop-blur-xl rounded-2xl shadow-sm border border-surface-container-high flex flex-col justify-center">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant mb-1 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-success"/> In Progress</span>
          <span className="text-2xl font-bold text-success">{statusCounts['In Progress'] || 0}</span>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-4 shadow-lg border border-primary/20">
          <h3 className="text-sm font-semibold text-on-surface mb-3">Capture New Idea</h3>
          {error && <div className="mb-3 p-2 text-xs text-danger-foreground bg-danger/20 rounded-lg">{error}</div>}
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              name="title"
              type="text"
              onChange={() => setError("")}
              placeholder="What's the idea?"
              className={`w-full h-10 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/50 text-sm focus:outline-none focus:bg-surface-container-high transition-all ${error && error.includes('Title') ? 'border border-error' : ''}`}
            />
            <textarea
              name="description"
              placeholder="Quick summary... (optional)"
              rows={2}
              className="px-3.5 py-2.5 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/50 text-sm focus:outline-none focus:bg-surface-container-high transition-all resize-none"
            />
            
            {/* Workspace Permissions Setting */}
            <div className="p-3.5 rounded-xl bg-surface-container-high/40 border border-surface-variant/30 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                <Shield className="w-3.5 h-3.5 text-stitch-primary" /> Workspace Permissions
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-on-surface-variant font-medium mb-1 block">Who can view this idea?</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as IdeasAny)}
                    className="w-full h-9 px-3 rounded-xl bg-surface-container-high/60 text-on-surface text-xs focus:outline-none focus:bg-surface-container-high transition-all"
                  >
                    <option value="workspace">Entire Workspace (Everyone)</option>
                    <option value="private">Only Me (Private)</option>
                    <option value="restricted">Specific Members...</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-on-surface-variant font-medium mb-1 block">Who can edit this idea?</label>
                  <select
                    value={editableBy}
                    onChange={(e) => setEditableBy(e.target.value as IdeasAny)}
                    className="w-full h-9 px-3 rounded-xl bg-surface-container-high/60 text-on-surface text-xs focus:outline-none focus:bg-surface-container-high transition-all"
                  >
                    <option value="workspace">Anyone who can view (Default)</option>
                    <option value="creator_only">Only Me & Admins</option>
                    <option value="restricted">Specific Editors...</option>
                  </select>
                </div>
              </div>

              {/* Specific Members Pickers */}
              {(visibility === "restricted" || editableBy === "restricted") && workspaceMembers.length > 0 && (
                <div className="pt-2 border-t border-surface-variant/20 space-y-2.5">
                  {visibility === "restricted" && (
                    <div>
                      <p className="text-[11px] text-on-surface-variant font-medium mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3 text-stitch-primary" /> Allowed Viewers:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {workspaceMembers.map((m: IdeasAny) => {
                          const u = m.userId || m;
                          const uId = u?._id ? u._id.toString() : (m.userId || m._id || m.id || "");
                          const uName = m.name || u.name || m.email || u.email || "Member";
                          const checked = visibleToMembers.includes(uId);
                          return (
                            <button
                              key={uId}
                              type="button"
                              onClick={() => {
                                setVisibleToMembers(prev =>
                                  checked ? prev.filter(id => id !== uId) : [...prev, uId]
                                );
                              }}
                              className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition-all ${
                                checked
                                  ? "bg-stitch-primary/15 border-stitch-primary/40 text-stitch-primary"
                                  : "bg-surface-container border-surface-variant/40 text-on-surface-variant hover:text-on-surface"
                              }`}
                            >
                              {uName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {editableBy === "restricted" && (
                    <div>
                      <p className="text-[11px] text-on-surface-variant font-medium mb-1 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-stitch-primary" /> Allowed Editors:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {workspaceMembers.map((m: IdeasAny) => {
                          const u = m.userId || m;
                          const uId = u?._id ? u._id.toString() : (m.userId || m._id || m.id || "");
                          const uName = m.name || u.name || m.email || u.email || "Member";
                          const checked = editableByMembers.includes(uId);
                          return (
                            <button
                              key={uId}
                              type="button"
                              onClick={() => {
                                setEditableByMembers(prev =>
                                  checked ? prev.filter(id => id !== uId) : [...prev, uId]
                                );
                              }}
                              className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition-all ${
                                checked
                                  ? "bg-stitch-primary/15 border-stitch-primary/40 text-stitch-primary"
                                  : "bg-surface-container border-surface-variant/40 text-on-surface-variant hover:text-on-surface"
                              }`}
                            >
                              {uName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5"/> Attachments</label>
              <AttachmentUpload
                multiple
                folder="manageo/ideas"
                attachments={attachments}
                onChange={setAttachments}
                label="Add files"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                name="status"
                className="flex-1 h-10 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all"
                defaultValue="Inbox"
              >
                {Object.keys(STATUS_CONFIG).slice(0, -1).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-stitch-primary text-on-primary text-sm font-semibold hover:bg-primary-fixed-dim transition-colors disabled:opacity-60"
              >
                {loading ? "Saving..." : "Capture"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveStatus("all")}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${activeStatus === "all" ? "bg-surface-container-high text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
        >
          All
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-surface-container text-on-surface-variant">{ideas.length}</span>
        </button>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const isActive = activeStatus === status;
          return (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${isActive ? `${config.bg} ${config.color}` : "text-on-surface-variant hover:text-on-surface"}`}
            >
              {config.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-black/10" : "bg-surface-container text-on-surface-variant"}`}>
                {statusCounts[status] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center gap-3 opacity-70">
          <Lightbulb className="w-12 h-12 text-on-surface-variant opacity-50" />
          <p className="text-sm font-medium text-on-surface-variant">
            {searchQuery ? "No ideas match your search" : "No ideas in this category"}
          </p>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs text-stitch-primary font-medium hover:underline"
            >
              Capture your first idea
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {filteredIdeas.map(idea => (
            <IdeaCard key={idea._id} idea={idea} onDelete={handleDelete} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}
