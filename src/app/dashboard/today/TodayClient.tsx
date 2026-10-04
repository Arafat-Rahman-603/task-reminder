"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  Check, Circle, Plus, Droplets, CheckCircle, Sunrise, Sun, Moon,
  Loader2, Trash2, ListTodo, Target, CalendarDays
} from "lucide-react";
import { updateTaskStatus, deleteTask, createTask } from "@/actions/task.actions";
import { useRouter } from "next/navigation";
import { FilterSystem, FilterDefinition } from "@/components/ui/FilterSystem";

const TODAY_FILTERS: FilterDefinition[] = [
  {
    id: "priority",
    label: "Task Priority",
    type: "select",
    options: [
      { value: "Urgent", label: "Urgent" },
      { value: "High", label: "High" },
      { value: "Medium", label: "Medium" },
      { value: "Low", label: "Low" }
    ]
  },
  {
    id: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "Inbox", label: "Inbox" },
      { value: "Planned", label: "Planned" },
      { value: "In Progress", label: "In Progress" },
      { value: "Completed", label: "Completed" },
      { value: "Cancelled", label: "Cancelled" }
    ]
  },
  {
    id: "date",
    label: "Custom Date Range",
    type: "date-range"
  }
];

/* ─── Task Card ────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TaskCard({ task, onToggle, onDelete }: { task: any; onToggle: (id: string, newStatus: string) => void; onDelete: (id: string) => void }) {
  const [pending, startTransition] = useTransition();
  const isDone = task.status === "Completed";

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = isDone ? "Pending" : "Completed";
    // Optimistic update immediately
    onToggle(task._id, newStatus);
    startTransition(async () => {
      await updateTaskStatus(task._id, newStatus);
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${task.title}"?`)) return;
    onDelete(task._id);
    startTransition(async () => {
      await deleteTask(task._id);
    });
  };

  return (
    <div
      className={`group flex items-center justify-between p-3.5 rounded-xl transition-all shadow-[0_2px_10px_rgba(0,0,0,0.2)] ${
        pending ? "opacity-60" : ""
      } ${isDone ? "bg-surface-container/40" : "bg-surface-container/70 hover:bg-surface-container/90"}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={handleToggle}>
        <button
          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors shadow-sm ${
            isDone
              ? "bg-stitch-primary/20 text-stitch-primary shadow-[0_0_8px_rgba(125,211,252,0.3)]"
              : "bg-surface-variant/80 text-on-surface-variant hover:text-stitch-primary hover:bg-primary/20"
          }`}
          aria-label={isDone ? "Mark incomplete" : "Mark complete"}
        >
          {pending ? (
            <Loader2 className="w-[13px] h-[13px] animate-spin" />
          ) : isDone ? (
            <Check className="w-[14px] h-[14px]" />
          ) : (
            <Circle className="w-[14px] h-[14px]" />
          )}
        </button>
        <div className="flex flex-col min-w-0">
          <span className={`text-xs font-semibold truncate ${isDone ? "text-on-surface/50 line-through" : "text-on-surface"}`}>
            {task.title}
          </span>
          <span className="text-[10px] text-on-surface-variant">
            {task.priority && `${task.priority} · `}
            {task.category || "Task"}
            {task.dueDate && ` · ${new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {isDone ? (
          <span className="text-[10px] text-stitch-primary/80 font-medium px-2 py-0.5 rounded-full bg-primary/10">Done ✓</span>
        ) : (
          <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">Pending</span>
        )}
        <button
          onClick={handleDelete}
          aria-label="Delete task"
          className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-[12px] h-[12px]" />
        </button>
      </div>
    </div>
  );
}

/* ─── Add Task Inline Form ──────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AddTaskInline({ onAdded }: { onAdded: (task: any) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const res = await createTask({ title: title.trim(), priority: priority as "Low" | "Medium" | "High" });
    if (res.success) {
      onAdded(res.task);
      setTitle("");
      setOpen(false);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-stitch-primary transition-colors px-2 py-1"
      >
        <Plus className="w-3.5 h-3.5" />
        Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleAdd} className="flex gap-2 items-center">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Task title..."
        className="flex-1 h-9 px-3 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-xs focus:outline-none focus:bg-surface-container-high transition-all"
      />
      <select
        value={priority}
        onChange={e => setPriority(e.target.value)}
        className="h-9 px-2 rounded-xl bg-surface-container-high/60 text-on-surface text-xs focus:outline-none"
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="h-9 px-3 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setTitle(""); }}
        className="h-9 px-2 rounded-xl text-on-surface-variant text-xs hover:text-on-surface"
      >
        ✕
      </button>
    </form>
  );
}

/* ─── Main Component ────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TodayClient({ tasks: initialTasks }: { tasks: any[] }) {
  const router = useRouter();

  // ── Water tracker with localStorage persistence ──────────────────
  const [glasses, setGlasses] = useState(0);
  const maxGlasses = 8;

  useEffect(() => {
    const key = `water_${new Date().toDateString()}`;
    const saved = localStorage.getItem(key);
    if (saved) setGlasses(parseInt(saved, 10));
  }, []);

  const handleWaterClick = () => {
    setGlasses(prev => {
      const next = Math.min(prev + 1, maxGlasses);
      localStorage.setItem(`water_${new Date().toDateString()}`, String(next));
      return next;
    });
  };

  const handleWaterReset = () => {
    setGlasses(0);
    localStorage.removeItem(`water_${new Date().toDateString()}`);
  };

  // ── Tasks state with optimistic updates ─────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>(initialTasks);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleToggle = (id: string, newStatus: string) => {
    setTasks(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t._id !== id));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAdded = (task: any) => {
    setTasks(prev => [task, ...prev]);
  };

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // ── Date & calendar strip ────────────────────────────────────────
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  
  // Generate a scrollable 31-day window (-15 days to +15 days)
  const scrollableDays = Array.from({ length: 31 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 15 + i);
    return { 
      label: dayLabels[d.getDay()], 
      date: d.getDate(), 
      fullDate: d,
      isToday: d.toDateString() === new Date().toDateString() 
    };
  });

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric"
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Center the selected date on mount or when selectedDate changes
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeEl) {
        const containerWidth = scrollRef.current.offsetWidth;
        const scrollPosition = activeEl.offsetLeft - (containerWidth / 2) + (activeEl.offsetWidth / 2);
        scrollRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
      }
    }
  }, [selectedDate]);

  // ── Task partitions (by priority / status) ───────────────────────
  let activeTasks = tasks.filter(t => {
    if (filters.status) return t.status === filters.status;
    return t.status !== "Cancelled" && t.status !== "Archived";
  });
  
  if (filters.priority) {
    activeTasks = activeTasks.filter(t => t.priority === filters.priority);
  }

  // Filter by selectedDate (unless custom date range filter is active)
  if (!filters.date_start && !filters.date_end) {
    const startOfSelected = new Date(selectedDate);
    startOfSelected.setHours(0, 0, 0, 0);
    const endOfSelected = new Date(selectedDate);
    endOfSelected.setHours(23, 59, 59, 999);
    
    activeTasks = activeTasks.filter(task => {
      // If task has no due date, typically we only show it if selectedDate is today
      if (!task.dueDate) {
        return selectedDate.toDateString() === new Date().toDateString();
      }
      const due = new Date(task.dueDate);
      return due >= startOfSelected && due <= endOfSelected;
    });
  }

  // Custom Date Range Filter
  if (filters.date_start || filters.date_end) {
    activeTasks = activeTasks.filter(task => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      if (filters.date_start) {
        const start = new Date(filters.date_start);
        start.setHours(0, 0, 0, 0);
        if (due < start) return false;
      }
      if (filters.date_end) {
        const end = new Date(filters.date_end);
        end.setHours(23, 59, 59, 999);
        if (due > end) return false;
      }
      return true;
    });
  }

  const completedCount = activeTasks.filter(t => t.status === "Completed").length;
  const pendingCount = activeTasks.length - completedCount;
  const progressPercent = activeTasks.length > 0
    ? Math.round((completedCount / activeTasks.length) * 100)
    : 0;

  // Split tasks by priority groups for the time-of-day blocks
  const highTasks = activeTasks.filter(t => t.priority === "High" || t.priority === "Urgent");
  const mediumTasks = activeTasks.filter(t => t.priority === "Medium");
  const lowTasks = activeTasks.filter(t => t.priority === "Low" || !t.priority);

  // ── Hour-based "active" block ─────────────────────────────────────
  const currentHour = new Date().getHours();
  const activeBlock = currentHour < 12 ? "morning" : currentHour < 17 ? "midday" : "evening";

  return (
    <div className="flex flex-col w-full text-on-surface pb-8 space-y-5 max-w-lg mx-auto md:max-w-3xl">

      {/* ── Date Header ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-stitch-primary">Daily Flow</span>
            <h2 className="text-xl font-bold font-headline text-on-surface tracking-tight flex items-center gap-1.5">
              {formattedDate}
              <span className="inline-block w-2 h-2 rounded-full bg-stitch-primary animate-pulse" />
            </h2>
          </div>
          <FilterSystem 
            filters={TODAY_FILTERS} 
            appliedState={filters}
            onApply={(newFilters) => setFilters(newFilters)} 
          />
        </div>

        {/* Accurate Weekly Strip */}
        {/* Accurate Weekly Strip */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto no-scrollbar gap-1.5 p-1.5 rounded-xl bg-surface-container/60 backdrop-blur-xl snap-x scroll-smooth"
        >
          {scrollableDays.map(({ label, date, fullDate, isToday }, i) => {
            const isSelected = fullDate.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={i}
                data-active={isSelected}
                onClick={() => setSelectedDate(fullDate)}
                className={`flex-1 min-w-[calc((100%-0.375rem*6)/7)] flex flex-col items-center py-2 px-1 rounded-lg transition-colors snap-center ${
                  isSelected
                    ? "bg-primary-container/80 text-on-primary-container shadow-[0_0_18px_rgba(125,211,252,0.25)]"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span className={`text-[10px] font-bold tracking-tight ${isSelected ? "text-stitch-primary" : ""}`}>{label}</span>
                <span className={`text-xs font-extrabold mt-0.5 ${isSelected ? "text-on-surface" : ""}`}>{date}</span>
                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? "bg-stitch-primary shadow-[0_0_6px_#7dd3fc]" : isToday ? "bg-stitch-secondary" : "bg-surface-variant"}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Daily Progress Banner ── */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-surface-container/90 via-surface-container-high/70 to-surface-container/90 backdrop-blur-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
        <div className="absolute -right-4 -top-8 w-24 h-24 bg-stitch-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-surface-variant/90 flex items-center justify-center text-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              {progressPercent === 100 ? "🎉" : progressPercent >= 50 ? "🔥" : "🎯"}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-on-surface">
                {progressPercent === 100
                  ? "All tasks done! 🎉"
                  : activeTasks.length === 0
                  ? "No tasks for today"
                  : `${completedCount} of ${activeTasks.length} tasks done`}
              </span>
              <span className="text-xs text-on-surface-variant mt-0.5">
                {progressPercent}% complete · {pendingCount} remaining
              </span>
            </div>
          </div>
        </div>
        <div className="w-full bg-surface-container-lowest/80 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-stitch-secondary to-stitch-primary h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(125,211,252,0.6)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-3 gap-2.5">

        {/* Water Tracker */}
        <div className="p-3 rounded-xl bg-surface-container/70 backdrop-blur-xl flex flex-col items-center justify-between min-w-0 shadow-[0_2px_12px_rgba(0,0,0,0.25)] gap-1.5">
          <div className="w-8 h-8 rounded-full bg-secondary-container/60 flex items-center justify-center text-stitch-secondary">
            <Droplets className="w-[18px] h-[18px]" />
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-on-surface block leading-tight">
              {glasses}/{maxGlasses}
            </span>
            <span className="text-[10px] text-on-surface-variant">Glasses</span>
          </div>
          {/* Visual water bar */}
          <div className="w-full h-1.5 rounded-full bg-surface-variant overflow-hidden">
            <div
              className="h-full bg-stitch-secondary rounded-full transition-all duration-500"
              style={{ width: `${(glasses / maxGlasses) * 100}%` }}
            />
          </div>
          <div className="flex gap-1 w-full">
            <button
              onClick={handleWaterClick}
              disabled={glasses >= maxGlasses}
              className="flex-1 py-1 rounded-lg bg-surface-variant text-[10px] font-semibold text-stitch-primary hover:bg-stitch-primary hover:text-on-primary transition-all flex items-center justify-center gap-0.5 active:scale-95 disabled:opacity-40"
            >
              <Plus className="w-[12px] h-[12px]" />
            </button>
            {glasses > 0 && (
              <button
                onClick={handleWaterReset}
                className="py-1 px-1.5 rounded-lg bg-surface-variant text-[10px] text-on-surface-variant hover:text-error hover:bg-error/10 transition-all active:scale-95"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Task Progress */}
        <div className="p-3 rounded-xl bg-surface-container/70 backdrop-blur-xl flex flex-col items-center justify-between min-w-0 shadow-[0_2px_12px_rgba(0,0,0,0.25)] gap-1.5">
          <div className="w-8 h-8 rounded-full bg-tertiary-container/60 flex items-center justify-center text-tertiary">
            <CheckCircle className="w-[18px] h-[18px]" />
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-on-surface block leading-tight">
              {completedCount}/{activeTasks.length}
            </span>
            <span className="text-[10px] text-on-surface-variant">Tasks Done</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-variant overflow-hidden">
            <div
              className="h-full bg-tertiary rounded-full transition-all duration-500"
              style={{ width: activeTasks.length > 0 ? `${progressPercent}%` : "0%" }}
            />
          </div>
          <span className="text-[10px] font-medium text-tertiary px-1.5 py-0.5 rounded-md bg-tertiary-container/40">
            {progressPercent}% Rate
          </span>
        </div>

        {/* Pending count */}
        <div className="p-3 rounded-xl bg-surface-container/70 backdrop-blur-xl flex flex-col items-center justify-between min-w-0 shadow-[0_2px_12px_rgba(0,0,0,0.25)] gap-1.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-stitch-primary">
            <ListTodo className="w-[18px] h-[18px]" />
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-on-surface block leading-tight">{pendingCount}</span>
            <span className="text-[10px] text-on-surface-variant">Remaining</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-variant overflow-hidden">
            <div
              className="h-full bg-stitch-primary rounded-full transition-all duration-500"
              style={{ width: activeTasks.length > 0 ? `${(pendingCount / activeTasks.length) * 100}%` : "0%" }}
            />
          </div>
          <span className="text-[10px] font-medium text-stitch-primary px-1.5 py-0.5 rounded-md bg-primary/10">
            {highTasks.filter(t => t.status !== "Completed").length} priority
          </span>
        </div>
      </div>

      {/* ── Task Blocks by Priority ── */}
      <div className="flex flex-col gap-5 mt-1">

        {/* Morning / High Priority Block */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sunrise className="w-[18px] h-[18px] text-stitch-secondary" />
              <span className="text-xs font-bold uppercase tracking-wider text-stitch-secondary">High Priority</span>
              {activeBlock === "morning" && (
                <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-stitch-secondary text-[9px] font-bold animate-pulse">
                  NOW
                </span>
              )}
            </div>
            <span className="text-[11px] text-on-surface-variant font-mono">Important Tasks</span>
          </div>
          <div className="flex flex-col gap-2">
            {highTasks.map(task => (
              <TaskCard key={task._id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
            {highTasks.length === 0 && (
              <span className="text-xs text-on-surface-variant italic px-2">No high priority tasks</span>
            )}
            <AddTaskInline onAdded={handleAdded} />
          </div>
        </div>

        {/* Midday / Medium Priority Block */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sun className="w-[18px] h-[18px] text-stitch-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-stitch-primary">Medium Priority</span>
              {activeBlock === "midday" && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-stitch-primary text-[9px] font-bold animate-pulse">
                  NOW
                </span>
              )}
            </div>
            <span className="text-[11px] text-on-surface-variant font-mono">Core Tasks</span>
          </div>
          <div className="flex flex-col gap-2">
            {mediumTasks.map(task => (
              <TaskCard key={task._id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
            {mediumTasks.length === 0 && (
              <span className="text-xs text-on-surface-variant italic px-2">No medium priority tasks</span>
            )}
            <AddTaskInline onAdded={handleAdded} />
          </div>
        </div>

        {/* Evening / Low Priority Block */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Moon className="w-[18px] h-[18px] text-tertiary" />
              <span className="text-xs font-bold uppercase tracking-wider text-tertiary">Low Priority</span>
              {activeBlock === "evening" && (
                <span className="px-2 py-0.5 rounded-full bg-tertiary/20 text-tertiary text-[9px] font-bold animate-pulse">
                  NOW
                </span>
              )}
            </div>
            <span className="text-[11px] text-on-surface-variant font-mono">Nice-to-do</span>
          </div>
          <div className="flex flex-col gap-2">
            {lowTasks.map(task => (
              <TaskCard key={task._id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
            {lowTasks.length === 0 && (
              <span className="text-xs text-on-surface-variant italic px-2">No low priority tasks</span>
            )}
            <AddTaskInline onAdded={handleAdded} />
          </div>
        </div>
      </div>

      {/* ── Empty state ── */}
      {activeTasks.length === 0 && (
        <div className="py-10 rounded-2xl bg-surface-container/40 border border-dashed border-surface-container-high text-center flex flex-col items-center gap-3">
          <Target className="w-12 h-12 text-on-surface-variant opacity-40" />
          <p className="text-sm font-medium text-on-surface-variant">No tasks for today</p>
          <button
            onClick={() => router.push("/dashboard/tasks")}
            className="text-xs text-stitch-primary font-medium hover:underline"
          >
            Go to Tasks to add some →
          </button>
        </div>
      )}

      {/* ── Quick Add CTA ── */}
      <button
        onClick={() => router.push("/dashboard/tasks")}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary-container via-surface-container-high to-surface-variant text-on-primary-container font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(125,211,252,0.2)] hover:shadow-[0_0_30px_rgba(125,211,252,0.35)] transition-all active:scale-[0.99]"
      >
        <div className="w-5 h-5 rounded-full bg-stitch-primary text-on-primary flex items-center justify-center">
          <Plus className="w-[15px] h-[15px]" />
        </div>
        <span>Manage All Tasks in Kanban Board</span>
      </button>
    </div>
  );
}
