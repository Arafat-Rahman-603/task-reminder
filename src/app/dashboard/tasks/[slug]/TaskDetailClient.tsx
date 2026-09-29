"use client";

import { useState } from "react";
import { updateTask, deleteTask } from "@/actions/task.actions";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Calendar, Clock, Tag } from "lucide-react";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TaskDetailClient({ task }: { task: any }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    notes: task.notes || "",
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    dueTime: task.dueTime || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await updateTask(task._id, formData);
    setIsSaving(false);
    setIsEditing(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(task._id);
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
                <option value="Inbox">Inbox</option>
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
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
              <span className="font-medium">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "None"}</span>
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
          <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2"><Tag className="w-4 h-4"/> Notes</h3>
          {isEditing ? (
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={6}
              className="w-full bg-surface text-on-surface border border-surface-variant rounded-xl p-3 resize-none outline-none focus:ring-2 ring-primary/50"
              placeholder="Add any extra notes, links, or references..."
            />
          ) : (
            <div className="p-4 bg-surface-container-low rounded-xl border border-surface-variant/50 min-h-[100px] whitespace-pre-wrap text-on-surface-variant">
              {task.notes || "No extra notes."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
