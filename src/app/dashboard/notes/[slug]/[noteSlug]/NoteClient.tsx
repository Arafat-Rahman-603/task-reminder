"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Trash2, Edit2, Save, Loader2, X, Plus, Trash, Image as ImageIcon } from "lucide-react";
import { deleteNote, updateNote } from "@/actions/note.actions";
import { AttachmentUpload } from "@/components/ui/AttachmentUpload";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function NoteClient({ group, note: initialNote }: { group: any; note: any }) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [isPending, startTransition] = useTransition();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [date, setDate] = useState(note.date ? new Date(note.date).toISOString().split('T')[0] : "");
  const [content, setContent] = useState(note.content || "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attachments, setAttachments] = useState<any[]>(note.attachments || []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [customFields, setCustomFields] = useState<any[]>(note.customFields || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleEditOpen = () => {
    setTitle(note.title);
    setDate(note.date ? new Date(note.date).toISOString().split('T')[0] : "");
    setContent(note.content || "");
    setCustomFields(note.customFields || []);
    setAttachments(note.attachments || []);
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
    if (!title.trim()) return setError("Title is required");
    if (customFields.some(f => !f.name.trim())) return setError("All custom fields must have a name");
    
    setSaving(true);
    setError("");

    const payload = {
      title: title.trim(),
      date: date ? new Date(date).toISOString() : undefined,
      content: content.trim(),
      customFields,
      attachments
    };

    const res = await updateNote(note._id, payload);
    if (res.success) {
      setNote({ ...note, ...res.note });
      setIsEditing(false);
      router.refresh();
      // Update browser URL if slug changed without full reload (using history API or router.replace)
      if (res.note.slug !== note.slug) {
        window.history.replaceState(null, '', `/dashboard/notes/${group.slug}/${res.note.slug}`);
      }
    } else {
      setError(res.error || "Failed to update note");
    }
    setSaving(false);
  };

  const handleDelete = () => {
    if (!confirm("Delete this note?")) return;
    startTransition(async () => {
      const res = await deleteNote(note._id);
      if (res.success) {
        router.push(`/dashboard/notes/${group.slug}`);
      }
    });
  };

  return (
    <div className="flex flex-col w-full text-on-surface space-y-6 pb-12">
      <div className="flex items-center gap-3 text-sm font-medium text-on-surface-variant">
        <Link href={`/dashboard/notes/${group.slug}`} className="flex items-center gap-1.5 hover:text-stitch-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to {group.name}
        </Link>
      </div>

      {isEditing ? (
        <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-5 sm:p-6 shadow-lg border border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-on-surface">Edit Note</h3>
            <button
              onClick={() => setIsEditing(false)}
              className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {error && <div className="mb-4 p-3 text-sm text-danger-foreground bg-danger/20 rounded-xl">{error}</div>}
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Title <span className="text-error">*</span></label>
              <input
                type="text"
                value={title}
                onChange={e => { setTitle(e.target.value); setError(""); }}
                className={`h-11 px-4 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all ${error && !title ? 'border border-error' : ''}`}
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
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface mb-2">{note.title}</h1>
              {note.date && (
                <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                  <Calendar className="w-4 h-4" />
                  {new Date(note.date).toLocaleDateString()}
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
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-error/10 text-error font-medium text-sm hover:bg-error/20 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {note.attachments.map((att: any, idx: number) => (
                  <a key={idx} href={att.publicId ? `/api/assets/${att.publicId}?resourceType=${att.resourceType || 'auto'}` : att.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-low hover:border-stitch-primary/50 transition-colors group">
                    {att.resourceType === "image" ? (
                      <div className="w-full h-48 relative bg-surface-variant/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={att.publicId ? `/api/assets/${att.publicId}?resourceType=${att.resourceType || 'image'}` : att.url} alt={att.originalFilename || `Attachment ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="w-full h-48 relative flex items-center justify-center bg-surface-variant/20 text-on-surface-variant">
                        <ImageIcon className="w-12 h-12 mb-2" />
                        <span className="absolute bottom-4 left-4 right-4 text-center text-sm font-medium truncate">{att.originalFilename || `Attachment ${idx + 1}`}</span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
