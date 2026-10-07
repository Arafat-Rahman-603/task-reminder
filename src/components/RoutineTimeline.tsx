"use client";
import { formatDate, formatDateTime, formatTime } from "@/lib/dateUtils";
import { useEffect, useState } from "react";
import { getRoutineHistory } from "@/actions/routine.actions";
import { Calendar, CheckCircle2, Circle, AlertCircle } from "lucide-react";

export default function RoutineTimeline({ routineId }: { routineId: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRoutineHistory(routineId).then(res => {
      setHistory(res.history);
      setLoading(false);
    });
  }, [routineId]);

  if (loading) return <div className="animate-pulse flex gap-3"><div className="w-4 h-4 bg-surface-variant rounded-full"></div><div className="h-4 bg-surface-variant rounded w-32"></div></div>;
  if (history.length === 0) return <div className="text-sm text-on-surface-variant italic">No occurrence history available</div>;

  return (
    <div className="space-y-6">
      {history.map((item, idx) => (
        <div key={item._id} className="relative pl-6 before:absolute before:left-2.5 before:top-6 before:bottom-[-24px] last:before:hidden before:w-px before:bg-surface-variant/50">
          <div className="absolute left-1 top-1 w-3.5 h-3.5 rounded-full border-2 border-surface bg-surface-variant z-10" />
          
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
              {new Date(item.occurrenceDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </h4>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${item.status === 'Completed' ? 'bg-success/20 text-success' : item.status === 'Missed' ? 'bg-error/20 text-error' : 'bg-surface-variant text-on-surface-variant'}`}>
              {item.status}
            </span>
          </div>

          <div className="text-xs text-on-surface-variant mb-2 font-mono">
            {item.scheduledTime && <span>{item.scheduledTime} — Scheduled</span>}
            {item.completedAt && <span><br/>{formatTime(item.completedAt)} — Completed</span>}
          </div>

          {item.items && item.items.length > 0 && (
            <div className="bg-surface-container-low border border-surface-variant/40 rounded-xl p-3 space-y-2">
              {item.items.map((taskItem: any, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  {taskItem.isCompleted ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" /> : <Circle className="w-4 h-4 text-on-surface-variant shrink-0" />}
                  <span className={`text-sm ${taskItem.isCompleted ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>{taskItem.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
