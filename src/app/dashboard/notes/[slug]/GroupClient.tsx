"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Edit2, Trash2, Search, X, Save, Loader2, BookOpen, Trash, Lock, Shield, Users } from "lucide-react";
import { createNote, updateNote, deleteNote, updateNoteGroup } from "@/actions/note.actions";
import { FilterSystem, FilterDefinition } from "@/components/ui/FilterSystem";
import { AttachmentUpload } from "@/components/ui/AttachmentUpload";
import { formatDate } from "@/lib/dateUtils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function GroupClient({ 
  group, 
  initialNotes,
  workspaceMembers = [] 
}: { 
  group: any; 
  initialNotes: any[];
  workspaceMembers?: any[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [showEditGroupForm, setShowEditGroupForm] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const [groupDesc, setGroupDesc] = useState(group.description || "");
  const [groupSaving, setGroupSaving] = useState(false);
  const [groupError, setGroupError] = useState("");

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"workspace" | "private" | "restricted">("workspace");
  const [visibleToMembers, setVisibleToMembers] = useState<string[]>([]);
  const [editableBy, setEditableBy] = useState<"workspace" | "creator_only" | "restricted">("workspace");
  const [editableByMembers, setEditableByMembers] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [customFields, setCustomFields] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attachments, setAttachments] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const editingNote = notes.find(n => n._id === editingNoteId);
  const canManage = !editingNote || editingNote.canManagePermissions !== false;

  const NOTE_FILTERS: FilterDefinition[] = [
    { id: "date", label: "Note Date", type: "date-range" }
  ];

  const filteredNotes = notes.filter(n => {
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    if (filters.date_start || filters.date_end) {
      if (!n.date) return false;
      const d = new Date(n.date);
      if (filters.date_start && d < new Date(filters.date_start)) return false;
      if (filters.date_end) {
        const end = new Date(filters.date_end);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
    }
    
    return true;
  });

  const handleGroupUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return setGroupError("Group name is required");
    
    setGroupSaving(true);
    setGroupError("");

    const res = await updateNoteGroup(group._id, { name: groupName.trim(), description: groupDesc.trim() });
    if (res.success) {
      setShowEditGroupForm(false);
      router.refresh();
      if (res.group.slug !== group.slug) {
        window.history.replaceState(null, '', `/dashboard/notes/${res.group.slug}`);
      }
    } else {
      setGroupError(res.error || "Failed to update group");
    }
    setGroupSaving(false);
  };

  const resetForm = () => {
    setTitle("");
    setDate("");
    setContent("");
    setCustomFields([]);
    setAttachments([]);
    setVisibility("workspace");
    setVisibleToMembers([]);
    setEditableBy("workspace");
    setEditableByMembers([]);
    setEditingNoteId(null);
    setShowAddForm(false);
  };

  const handleEdit = (note: any) => {
    if (note.canEdit === false) {
      alert("Permission denied: You have view-only access. You do not have permission to edit this note.");
      return;
    }
    setTitle(note.title);
    setDate(note.date ? new Date(note.date).toISOString().split('T')[0] : "");
    setContent(note.content || "");
    setCustomFields(note.customFields || []);
    setAttachments(note.attachments || []);
    setVisibility(note.visibility || "workspace");
    setVisibleToMembers((note.visibleToMembers || []).map((m: any) => String(m?._id || m)));
    setEditableBy(note.editableBy || "workspace");
    setEditableByMembers((note.editableByMembers || []).map((m: any) => String(m?._id || m)));
    setEditingNoteId(note._id);
    setShowAddForm(true);
  };

  const handleAddField = () => {
    setCustomFields(prev => [...prev, { name: "", type: "text", value: "" }]);
  };

  const handleRemoveField = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: string, value: string) => {
    setCustomFields(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Title is required");
    
    setSaving(true);
    setError("");

    // Validate fields
    if (customFields.some(f => !f.name.trim())) {
      setError("All custom fields must have a name");
      setSaving(false);
      return;
    }

    const payload = {
      title: title.trim(),
      date: date ? new Date(date).toISOString() : undefined,
      content: content.trim(),
      visibility,
      visibleToMembers: visibility === "restricted" ? visibleToMembers : [],
      editableBy,
      editableByMembers: editableBy === "restricted" ? editableByMembers : [],
      customFields,
      attachments
    };

    if (editingNoteId) {
      const res = await updateNote(editingNoteId, payload);
      if (res.success) {
        setNotes(prev => prev.map(n => n._id === editingNoteId ? { ...n, ...res.note } : n));
        resetForm();
        router.refresh();
      } else {
        setError(res.error || "Failed to update note");
      }
    } else {
      const res = await createNote(group._id, payload);
      if (res.success) {
        setNotes(prev => [res.note, ...prev]);
        resetForm();
        router.refresh();
      } else {
        setError(res.error || "Failed to create note");
      }
    }
    setSaving(false);
  };

  const handleDelete = (noteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const note = notes.find(n => n._id === noteId);
    if (note && note.canEdit === false) {
      alert("Permission denied: You do not have permission to delete this note.");
      return;
    }
    if (!confirm("Delete this note?")) return;
    
    startTransition(async () => {
      const res = await deleteNote(noteId);
      if (res.success) {
        setNotes(prev => prev.filter(n => n._id !== noteId));
      } else {
        alert(res.error || "Failed to delete note");
      }
    });
  };

  return (
    <div className="flex flex-col w-full text-on-surface space-y-6">
      <div className="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
        <Link href="/dashboard/notes" className="flex items-center gap-1.5 hover:text-stitch-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Notes
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">{group.name}</h1>
            <button
              onClick={() => setShowEditGroupForm(true)}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-stitch-primary hover:bg-primary/10 transition-colors"
              title="Edit Group"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          {group.description && <p className="text-sm text-on-surface-variant mt-1">{group.description}</p>}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-on-surface-variant pointer-events-none" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..." 
              className="w-full pl-10 pr-4 h-10 text-sm rounded-xl bg-surface-container-low/70 backdrop-blur-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:bg-surface-container/90 transition-all border border-surface-variant/40" 
            />
          </div>
          <FilterSystem 
            filters={NOTE_FILTERS} 
            appliedState={filters}
            onApply={(newFilters) => setFilters(newFilters)} 
          />
          <button
            onClick={() => {
              if (showAddForm) {
                setShowAddForm(false);
                setEditingNoteId(null);
                setTitle("");
                setDate("");
                setContent("");
                setCustomFields([]);
                setAttachments([]);
              } else {
                setShowAddForm(true);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl bg-primary-container text-on-primary-container font-medium text-xs shadow-md hover:bg-stitch-primary hover:text-on-primary transition-all active:scale-95 whitespace-nowrap"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? "Cancel" : "New Note"}
          </button>
        </div>
      </div>

      {showEditGroupForm && (
        <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-5 sm:p-6 shadow-lg border border-primary/20">
          <h3 className="text-sm font-semibold text-on-surface mb-3">Edit Group</h3>
          {groupError && <div className="mb-3 p-2 text-xs text-danger-foreground bg-danger/20 rounded-lg">{groupError}</div>}
          <form onSubmit={handleGroupUpdate} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-on-surface-variant">Name <span className="text-error">*</span></label>
              <input
                type="text"
                value={groupName}
                onChange={e => { setGroupName(e.target.value); setGroupError(""); }}
                className={`h-10 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all ${groupError && !groupName ? 'border border-error' : ''}`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-on-surface-variant">Description (Optional)</label>
              <input
                type="text"
                value={groupDesc}
                onChange={e => setGroupDesc(e.target.value)}
                className="h-10 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowEditGroupForm(false)}
                className="h-10 px-4 rounded-xl bg-surface-container text-on-surface text-sm font-semibold hover:bg-surface-container-high transition-colors w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={groupSaving}
                className="h-10 px-4 rounded-xl bg-stitch-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors disabled:opacity-60 w-full sm:w-auto sm:ml-auto"
              >
                {groupSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Group</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddForm && (
        <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-5 sm:p-6 shadow-lg border border-primary/20">
          <h3 className="text-sm font-semibold text-on-surface mb-3">{editingNoteId ? "Edit Note" : "Create Note"}</h3>
          {error && <div className="mb-3 p-2 text-xs text-danger-foreground bg-danger/20 rounded-lg">{error}</div>}
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Title <span className="text-error">*</span></label>
              <input
                type="text"
                value={title}
                onChange={e => { setTitle(e.target.value); setError(""); }}
                className={`h-11 px-4 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all ${error && !title ? 'border border-error' : ''}`}
                placeholder="Note title"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="h-11 px-4 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all w-full sm:w-auto"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Content (Optional)</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={3}
                className="p-4 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all resize-y"
                placeholder="Write your note here..."
              />
            </div>

            {/* Workspace Sharing & Permissions */}
            {group.workspaceId && (
              <div className="border-t border-surface-container-high pt-5 mt-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-stitch-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-on-surface">Workspace Permissions</span>
                    </div>
                    {!canManage && (
                      <span className="text-[10px] text-amber-400 font-medium">Read-Only (Only creator/admin can change permissions)</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-on-surface-variant font-medium mb-1 block">Who can view this note?</label>
                      <select
                        disabled={!canManage}
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-xl bg-surface-container-high/60 text-on-surface text-xs focus:outline-none focus:bg-surface-container-high transition-all disabled:opacity-50"
                      >
                        <option value="workspace">Everyone in Workspace (Default)</option>
                        <option value="private">Only Me & Admins (Private)</option>
                        <option value="restricted">Specific Members...</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-on-surface-variant font-medium mb-1 block">Who can edit this note?</label>
                      <select
                        disabled={!canManage}
                        value={editableBy}
                        onChange={(e) => setEditableBy(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-xl bg-surface-container-high/60 text-on-surface text-xs focus:outline-none focus:bg-surface-container-high transition-all disabled:opacity-50"
                      >
                        <option value="workspace">Anyone who can view (Default)</option>
                        <option value="creator_only">Only Me & Admins (Read-only for others)</option>
                        <option value="restricted">Specific Editors...</option>
                      </select>
                    </div>
                  </div>

                {/* Specific Members Selectors */}
                {(visibility === "restricted" || editableBy === "restricted") && workspaceMembers.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-variant/40 space-y-3">
                    {visibility === "restricted" && (
                      <div>
                        <p className="text-xs text-on-surface-variant font-medium mb-1.5 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-stitch-primary" /> Select members allowed to view:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {workspaceMembers.map((m: any) => {
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
                                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
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
                        <p className="text-xs text-on-surface-variant font-medium mb-1.5 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-stitch-primary" /> Select members allowed to edit:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {workspaceMembers.map((m: any) => {
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
                                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
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
            )}

            <div className="border-t border-surface-container-high pt-5 mt-2 space-y-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Attachments</label>
              <AttachmentUpload
                multiple
                folder="manageo/notes"
                attachments={attachments}
                onChange={setAttachments}
                label="Add files to this note"
              />
            </div>

            <div className="border-t border-surface-container-high pt-5 mt-2 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Custom Fields</label>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="flex items-center gap-1.5 text-xs font-medium text-stitch-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Field
                </button>
              </div>

              {customFields.length > 0 && (
                <div className="space-y-3">
                  {customFields.map((field, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center bg-surface-container/40 p-3 sm:p-0 rounded-xl sm:bg-transparent">
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-1/2">
                        <input 
                          type="text" 
                          value={field.name}
                          onChange={e => handleFieldChange(idx, "name", e.target.value)}
                          placeholder="Field Name"
                          className="h-10 px-3 w-full rounded-xl bg-surface-container-high text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                        <select
                          value={field.type}
                          onChange={e => handleFieldChange(idx, "type", e.target.value)}
                          className="h-10 px-3 w-full sm:w-32 rounded-xl bg-surface-container-high text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        >
                          <option value="text">Text</option>
                          <option value="url">URL</option>
                          <option value="date">Date</option>
                        </select>
                      </div>
                      <div className="flex gap-2 w-full sm:w-1/2">
                        <input 
                          type="text" 
                          value={field.value}
                          onChange={e => handleFieldChange(idx, "value", e.target.value)}
                          placeholder="Value"
                          className="h-10 px-3 flex-1 rounded-xl bg-surface-container-high text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveField(idx)}
                          className="w-10 h-10 flex items-center justify-center shrink-0 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-colors"
                          title="Remove field"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingNoteId(null);
                }}
                className="h-11 px-5 rounded-xl bg-surface-container text-on-surface font-semibold hover:bg-surface-container-high transition-colors w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-11 px-5 rounded-xl bg-stitch-primary text-on-primary font-semibold flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors disabled:opacity-60 w-full sm:w-auto sm:ml-auto"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Note</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {notes.length === 0 && !showAddForm ? (
        <div className="rounded-2xl bg-surface-container/60 p-12 text-center border border-dashed border-surface-container-high">
          <BookOpen className="w-12 h-12 text-on-surface-variant opacity-50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-on-surface mb-1">No Notes Yet</h3>
          <p className="text-sm text-on-surface-variant/70 mb-6">Create your first note in this group.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stitch-primary text-on-primary font-semibold text-sm hover:bg-primary-fixed-dim transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <Link 
              href={`/dashboard/notes/${group.slug}/${note.slug}`} 
              key={note._id}
              className={`flex flex-col p-5 rounded-2xl bg-surface-container/60 backdrop-blur-xl border border-surface-container-high hover:bg-surface-container hover:border-stitch-primary/30 transition-all group ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0 pr-2">
                  <h3 className="text-base font-bold text-on-surface line-clamp-1">{note.title}</h3>
                  {note.canEdit === false && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium shrink-0">
                      <Lock className="w-2.5 h-2.5" /> View Only
                    </span>
                  )}
                  {note.visibility === "private" && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/20 font-medium shrink-0">
                      Private
                    </span>
                  )}
                  {note.visibility === "restricted" && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium shrink-0">
                      Restricted
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(note); }}
                    className="p-1 rounded-md text-on-surface-variant hover:text-stitch-primary hover:bg-primary/10 transition-colors"
                    title={note.canEdit === false ? "View only note" : "Edit note"}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {note.canEdit !== false && (
                    <button
                      onClick={(e) => handleDelete(note._id, e)}
                      className="p-1 rounded-md text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              
              {note.date && (
                <p className="text-xs text-on-surface-variant mb-2" suppressHydrationWarning>
                  {formatDate(note.date)}
                </p>
              )}
              
              <div className="flex-1">
                {note.customFields && note.customFields.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {note.customFields.slice(0, 3).map((f: any, idx: number) => (
                      <div key={idx} className="bg-surface-container-high px-2 py-1 rounded text-[10px] text-on-surface-variant max-w-full truncate">
                        <span className="font-semibold">{f.name}:</span> {f.value}
                      </div>
                    ))}
                    {note.customFields.length > 3 && (
                      <div className="bg-surface-container-high px-2 py-1 rounded text-[10px] text-on-surface-variant">
                        +{note.customFields.length - 3} more
                      </div>
                    )}
                  </div>
                )}
                {note.content && (
                  <p className="text-sm text-on-surface-variant line-clamp-2">
                    {note.content}
                  </p>
                )}
              </div>
            </Link>
          ))}
          {filteredNotes.length === 0 && searchQuery && (
            <div className="col-span-full py-12 text-center text-on-surface-variant">
              No notes match your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
