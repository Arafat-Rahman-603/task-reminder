"use client";

import { useState } from "react";
import { CheckCircle2, Circle, MoreHorizontal, Plus, Search, SlidersHorizontal, ChevronDown, Clock, MessageSquare, Paperclip, Zap, Trash2, CheckCircle, CircleDashed } from "lucide-react";
import { updateTaskStatus, deleteTask } from "@/actions/task.actions";
import { useTransition } from "react";
import NewTaskForm from "./NewTaskForm";

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
        <div className="cursor-pointer" onClick={handleToggle}>
          <h3 className={`text-sm font-semibold transition-colors leading-snug ${isDone ? 'line-through text-on-surface-variant group-hover:text-secondary-fixed' : 'text-on-surface group-hover:text-stitch-primary'}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-on-surface-variant/90 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        
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
export default function KanbanBoard({ initialTasks }: { initialTasks: any[] }) {
  const [activeTab, setActiveTab] = useState("todo");
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = initialTasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const todoTasks = filteredTasks.filter(t => t.status === "Pending" || t.status === "Inbox" || t.status === "Planned");
  const inProgressTasks = filteredTasks.filter(t => t.status === "In Progress");
  const doneTasks = filteredTasks.filter(t => t.status === "Completed");
  
  // Create a mapping for tabs to arrays
  const tabData = {
    "todo": { label: "To Do", tasks: todoTasks, colorClass: "text-stitch-secondary bg-secondary/20", indicatorClass: "bg-stitch-secondary", badgeClass: "bg-surface-variant text-on-surface-variant" },
    "in-progress": { label: "In Progress", tasks: inProgressTasks, colorClass: "text-stitch-primary bg-primary/20", indicatorClass: "bg-stitch-primary", badgeClass: "bg-primary/30 text-on-surface" },
    "done": { label: "Done", tasks: doneTasks, colorClass: "text-secondary-fixed bg-secondary-fixed/20", indicatorClass: "bg-secondary-fixed", badgeClass: "bg-surface-variant text-on-surface-variant" }
  };

  const activeTasks = tabData[activeTab as keyof typeof tabData].tasks;

  return (
    <div className="flex flex-col w-full text-on-surface">
      {/* Header Actions Panel */}
      <div className="space-y-3 relative z-10 mb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 min-w-0">
            <button className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container/60 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:bg-surface-container-high/70 transition-all text-left group">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-stitch-primary shadow-[0_0_10px_rgba(125,211,252,0.8)] animate-pulse"></span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider leading-none">Active View</span>
                  <span className="text-sm font-semibold text-on-surface truncate group-hover:text-stitch-primary transition-colors">My Tasks</span>
                </div>
              </div>
              <ChevronDown className="w-[20px] h-[20px] text-on-surface-variant group-hover:text-stitch-primary transition-transform duration-200" />
            </button>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-medium text-xs shadow-[0_0_20px_rgba(125,211,252,0.25)] hover:bg-stitch-primary hover:text-on-primary active:scale-95 transition-all whitespace-nowrap"
          >
            <Plus className="w-[18px] h-[18px]" />
            <span>Task</span>
          </button>
        </div>
        
        {showAddForm && (
          <div className="rounded-2xl bg-surface-container/70 backdrop-blur-2xl p-4 shadow-lg border border-primary/20">
            <NewTaskForm onSuccess={() => setShowAddForm(false)} />
          </div>
        )}
        
        {/* Search & View Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-on-surface-variant pointer-events-none" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..." 
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-surface-container-low/70 backdrop-blur-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:bg-surface-container/90 transition-all shadow-inner" 
            />
          </div>
          <button aria-label="Sort options" className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low/70 text-on-surface-variant hover:text-stitch-primary hover:bg-surface-container transition-colors">
            <SlidersHorizontal className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

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
    </div>
  );
}
