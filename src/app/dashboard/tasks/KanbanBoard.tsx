"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, Circle, MoreHorizontal, Plus, Search, SlidersHorizontal, ChevronDown, Clock, MessageSquare, Paperclip, Zap, Trash2, CheckCircle, CircleDashed, LayoutList, LayoutGrid, X } from "lucide-react";
import { updateTaskStatus, deleteTask } from "@/actions/task.actions";
import { useTransition } from "react";
import NewTaskForm from "./NewTaskForm";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TaskCard({ task }: { task: any }) {
  const [pending, startTransition] = useTransition();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      const newStatus = task.status === "Completed" ? "Pending" : "Completed";
      await updateTaskStatus(task._id, newStatus);
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${task.title}"?`)) return;
    startTransition(async () => {
      await deleteTask(task._id);
    });
  };

  const isDone = task.status === "Completed";
  
  // Style logic based on priority
  const isHigh = task.priority === 'High' || task.priority === 'Urgent';
  const isMedium = task.priority === 'Medium';
  const accentGradient = isDone ? "from-secondary-fixed via-secondary" : isHigh ? "from-error via-error/60" : "from-stitch-primary via-primary/60";

  return (
    <article className={`group relative rounded-2xl bg-surface-container/70 backdrop-blur-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 overflow-hidden ${pending ? 'opacity-50' : ''} ${isDone ? 'bg-surface-container-low/50 opacity-80' : 'hover:bg-surface-container-high/80 active:scale-[0.99]'}`}>
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentGradient} to-transparent opacity-80`}></div>
      <div className="flex flex-col gap-3">
        {/* Badges & Action */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {task.category && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${isDone ? 'bg-surface-variant text-secondary-fixed shadow-[0_0_10px_rgba(192,216,232,0.15)]' : 'bg-primary/20 text-stitch-primary shadow-[0_0_12px_rgba(125,211,252,0.25)]'}`}>
                {task.category}
              </span>
            )}
            {isHigh && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-error-container text-on-error-container shadow-[0_0_12px_rgba(255,107,107,0.3)] flex items-center gap-1">
                <Zap className="w-[11px] h-[11px]" /> Urgent
              </span>
            )}
            {isMedium && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-secondary-container text-on-secondary-container">
                Medium
              </span>
            )}
            {isDone && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success flex items-center gap-1">
                <CheckCircle className="w-[12px] h-[12px]" /> Done
              </span>
            )}
          </div>
          <div className="flex items-center">
            <button onClick={handleDelete} aria-label="Delete task" className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors">
              <Trash2 className="w-[14px] h-[14px]" />
            </button>
            <button onClick={handleToggle} aria-label="Toggle Complete" className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-success hover:bg-success/10 transition-colors">
              {isDone ? <CheckCircle className="w-[18px] h-[18px] text-success" /> : <CircleDashed className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>
        
        {/* Title & Context */}
        <Link href={`/dashboard/tasks/${task.slug}`} className="block">
          <h3 className={`text-sm font-semibold transition-colors leading-snug ${isDone ? 'line-through text-on-surface-variant group-hover:text-secondary-fixed' : 'text-on-surface group-hover:text-stitch-primary'}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-on-surface-variant/90 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </Link>
        
        {/* Footer Metadata */}
        <div className="flex items-center justify-between pt-1 text-xs text-on-surface-variant">
          <div className="flex items-center gap-3">
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-[11px] ${isDone ? 'text-on-surface-variant' : isHigh ? 'text-error' : 'text-stitch-secondary'}`}>
                <Clock className="w-[12px] h-[12px]" /> 
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function KanbanBoard({ initialTasks, taskSettings }: { initialTasks: any[], taskSettings?: any }) {
  const [activeTab, setActiveTab] = useState("inbox");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">(taskSettings?.defaultView || "kanban");
  const [filters, setFilters] = useState({
    priority: "",
    dueDatePreset: "",
  });

  const filteredTasks = useMemo(() => {
    return initialTasks.filter(task => {
      // Hide completed by default unless in 'done' tab or settings override
      if (taskSettings?.hideCompleted && task.status === "Completed" && activeTab !== "done") {
        return false;
      }
      
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!task.title.toLowerCase().includes(query) && !task.description?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Priority Filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      // Due Date Filter
      if (filters.dueDatePreset && task.dueDate) {
        const due = new Date(task.dueDate);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
        
        if (filters.dueDatePreset === "today" && (due < startOfToday || due > endOfToday)) return false;
        if (filters.dueDatePreset === "overdue" && due >= startOfToday) return false;
      }

      return true;
    });
  }, [initialTasks, searchQuery, filters, activeTab, taskSettings]);

  const inboxTasks = filteredTasks.filter(t => t.status === "Inbox");
  const plannedTasks = filteredTasks.filter(t => t.status === "Planned");
  const inProgressTasks = filteredTasks.filter(t => t.status === "In Progress");
  const doneTasks = filteredTasks.filter(t => t.status === "Completed");
  const cancelledTasks = filteredTasks.filter(t => t.status === "Cancelled");
  
  // Create a mapping for tabs to arrays
  const tabData = {
    "inbox": { label: "Inbox", tasks: inboxTasks, colorClass: "text-stitch-secondary bg-secondary/20", indicatorClass: "bg-stitch-secondary", badgeClass: "bg-surface-variant text-on-surface-variant" },
    "planned": { label: "Planned", tasks: plannedTasks, colorClass: "text-stitch-secondary bg-secondary/20", indicatorClass: "bg-stitch-secondary", badgeClass: "bg-surface-variant text-on-surface-variant" },
    "in-progress": { label: "In Progress", tasks: inProgressTasks, colorClass: "text-stitch-primary bg-primary/20", indicatorClass: "bg-stitch-primary", badgeClass: "bg-primary/30 text-on-surface" },
    "done": { label: "Completed", tasks: doneTasks, colorClass: "text-secondary-fixed bg-secondary-fixed/20", indicatorClass: "bg-secondary-fixed", badgeClass: "bg-surface-variant text-on-surface-variant" },
    "cancelled": { label: "Cancelled", tasks: cancelledTasks, colorClass: "text-error bg-error/20", indicatorClass: "bg-error", badgeClass: "bg-error/30 text-error" }
  };

  const activeTasks = tabData[activeTab as keyof typeof tabData].tasks;

  return (
    <div className="flex flex-col w-full text-on-surface">
      {/* Header Actions Panel */}
      <div className="space-y-3 relative z-10 mb-2">
        
        {/* Modern Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-on-surface-variant pointer-events-none" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..." 
              className="w-full pl-10 pr-4 h-10 text-sm rounded-xl bg-surface-container-low/70 backdrop-blur-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:bg-surface-container/90 transition-all border border-surface-variant/40" 
            />
          </div>
          
          <button onClick={() => setShowFilterPanel(!showFilterPanel)} aria-label="Filter" className={`h-10 px-3 flex items-center gap-2 rounded-xl border transition-colors text-sm font-medium ${showFilterPanel || filters.priority || filters.dueDatePreset ? 'bg-stitch-primary text-on-primary border-stitch-primary shadow-md' : 'bg-surface-container-low/70 text-on-surface-variant hover:text-stitch-primary hover:bg-surface-container border-surface-variant/40'}`}>
            <SlidersHorizontal className="w-[16px] h-[16px]" />
            <span className="hidden sm:inline">Filter</span>
          </button>
          
          <div className="flex bg-surface-container-low/70 rounded-xl border border-surface-variant/40 overflow-hidden h-10">
            <button 
              onClick={() => setViewMode("list")} 
              className={`px-3 flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-surface-variant/50 text-stitch-primary" : "text-on-surface-variant hover:text-on-surface"}`}
              title="List View"
            >
              <LayoutList className="w-[16px] h-[16px]" />
            </button>
            <button 
              onClick={() => setViewMode("kanban")} 
              className={`px-3 flex items-center justify-center transition-colors ${viewMode === "kanban" ? "bg-surface-variant/50 text-stitch-primary" : "text-on-surface-variant hover:text-on-surface"}`}
              title="Kanban/Board View"
            >
              <LayoutGrid className="w-[16px] h-[16px]" />
            </button>
          </div>
          
          <Link href="/dashboard/settings" aria-label="Settings" className="h-10 px-3 flex items-center gap-2 rounded-xl bg-surface-container-low/70 text-on-surface-variant hover:text-stitch-primary hover:bg-surface-container transition-colors border border-surface-variant/40 text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </Link>
          
          <button 
            onClick={() => setShowAddForm(true)}
            className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-xl bg-stitch-primary text-on-primary font-bold text-sm shadow-[0_0_20px_rgba(125,211,252,0.25)] hover:bg-primary-fixed hover:text-on-primary-fixed active:scale-95 transition-all whitespace-nowrap ml-auto"
          >
            <Plus className="w-[18px] h-[18px]" />
            <span>New Task</span>
          </button>
        </div>
        
        {showAddForm && (
          <NewTaskForm onSuccess={() => setShowAddForm(false)} onClose={() => setShowAddForm(false)} taskSettings={taskSettings} />
        )}
        {showFilterPanel && (
          <div className="rounded-2xl bg-surface border border-surface-variant/40 shadow-lg p-4 mb-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface">Filters</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setFilters({ priority: "", dueDatePreset: "" })} 
                  className="text-xs font-semibold text-on-surface-variant hover:text-on-surface"
                >
                  Clear all
                </button>
                <button onClick={() => setShowFilterPanel(false)} className="text-on-surface-variant hover:text-on-surface"><X className="w-4 h-4"/></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Priority</label>
                <select value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})} className="w-full h-9 px-3 bg-surface-container text-sm rounded-lg border border-surface-variant/50 focus:outline-none">
                  <option value="">Any Priority</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Due Date</label>
                <select value={filters.dueDatePreset} onChange={e => setFilters({...filters, dueDatePreset: e.target.value})} className="w-full h-9 px-3 bg-surface-container text-sm rounded-lg border border-surface-variant/50 focus:outline-none">
                  <option value="">Any Date</option>
                  <option value="today">Today</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Rendering */}
      {viewMode === "kanban" ? (
        <>
          {/* Column Pill Bar (Horizontal Swipeable) */}
      <div className="w-full overflow-x-auto no-scrollbar pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 min-w-max">
          {Object.entries(tabData).map(([key, data]) => {
            const isActive = activeTab === key;
            return (
              <button 
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all ${isActive ? `${data.colorClass} shadow-[0_0_15px_rgba(125,211,252,0.15)] font-semibold` : 'text-on-surface-variant bg-surface-container-low/60 hover:text-on-surface hover:bg-surface-container/80 font-medium'}`}
              >
                <span className={`w-2 h-2 rounded-full ${data.indicatorClass} ${isActive ? 'shadow-sm' : ''}`}></span>
                <span>{data.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? data.badgeClass : 'bg-surface-variant text-on-surface-variant'}`}>{data.tasks.length}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Active Column Status Summary */}
      <div className="py-2 flex items-center justify-between text-xs text-on-surface-variant">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-stitch-primary font-bold">{activeTasks.length} {tabData[activeTab as keyof typeof tabData].label}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-on-surface-variant/80">
          <Clock className="w-[14px] h-[14px]" />
          <span>Synced moments ago</span>
        </div>
      </div>
      
      {/* Tasks Stack Container */}
      <div className="pt-1 pb-4 space-y-3.5">
        {activeTasks.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center opacity-70">
            <CheckCircle2 className="w-12 h-12 text-on-surface-variant mb-3 opacity-50" />
            <p className="text-sm font-medium text-on-surface-variant">No tasks found</p>
          </div>
        ) : (
          activeTasks.map(task => <TaskCard key={task._id} task={task} />)
        )}
      </div>
      </>
      ) : (
        <div className="pt-2 pb-4 space-y-3.5">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center opacity-70">
              <CheckCircle2 className="w-12 h-12 text-on-surface-variant mb-3 opacity-50" />
              <p className="text-sm font-medium text-on-surface-variant">No tasks found</p>
            </div>
          ) : (
            filteredTasks.map(task => <TaskCard key={task._id} task={task} />)
          )}
        </div>
      )}
    </div>
  );
}
