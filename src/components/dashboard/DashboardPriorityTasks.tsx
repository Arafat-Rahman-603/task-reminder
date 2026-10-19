"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { CircleDashed, CheckCircle2, Clock, Check } from "lucide-react";
import { updateTaskStatus } from "@/actions/task.actions";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";

interface DashboardTask {
  _id: string;
  slug?: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: string | Date;
  category?: string;
}

export function DashboardPriorityTasks({ initialTasks }: { initialTasks: DashboardTask[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<DashboardTask[]>(initialTasks);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleToggle = async (task: DashboardTask) => {
    const isCompleted = task.status === "Done" || task.status === "Completed";
    const nextStatus = isCompleted ? "Backlog" : "Done";
    setTogglingId(task._id);

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, status: nextStatus } : t))
    );

    try {
      await updateTaskStatus(task._id, nextStatus);
      router.refresh();
    } catch (err) {
      console.error("Failed to toggle task:", err);
      // Revert on error
      setTasks(initialTasks);
    } finally {
      setTogglingId(null);
    }
  };

  const pendingList = tasks.filter(
    (t) => t.status !== "Done" && t.status !== "Completed" && t.status !== "Cancelled"
  );

  if (pendingList.length === 0) {
    return (
      <EmptyState
        title="No pending tasks"
        description="You are all caught up."
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {pendingList.slice(0, 4).map((task) => {
        const isDone = task.status === "Done" || task.status === "Completed";
        const isPendingToggle = togglingId === task._id;

        return (
          <div
            key={task._id}
            className="task-card group relative rounded-2xl bg-surface-container/60 backdrop-blur-xl p-4 shadow-md transition-all duration-200 hover:bg-surface-container/90"
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => handleToggle(task)}
                disabled={isPendingToggle}
                aria-label={isDone ? "Mark as incomplete" : "Mark as completed"}
                className={`task-checkbox mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
                  isDone
                    ? "bg-success/20 text-success"
                    : "bg-surface-container-high text-primary-container group-hover:text-stitch-primary hover:bg-stitch-primary/10"
                }`}
              >
                {isDone ? (
                  <Check className="w-[16px] h-[16px] text-success" />
                ) : (
                  <CircleDashed className="w-[18px] h-[18px]" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={task.slug ? `/dashboard/tasks/${task.slug}` : "/dashboard/tasks"}
                    className="task-title text-sm font-semibold text-on-surface truncate hover:text-stitch-primary transition-colors"
                  >
                    {task.title}
                  </Link>

                  {task.dueDate && (
                    <span className="text-[11px] font-medium text-on-surface-variant shrink-0 flex items-center gap-1">
                      <Clock className="w-[12px] h-[12px]" />
                      {new Date(task.dueDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>

                {task.description && (
                  <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {task.priority === "Urgent" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-error-container text-on-error-container">
                        Urgent
                      </span>
                    )}
                    {task.priority === "High" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-error-container text-on-error-container">
                        High Priority
                      </span>
                    )}
                    {task.priority === "Medium" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary-container text-on-secondary-container">
                        Medium
                      </span>
                    )}
                    {task.priority === "Low" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-container-high text-on-surface-variant">
                        Low
                      </span>
                    )}
                    {task.category && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-container-high text-on-surface-variant">
                        {task.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

