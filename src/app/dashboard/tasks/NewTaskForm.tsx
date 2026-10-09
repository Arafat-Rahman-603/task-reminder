"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createTask } from "@/actions/task.actions";
import { useRouter } from "next/navigation";
import { X, Calendar, Clock, Flag, AlignLeft, Settings, Tag, Folder, Bell, Paperclip } from "lucide-react";
import { AttachmentUpload } from "@/components/ui/AttachmentUpload";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function NewTaskForm({ onSuccess, taskSettings, onClose }: { onSuccess?: () => void, taskSettings?: any, onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultPriority = taskSettings?.defaultPriority || "Medium";

  // State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Backlog");
  const [priority, setPriority] = useState(defaultPriority);
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  
  // Advanced State
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [reminder, setReminder] = useState("none");
  const [repeat, setRepeat] = useState("none");
  const [project, setProject] = useState("");
  const [tags, setTags] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Calculate reminder time based on selection
    let reminderTime = undefined;
    if (reminder !== "none" && dueDate) {
      const dt = new Date(`${dueDate}T${dueTime || "00:00"}`);
      if (!isNaN(dt.getTime())) {
        if (reminder === "at_time") reminderTime = dt.toISOString();
        else if (reminder === "5_min") reminderTime = new Date(dt.getTime() - 5 * 60000).toISOString();
        else if (reminder === "10_min") reminderTime = new Date(dt.getTime() - 10 * 60000).toISOString();
        else if (reminder === "15_min") reminderTime = new Date(dt.getTime() - 15 * 60000).toISOString();
        else if (reminder === "30_min") reminderTime = new Date(dt.getTime() - 30 * 60000).toISOString();
        else if (reminder === "1_hour") reminderTime = new Date(dt.getTime() - 60 * 60000).toISOString();
      }
    }

    const data = {
      title,
      description: description || undefined,
      status: status as any,
      priority: priority as any,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      startDate: startDate || undefined,
      startTime: startTime || undefined,
      recurringSchedule: repeat !== "none" ? repeat : undefined,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      reminderTime,
    };

    try {
      const res = await createTask(data);
      if (res.success) {
        router.refresh();
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || "Failed to create task");
      }
    } catch (err) {
      const error = err as Error;
      setError(error?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface border border-surface-variant/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-variant/30">
          <h2 className="text-lg font-bold text-on-surface">Create Task</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant/20 hover:text-on-surface transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="new-task-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-surface-variant scrollbar-track-transparent">
          
          {error && <div className="text-sm font-medium text-error bg-error/10 p-3 rounded-xl">{error}</div>}

          {/* Primary Info */}
          <div className="space-y-3">
            <div>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full bg-surface-container-low px-4 py-3.5 rounded-xl text-lg font-bold text-on-surface placeholder:text-on-surface-variant/50 border border-surface-variant/50 focus:outline-none focus:border-stitch-primary focus:ring-1 focus:ring-stitch-primary transition-all shadow-sm"
                autoFocus
              />
            </div>

            <div className="flex items-start gap-3 bg-surface-container-low px-4 py-3 rounded-xl border border-surface-variant/50 focus-within:border-stitch-primary focus-within:ring-1 focus-within:ring-stitch-primary transition-all shadow-sm">
              <AlignLeft className="w-5 h-5 text-on-surface-variant/70 mt-0.5 shrink-0" />
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add description..."
                className="w-full min-h-[60px] bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 resize-none focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5"><Flag className="w-3.5 h-3.5"/> Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors">
                <option value="Backlog">Backlog</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5"><Flag className="w-3.5 h-3.5"/> Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Due Time</label>
              <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5"/> Attachments</label>
            <AttachmentUpload
              multiple
              folder="manageo/tasks"
              attachments={attachments}
              onChange={setAttachments}
              label="Add files to this task"
            />
          </div>

          {/* Toggle Advanced */}
          <div>
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm font-semibold text-stitch-primary hover:text-primary-fixed transition-colors">
              <Settings className="w-4 h-4" /> {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
            </button>
          </div>

          {/* Advanced / Scheduling / Organization */}
          {showAdvanced && (
            <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-surface-variant/30">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5"><Bell className="w-3.5 h-3.5"/> Reminder</label>
                  <select value={reminder} onChange={e => setReminder(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors">
                    <option value="none">No reminder</option>
                    <option value="at_time">At due time</option>
                    <option value="5_min">5 minutes before</option>
                    <option value="10_min">10 minutes before</option>
                    <option value="15_min">15 minutes before</option>
                    <option value="30_min">30 minutes before</option>
                    <option value="1_hour">1 hour before</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Repeat</label>
                  <select value={repeat} onChange={e => setRepeat(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors">
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Start Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5"><Folder className="w-3.5 h-3.5"/> Project</label>
                  <select value={project} onChange={e => setProject(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors">
                    <option value="">No Project</option>
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5"><Tag className="w-3.5 h-3.5"/> Tags</label>
                  <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. urgent, frontend" className="w-full h-10 px-3 bg-surface-container-low border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors" />
                </div>
              </div>

            </div>
          )}

        </form>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-surface-variant/30 bg-surface-container-lowest/50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-variant/20 transition-colors">
            Cancel
          </button>
          <button form="new-task-form" type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl bg-stitch-primary text-on-primary text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-fixed transition-colors disabled:opacity-50">
            {loading ? "Creating..." : "Create Task"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}


