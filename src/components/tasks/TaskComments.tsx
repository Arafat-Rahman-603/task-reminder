"use client";

import { useState, useEffect, useTransition } from "react";
import { getTaskComments, addTaskComment, deleteTaskComment } from "@/actions/taskComment.actions";
import { MessageSquare, Send, Trash2, Paperclip, Loader2, CornerDownRight, User as UserIcon } from "lucide-react";
import { AttachmentUpload } from "@/components/ui/AttachmentUpload";
import { formatDateTime } from "@/lib/dateUtils";

interface TaskCommentsProps {
  taskId: string;
  currentUserId?: string;
  isWorkspaceTask?: boolean;
}

export default function TaskComments({ taskId, currentUserId }: TaskCommentsProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showAttachUpload, setShowAttachUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    setLoading(true);
    const res = await getTaskComments(taskId);
    if (res.success && res.comments) {
      setComments(res.comments);
    }
    setLoading(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    const res = await addTaskComment({
      taskId,
      content: content.trim(),
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (res.success && res.comment) {
      setComments((prev) => [...prev, res.comment]);
      setContent("");
      setAttachments([]);
      setShowAttachUpload(false);
    } else {
      setError(res.error || "Failed to post comment");
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setDeletingId(commentId);
    const res = await deleteTaskComment(commentId);
    if (res.success) {
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } else {
      alert(res.error || "Failed to delete comment");
    }
    setDeletingId(null);
  };

  return (
    <div className="bg-surface-container/60 border border-surface-variant/30 rounded-2xl p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-variant/20 pb-3">
        <div className="flex items-center gap-2 text-on-surface font-semibold text-sm sm:text-base">
          <MessageSquare className="w-4 h-4 text-stitch-primary" />
          <span>Team Discussion & Activity ({comments.length})</span>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-on-surface-variant text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-stitch-primary" />
            <span>Loading discussion...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant text-xs sm:text-sm">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-stitch-primary" />
            No comments yet. Start the team conversation below!
          </div>
        ) : (
          comments.map((comment) => {
            const isMe = currentUserId && comment.user?._id === currentUserId;
            return (
              <div
                key={comment._id}
                className="group p-3 rounded-xl bg-surface/50 border border-surface-variant/20 hover:border-surface-variant/40 transition-all text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-stitch-primary/10 text-stitch-primary flex items-center justify-center font-bold text-[10px] shrink-0 border border-stitch-primary/20 uppercase overflow-hidden">
                      {comment.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={comment.user.image}
                          alt={comment.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        comment.user?.name?.slice(0, 2) || "U"
                      )}
                    </div>
                    <span className="font-semibold text-on-surface text-xs">
                      {comment.user?.name || "Team Member"}
                    </span>
                    {isMe && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/20 font-medium">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] text-on-surface-variant/70"
                      suppressHydrationWarning
                    >
                      {formatDateTime(new Date(comment.createdAt))}
                    </span>
                    <button
                      onClick={() => handleDelete(comment._id)}
                      disabled={deletingId === comment._id}
                      className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all"
                      title="Delete comment"
                    >
                      {deletingId === comment._id ? (
                        <Loader2 className="w-3 h-3 animate-spin text-error" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Content */}
                <p className="text-on-surface text-xs sm:text-sm pl-8 whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>

                {/* Attachments */}
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="pl-8 pt-1 flex flex-wrap gap-2">
                    {comment.attachments.map((att: any, idx: number) => (
                      <a
                        key={idx}
                        href={att.publicId ? `/api/assets/${att.publicId}` : att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container border border-surface-variant/30 text-[11px] text-stitch-primary hover:bg-stitch-primary/10 transition-colors"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">
                          {att.originalFilename || `File ${idx + 1}`}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Comment Box */}
      <form onSubmit={handleAddComment} className="pt-2 border-t border-surface-variant/20 space-y-2">
        {error && (
          <div className="p-2 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
            {error}
          </div>
        )}

        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment or update for the team..."
            rows={2}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-surface border border-surface-variant/40 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-stitch-primary resize-none transition-all"
          />
        </div>

        {/* Attachment Upload Drawer */}
        {showAttachUpload && (
          <div className="p-3 bg-surface/40 border border-surface-variant/30 rounded-xl">
            <AttachmentUpload
              attachments={attachments}
              onChange={setAttachments}
              folder="task-comments"
              multiple
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowAttachUpload(!showAttachUpload)}
            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
              attachments.length > 0 || showAttachUpload
                ? "bg-stitch-primary/10 border-stitch-primary/30 text-stitch-primary"
                : "border-surface-variant/40 text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>
              {attachments.length > 0
                ? `${attachments.length} file(s) attached`
                : "Attach file"}
            </span>
          </button>

          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-stitch-primary text-black font-semibold text-xs hover:bg-stitch-primary/90 disabled:opacity-50 transition-all shadow-sm"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Comment</span>
          </button>
        </div>
      </form>
    </div>
  );
}
