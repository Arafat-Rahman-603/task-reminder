"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  Award, 
  Zap, 
  Calendar, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  CircleDashed, 
  X,
  ExternalLink,
  BarChart3
} from "lucide-react";
import { 
  getWorkspaceMemberPerformance, 
  WorkspacePerformanceSummary, 
  MemberPerformanceMetric 
} from "@/actions/workspaceAnalytics.actions";
import { formatDate } from "@/lib/dateUtils";
import Link from "next/link";
import MemberAvatar from "@/components/workspace/MemberAvatar";

interface WorkspacePerformanceTabProps {
  workspaceId: string;
  isOwnerOrAdmin: boolean;
}

export default function WorkspacePerformanceTab({
  workspaceId,
  isOwnerOrAdmin: _isOwnerOrAdmin,
}: WorkspacePerformanceTabProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("all");
  const [data, setData] = useState<WorkspacePerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberPerformanceMetric | null>(null);

  useEffect(() => {
    let ignore = false;
    getWorkspaceMemberPerformance(workspaceId, timeRange)
      .then((res) => {
        if (!ignore) {
          if (res.success && res.data) {
            setData(res.data);
          } else {
            setError(res.error || "Failed to load team performance metrics");
          }
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const error = err as Error;
          setError(error.message || "Failed to load team performance");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [workspaceId, timeRange]);

  const getStatusBadge = (status: MemberPerformanceMetric["productivityStatus"]) => {
    switch (status) {
      case "Top Performer":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "On Track":
        return "bg-stitch-primary/10 text-stitch-primary border-stitch-primary/20";
      case "Needs Attention":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Range Switcher */}
      <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-stitch-primary/10 text-stitch-primary flex items-center justify-center shrink-0">
            <BarChart3 size={20} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-semibold text-on-surface">Team Member Performance & Analytics</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Track assigned tasks, completion velocities, on-time delivery rates, and overdue metrics per member.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-surface-variant/20">
          <Link
            href="/dashboard/workspace/performance"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-variant/40 hover:bg-white/5 text-xs text-stitch-primary font-semibold transition-all shrink-0"
          >
            <ExternalLink size={13} />
            <span>Dedicated Page</span>
          </Link>

          {/* Time Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/5 rounded-xl shrink-0">
            {(["all", "30d", "7d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold text-center transition-all ${
                  timeRange === r
                    ? "bg-stitch-primary text-black shadow-sm font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {r === "all" ? "All Time" : r === "30d" ? "30 Days" : "7 Days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2 bg-stitch-surface border border-surface-variant/30 rounded-2xl">
          <Loader2 size={16} className="animate-spin text-stitch-primary" />
          <span>Calculating member performance metrics...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs text-center">
          {error}
        </div>
      ) : data ? (
        <>
          {/* 4 Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* 1. Overall Completion Rate */}
            <div className="rounded-2xl bg-surface-container/60 border border-surface-variant/30 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] sm:text-xs text-slate-300 font-medium">Completion Rate</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle size={15} />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-headline text-white">
                  {data.overallCompletionRate}%
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                  {data.totalCompleted} of {data.totalTasks} completed
                </p>
              </div>
            </div>

            {/* 2. On-Time Delivery Rate */}
            <div className="rounded-2xl bg-surface-container/60 border border-surface-variant/30 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] sm:text-xs text-slate-300 font-medium">On-Time Delivery</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-stitch-primary/10 text-stitch-primary flex items-center justify-center shrink-0">
                  <Zap size={15} />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-headline text-stitch-primary">
                  {data.overallOnTimeRate}%
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                  {data.totalOnTime} on-time vs {data.totalLate} late
                </p>
              </div>
            </div>

            {/* 3. Currently Overdue Active */}
            <div className="rounded-2xl bg-surface-container/60 border border-surface-variant/30 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] sm:text-xs text-slate-300 font-medium">Past Deadline</span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                  data.totalCurrentlyOverdue > 0 ? "bg-rose-500/10 text-rose-400" : "bg-slate-500/10 text-slate-400"
                }`}>
                  <AlertTriangle size={15} />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3">
                <div className={`text-xl sm:text-2xl lg:text-3xl font-bold font-headline ${
                  data.totalCurrentlyOverdue > 0 ? "text-rose-400" : "text-white"
                }`}>
                  {data.totalCurrentlyOverdue}
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                  {data.totalCurrentlyOverdue > 0 ? "Overdue tasks right now" : "All deadlines on track"}
                </p>
              </div>
            </div>

            {/* 4. Top Performer */}
            <div className="rounded-2xl bg-surface-container/60 border border-surface-variant/30 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] sm:text-xs text-slate-300 font-medium">Top Performer</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Award size={15} />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3">
                <div className="text-base sm:text-lg font-bold font-headline text-amber-400 truncate">
                  {data.topPerformerName || "No tasks yet"}
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                  Highest on-time consistency
                </p>
              </div>
            </div>
          </div>

          {/* Member Performance Table Card */}
          <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-surface-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-stitch-primary" />
                <h5 className="text-sm font-bold text-on-surface">Member Productivity Breakdown</h5>
              </div>
              <span className="text-xs text-slate-400">
                {data.members.length} team {data.members.length === 1 ? "member" : "members"}
              </span>
            </div>

            <div className="divide-y divide-surface-variant/20">
              {data.members.map((m) => {
                const onTimePercent = m.onTimeRate !== null ? m.onTimeRate : 100;
                const barColor =
                  onTimePercent >= 80 ? "bg-emerald-400" : onTimePercent >= 60 ? "bg-amber-400" : "bg-rose-400";

                return (
                  <div
                    key={m.userId}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* User Profile & Role */}
                    <div className="flex items-center gap-3 min-w-0 md:max-w-xs xl:max-w-sm flex-1">
                      <MemberAvatar
                        name={m.name}
                        avatarUrl={m.avatarUrl}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link 
                            href={`/dashboard/workspace/members/${m.userId}`}
                            className="text-xs sm:text-sm font-bold text-on-surface hover:text-stitch-primary transition-colors truncate"
                          >
                            {m.name}
                          </Link>
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${getStatusBadge(
                              m.productivityStatus
                            )}`}
                          >
                            {m.productivityStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate mt-0.5">
                          <span className="truncate">{m.email}</span>
                          <span>•</span>
                          <span className="text-stitch-primary font-medium capitalize shrink-0">
                            {m.customRoleName || m.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Numeric Stats */}
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center w-full md:w-auto shrink-0">
                      <div className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-black/25 border border-white/5 min-w-[52px] sm:min-w-[58px]">
                        <span className="text-xs sm:text-sm font-bold text-white block">{m.assignedCount}</span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400">Assigned</span>
                      </div>
                      <div className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-black/25 border border-white/5 min-w-[52px] sm:min-w-[58px]">
                        <span className="text-xs sm:text-sm font-bold text-emerald-400 block">{m.completedCount}</span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400">Done</span>
                      </div>
                      <div className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-black/25 border border-white/5 min-w-[52px] sm:min-w-[58px]">
                        <span className="text-xs sm:text-sm font-bold text-stitch-primary block">{m.pendingCount}</span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400">Pending</span>
                      </div>
                      <div className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-black/25 border border-white/5 min-w-[52px] sm:min-w-[58px]">
                        <span
                          className={`text-xs sm:text-sm font-bold block ${
                            m.currentlyOverdueCount > 0 ? "text-rose-400" : "text-slate-400"
                          }`}
                        >
                          {m.currentlyOverdueCount}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400">Overdue</span>
                      </div>
                    </div>

                    {/* On-Time Progress & Inspection Button */}
                    <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                      <div className="w-24 sm:w-28 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 text-[10px]">On-Time</span>
                          <span className="font-bold text-white text-xs">
                            {m.onTimeRate !== null ? `${m.onTimeRate}%` : "—"}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${m.onTimeRate !== null ? m.onTimeRate : 0}%` }}
                          />
                        </div>
                        {m.avgCompletionHours !== null && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            Avg: {m.avgCompletionHours < 24 ? `${m.avgCompletionHours}h` : `${Math.round((m.avgCompletionHours / 24) * 10) / 10}d`}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setSelectedMember(m)}
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-surface-variant/40 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                          title="Quick Preview"
                        >
                          <span>Preview</span>
                        </button>
                        <Link
                          href={`/dashboard/workspace/members/${m.userId}`}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-stitch-primary text-black text-xs font-bold shadow-sm hover:opacity-90 transition-all"
                          title="Open full member details page"
                        >
                          <span>Details</span>
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      {/* Member Tasks Inspection Drawer / Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-surface-container border border-surface-variant/40 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-variant/30 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <MemberAvatar
                  name={selectedMember.name}
                  avatarUrl={selectedMember.avatarUrl}
                  size="md"
                />
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-on-surface">{selectedMember.name}&apos;s Assigned Tasks</h4>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    {selectedMember.completedCount} completed • {selectedMember.currentlyOverdueCount} overdue • {selectedMember.onTimeRate !== null ? `${selectedMember.onTimeRate}% on-time` : "No deadlines"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/workspace/members/${selectedMember.userId}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stitch-primary text-black text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  <span>Full Page</span>
                  <ExternalLink size={12} />
                </Link>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Task list */}
            {selectedMember.tasks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No tasks currently assigned to this member.
              </div>
            ) : (
              <div className="divide-y divide-white/5 space-y-1">
                {selectedMember.tasks.map((t) => {
                  const isDone = t.status === "Done" || t.status === "Completed";
                  const isOverdue = t.performanceStatus === "overdue";
                  const isOnTime = t.performanceStatus === "on_time";
                  const isLate = t.performanceStatus === "late";

                  return (
                    <div key={t._id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/dashboard/tasks/${t.slug}`}
                            className={`text-xs sm:text-sm font-semibold hover:text-stitch-primary transition-colors inline-flex items-center gap-1 ${
                              isDone ? "line-through text-slate-400" : "text-white"
                            }`}
                          >
                            <span>{t.title}</span>
                            <ExternalLink size={12} className="opacity-50" />
                          </Link>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-slate-300">
                            {t.priority}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                          {t.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar size={11} /> Due: {formatDate(t.dueDate)}
                            </span>
                          )}
                          {t.completedAt && (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 size={11} /> Finished: {formatDate(t.completedAt)}
                            </span>
                          )}
                          <span className="text-slate-500">Status: {t.status}</span>
                        </div>
                      </div>

                      {/* Performance status pill */}
                      <div className="shrink-0 pt-0.5">
                        {isOnTime && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            <CheckCircle2 size={11} /> On Time
                          </span>
                        )}
                        {isLate && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            <Clock size={11} /> Completed Late
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                            <AlertTriangle size={11} /> Overdue
                          </span>
                        )}
                        {t.performanceStatus === "pending" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stitch-primary bg-stitch-primary/10 border border-stitch-primary/20 px-2 py-0.5 rounded-md">
                            <CircleDashed size={11} /> In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-3 border-t border-surface-variant/30 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
