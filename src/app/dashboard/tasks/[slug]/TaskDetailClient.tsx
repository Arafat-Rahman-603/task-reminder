"use client";

import { useState } from "react";
import { updateTask, deleteTask } from "@/actions/task.actions";
import { useRouter } from "next/navigation";
import TaskTimeline from "@/components/TaskTimeline";
import TaskComments from "@/components/tasks/TaskComments";
import { ArrowLeft, Save, Trash2, Calendar, Clock, Tag, Bell, Paperclip, ExternalLink, UserCheck, User } from "lucide-react";
import Link from "next/link";
import { AttachmentUpload } from "@/components/ui/AttachmentUpload";
import { formatDate, formatTime } from "@/lib/dateUtils";
import { FilePreviewModal, PreviewableFile } from "@/components/ui/FilePreviewModal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TaskDetailAny = any;

function TaskAttachmentItem({ 
  att, 
  index, 
  onPreview 
}: { 
  att: TaskDetailAny; 
  index: number; 
  onPreview: (att: TaskDetailAny) => void;
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

export default function TaskDetailClient({ 
  task, 
  workspaceMembers = [], 
  currentUserId 
}: { 
  task: TaskDetailAny; 
  workspaceMembers?: TaskDetailAny[]; 
  currentUserId?: string; 
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  let initialReminderOption = "none";
  let initRemindDate = "";
  let initRemindTime = "";
  if (task.reminder && task.reminder.remindAt) {
    const remindTime = new Date(task.reminder.remindAt).getTime();
    if (task.dueDate) {
      const dueDt = new Date(`${task.dueDate.split('T')[0]}T${task.dueTime || "00:00"}`).getTime();
      const diffMins = Math.round((dueDt - remindTime) / 60000);
      
      if (diffMins === 0) initialReminderOption = "at_time";
      else if (diffMins === 5) initialReminderOption = "5_min";
      else if (diffMins === 10) initialReminderOption = "10_min";
      else if (diffMins === 15) initialReminderOption = "15_min";
      else if (diffMins === 30) initialReminderOption = "30_min";
      else if (diffMins === 60) initialReminderOption = "1_hour";
      else initialReminderOption = "custom";
    } else {
      initialReminderOption = "custom";
    }

    const dt = new Date(task.reminder.remindAt);
    initRemindDate = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, '0') + "-" + String(dt.getDate()).padStart(2, '0');
    initRemindTime = String(dt.getHours()).padStart(2, '0') + ":" + String(dt.getMinutes()).padStart(2, '0');
  }

  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    notes: task.notes || "",
    status: task.status,
    priority: task.priority,
    assigneeId: task.assigneeId?._id ? task.assigneeId._id.toString() : (task.assigneeId?.toString() || ""),
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    dueTime: task.dueTime || "",
    startDate: task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "",
    startTime: task.startTime || "",
    reminderOption: initialReminderOption,
    reminderDate: initRemindDate,
    reminderTime: initRemindTime,
    repeat: task.recurringSchedule || "none",
    tags: task.tags ? task.tags.join(", ") : "",
    attachments: task.attachments || [],
  });
  const [isSaving, setIsSaving] = useState(false);

  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePreview = (att: TaskDetailAny) => {
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
    setIsSaving(true);
    const submissionData: TaskDetailAny = { ...formData };
    submissionData.assigneeId = formData.assigneeId || null;
    
    submissionData.recurringSchedule = formData.repeat !== "none" ? formData.repeat : null;
    submissionData.tags = formData.tags ? formData.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];

    if (formData.reminderOption !== "none") {
      if (formData.reminderOption === "custom") {
        if (formData.reminderDate && formData.reminderTime) {
          const dt = new Date(`${formData.reminderDate}T${formData.reminderTime}`);
          if (!isNaN(dt.getTime())) submissionData.reminderTime = dt.toISOString();
        }
      } else if (formData.dueDate) {
        const dt = new Date(`${formData.dueDate}T${formData.dueTime || "00:00"}`);
        if (!isNaN(dt.getTime())) {
          if (formData.reminderOption === "at_time") submissionData.reminderTime = dt.toISOString();
          else if (formData.reminderOption === "5_min") submissionData.reminderTime = new Date(dt.getTime() - 5 * 60000).toISOString();
          else if (formData.reminderOption === "10_min") submissionData.reminderTime = new Date(dt.getTime() - 10 * 60000).toISOString();
          else if (formData.reminderOption === "15_min") submissionData.reminderTime = new Date(dt.getTime() - 15 * 60000).toISOString();
          else if (formData.reminderOption === "30_min") submissionData.reminderTime = new Date(dt.getTime() - 30 * 60000).toISOString();
          else if (formData.reminderOption === "1_hour") submissionData.reminderTime = new Date(dt.getTime() - 60 * 60000).toISOString();
        }
      }
    } else {
      submissionData.reminderTime = null;
    }

    await updateTask(task._id, submissionData);
    setIsSaving(false);
    setIsEditing(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(task._id);
      router.refresh();
      router.push("/dashboard/tasks");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/tasks" className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant">
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
            placeholder="Task Title"
          />
        ) : (
          <h1 className="text-3xl font-bold text-on-surface">{task.title}</h1>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-surface-container-low rounded-2xl border border-surface-variant/50">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Status</p>
            {isEditing ? (
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-surface text-on-surface border border-surface-variant rounded-md p-1"
              >
                <option value="Backlog">Backlog</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            ) : (
              <span className="font-medium">{task.status}</span>
            )}
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Priority</p>
            {isEditing ? (
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-surface text-on-surface border border-surface-variant rounded-md p-1"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            ) : (
              <span className="font-medium">{task.priority}</span>
            )}
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Due Date</p>
            {isEditing ? (
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full bg-surface text-on-surface border border-surface-variant rounded-md p-1"
              />
            ) : (
              <span className="font-medium" suppressHydrationWarning>{task.dueDate ? formatDate(task.dueDate) : "None"}</span>
            )}
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Due Time</p>
            {isEditing ? (
              <input
                type="time"
                value={formData.dueTime}
                onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                className="w-full bg-surface text-on-surface border border-surface-variant rounded-md p-1"
              />
            ) : (
              <span className="font-medium">{task.dueTime || "None"}</span>
            )}
          </div>

          {(task.assigneeId || (workspaceMembers && workspaceMembers.length > 1)) && (
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-stitch-primary"/> Assignee
              </p>
              {isEditing ? (
                <select
                  value={formData.assigneeId}
                  onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                  className="w-full bg-surface text-on-surface border border-surface-variant rounded-md p-1 text-xs"
                >
                  <option value="">Unassigned</option>
                  {workspaceMembers.map((m: TaskDetailAny) => {
                    const u = m.userId || m;
                    const uId = u._id ? u._id.toString() : (m.userId || m._id || m.id || "");
                    const uName = m.name || u.name || m.email || u.email || "Member";
                    return (
                      <option key={uId} value={uId}>
                        {uName} ({m.role || "member"})
                      </option>
                    );
                  })}
                </select>
              ) : (
                (() => {
                  const assignee = task.assigneeId;
                  const memberMatch = workspaceMembers?.find((m: TaskDetailAny) => {
                    const u = m.userId || m;
                    const uId = u?._id ? u._id.toString() : (m.userId || m._id || m.id || "");
                    const targetId = typeof assignee === 'object' ? assignee?._id?.toString() : assignee;
                    return uId && targetId && uId === targetId;
                  });
                  const assigneeImage = (typeof assignee === 'object' ? (assignee?.image || assignee?.avatarUrl || (assignee?.avatarPublicId ? `/api/assets/${assignee.avatarPublicId}?resourceType=image` : null)) : null) || memberMatch?.image || memberMatch?.userId?.avatarUrl || null;
                  const assigneeName = (typeof assignee === 'object' ? (assignee?.name || assignee?.email) : null) || memberMatch?.name || memberMatch?.userId?.name || "Assigned Member";

                  return (
                    <div className="flex items-center gap-2 font-medium text-xs sm:text-sm truncate">
                      {task.assigneeId ? (
                        <>
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-stitch-primary/15 text-stitch-primary flex items-center justify-center overflow-hidden shrink-0 border border-stitch-primary/30 shadow-xs">
                            {assigneeImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={assigneeImage} alt={assigneeName} className="w-full h-full object-cover" />
                            ) : (
                              <User size={13} className="text-stitch-primary/80" />
                            )}
                          </div>
                          <span className="truncate text-on-surface font-medium text-xs sm:text-sm">
                            {assigneeName}
                          </span>
                        </>
                      ) : (
                        <span className="text-on-surface-variant">Unassigned</span>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>

        {/* Reminder Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2"><Bell className="w-4 h-4"/> Schedule & Reminders</h3>
          
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface-container-low rounded-2xl border border-surface-variant/50">
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Reminder</p>
                <select
                  value={formData.reminderOption}
                  onChange={(e) => setFormData({ ...formData, reminderOption: e.target.value })}
                  className="w-full bg-surface text-on-surface border border-surface-variant rounded-md p-1.5 focus:outline-none focus:border-stitch-primary"
                >
                  <option value="none">No reminder</option>
                  <option value="at_time">At due time</option>
                  <option value="5_min">5 minutes before</option>
                  <option value="10_min">10 minutes before</option>
                  <option value="15_min">15 minutes before</option>
                  <option value="30_min">30 minutes before</option>
                  <option value="1_hour">1 hour before</option>
                  <option value="custom">Custom Date & Time</option>
                </select>
              </div>

              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Repeat</p>
                <select
                  value={formData.repeat}
                  onChange={(e) => setFormData({ ...formData, repeat: e.target.value })}
                  className="w-full bg-surface text-on-surface border border-surface-variant rounded-md p-1.5 focus:outline-none focus:border-stitch-primary"
                >
                  <option value="none">Does not repeat</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              {formData.reminderOption === "custom" && (
                <>
                  <div>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Exact Date</p>
                    <input
                      type="date"
                      value={formData.reminderDate}
                      onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                      className="w-full bg-surface text-on-surface border border-surface-variant rounded-md p-1.5"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Exact Time</p>
                    <input
                      type="time"
                      value={formData.reminderTime}
                      onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                      className="w-full bg-surface text-on-surface border border-surface-variant rounded-md p-1.5"
                    />
                  </div>
                </>
              )}

              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Start Date</p>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-surface text-on-surface border border-surface-variant rounded-md p-1.5"
                />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Start Time</p>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full bg-surface text-on-surface border border-surface-variant rounded-md p-1.5"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 p-4 bg-surface-container-low rounded-2xl border border-surface-variant/50">
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Active Reminder</p>
                <span className="font-medium" suppressHydrationWarning>
                  {task.reminder ? `${formatDate(task.reminder.remindAt)} at ${formatTime(task.reminder.remindAt)}` : "Off"}
                </span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Repeats</p>
                <span className="font-medium">{task.recurringSchedule || "Does not repeat"}</span>
              </div>
              {(task.startDate || task.startTime) && (
                <div className="col-span-2 flex gap-4 mt-2 pt-2 border-t border-surface-variant/30">
                  <div>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Starts On</p>
                    <span className="font-medium" suppressHydrationWarning>
                      {task.startDate ? formatDate(task.startDate) : ""} {task.startTime || ""}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-on-surface">Description</h3>
          {isEditing ? (
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full bg-surface text-on-surface border border-surface-variant rounded-xl p-3 resize-none outline-none focus:ring-2 ring-primary/50"
              placeholder="Add description..."
            />
          ) : (
            <div className="p-4 bg-surface-container-low rounded-xl border border-surface-variant/50 min-h-[100px] whitespace-pre-wrap text-on-surface-variant">
              {task.description || "No description provided."}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2"><Tag className="w-4 h-4"/> Notes & Tags</h3>
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full bg-surface text-on-surface border border-surface-variant rounded-xl p-3 outline-none focus:ring-2 ring-primary/50"
                placeholder="Tags (comma separated)..."
              />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full bg-surface text-on-surface border border-surface-variant rounded-xl p-3 resize-none outline-none focus:ring-2 ring-primary/50"
                placeholder="Add any extra notes, links, or references..."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-surface-variant text-on-surface text-xs rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="p-4 bg-surface-container-low rounded-xl border border-surface-variant/50 min-h-[100px] whitespace-pre-wrap text-on-surface-variant">
                {task.notes || "No extra notes."}
              </div>
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
                folder="manageo/tasks"
                attachments={formData.attachments}
                onChange={(attachments) => setFormData({ ...formData, attachments })}
                label="Add files to this task"
              />
            </div>
          ) : (
            <div className="p-4 bg-surface-container-low rounded-xl border border-surface-variant/50 min-h-[100px] text-on-surface-variant">
              {formData.attachments && formData.attachments.length > 0 ? (
                <ul className="space-y-2">
                  {formData.attachments.map((att: TaskDetailAny, i: number) => (
                    <TaskAttachmentItem key={i} att={att} index={i} onPreview={handlePreview} />
                  ))}
                </ul>
              ) : (
                "No attachments."
              )}
            </div>
          )}
        </div>
        
        {/* Team Discussion & Activity */}
        {!isEditing && (
          <div className="pt-6 border-t border-surface-variant/40 mt-8">
            <TaskComments
              taskId={task._id.toString()}
              currentUserId={currentUserId}
              isWorkspaceTask={Boolean(task.workspaceId)}
            />
          </div>
        )}

      {/* Timeline */}
          {!isEditing && (
            <div className="space-y-4 pt-6 border-t border-surface-variant/40 mt-8">
              <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                <Clock className="w-5 h-5" /> Activity Timeline
              </h3>
              <TaskTimeline taskId={task._id.toString()} />
            </div>
          )}
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


