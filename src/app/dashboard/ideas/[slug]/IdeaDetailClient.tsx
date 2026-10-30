"use client";

import { useState } from "react";
import { updateIdea, deleteIdea } from "@/actions/idea.actions";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Trash2, Tag, Paperclip, ExternalLink, Lock, 
  Users, Shield, Globe 
} from "lucide-react";
import Link from "next/link";
import { AttachmentUpload } from "@/components/ui/AttachmentUpload";
import { FilePreviewModal, PreviewableFile } from "@/components/ui/FilePreviewModal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IdeaDetailAny = any;

function IdeaAttachmentItem({ 
  att, 
  index, 
  onPreview 
}: { 
  att: IdeaDetailAny; 
  index: number; 
  onPreview: (att: IdeaDetailAny) => void;
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

export default function IdeaDetailClient({ 
  idea, 
  workspaceMembers = [],
  isTeamWorkspace: initialIsTeamWorkspace,
}: { 
  idea: IdeaDetailAny; 
  workspaceMembers?: IdeaDetailAny[];
  isTeamWorkspace?: boolean;
}) {
  const isTeamWorkspace = initialIsTeamWorkspace ?? (workspaceMembers && workspaceMembers.length > 1);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    title: idea.title,
    description: idea.description || "",
    status: idea.status,
    priority: idea.priority || "Medium",
    visibility: (idea.visibility || "workspace") as 'workspace' | 'private' | 'restricted',
    visibleToMembers: (idea.visibleToMembers || []).map((m: IdeaDetailAny) => String(m?._id || m)),
    editableBy: (idea.editableBy || "workspace") as 'workspace' | 'creator_only' | 'restricted',
    editableByMembers: (idea.editableByMembers || []).map((m: IdeaDetailAny) => String(m?._id || m)),
    attachments: idea.attachments || [],
  });
  const [isSaving, setIsSaving] = useState(false);

  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePreview = (att: IdeaDetailAny) => {
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
    const res = await updateIdea(idea._id, {
      ...formData,
      visibleToMembers: formData.visibility === "restricted" ? formData.visibleToMembers : [],
      editableByMembers: formData.editableBy === "restricted" ? formData.editableByMembers : [],
    });
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
    setFormData({
      title: idea.title,
      description: idea.description || "",
      status: idea.status,
      priority: idea.priority || "Medium",
      visibility: idea.visibility || "workspace",
      visibleToMembers: (idea.visibleToMembers || []).map((m: IdeaDetailAny) => String(m?._id || m)),
      editableBy: idea.editableBy || "workspace",
      editableByMembers: (idea.editableByMembers || []).map((m: IdeaDetailAny) => String(m?._id || m)),
      attachments: idea.attachments || [],
    });
    setIsEditing(true);
  };

  const getMemberName = (id: string) => {
    const found = workspaceMembers.find((m: IdeaDetailAny) => {
      const u = m.userId || m;
      const uId = u?._id ? u._id.toString() : (m.userId || m._id || m.id || "");
      return String(uId) === String(id);
    });
    if (!found) return id.slice(0, 8);
    const u = found.userId || found;
    return found.name || u.name || found.email || u.email || "Member";
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
            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-stitch-primary text-black rounded-lg font-medium hover:bg-primary-fixed-dim transition-colors">
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
        <div>
          {isEditing ? (
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-3xl font-bold bg-transparent border-none outline-none focus:ring-0 p-0 text-on-surface"
              placeholder="Idea Title"
            />
          ) : (
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-3xl font-bold text-on-surface">{idea.title}</h1>
              {isTeamWorkspace && idea.visibility === "restricted" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/20 font-medium">
                  <Users className="w-3 h-3" /> Restricted
                </span>
              )}
              {isTeamWorkspace && idea.visibility === "private" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-surface-container-high text-on-surface-variant border border-surface-variant/40 font-medium">
                  <Lock className="w-3 h-3" /> Private
                </span>
              )}
              {isTeamWorkspace && (!idea.visibility || idea.visibility === "workspace") && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-surface-container-high/60 text-on-surface-variant font-medium">
                  <Globe className="w-3 h-3" /> Shared with Workspace
                </span>
              )}
            </div>
          )}
        </div>

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
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as IdeaDetailAny })}
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

        {/* Workspace Permissions (Edit Mode) */}
        {isEditing && (
          <div className="p-4 rounded-2xl bg-surface-container-high/40 border border-surface-variant/40 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                <Shield className="w-4 h-4 text-stitch-primary" /> Workspace Access & Permissions
              </div>
              {idea.canManagePermissions === false && (
                <span className="text-[10px] text-amber-400 font-medium">
                  Only creator/admin can change permissions
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs text-on-surface-variant font-medium mb-1 block">Who can view this idea?</label>
                <select
                  disabled={idea.canManagePermissions === false}
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as IdeaDetailAny })}
                  className="w-full h-10 px-3 rounded-xl bg-surface text-on-surface text-xs focus:outline-none border border-surface-variant disabled:opacity-50"
                >
                  <option value="workspace">Entire Workspace (Everyone)</option>
                  <option value="private">Only Me (Private)</option>
                  <option value="restricted">Specific Members...</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant font-medium mb-1 block">Who can edit this idea?</label>
                <select
                  disabled={idea.canManagePermissions === false}
                  value={formData.editableBy}
                  onChange={(e) => setFormData({ ...formData, editableBy: e.target.value as IdeaDetailAny })}
                  className="w-full h-10 px-3 rounded-xl bg-surface text-on-surface text-xs focus:outline-none border border-surface-variant disabled:opacity-50"
                >
                  <option value="workspace">Anyone who can view (Default)</option>
                  <option value="creator_only">Only Me & Admins</option>
                  <option value="restricted">Specific Editors...</option>
                </select>
              </div>
            </div>

            {/* Member Picker */}
            {(formData.visibility === "restricted" || formData.editableBy === "restricted") && workspaceMembers.length > 0 && (
              <div className="pt-3 border-t border-surface-variant/20 space-y-3">
                {formData.visibility === "restricted" && (
                  <div>
                    <p className="text-xs text-on-surface-variant font-medium mb-1.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-stitch-primary" /> Select members allowed to view:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {workspaceMembers.map((m: IdeaDetailAny) => {
                        const u = m.userId || m;
                        const uId = u?._id ? u._id.toString() : (m.userId || m._id || m.id || "");
                        const uName = m.name || u.name || m.email || u.email || "Member";
                        const checked = formData.visibleToMembers.includes(uId);
                        return (
                          <button
                            key={uId}
                            type="button"
                            disabled={idea.canManagePermissions === false}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                visibleToMembers: checked
                                  ? formData.visibleToMembers.filter((id: string) => id !== uId)
                                  : [...formData.visibleToMembers, uId]
                              });
                            }}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all disabled:opacity-50 ${
                              checked
                                ? "bg-stitch-primary/15 border-stitch-primary/40 text-stitch-primary font-medium"
                                : "bg-surface border-surface-variant/40 text-on-surface-variant hover:text-on-surface"
                            }`}
                          >
                            {uName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {formData.editableBy === "restricted" && (
                  <div>
                    <p className="text-xs text-on-surface-variant font-medium mb-1.5 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-stitch-primary" /> Select members allowed to edit:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {workspaceMembers.map((m: IdeaDetailAny) => {
                        const u = m.userId || m;
                        const uId = u?._id ? u._id.toString() : (m.userId || m._id || m.id || "");
                        const uName = m.name || u.name || m.email || u.email || "Member";
                        const checked = formData.editableByMembers.includes(uId);
                        return (
                          <button
                            key={uId}
                            type="button"
                            disabled={idea.canManagePermissions === false}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                editableByMembers: checked
                                  ? formData.editableByMembers.filter((id: string) => id !== uId)
                                  : [...formData.editableByMembers, uId]
                              });
                            }}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all disabled:opacity-50 ${
                              checked
                                ? "bg-stitch-primary/15 border-stitch-primary/40 text-stitch-primary font-medium"
                                : "bg-surface border-surface-variant/40 text-on-surface-variant hover:text-on-surface"
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

        {/* Permissions & Visibility Info Card (View Mode) */}
        {!isEditing && (
          <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl border border-surface-variant/50 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-stitch-primary" /> Access & Permissions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface border border-surface-variant/30">
                <span className="text-on-surface-variant block mb-1 font-medium">Who can view:</span>
                {idea.visibility === "private" ? (
                  <span className="text-on-surface font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" /> Only you (Private)
                  </span>
                ) : idea.visibility === "restricted" ? (
                  <div>
                    <span className="text-on-surface font-semibold flex items-center gap-1 mb-1.5">
                      <Users className="w-3 h-3 text-stitch-primary" /> Specific Members ({idea.visibleToMembers?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(idea.visibleToMembers || []).map((m: IdeaDetailAny) => {
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

              <div className="p-3 rounded-xl bg-surface border border-surface-variant/30">
                <span className="text-on-surface-variant block mb-1 font-medium">Who can edit:</span>
                {idea.editableBy === "creator_only" ? (
                  <span className="text-on-surface font-semibold flex items-center gap-1">
                    <Shield className="w-3 h-3 text-amber-400" /> Only you & Workspace Admins
                  </span>
                ) : idea.editableBy === "restricted" ? (
                  <div>
                    <span className="text-on-surface font-semibold flex items-center gap-1 mb-1.5">
                      <Shield className="w-3 h-3 text-stitch-primary" /> Specific Editors ({idea.editableByMembers?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(idea.editableByMembers || []).map((m: IdeaDetailAny) => {
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
        )}

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
                  {formData.attachments.map((att: IdeaDetailAny, i: number) => (
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
