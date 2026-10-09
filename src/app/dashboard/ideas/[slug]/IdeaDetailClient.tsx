"use client";

import { useState } from "react";
import { updateIdea, deleteIdea } from "@/actions/idea.actions";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Tag, Paperclip, ExternalLink, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { AttachmentUpload } from "@/components/ui/AttachmentUpload";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function IdeaDetailClient({ idea }: { idea: any }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    title: idea.title,
    description: idea.description || "",
    status: idea.status,
    priority: idea.priority || "Medium",
    attachments: idea.attachments || [],
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await updateIdea(idea._id, formData);
    setIsSaving(false);
    setIsEditing(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this idea?")) {
      await deleteIdea(idea._id);
      router.refresh();
      router.push("/dashboard/ideas");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/ideas" className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex gap-2">
          {isEditing ? (
            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
              <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save"}
            </button>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-surface-variant text-on-surface rounded-lg font-medium">
                Edit
              </button>
              <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {isEditing ? (
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full text-3xl font-bold bg-transparent border-none outline-none focus:ring-0 p-0 text-on-surface"
            placeholder="Idea Title"
          />
        ) : (
          <h1 className="text-3xl font-bold text-on-surface">{idea.title}</h1>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-surface-container-low rounded-2xl border border-surface-variant/50">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Status</p>
            {isEditing ? (
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-surface text-on-surface border border-surface-variant rounded-md p-1"
              >
                <option value="Inbox">Inbox</option>
                <option value="Exploring">Exploring</option>
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Archived">Archived</option>
              </select>
            ) : (
              <span className="font-medium">{idea.status}</span>
            )}
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Priority</p>
            {isEditing ? (
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full bg-surface text-on-surface border border-surface-variant rounded-md p-1"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            ) : (
              <span className="font-medium">{idea.priority || "None"}</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2"><Tag className="w-4 h-4"/> Description</h3>
          {isEditing ? (
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full bg-surface text-on-surface border border-surface-variant rounded-xl p-3 resize-none outline-none focus:ring-2 ring-primary/50"
              placeholder="Add description..."
            />
          ) : (
            <div className="p-4 bg-surface-container-low rounded-xl border border-surface-variant/50 min-h-[100px] whitespace-pre-wrap text-on-surface-variant">
              {idea.description || "No description provided."}
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2"><Paperclip className="w-4 h-4"/> Attachments</h3>
          {isEditing ? (
            <div className="p-4 bg-surface-container-low rounded-xl border border-surface-variant/50">
              <AttachmentUpload
                multiple
                folder="manageo/ideas"
                attachments={formData.attachments}
                onChange={(attachments) => setFormData({ ...formData, attachments })}
                label="Add files to this idea"
              />
            </div>
          ) : (
            <div className="p-4 bg-surface-container-low rounded-xl border border-surface-variant/50 min-h-[100px] text-on-surface-variant">
              {formData.attachments && formData.attachments.length > 0 ? (
                <ul className="space-y-2">
                  {formData.attachments.map((att: any, i: number) => (
                    <li key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-surface-variant/30 hover:border-stitch-primary/50 transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {att.resourceType === "image" ? (
                          <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-surface-variant/30 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={att.url} alt={att.originalFilename || "Attachment"} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded shrink-0 bg-surface-variant/30 flex items-center justify-center text-on-surface-variant">
                            <Paperclip className="w-5 h-5" />
                          </div>
                        )}
                        <span className="font-medium truncate max-w-[200px] sm:max-w-xs">{att.originalFilename || `File ${i + 1}`}</span>
                      </div>
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-2 text-stitch-primary hover:bg-stitch-primary/10 rounded-full transition-colors" title="View/Download">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                "No attachments."
              )}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
