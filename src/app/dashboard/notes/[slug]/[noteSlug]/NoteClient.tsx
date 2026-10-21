"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Calendar, Trash2, Edit2, Save, Loader2, Plus, Trash, 
  Image as ImageIcon, Download, FileText, Lock, Users, Shield, Globe 
} from "lucide-react";
import { deleteNote, updateNote } from "@/actions/note.actions";
import { AttachmentUpload } from "@/components/ui/AttachmentUpload";
import { formatDate } from "@/lib/dateUtils";
import { FilePreviewModal, PreviewableFile } from "@/components/ui/FilePreviewModal";

function NoteAttachmentItem({ 
  att, 
  idx, 
  onPreview 
}: { 
  att: any; 
  idx: number; 
  onPreview: (att: any) => void;
}) {
  const isImage = att.resourceType === "image" || att.url?.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i);
  const primarySrc = att.publicId 
    ? `/api/assets/${att.publicId}?resourceType=${att.resourceType || 'image'}` 
    : att.url;
  const [src, setSrc] = useState(primarySrc);
  const [failed, setFailed] = useState(false);

  return (
    <div
      onClick={() => onPreview(att)}
      className="flex items-center gap-3 p-2.5 rounded-xl border border-surface-container-high bg-surface-container-low/70 hover:border-stitch-primary/40 hover:bg-surface-container transition-all group cursor-pointer"
    >
      <div className="w-11 h-11 rounded-lg bg-black/40 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
        {isImage && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={att.originalFilename || `Attachment ${idx + 1}`}
            onError={() => {
              if (src !== att.url && att.url) {
                setSrc(att.url);
              } else {
                setFailed(true);
              }
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="text-stitch-primary/80">
            {isImage ? <ImageIcon className="w-5 h-5 text-stitch-primary" /> : <FileText className="w-5 h-5 text-slate-300" />}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-on-surface truncate" title={att.originalFilename || `Attachment ${idx + 1}`}>
          {att.originalFilename || `Attachment ${idx + 1}`}
        </p>
        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">
          {att.resourceType || (isImage ? "image" : "document")}
        </span>
      </div>
      <Download className="w-4 h-4 text-on-surface-variant group-hover:text-stitch-primary shrink-0 transition-colors" />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function NoteClient({ 
  group, 
  note: initialNote,
  workspaceMembers = []
}: { 
  group: any; 
  note: any;
  workspaceMembers?: any[];
}) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [isPending, startTransition] = useTransition();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [date, setDate] = useState(note.date ? new Date(note.date).toISOString().split('T')[0] : "");
  const [content, setContent] = useState(note.content || "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [customFields, setCustomFields] = useState<any[]>(note.customFields || []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attachments, setAttachments] = useState<any[]>(note.attachments || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Workspace Permissions State
  const [visibility, setVisibility] = useState<'workspace' | 'private' | 'restricted'>(
    note.visibility || 'workspace'
  );
  const [visibleToMembers, setVisibleToMembers] = useState<string[]>(
    (note.visibleToMembers || []).map((m: any) => String(m?._id || m))
  );
  const [editableBy, setEditableBy] = useState<'workspace' | 'creator_only' | 'restricted'>(
    note.editableBy || 'workspace'
  );
  const [editableByMembers, setEditableByMembers] = useState<string[]>(
    (note.editableByMembers || []).map((m: any) => String(m?._id || m))
  );

  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePreview = (att: any) => {
    const isImage = att.resourceType === "image" || att.url?.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i);
    const url = att.publicId 
      ? `/api/assets/${att.publicId}?resourceType=${att.resourceType || (isImage ? 'image' : 'auto')}` 
      : att.url;
    setPreviewFile({
      title: att.originalFilename || "Attachment",
      url,
      originalFilename: att.originalFilename,
      resourceType: att.resourceType || (isImage ? 'image' : 'auto'),
    });
    setPreviewOpen(true);
  };

  const handleEditOpen = () => {
    if (note.canEdit === false) {
      alert("Permission denied: You have view-only access. You do not have permission to edit this note.");
      return;
    }
    setTitle(note.title);
    setDate(note.date ? new Date(note.date).toISOString().split('T')[0] : "");
    setContent(note.content || "");
    setCustomFields(note.customFields || []);
    setAttachments(note.attachments || []);
    setVisibility(note.visibility || 'workspace');
    setVisibleToMembers((note.visibleToMembers || []).map((m: any) => String(m?._id || m)));
    setEditableBy(note.editableBy || 'workspace');
    setEditableByMembers((note.editableByMembers || []).map((m: any) => String(m?._id || m)));
    setError("");
    setIsEditing(true);
  };

  const handleAddField = () => setCustomFields(prev => [...prev, { name: "", type: "text", value: "" }]);
  const handleRemoveField = (index: number) => setCustomFields(prev => prev.filter((_, i) => i !== index));
  const handleFieldChange = (index: number, key: string, value: string) => {
    setCustomFields(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (note.canEdit === false) {
      alert("Permission denied: You do not have permission to edit this note.");
      return;
    }
    if (!title.trim()) return setError("Title is required");
    if (customFields.some(f => !f.name.trim())) return setError("All custom fields must have a name");
    
    setSaving(true);
    setError("");

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

    const res = await updateNote(note._id, payload);
    if (res.success) {
      setNote({ ...note, ...res.note });
      setIsEditing(false);
      router.refresh();
      if (res.note.slug !== note.slug) {
        window.history.replaceState(null, '', `/dashboard/notes/${group.slug}/${res.note.slug}`);
      }
    } else {
      setError(res.error || "Failed to update note");
    }
    setSaving(false);
  };

  const handleDelete = () => {
    if (note.canEdit === false) {
      alert("Permission denied: You do not have permission to delete this note.");
      return;
    }
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    startTransition(async () => {
      const res = await deleteNote(note._id);
      if (res.success) {
        router.push(`/dashboard/notes/${group.slug}`);
      } else {
        alert(res.error || "Failed to delete note");
      }
    });
  };

  // Helper to resolve member names
  const getMemberName = (id: string) => {
    const found = workspaceMembers.find((m: any) => {
      const u = m.userId || m;
      const uId = u?._id ? u._id.toString() : (m.userId || m._id || m.id || "");
      return String(uId) === String(id);
    });
    if (!found) return id.slice(0, 8);
    const u = found.userId || found;
    return found.name || u.name || found.email || u.email || "Member";
  };

  return (
    <div className="flex flex-col w-full text-on-surface space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
        <Link href={`/dashboard/notes/${group.slug}`} className="flex items-center gap-1.5 hover:text-stitch-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to {group.name}
        </Link>
      </div>

      {isEditing ? (
        <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-5 sm:p-6 shadow-lg border border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-on-surface">Edit Note</h2>
            {note.canManagePermissions === false && (
              <span className="text-[11px] text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-lg">
                Only creator/admin can change permissions
              </span>
            )}
          </div>

          {error && <div className="mb-4 p-3 text-xs text-danger-foreground bg-danger/20 rounded-xl">{error}</div>}
          
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => { setTitle(e.target.value); setError(""); }}
                className="h-11 px-4 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all"
                placeholder="Note title"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="h-11 px-4 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all w-full sm:w-auto"
              />
            </div>

            {/* Workspace Permissions & Access Control */}
            <div className="p-4 rounded-2xl bg-surface-container-high/40 border border-surface-variant/40 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                  <Shield className="w-4 h-4 text-stitch-primary" /> Workspace Access & Permissions
                </div>
                {note.canManagePermissions === false && (
                  <span className="text-[10px] text-amber-400 font-medium">Read-Only</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-on-surface-variant font-medium mb-1 block">Who can view this note?</label>
                  <select
                    disabled={note.canManagePermissions === false}
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-high/60 text-on-surface text-xs focus:outline-none focus:bg-surface-container-high transition-all disabled:opacity-50"
                  >
                    <option value="workspace">Entire Workspace (Everyone)</option>
                    <option value="private">Only Me (Private)</option>
                    <option value="restricted">Specific Members...</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-on-surface-variant font-medium mb-1 block">Who can edit this note?</label>
                  <select
                    disabled={note.canManagePermissions === false}
                    value={editableBy}
                    onChange={(e) => setEditableBy(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-high/60 text-on-surface text-xs focus:outline-none focus:bg-surface-container-high transition-all disabled:opacity-50"
                  >
                    <option value="workspace">Anyone who can view (Default)</option>
                    <option value="creator_only">Only Me & Admins</option>
                    <option value="restricted">Specific Editors...</option>
                  </select>
                </div>
              </div>

              {/* Specific Members Pickers */}
              {(visibility === "restricted" || editableBy === "restricted") && workspaceMembers.length > 0 && (
                <div className="pt-3 border-t border-surface-variant/20 space-y-3">
                  {visibility === "restricted" && (
                    <div>
                      <p className="text-xs text-on-surface-variant font-medium mb-1.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-stitch-primary" /> Select members allowed to view:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {workspaceMembers.map((m: any) => {
                          const u = m.userId || m;
                          const uId = u?._id ? u._id.toString() : (m.userId || m._id || m.id || "");
                          const uName = m.name || u.name || m.email || u.email || "Member";
                          const checked = visibleToMembers.includes(uId);
                          return (
                            <button
                              key={uId}
                              type="button"
                              disabled={note.canManagePermissions === false}
                              onClick={() => {
                                setVisibleToMembers(prev =>
                                  checked ? prev.filter(id => id !== uId) : [...prev, uId]
                                );
                              }}
                              className={`text-xs px-2.5 py-1 rounded-lg border transition-all disabled:opacity-50 ${
                                checked
                                  ? "bg-stitch-primary/15 border-stitch-primary/40 text-stitch-primary font-medium"
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
                      <div className="flex flex-wrap gap-1.5">
                        {workspaceMembers.map((m: any) => {
                          const u = m.userId || m;
                          const uId = u?._id ? u._id.toString() : (m.userId || m._id || m.id || "");
                          const uName = m.name || u.name || m.email || u.email || "Member";
                          const checked = editableByMembers.includes(uId);
                          return (
                            <button
                              key={uId}
                              type="button"
                              disabled={note.canManagePermissions === false}
                              onClick={() => {
                                setEditableByMembers(prev =>
                                  checked ? prev.filter(id => id !== uId) : [...prev, uId]
                                );
                              }}
                              className={`text-xs px-2.5 py-1 rounded-lg border transition-all disabled:opacity-50 ${
                                checked
                                  ? "bg-stitch-primary/15 border-stitch-primary/40 text-stitch-primary font-medium"
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

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Content (Optional)</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={5}
                className="p-4 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all resize-y min-h-[120px]"
                placeholder="Write your note here..."
              />
            </div>

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
                onClick={() => setIsEditing(false)}
                className="h-11 px-5 rounded-xl bg-surface-container text-on-surface font-semibold hover:bg-surface-container-high transition-colors w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-11 px-5 rounded-xl bg-stitch-primary text-on-primary font-semibold flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors disabled:opacity-60 w-full sm:w-auto sm:ml-auto"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between bg-surface-container/60 p-5 sm:p-6 rounded-2xl border border-surface-container-high gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">{note.title}</h1>
                {note.canEdit === false && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    <Lock className="w-3 h-3" /> View Only
                  </span>
                )}
                {note.visibility === "restricted" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/20 font-medium">
                    <Users className="w-3 h-3" /> Restricted
                  </span>
                )}
                {note.visibility === "private" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-surface-container-high text-on-surface-variant border border-surface-variant/40 font-medium">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                )}
                {(!note.visibility || note.visibility === "workspace") && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-surface-container-high/60 text-on-surface-variant font-medium">
                    <Globe className="w-3 h-3" /> Shared with Workspace
                  </span>
                )}
              </div>
              {note.date && (
                <div className="flex items-center gap-1.5 text-sm text-on-surface-variant" suppressHydrationWarning>
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(note.date)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <button
                onClick={handleEditOpen}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high text-on-surface font-medium text-sm hover:bg-surface-variant/50 transition-colors"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              {note.canEdit !== false && (
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-error/10 text-error font-medium text-sm hover:bg-error/20 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
            </div>
          </div>

          {/* Permissions & Visibility Info Card */}
          <div className="bg-surface-container/40 p-4 sm:p-5 rounded-2xl border border-surface-container-high space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-stitch-primary" /> Access & Permissions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-variant/30">
                <span className="text-on-surface-variant block mb-1 font-medium">Who can view:</span>
                {note.visibility === "private" ? (
                  <span className="text-on-surface font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" /> Only you (Private)
                  </span>
                ) : note.visibility === "restricted" ? (
                  <div>
                    <span className="text-on-surface font-semibold flex items-center gap-1 mb-1.5">
                      <Users className="w-3 h-3 text-stitch-primary" /> Specific Members ({note.visibleToMembers?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(note.visibleToMembers || []).map((m: any) => {
                        const mId = m?._id ? m._id.toString() : String(m);
                        return (
                          <span key={mId} className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface text-[11px]">
                            {getMemberName(mId)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <span className="text-on-surface font-semibold flex items-center gap-1">
                    <Globe className="w-3 h-3 text-stitch-secondary" /> Everyone in this workspace
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-variant/30">
                <span className="text-on-surface-variant block mb-1 font-medium">Who can edit:</span>
                {note.editableBy === "creator_only" ? (
                  <span className="text-on-surface font-semibold flex items-center gap-1">
                    <Shield className="w-3 h-3 text-amber-400" /> Only you & Workspace Admins
                  </span>
                ) : note.editableBy === "restricted" ? (
                  <div>
                    <span className="text-on-surface font-semibold flex items-center gap-1 mb-1.5">
                      <Shield className="w-3 h-3 text-stitch-primary" /> Specific Editors ({note.editableByMembers?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(note.editableByMembers || []).map((m: any) => {
                        const mId = m?._id ? m._id.toString() : String(m);
                        return (
                          <span key={mId} className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface text-[11px]">
                            {getMemberName(mId)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <span className="text-on-surface font-semibold flex items-center gap-1">
                    <Globe className="w-3 h-3 text-stitch-secondary" /> Anyone who can view
                  </span>
                )}
              </div>
            </div>
          </div>

          {note.customFields && note.customFields.length > 0 && (
            <div className="bg-surface-container/60 p-5 sm:p-6 rounded-2xl border border-surface-container-high space-y-4">
              <h2 className="text-lg font-bold text-on-surface">Custom Fields</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {note.customFields.map((field: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      {field.name}
                    </span>
                    <div className="text-sm text-on-surface break-words">
                      {field.type === "url" && field.value ? (
                        <a href={field.value} target="_blank" rel="noopener noreferrer" className="text-stitch-primary hover:underline">
                          {field.value}
                        </a>
                      ) : field.value ? (
                        <span className="whitespace-pre-wrap">{field.value}</span>
                      ) : (
                        <span className="text-on-surface-variant/50">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {note.content && (
            <div className="bg-surface-container/60 p-5 sm:p-6 rounded-2xl border border-surface-container-high space-y-4">
              <h2 className="text-lg font-bold text-on-surface">Content</h2>
              <div className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                {note.content}
              </div>
            </div>
          )}

          {note.attachments && note.attachments.length > 0 && (
            <div className="bg-surface-container/60 p-5 sm:p-6 rounded-2xl border border-surface-container-high space-y-4">
              <h2 className="text-lg font-bold text-on-surface">Attachments</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {note.attachments.map((att: any, idx: number) => (
                  <NoteAttachmentItem key={idx} att={att} idx={idx} onPreview={handlePreview} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* In-app File Preview Modal */}
      <FilePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={previewFile}
      />
    </div>
  );
}
