"use client";
import { formatDate, formatDateTime, formatTime } from "@/lib/dateUtils";
import { useEffect, useState } from "react";
import { getTaskHistory } from "@/actions/task.actions";
import { Clock, CheckCircle2, AlertCircle, RefreshCw, Flag, Edit3, PlusCircle, Trash2 } from "lucide-react";

export default function TaskTimeline({ taskId }: { taskId: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTaskHistory(taskId).then(res => {
      setHistory(res.history);
      setLoading(false);
    });
  }, [taskId]);

  if (loading) return <div className="animate-pulse flex gap-3"><div className="w-4 h-4 bg-surface-variant rounded-full"></div><div className="h-4 bg-surface-variant rounded w-32"></div></div>;
  if (history.length === 0) return <div className="text-sm text-on-surface-variant italic">No history available</div>;

  const getIcon = (action: string) => {
    const l = action.toLowerCase();
    if (l.includes("created")) return <PlusCircle className="w-4 h-4 text-stitch-primary" />;
    if (l.includes("completed")) return <CheckCircle2 className="w-4 h-4 text-success" />;
    if (l.includes("priority")) return <Flag className="w-4 h-4 text-warning" />;
    if (l.includes("status")) return <RefreshCw className="w-4 h-4 text-secondary" />;
    if (l.includes("deleted")) return <Trash2 className="w-4 h-4 text-error" />;
    return <Edit3 className="w-4 h-4 text-on-surface-variant" />;
  };

  return (
    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-surface-variant/50 before:to-transparent">
      {history.map((item, idx) => (
        <div key={item._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-5 h-5 rounded-full border border-surface-variant bg-surface-container shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
            {getIcon(item.action)}
          </div>
          <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl border border-surface-variant/40 bg-surface-container-low shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-on-surface text-sm">{item.action}</span>
              <span className="text-[10px] font-mono text-on-surface-variant flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {item.previousValue || item.newValue ? (
              <div className="text-xs text-on-surface-variant mt-1.5 flex flex-col gap-1">
                {item.previousValue && <div className="line-through opacity-70 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-error/50 inline-block"></span>{item.previousValue}</div>}
                {item.newValue && <div className="text-on-surface flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success/50 inline-block"></span>{item.newValue}</div>}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
