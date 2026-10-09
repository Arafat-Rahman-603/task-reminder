"use client";
import { formatDate, formatDateTime, formatTime } from "@/lib/dateUtils";

import { updateTaskStatus, deleteTask } from "@/actions/task.actions";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransition } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TaskItem({ task }: { task: any }) {
  const [pending, startTransition] = useTransition();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    startTransition(async () => {
      await updateTaskStatus(task._id, newStatus);
    });
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    startTransition(async () => {
      await deleteTask(task._id);
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-danger bg-danger/10';
      case 'High': return 'text-warning bg-warning/10';
      case 'Medium': return 'text-focus bg-focus/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <li
      className={`flex items-center justify-between p-3 rounded-lg border border-border bg-surface hover:bg-muted/50 transition-colors ${pending ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <select
          value={task.status}
          onChange={handleStatusChange}
          disabled={pending}
          className={cn(
            "text-xs font-medium py-1 px-2 rounded border appearance-none cursor-pointer flex-shrink-0 transition-colors focus:outline-none focus:ring-1 focus:ring-stitch-primary",
            task.status === "Done" ? "bg-success/10 text-success border-success/30" : 
            task.status === "In Progress" ? "bg-stitch-primary/10 text-stitch-primary border-stitch-primary/30" :
            task.status === "Cancelled" ? "bg-error/10 text-error border-error/30" :
            task.status === "To Do" ? "bg-warning/10 text-warning border-warning/30" :
            "bg-surface-variant/20 text-on-surface-variant border-surface-variant/30"
          )}
          aria-label="Change task status"
        >
          <option value="Backlog">Backlog</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <div className="min-w-0 flex-1 overflow-hidden">
          <span className={`font-medium text-sm block truncate ${task.status === "Done" ? "line-through text-muted-foreground opacity-70" : "text-foreground"}`}>
            {task.title}
          </span>
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">
              Due {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {task.priority && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        )}
        <button
          onClick={handleDelete}
          disabled={pending}
          className="text-muted-foreground hover:text-danger transition-colors p-1 rounded"
          aria-label="Delete task"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TaskList({ tasks, emptyMessage = "No tasks here." }: { tasks: any[], emptyMessage?: string }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-sm text-muted-foreground py-4 text-center italic">{emptyMessage}</div>;
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <TaskItem key={task._id} task={task} />
      ))}
    </ul>
  );
}


