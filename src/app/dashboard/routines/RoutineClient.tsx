"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus, Edit2, Trash2, Power, PowerOff, CheckCircle2,
  Circle, Search, LayoutList, LayoutGrid, ExternalLink,
  Clock, CalendarDays, Flame, X
} from "lucide-react";
import { updateRoutine, deleteRoutine, toggleRoutineItem } from "@/actions/routine.actions";
import { useRouter } from "next/navigation";
import NewRoutineForm from "./NewRoutineForm";
import Link from "next/link";
import { FilterSystem, FilterDefinition } from "@/components/ui/FilterSystem";



// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function RoutineClient({ initialRoutines }: { initialRoutines: any[] }) {
  const router = useRouter();
  const [routines, setRoutines] = useState(initialRoutines);
  useEffect(() => { setRoutines(initialRoutines); }, [initialRoutines]);
  const [isAdding, setIsAdding] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingRoutine, setEditingRoutine] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filters, setFilters] = useState<Record<string, any>>({});
  
  const ROUTINE_FILTERS: FilterDefinition[] = [
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" }
      ]
    },
    {
      id: "schedule",
      label: "Frequency",
      type: "select",
      options: [
        { value: "Daily", label: "Daily" },
        { value: "Weekly", label: "Weekly (Specific Days)" }
      ]
    },
    {
      id: "day",
      label: "Specific Day",
      type: "select",
      options: [
        { value: "Monday", label: "Monday" },
        { value: "Tuesday", label: "Tuesday" },
        { value: "Wednesday", label: "Wednesday" },
        { value: "Thursday", label: "Thursday" },
        { value: "Friday", label: "Friday" },
        { value: "Saturday", label: "Saturday" },
        { value: "Sunday", label: "Sunday" }
      ]
    },
    {
      id: "stepCount",
      label: "Steps",
      type: "select",
      options: [
        { value: "none", label: "0 Steps" },
        { value: "1-3", label: "1 to 3 Steps" },
        { value: "4+", label: "4 or more Steps" }
      ]
    }
  ];

  const filteredRoutines = useMemo(() => {
    return routines.filter(r => {
      if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !r.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        
      if (filters.status === "active" && !r.isActive) return false;
      if (filters.status === "inactive" && r.isActive) return false;
      
      if (filters.stepCount) {
        const count = r.items?.length || 0;
        if (filters.stepCount === "none" && count !== 0) return false;
        if (filters.stepCount === "1-3" && (count < 1 || count > 3)) return false;
        if (filters.stepCount === "4+" && count < 4) return false;
      }

      if (filters.schedule) {
        if (filters.schedule === "Daily" && (!r.schedule || r.schedule[0] !== "Daily")) return false;
        if (filters.schedule === "Weekly" && (!r.schedule || r.schedule[0] === "Daily")) return false;
      }

      if (filters.day) {
        // If it's daily, it technically runs on any given day.
        // If it's weekly, it must include the specific day in its schedule array.
        if (r.schedule && r.schedule[0] !== "Daily") {
          if (!r.schedule.includes(filters.day)) return false;
        }
      }
      
      return true;
    });
  }, [routines, searchQuery, filters]);

  const activeCount = routines.filter(r => r.isActive).length;
  const inactiveCount = routines.filter(r => !r.isActive).length;

  const handleCloseForm = () => {
    setIsAdding(false);
    setEditingRoutine(null);
    router.refresh();
  };

  const toggleActive = async (routine: any) => {
    const res = await updateRoutine(routine._id, { isActive: !routine.isActive });
    if (res.success) {
      setRoutines(prev => prev.map(r => r._id === routine._id ? { ...r, isActive: !r.isActive } : r));
    }
  };

  const handleToggleItem = async (routine: any, itemIndex: number, currentStatus: boolean) => {
    setRoutines(prev => prev.map(r => {
      if (r._id !== routine._id) return r;
      const newItems = [...r.items];
      newItems[itemIndex] = { ...newItems[itemIndex], isCompleted: !currentStatus };
      return { ...r, items: newItems };
    }));
    const res = await toggleRoutineItem(routine._id, itemIndex, !currentStatus);
    if (!res.success) setRoutines(routines);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this routine?")) return;
    const res = await deleteRoutine(id);
    if (res.success) {
      setRoutines(prev => prev.filter(r => r._id !== id));
    }
  };

  const getProgress = (routine: any) => {
    const total = routine.items?.length || 0;
    const done = routine.items?.filter((i: any) => i.isCompleted).length || 0;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };



  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
        {/* Search + View Toggle Container (always side by side on mobile) */}
        <div className="flex gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search routines…"
              className="w-full h-10 pl-9 pr-4 text-sm rounded-xl bg-surface-container-low border border-surface-variant/40 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-stitch-primary/60 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Filter Option */}
          <div className="flex-shrink-0">
            <FilterSystem 
              filters={ROUTINE_FILTERS} 
              appliedState={filters}
              onApply={(newFilters) => setFilters(newFilters)} 
            />
          </div>

          {/* View toggle */}
          <div className="flex bg-surface-container-low border border-surface-variant/40 rounded-xl overflow-hidden h-10 flex-shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className={`px-2.5 sm:px-3 flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-stitch-primary/15 text-stitch-primary" : "text-on-surface-variant hover:text-on-surface"}`}
              title="List View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2.5 sm:px-3 flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-stitch-primary/15 text-stitch-primary" : "text-on-surface-variant hover:text-on-surface"}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Routine button */}
        <button
          onClick={() => setIsAdding(true)}
          className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-xl bg-stitch-primary text-on-primary font-bold text-sm hover:opacity-90 active:scale-95 transition-all whitespace-nowrap w-full sm:w-auto flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Routine</span>
        </button>
      </div>

      {/* Form */}
      {(isAdding || editingRoutine) && (
        <NewRoutineForm initialData={editingRoutine} onClose={handleCloseForm} />
      )}

      {/* Empty state */}
      {filteredRoutines.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-container-high bg-surface-container/30 py-16 text-center animate-in fade-in-50 duration-500">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4">
            <CalendarDays className="w-7 h-7 text-on-surface-variant" />
          </div>
          <h3 className="text-base font-semibold text-on-surface">
            {searchQuery ? "No routines match your search" : filters.status ? `No ${filters.status} routines` : "No routines yet"}
          </h3>
          <p className="text-sm text-on-surface-variant mt-1 max-w-xs">
            {searchQuery ? "Try a different search term." : "Create your first routine to build healthy daily habits."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsAdding(true)}
              className="mt-6 px-5 py-2 bg-stitch-primary text-on-primary font-semibold text-sm rounded-xl hover:opacity-90 transition-opacity"
            >
              + Create Routine
            </button>
          )}
        </div>
      )}

      {/* Routine list/grid */}
      <div className={viewMode === "grid"
        ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
        : "flex flex-col gap-3"
      }>
        {filteredRoutines.map(routine => {
          const progress = getProgress(routine);
          const completedCount = routine.items?.filter((i: any) => i.isCompleted).length || 0;
          const totalCount = routine.items?.length || 0;
          const scheduleStr = routine.schedule?.length > 0
            ? (routine.schedule[0] === "Daily" ? "Daily" : routine.schedule.join(", "))
            : null;

          return (
            <div
              key={routine._id}
              className={`rounded-2xl border transition-all ${
                routine.isActive
                  ? "bg-surface-container-low border-surface-variant/40 hover:border-stitch-primary/30 shadow-sm"
                  : "bg-surface border-surface-variant/30 opacity-60"
              }`}
            >
              {/* Card header */}
              <div className="p-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Name */}
                    <Link href={`/dashboard/routines/${routine._id}`} className="group">
                      <h3 className="font-bold text-base text-on-surface group-hover:text-stitch-primary transition-colors leading-tight truncate">
                        {routine.name}
                      </h3>
                    </Link>

                    {/* Meta row */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {routine.startTime && (
                        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                          <Clock className="w-3 h-3" />
                          {routine.startTime}{routine.endTime ? `–${routine.endTime}` : ""}
                        </span>
                      )}
                      {scheduleStr && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stitch-secondary px-1.5 py-0.5 bg-stitch-secondary/10 rounded-md">
                          {scheduleStr}
                        </span>
                      )}
                      {totalCount > 0 && (
                        <span className="text-xs text-on-surface-variant">
                          {completedCount}/{totalCount} steps
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {routine.description && (
                      <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-1">{routine.description}</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                    <Link
                      href={`/dashboard/routines/${routine._id}`}
                      className="p-2 rounded-lg text-on-surface-variant hover:text-stitch-primary hover:bg-surface-container transition-colors"
                      title="View Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setEditingRoutine(routine)}
                      className="p-2 rounded-lg text-on-surface-variant hover:text-stitch-primary hover:bg-surface-container transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleActive(routine)}
                      className={`p-2 rounded-lg transition-colors ${
                        routine.isActive
                          ? "text-stitch-primary hover:bg-stitch-primary/10"
                          : "text-on-surface-variant hover:bg-surface-container"
                      }`}
                      title={routine.isActive ? "Deactivate" : "Activate"}
                    >
                      {routine.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(routine._id)}
                      className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {routine.isActive && totalCount > 0 && (
                  <div className="mt-3">
                    <div className="w-full h-1.5 bg-surface-variant/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-stitch-primary rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items checklist — only show when active */}
              {routine.isActive && totalCount > 0 && (
                <div className="px-4 pb-4 space-y-1.5">
                  {routine.items.map((item: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleToggleItem(routine, idx, item.isCompleted)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-surface hover:bg-surface-container-high border border-surface-variant/30 transition-colors text-left"
                    >
                      {item.isCompleted
                        ? <CheckCircle2 className="w-4 h-4 text-stitch-primary flex-shrink-0" />
                        : <Circle className="w-4 h-4 text-on-surface-variant flex-shrink-0" />}
                      <span className={`text-sm truncate ${item.isCompleted ? "line-through text-on-surface-variant/60" : "text-on-surface font-medium"}`}>
                        {item.title}
                      </span>
                      {item.durationMinutes && (
                        <span className="ml-auto text-xs text-on-surface-variant flex-shrink-0">{item.durationMinutes}m</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}