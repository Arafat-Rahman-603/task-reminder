"use client";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft, Calendar, CheckCircle2, Circle, Clock,
  TrendingUp, Target, Flame, AlertCircle, BarChart2,
  Info, Activity
} from "lucide-react";
import Link from "next/link";
import { getRoutineHistory, getRoutineStats } from "@/actions/routine.actions";

type HistoryItem = {
  _id: string;
  occurrenceDate: string;
  scheduledTime?: string;
  status: "Scheduled" | "Completed" | "Missed";
  completedAt?: string;
  items: { title: string; isCompleted: boolean }[];
  timestamp: string;
};

type Stats = {
  total: number;
  completed: number;
  missed: number;
  pending: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  lastCompleted: HistoryItem | null;
  nextScheduled: HistoryItem | null;
};

type StatusFilter = "all" | "Completed" | "Scheduled" | "Missed";
type DateRangeFilter = "all" | "today" | "week" | "month" | "custom";

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-surface-container-low rounded-2xl border border-surface-variant/40 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-on-surface-variant truncate">{label}</p>
        <p className="text-xl font-bold text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Missed: "bg-red-500/15 text-red-400 border-red-500/30",
    Scheduled: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles[status] || "bg-surface-variant text-on-surface-variant border-surface-variant"}`}>
      {status}
    </span>
  );
}

export default function RoutineDetailClient({ routine }: { routine: any }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    Promise.all([
      getRoutineHistory(routine._id),
      getRoutineStats(routine._id),
    ]).then(([histRes, statsRes]) => {
      setHistory((histRes.history || []) as HistoryItem[]);
      setStats(statsRes as Stats | null);
      setLoading(false);
    });
  }, [routine._id]);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;

      const itemDate = new Date(item.occurrenceDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateRangeFilter === "today") {
        const itemDay = new Date(itemDate);
        itemDay.setHours(0, 0, 0, 0);
        if (itemDay.getTime() !== today.getTime()) return false;
      } else if (dateRangeFilter === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (itemDate < weekAgo) return false;
      } else if (dateRangeFilter === "month") {
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        if (itemDate < monthAgo) return false;
      } else if (dateRangeFilter === "custom") {
        if (customStart) {
          const start = new Date(customStart);
          start.setHours(0, 0, 0, 0);
          if (itemDate < start) return false;
        }
        if (customEnd) {
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) return false;
        }
      }
      return true;
    });
  }, [history, statusFilter, dateRangeFilter, customStart, customEnd]);

  const scheduleLabel = routine.schedule && routine.schedule.length > 0
    ? (routine.schedule[0] === "Daily" ? "Daily" : routine.schedule.join(", "))
    : "—";

  const recurrenceLabel = routine.recurrence || scheduleLabel;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Back header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/routines"
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-surface-container transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-on-surface truncate">{routine.name}</h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
              routine.isActive
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-surface-variant text-on-surface-variant border-surface-variant"
            }`}>
              {routine.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {routine.description && (
            <p className="text-sm text-on-surface-variant mt-0.5 line-clamp-2">{routine.description}</p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-surface-container-low rounded-2xl border border-surface-variant/40 p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard icon={BarChart2} label="Completion Rate" value={`${stats.completionRate}%`} color="bg-stitch-primary/15 text-stitch-primary" />
          <StatCard icon={Flame} label="Current Streak" value={`${stats.currentStreak} days`} color="bg-orange-500/15 text-orange-400" />
          <StatCard icon={TrendingUp} label="Best Streak" value={`${stats.bestStreak} days`} color="bg-purple-500/15 text-purple-400" />
          <StatCard icon={Target} label="Total Occurrences" value={stats.total} color="bg-sky-500/15 text-sky-400" />
          <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="bg-emerald-500/15 text-emerald-400" />
          <StatCard icon={AlertCircle} label="Missed" value={stats.missed} color="bg-red-500/15 text-red-400" />
          <StatCard icon={Clock} label="Pending" value={stats.pending} color="bg-amber-500/15 text-amber-400" />
          <StatCard icon={Activity} label="Streak Record" value={stats.bestStreak > 0 ? `${stats.bestStreak} days` : "—"} color="bg-teal-500/15 text-teal-400" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Routine Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Details card */}
          <div className="bg-surface-container-low rounded-2xl border border-surface-variant/40 p-5 space-y-4">
            <h2 className="font-bold text-base text-on-surface flex items-center gap-2">
              <Info className="w-4 h-4 text-stitch-primary" /> Details
            </h2>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-on-surface-variant flex-shrink-0">Schedule</dt>
                <dd className="text-on-surface font-medium text-right">{scheduleLabel}</dd>
              </div>
              {routine.recurrence && (
                <div className="flex justify-between gap-2">
                  <dt className="text-on-surface-variant flex-shrink-0">Recurrence</dt>
                  <dd className="text-on-surface font-medium text-right">{routine.recurrence}</dd>
                </div>
              )}
              {routine.startTime && (
                <div className="flex justify-between gap-2">
                  <dt className="text-on-surface-variant flex-shrink-0">Time</dt>
                  <dd className="text-on-surface font-medium text-right">
                    {routine.startTime}{routine.endTime ? ` – ${routine.endTime}` : ""}
                  </dd>
                </div>
              )}
              {routine.startDate && (
                <div className="flex justify-between gap-2">
                  <dt className="text-on-surface-variant flex-shrink-0">Start Date</dt>
                  <dd className="text-on-surface font-medium text-right">
                    {new Date(routine.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-on-surface-variant flex-shrink-0">Status</dt>
                <dd className="text-on-surface font-medium text-right">{routine.isActive ? "Active" : "Inactive"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-on-surface-variant flex-shrink-0">Created</dt>
                <dd className="text-on-surface font-medium text-right">
                  {new Date(routine.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </dd>
              </div>
              {routine.updatedAt && (
                <div className="flex justify-between gap-2">
                  <dt className="text-on-surface-variant flex-shrink-0">Updated</dt>
                  <dd className="text-on-surface font-medium text-right">
                    {new Date(routine.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </dd>
                </div>
              )}
              {stats?.lastCompleted && (
                <div className="flex justify-between gap-2">
                  <dt className="text-on-surface-variant flex-shrink-0">Last Completed</dt>
                  <dd className="text-on-surface font-medium text-right">
                    {new Date(stats.lastCompleted.occurrenceDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </dd>
                </div>
              )}
              {stats?.nextScheduled && (
                <div className="flex justify-between gap-2">
                  <dt className="text-on-surface-variant flex-shrink-0">Next Scheduled</dt>
                  <dd className="text-on-surface font-medium text-right">
                    {new Date(stats.nextScheduled.occurrenceDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Steps card */}
          {routine.items && routine.items.length > 0 && (
            <div className="bg-surface-container-low rounded-2xl border border-surface-variant/40 p-5">
              <h2 className="font-bold text-base text-on-surface mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-stitch-primary" /> Steps ({routine.items.length})
              </h2>
              <div className="space-y-2">
                {routine.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-2.5 bg-surface rounded-xl border border-surface-variant/30">
                    <div className="w-5 h-5 rounded-full border-2 border-stitch-primary/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-stitch-primary">{idx + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-on-surface">{item.title}</p>
                      {item.startTime && (
                        <p className="text-xs text-on-surface-variant mt-0.5">{item.startTime}{item.endTime ? ` – ${item.endTime}` : ""}</p>
                      )}
                      {item.durationMinutes && (
                        <p className="text-xs text-on-surface-variant">{item.durationMinutes}min</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {item.remindAtStart && <span title="Reminder at start"><Clock className="w-3 h-3 text-stitch-primary" /></span>}
                      {item.remindAtEnd && <span title="Reminder at end"><Clock className="w-3 h-3 text-amber-400" /></span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: History */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-surface-container-low rounded-2xl border border-surface-variant/40 p-4 space-y-3">
            <h2 className="font-bold text-base text-on-surface flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stitch-primary" /> History
            </h2>

            {/* Status filter tabs */}
            <div className="flex flex-wrap gap-2">
              {(["all", "Completed", "Scheduled", "Missed"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                    statusFilter === f
                      ? f === "Completed"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : f === "Missed"
                        ? "bg-red-500/15 text-red-400 border-red-500/30"
                        : f === "Scheduled"
                        ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                        : "bg-stitch-primary/15 text-stitch-primary border-stitch-primary/30"
                      : "bg-surface border-surface-variant text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {f === "all" ? "All" : f === "Scheduled" ? "Pending" : f}
                </button>
              ))}
            </div>

            {/* Date range quick filters */}
            <div className="flex flex-wrap gap-2">
              {(["all", "today", "week", "month", "custom"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setDateRangeFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors capitalize ${
                    dateRangeFilter === f
                      ? "bg-stitch-primary/15 text-stitch-primary border-stitch-primary/30"
                      : "bg-surface border-surface-variant text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {f === "all" ? "All Time" : f === "week" ? "This Week" : f === "month" ? "This Month" : f}
                </button>
              ))}
            </div>

            {/* Custom date range inputs */}
            {dateRangeFilter === "custom" && (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 bg-surface border border-surface-variant rounded-lg text-sm outline-none focus:border-stitch-primary transition-colors"
                />
                <span className="text-on-surface-variant text-sm">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 bg-surface border border-surface-variant rounded-lg text-sm outline-none focus:border-stitch-primary transition-colors"
                />
              </div>
            )}
          </div>

          {/* History list */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-surface-container-low rounded-2xl border border-surface-variant/40 p-4 h-28 animate-pulse" />
              ))}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl border border-dashed border-surface-variant/50 p-10 text-center">
              <Calendar className="w-10 h-10 text-on-surface-variant/50 mx-auto mb-3" />
              <p className="text-sm font-semibold text-on-surface-variant">No history found</p>
              <p className="text-xs text-on-surface-variant/60 mt-1">
                {statusFilter !== "all" || dateRangeFilter !== "all"
                  ? "Try adjusting your filters."
                  : "Complete your routine steps to start building history."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map(item => {
                const completedCount = item.items.filter(i => i.isCompleted).length;
                const totalItems = item.items.length;
                const pct = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

                return (
                  <div key={item._id} className="bg-surface-container-low rounded-2xl border border-surface-variant/40 p-4 hover:border-stitch-primary/25 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-on-surface">
                          {new Date(item.occurrenceDate).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-on-surface-variant">
                          {item.scheduledTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {item.scheduledTime}
                            </span>
                          )}
                          {item.completedAt && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Completed at {new Date(item.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    {totalItems > 0 && (
                      <>
                        <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.status === "Completed" ? "bg-emerald-500" : item.status === "Missed" ? "bg-red-500" : "bg-stitch-primary"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-on-surface-variant mb-3">
                          {completedCount}/{totalItems} steps · {pct}%
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {item.items.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-2 text-xs">
                              {step.isCompleted
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                : <Circle className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0" />}
                              <span className={`truncate ${step.isCompleted ? "text-on-surface/80 line-through" : "text-on-surface-variant"}`}>
                                {step.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}