"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Folder, Edit2, Trash2, Search, X, Save, Loader2, FilterX } from "lucide-react";
import { createNoteGroup, updateNoteGroup, deleteNoteGroup } from "@/actions/note.actions";
import { FilterSystem, FilterDefinition } from "@/components/ui/FilterSystem";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function NotesClient({ initialGroups }: { initialGroups: any[] }) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});

  const GROUP_FILTERS: FilterDefinition[] = [
    { id: "createdAt", label: "Date Created", type: "date-range" }
  ];

  const filteredGroups = groups.filter(g => {
    if (searchQuery && !g.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    if (filters.createdAt_start || filters.createdAt_end) {
      const d = new Date(g.createdAt);
      if (filters.createdAt_start && d < new Date(filters.createdAt_start)) return false;
      if (filters.createdAt_end) {
        const end = new Date(filters.createdAt_end);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
    }
    
    return true;
  });

  const handleEdit = (group: any) => {
    setName(group.name);
    setDescription(group.description || "");
    setEditingGroupId(group._id);
    setShowAddForm(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Group name is required");
    
    setSaving(true);
    setError("");

    if (editingGroupId) {
      const res = await updateNoteGroup(editingGroupId, { name: name.trim(), description: description.trim() });
      if (res.success) {
        setGroups(prev => prev.map(g => g._id === editingGroupId ? { ...g, ...res.group } : g));
        setName("");
        setDescription("");
        setEditingGroupId(null);
        setShowAddForm(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update group");
      }
    } else {
      const res = await createNoteGroup({ name: name.trim(), description: description.trim() });
      if (res.success) {
        res.group.noteCount = 0;
        setGroups(prev => [res.group, ...prev]);
        setName("");
        setDescription("");
        setShowAddForm(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to create group");
      }
    }
    setSaving(false);
  };

  const handleDelete = (groupId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this group and all its notes? This cannot be undone.")) return;
    
    startTransition(async () => {
      const res = await deleteNoteGroup(groupId);
      if (res.success) {
        setGroups(prev => prev.filter(g => g._id !== groupId));
      }
    });
  };

  return (
    <div className="flex flex-col w-full text-on-surface space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Notes Groups</h1>
          <p className="text-sm text-on-surface-variant mt-1">Organize your notes into groups</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-on-surface-variant pointer-events-none" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups..." 
              className="w-full pl-10 pr-4 h-10 text-sm rounded-xl bg-surface-container-low/70 backdrop-blur-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:bg-surface-container/90 transition-all border border-surface-variant/40" 
            />
          </div>
          <FilterSystem 
            filters={GROUP_FILTERS} 
            appliedState={filters}
            onApply={(newFilters) => setFilters(newFilters)} 
          />
          <button
            onClick={() => {
              if (showAddForm) {
                setShowAddForm(false);
                setEditingGroupId(null);
                setName("");
                setDescription("");
              } else {
                setShowAddForm(true);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl bg-primary-container text-on-primary-container font-medium text-xs shadow-md hover:bg-stitch-primary hover:text-on-primary transition-all active:scale-95 whitespace-nowrap"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? "Cancel" : "New Group"}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-5 shadow-lg border border-primary/20">
          <h3 className="text-sm font-semibold text-on-surface mb-3">{editingGroupId ? "Edit Group" : "Create Group"}</h3>
          {error && <div className="mb-3 p-2 text-xs text-danger-foreground bg-danger/20 rounded-lg">{error}</div>}
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-on-surface-variant">Name <span className="text-error">*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(""); }}
                className={`h-10 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all ${error && !name ? 'border border-error' : ''}`}
                placeholder="e.g. Study, Work, Personal"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-on-surface-variant">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="h-10 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all"
                placeholder="What's this group for?"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingGroupId(null);
                  setName("");
                  setDescription("");
                }}
                className="h-10 px-4 rounded-xl bg-surface-container text-on-surface text-sm font-semibold hover:bg-surface-container-high transition-colors w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-10 px-4 rounded-xl bg-stitch-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors disabled:opacity-60 w-full sm:w-auto sm:ml-auto"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Group</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {groups.length === 0 && !showAddForm ? (
        <div className="rounded-2xl bg-surface-container/60 p-12 text-center border border-dashed border-surface-container-high">
          <Folder className="w-12 h-12 text-on-surface-variant opacity-50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-on-surface mb-1">No Note Groups Yet</h3>
          <p className="text-sm text-on-surface-variant/70 mb-6">Create a group like 'Study' or 'Work' to organize your notes.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stitch-primary text-on-primary font-semibold text-sm hover:bg-primary-fixed-dim transition-colors"
          >
            <Plus className="w-4 h-4" /> Create First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map(group => (
            <Link 
              href={`/dashboard/notes/${group.slug}`} 
              key={group._id}
              className={`flex flex-col p-5 rounded-2xl bg-surface-container/60 backdrop-blur-xl border border-surface-container-high hover:bg-surface-container hover:border-stitch-primary/30 transition-all group ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-stitch-primary flex items-center justify-center">
                  <Folder className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(group); }}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-stitch-primary hover:bg-primary/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(group._id, e)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-on-surface line-clamp-1">{group.name}</h3>
              {group.description && (
                <p className="text-sm text-on-surface-variant line-clamp-2 mt-1">{group.description}</p>
              )}
              <div className="mt-auto pt-4 flex items-center justify-between text-xs text-on-surface-variant">
                <span>{group.noteCount || 0} notes</span>
                <span>{new Date(group.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
          {filteredGroups.length === 0 && searchQuery && (
            <div className="col-span-full py-12 text-center text-on-surface-variant">
              No groups match your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
