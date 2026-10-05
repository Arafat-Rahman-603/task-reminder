"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createRoutine, updateRoutine } from "@/actions/routine.actions";
import { useRouter } from "next/navigation";
import { X, Calendar, Clock, Bell, ListChecks } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function NewRoutineForm({ initialData, onClose }: { initialData?: any, onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [startDate, setStartDate] = useState(initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : "");
  const [startTime, setStartTime] = useState(initialData?.startTime || "");
  const [endTime, setEndTime] = useState(initialData?.endTime || "");
  const [scheduleType, setScheduleType] = useState(initialData?.schedule?.[0] === "Daily" ? "Daily" : "Weekdays");
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(
    initialData?.schedule?.filter((s: string) => s !== "Daily") || []
  );
  
  type ItemType = { title: string, durationMinutes?: number, remindAtStart?: boolean, remindAtEnd?: boolean };
  const [items, setItems] = useState<ItemType[]>(
    initialData?.items?.length ? initialData.items : [{ title: "", remindAtStart: false, remindAtEnd: false }]
  );
  
  // Hydrate reminder state
  let initReminder = "none";
  if (initialData?.reminder?.remindAt && initialData?.startTime) {
    const remindAtDt = new Date(initialData.reminder.remindAt);
    const remindAtTime = remindAtDt.getTime();
    
    // Construct the scheduled event time for the SAME DAY as the reminder
    const dateStr = remindAtDt.toISOString().split('T')[0];
    const eventTime = new Date(`${dateStr}T${initialData.startTime}`).getTime();
    
    if (!isNaN(remindAtTime) && !isNaN(eventTime)) {
      const diffMinutes = Math.round((eventTime - remindAtTime) / 60000);
      if (diffMinutes === 0) initReminder = "at_start";
      else if (diffMinutes === 10) initReminder = "10_min";
      else if (diffMinutes === 15) initReminder = "15_min";
      else if (diffMinutes === 30) initReminder = "30_min";
    }
  }
  
  const [reminder, setReminder] = useState(initReminder);

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleWeekday = (day: string) => {
    if (selectedWeekdays.includes(day)) {
      setSelectedWeekdays(selectedWeekdays.filter(d => d !== day));
    } else {
      setSelectedWeekdays([...selectedWeekdays, day]);
    }
  };

  // Calculate End Time automatically
  useEffect(() => {
    if (startTime) {
      const totalMinutes = items.reduce((sum, item) => sum + (Number(item.durationMinutes) || 0), 0);
      if (totalMinutes > 0) {
        const dt = new Date(`1970-01-01T${startTime}`);
        if (!isNaN(dt.getTime())) {
          dt.setMinutes(dt.getMinutes() + totalMinutes);
          setEndTime(dt.toTimeString().substring(0, 5));
        }
      }
    }
  }, [startTime, items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    let currentDt = startTime ? new Date(`1970-01-01T${startTime}`) : null;
    
    const validItems = items.filter(i => i.title.trim() !== "").map(i => {
      let iStart = undefined;
      let iEnd = undefined;
      const duration = i.durationMinutes ? Number(i.durationMinutes) : 0;
      
      if (currentDt && !isNaN(currentDt.getTime()) && duration > 0) {
        iStart = currentDt.toTimeString().substring(0, 5);
        currentDt = new Date(currentDt.getTime() + duration * 60000);
        iEnd = currentDt.toTimeString().substring(0, 5);
      }
      
      return { 
        title: i.title, 
        durationMinutes: duration > 0 ? duration : undefined,
        remindAtStart: i.remindAtStart,
        remindAtEnd: i.remindAtEnd,
        startTime: iStart,
        endTime: iEnd
      };
    });

    const finalSchedule = scheduleType === "Daily" ? ["Daily"] : selectedWeekdays;

    let reminderTime: string | null | undefined = undefined;
    if (reminder === "none") {
      reminderTime = null; 
    } else if (startTime) {
      const referenceDateStr = (initialData?.reminder?.remindAt) 
        ? new Date(initialData.reminder.remindAt).toISOString().split('T')[0] 
        : (startDate || new Date().toISOString().split('T')[0]);
        
      const dt = new Date(`${referenceDateStr}T${startTime}`);
      if (!isNaN(dt.getTime())) {
        if (reminder === "at_start") reminderTime = dt.toISOString();
        else if (reminder === "10_min") reminderTime = new Date(dt.getTime() - 10 * 60000).toISOString();
        else if (reminder === "15_min") reminderTime = new Date(dt.getTime() - 15 * 60000).toISOString();
        else if (reminder === "30_min") reminderTime = new Date(dt.getTime() - 30 * 60000).toISOString();
      }
    }

    const payload = {
      name,
      description: description || undefined,
      startDate: startDate || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      schedule: finalSchedule,
      items: validItems,
      isActive: initialData ? initialData.isActive : true,
      reminderTime
    };

    const res = initialData 
      ? await updateRoutine(initialData._id, payload)
      : await createRoutine(payload);

    if (res.success) {
      router.refresh();
      onClose();
    } else {
      setError(res.error || "Failed to save routine");
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface border border-surface-variant/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-variant/30">
          <h2 className="text-lg font-bold text-on-surface">{initialData ? "Edit Routine" : "Create Routine"}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant/20 hover:text-on-surface transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="routine-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-surface-variant scrollbar-track-transparent">
          {error && <div className="text-sm font-medium text-error bg-error/10 p-3 rounded-xl">{error}</div>}

          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Routine Name (e.g., Morning Focus)"
                className="w-full bg-surface-container-low px-4 py-3.5 rounded-xl text-lg font-bold text-on-surface placeholder:text-on-surface-variant/50 border border-surface-variant/50 focus:outline-none focus:border-stitch-primary focus:ring-1 focus:ring-stitch-primary transition-all shadow-sm"
                autoFocus
              />
            </div>
            
            <div className="flex items-start gap-3 bg-surface-container-low px-4 py-3 rounded-xl border border-surface-variant/50 focus-within:border-stitch-primary focus-within:ring-1 focus-within:ring-stitch-primary transition-all shadow-sm">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add description..."
                className="w-full min-h-[60px] bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 resize-none focus:outline-none"
              />
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-4 border-t border-surface-variant/30 pt-4">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2"><Clock className="w-4 h-4"/> Schedule & Time</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Start Time</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">End Time</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full h-10 px-3 bg-surface-container border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant">Repeat</label>
              <select value={scheduleType} onChange={e => setScheduleType(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors">
                <option value="Daily">Daily</option>
                <option value="Weekdays">Selected Weekdays</option>
              </select>
            </div>
            
            {scheduleType === "Weekdays" && (
              <div className="flex flex-wrap gap-2 mt-2">
                {weekdays.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekday(day)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${selectedWeekdays.includes(day) ? 'bg-stitch-primary text-on-primary' : 'bg-surface-container border border-surface-variant text-on-surface-variant hover:text-on-surface'}`}
                  >
                    {day.substring(0,3)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5 border-t border-surface-variant/30 pt-4">
            <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5"><Bell className="w-3.5 h-3.5"/> Routine Reminder</label>
            <select value={reminder} onChange={e => setReminder(e.target.value)} className="w-full h-10 px-3 bg-surface-container-low border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors">
              <option value="none">No reminder</option>
              <option value="at_start">At start time</option>
              <option value="10_min">10 minutes before</option>
              <option value="15_min">15 minutes before</option>
              <option value="30_min">30 minutes before</option>
            </select>
          </div>

          {/* Routine Items */}
          <div className="space-y-4 border-t border-surface-variant/30 pt-4">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2"><ListChecks className="w-4 h-4"/> Steps</h3>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-3 bg-surface-container-low rounded-xl border border-surface-variant/50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder={`Step ${idx + 1}`}
                      value={item.title}
                      onChange={e => {
                        const newItems = [...items];
                        newItems[idx].title = e.target.value;
                        setItems(newItems);
                      }}
                      className="flex-1 h-10 px-3 bg-surface-container border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors"
                    />
                    <input
                      type="number"
                      placeholder="Min"
                      value={item.durationMinutes || ""}
                      onChange={e => {
                        const newItems = [...items];
                        newItems[idx].durationMinutes = e.target.value ? Number(e.target.value) : undefined;
                        setItems(newItems);
                      }}
                      className="w-20 h-10 px-3 bg-surface-container border border-surface-variant/50 rounded-xl text-sm focus:outline-none focus:border-stitch-primary transition-colors"
                    />
                  </div>
                  <div className="flex gap-4 items-center px-1">
                    <label className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1.5 cursor-pointer hover:text-stitch-primary">
                      <input 
                        type="checkbox" 
                        checked={item.remindAtStart || false} 
                        onChange={e => {
                          const newItems = [...items];
                          newItems[idx].remindAtStart = e.target.checked;
                          setItems(newItems);
                        }} 
                        className="rounded border-surface-variant/50 text-stitch-primary focus:ring-stitch-primary"
                      /> 
                      Remind at Start
                    </label>
                    <label className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1.5 cursor-pointer hover:text-stitch-primary">
                      <input 
                        type="checkbox" 
                        checked={item.remindAtEnd || false} 
                        onChange={e => {
                          const newItems = [...items];
                          newItems[idx].remindAtEnd = e.target.checked;
                          setItems(newItems);
                        }} 
                        className="rounded border-surface-variant/50 text-stitch-primary focus:ring-stitch-primary"
                      /> 
                      Remind at End
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setItems([...items, { title: "", remindAtStart: false, remindAtEnd: false }])}
              className="text-sm text-stitch-primary font-semibold hover:text-primary-fixed transition-colors"
            >
              + Add Step
            </button>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-surface-variant/30 bg-surface-container-lowest/50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-variant/20 transition-colors">
            Cancel
          </button>
          <button form="routine-form" type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl bg-stitch-primary text-on-primary text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-fixed transition-colors disabled:opacity-50">
            {loading ? "Saving..." : initialData ? "Save Changes" : "Create Routine"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

