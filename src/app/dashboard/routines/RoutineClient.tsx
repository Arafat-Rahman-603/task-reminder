"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Power, PowerOff, CheckCircle2, Circle } from "lucide-react";
import { createRoutine, updateRoutine, deleteRoutine, toggleRoutineItem } from "@/actions/routine.actions";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function RoutineClient({ initialRoutines }: { initialRoutines: any[] }) {
  const router = useRouter();
  const [routines, setRoutines] = useState(initialRoutines);
  const [isAdding, setIsAdding] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingRoutine, setEditingRoutine] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    timeOfDay: "Morning",
    items: [{ title: "" }]
  });

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    const items = formData.items.filter(i => i.title.trim() !== "");
    
    if (editingRoutine) {
      const res = await updateRoutine(editingRoutine._id, { ...formData, items });
      if (res.success) {
        setRoutines(routines.map(r => r._id === editingRoutine._id ? res.routine : r));
      }
    } else {
      const res = await createRoutine({ ...formData, items, schedule: ["Daily"], isActive: true });
      if (res.success) {
        setRoutines([res.routine, ...routines]);
      }
    }
    
    setIsAdding(false);
    setEditingRoutine(null);
    setFormData({ name: "", description: "", timeOfDay: "Morning", items: [{ title: "" }] });
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
    <div className="space-y-6 px-4 sm:px-0">
      {!isAdding && !editingRoutine ? (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
        >
          <Plus className="w-5 h-5" /> Create Routine
        </button>
      ) : (
        <div className="bg-surface-container p-6 rounded-2xl border border-surface-variant">
          <h2 className="text-xl font-bold text-on-surface mb-4">{editingRoutine ? "Edit Routine" : "New Routine"}</h2>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Routine Name (e.g., Morning Focus)" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 bg-surface border border-surface-variant rounded-xl text-on-surface"
            />
            <textarea 
              placeholder="Description" 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 bg-surface border border-surface-variant rounded-xl text-on-surface"
            />
            <select 
              value={formData.timeOfDay}
              onChange={e => setFormData({ ...formData, timeOfDay: e.target.value })}
              className="w-full p-3 bg-surface border border-surface-variant rounded-xl text-on-surface"
            >
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>
            
            <div>
              <h3 className="font-semibold text-on-surface mb-2">Steps</h3>
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    placeholder={`Step ${idx + 1}`}
                    value={item.title}
                    onChange={e => {
                      const newItems = [...formData.items];
                      newItems[idx].title = e.target.value;
                      setFormData({ ...formData, items: newItems });
                    }}
                    className="flex-1 p-2 bg-surface border border-surface-variant rounded-xl text-on-surface"
                  />
                </div>
              ))}
              <button 
                onClick={() => setFormData({ ...formData, items: [...formData.items, { title: "" }] })}
                className="text-sm text-primary font-medium"
              >
                + Add Step
              </button>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button onClick={handleSave} className="px-6 py-2 bg-primary text-primary-foreground rounded-xl">Save</button>
              <button onClick={() => { setIsAdding(false); setEditingRoutine(null); }} className="px-6 py-2 bg-surface-variant text-on-surface rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routines.map(routine => (
          <div key={routine._id} className={`p-5 rounded-2xl border ${routine.isActive ? 'bg-surface-container-low border-primary/20 shadow-sm' : 'bg-surface border-surface-variant/50 opacity-70'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg text-on-surface">{routine.name}</h3>
                <p className="text-sm text-on-surface-variant">{routine.timeOfDay} • {routine.items.length} steps</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(routine)} className={`p-2 rounded-lg ${routine.isActive ? 'text-primary bg-primary/10' : 'text-on-surface-variant bg-surface-variant'}`}>
                  {routine.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
                <button onClick={() => { setEditingRoutine(routine); setFormData({ name: routine.name, description: routine.description || "", timeOfDay: routine.timeOfDay, items: routine.items }); setIsAdding(true); }} className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(routine._id)} className="p-2 text-error hover:bg-error/10 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {routine.isActive && (
              <div className="mt-4 space-y-2">
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
                    <span className={`text-sm text-on-surface ${item.isCompleted ? 'line-through text-on-surface-variant opacity-70' : ''}`}>
                      {item.title}
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
