"use client";

import { updateTaskStatus, deleteTask } from "@/actions/task.actions";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { useTransition } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TaskItem({ task }: { task: any }) {
  const [pending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const newStatus = task.status === "Completed" ? "Inbox" : "Completed";
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
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={handleToggle}
          disabled={pending}
          className="text-muted-foreground hover:text-success transition-colors flex-shrink-0"
          aria-label={task.status === "Completed" ? "Mark incomplete" : "Mark complete"}
        >
          {task.status === "Completed" ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>
        <div className="min-w-0">
          <span className={`font-medium text-sm block truncate ${task.status === "Completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {task.title}
          </span>
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">
              Due {new Date(task.dueDate).toLocaleDateString()}
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
export default function TaskList({ tasks }: { tasks: any[] }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-sm text-muted-foreground py-4 text-center italic">No tasks here.</div>;
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <TaskItem key={task._id} task={task} />
      ))}
    </ul>
  );
}
