"use client";

import { useState } from "react";
import { updateIdea, deleteIdea } from "@/actions/idea.actions";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Tag, Paperclip, ExternalLink, Image as ImageIcon, Lock } from "lucide-react";
import Link from "next/link";
import { AttachmentUpload } from "@/components/ui/AttachmentUpload";
import { FilePreviewModal, PreviewableFile } from "@/components/ui/FilePreviewModal";

function IdeaAttachmentItem({ 
  att, 
  index, 
  onPreview 
}: { 
  att: any; 
  index: number; 
  onPreview: (att: any) => void;
}) {
  const isImage = att.resourceType === "image" || att.url?.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i);
  const primarySrc = att.publicId ? `/api/assets/${att.publicId}?resourceType=${att.resourceType || 'image'}` : att.url;
  const [src, setSrc] = useState(primarySrc);
  const [failed, setFailed] = useState(false);

  return (
    <li 
      onClick={() => onPreview(att)}
      className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-surface-variant/30 hover:border-stitch-primary/50 transition-colors group cursor-pointer"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        {isImage && !failed ? (
          <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-surface-variant/30 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={att.originalFilename || "Attachment"}
              onError={() => {
                if (src !== att.url && att.url) setSrc(att.url);
                else setFailed(true);
              }}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded shrink-0 bg-surface-variant/30 flex items-center justify-center text-on-surface-variant">
            <Paperclip className="w-5 h-5" />
          </div>
        )}
        <span className="text-xs sm:text-sm font-medium truncate max-w-[200px] sm:max-w-xs text-on-surface">
          {att.originalFilename || `File ${index + 1}`}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPreview(att);
        }}
        className="p-1.5 text-stitch-primary hover:bg-stitch-primary/10 rounded-lg transition-colors"
        title="View inside app"
      >
        <ExternalLink className="w-4 h-4" />
      </button>
    </li>
  );
}

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

  const handleSave = async () => {
    if (idea.canEdit === false) {
      alert("Permission denied: You do not have permission to edit this idea.");
      return;
    }
    setIsSaving(true);
    const res = await updateIdea(idea._id, formData);
    setIsSaving(false);
    if (res.success) {
      setIsEditing(false);
      router.refresh();
    } else {
      alert(res.error || "Failed to update idea");
    }
  };

  const handleDelete = async () => {
    if (idea.canEdit === false) {
      alert("Permission denied: You do not have permission to delete this idea.");
      return;
    }
    if (confirm("Are you sure you want to delete this idea?")) {
      const res = await deleteIdea(idea._id);
      if (res.success) {
        router.refresh();
        router.push("/dashboard/ideas");
      } else {
        alert(res.error || "Failed to delete idea");
      }
    }
  };

  const handleEditClick = () => {
    if (idea.canEdit === false) {
      alert("Permission denied: You have view-only access. You do not have permission to edit this idea.");
      return;
    }
    setIsEditing(true);
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/ideas" className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          {idea.canEdit === false && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              <Lock className="w-3 h-3" /> View Only
            </span>
          )}
          {isEditing ? (
            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-stitch-primary text-black rounded-lg font-medium">
              <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save"}
            </button>
          ) : (
            <>
              <button onClick={handleEditClick} className="px-4 py-2 bg-surface-variant text-on-surface rounded-lg font-medium hover:bg-surface-variant/80 transition-colors">
                Edit
              </button>
              {idea.canEdit !== false && (
                <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
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
                    <IdeaAttachmentItem key={i} att={att} index={i} onPreview={handlePreview} />
                  ))}
                </ul>
              ) : (
                "No attachments."
              )}
            </div>
          )}
        </div>
        
      </div>

      {/* In-app File Preview Modal */}
      <FilePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={previewFile}
      />
    </div>
  );
}
