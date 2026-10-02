"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Power, PowerOff, CheckCircle2, Circle, Search, SlidersHorizontal, LayoutList, LayoutGrid, X } from "lucide-react";
import { createRoutine, updateRoutine, deleteRoutine, toggleRoutineItem } from "@/actions/routine.actions";
import { useRouter } from "next/navigation";
import NewRoutineForm from "./NewRoutineForm";
import Link from "next/link";
import { FilterSystem, FilterDefinition } from "@/components/ui/FilterSystem";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function RoutineClient({ initialRoutines }: { initialRoutines: any[] }) {
  const router = useRouter();
  const [routines, setRoutines] = useState(initialRoutines);
  const [isAdding, setIsAdding] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingRoutine, setEditingRoutine] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [filters, setFilters] = useState<Record<string, any>>({});

  const ROUTINE_FILTERS: FilterDefinition[] = [
    {
      id: "timeOfDay",
      label: "Time of Day",
      type: "select",
      options: [
        { value: "Morning", label: "Morning" },
        { value: "Afternoon", label: "Afternoon" },
        { value: "Evening", label: "Evening" },
        { value: "Night", label: "Night" }
      ]
    },
    {
      id: "date",
      label: "Custom Date Range",
      type: "date-range"
    }
  ];

  const filteredRoutines = routines.filter(r => {
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase()) && !r.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filters.timeOfDay && r.timeOfDay !== filters.timeOfDay) {
      return false;
    }
    
    // Custom Date Range (filtering by createdAt)
    if (r.createdAt && (filters.date_start || filters.date_end)) {
      const created = new Date(r.createdAt);
      if (filters.date_start) {
        const start = new Date(filters.date_start);
        start.setHours(0, 0, 0, 0);
        if (created < start) return false;
      }
      if (filters.date_end) {
        const end = new Date(filters.date_end);
        end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }
    }
    
    return true;
  });

  const handleCloseForm = () => {
    setIsAdding(false);
    setEditingRoutine(null);
    router.refresh();
  };
  const toggleActive = async (routine: any) => {
    const res = await updateRoutine(routine._id, { isActive: !routine.isActive });
    if (res.success) {
      setRoutines(routines.map(r => r._id === routine._id ? res.routine : r));
      router.refresh();
    }
  };

  const handleToggleItem = async (routine: any, itemIndex: number, currentStatus: boolean) => {
    // Optimistic UI update
    const updatedRoutines = routines.map(r => {
      if (r._id === routine._id) {
        const newItems = [...r.items];
        newItems[itemIndex] = { ...newItems[itemIndex], isCompleted: !currentStatus };
        return { ...r, items: newItems };
      }
      return r;
    });
    setRoutines(updatedRoutines);

    const res = await toggleRoutineItem(routine._id, itemIndex, !currentStatus);
    if (!res.success) {
      // Revert on failure
      setRoutines(routines);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this routine?")) {
      const res = await deleteRoutine(id);
      if (res.success) {
        setRoutines(routines.filter(r => r._id !== id));
        router.refresh();
      }
    }
  };

  return (
    <div className="flex flex-col w-full text-on-surface">
      {/* Header Actions Panel */}
      <div className="space-y-3 relative z-10 mb-6">
        
        {/* Modern Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-on-surface-variant pointer-events-none" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search routines..." 
              className="w-full pl-10 pr-4 h-10 text-sm rounded-xl bg-surface-container-low/70 backdrop-blur-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:bg-surface-container/90 transition-all border border-surface-variant/40" 
            />
          </div>
          
          <FilterSystem 
            filters={ROUTINE_FILTERS} 
            appliedState={filters}
            onApply={(newFilters) => setFilters(newFilters)} 
          />
          
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
              title="Grid View"
            >
              <LayoutGrid className="w-[16px] h-[16px]" />
            </button>
          </div>
          
          <Link href="/dashboard/settings" aria-label="Settings" className="h-10 px-3 flex items-center gap-2 rounded-xl bg-surface-container-low/70 text-on-surface-variant hover:text-stitch-primary hover:bg-surface-container transition-colors border border-surface-variant/40 text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </Link>
          
          <button 
            onClick={() => setIsAdding(true)}
            className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-xl bg-stitch-primary text-on-primary font-bold text-sm shadow-[0_0_20px_rgba(125,211,252,0.25)] hover:bg-primary-fixed hover:text-on-primary-fixed active:scale-95 transition-all whitespace-nowrap ml-auto"
          >
            <Plus className="w-[18px] h-[18px]" />
            <span>New Routine</span>
          </button>
        </div>
        
        {(isAdding || editingRoutine) && (
          <NewRoutineForm initialData={editingRoutine} onClose={handleCloseForm} />
        )}
      </div>

      <div className={viewMode === "kanban" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
        {filteredRoutines.map(routine => (
          <div key={routine._id} className={`p-5 rounded-2xl border transition-all ${routine.isActive ? 'bg-surface-container-low border-stitch-primary/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)]' : 'bg-surface border-surface-variant/50 opacity-70'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg text-on-surface">{routine.name}</h3>
                <p className="text-xs text-on-surface-variant/80 mt-0.5">{routine.timeOfDay} • {routine.items.length} steps</p>
                {routine.schedule && routine.schedule.length > 0 && (
                  <div className="mt-2 text-[10px] font-semibold tracking-wider text-stitch-secondary uppercase">
                    {routine.schedule.join(", ")}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(routine)} className={`p-2 rounded-lg transition-colors ${routine.isActive ? 'text-stitch-primary bg-primary/10 hover:bg-primary/20' : 'text-on-surface-variant bg-surface-variant hover:bg-surface-variant/80'}`}>
                  {routine.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditingRoutine(routine)} className="p-2 text-on-surface-variant hover:text-stitch-primary hover:bg-surface-container rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(routine._id)} className="p-2 text-error hover:bg-error/10 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {routine.isActive && (
              <div className="mt-4 space-y-2">
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-stitch-primary transition-all duration-500 ease-in-out" 
                    style={{ width: `${routine.items.length > 0 ? (routine.items.filter((i: any) => i.isCompleted).length / routine.items.length) * 100 : 0}%` }}
                  />
                </div>
                
                {routine.items.map((item: any, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => handleToggleItem(routine, idx, item.isCompleted)}
                    className="w-full flex items-center gap-3 p-2 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors"
                  >
                    {item.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-stitch-primary" />
                    ) : (
                      <Circle className="w-5 h-5 text-on-surface-variant" />
                    )}
                    <span className={`text-sm ${item.isCompleted ? 'line-through text-on-surface-variant opacity-70' : 'text-on-surface font-medium'}`}>
                      {item.title}
                      {item.durationMinutes && <span className="ml-2 text-xs text-on-surface-variant no-underline">({item.durationMinutes}m)</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
