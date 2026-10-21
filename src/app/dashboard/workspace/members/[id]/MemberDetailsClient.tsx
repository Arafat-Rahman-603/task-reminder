"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  CircleDashed, 
  Clock, 
  AlertTriangle, 
  Shield, 
  Crown, 
  ShieldCheck, 
  User, 
  ExternalLink, 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Award, 
  Filter, 
  Check, 
  X,
  FileText,
  Search,
  Layers,
  Eye
} from "lucide-react";
import { MemberPerformanceMetric } from "@/actions/workspaceAnalytics.actions";
import { formatDate, formatTime } from "@/lib/dateUtils";

interface MemberDetailsClientProps {
  member: MemberPerformanceMetric;
  workspaceName: string;
  workspaceId: string;
  joinedAt: string;
  status: string;
  permissions?: any;
  permissionSource?: string;
}

export default function MemberDetailsClient({
  member,
  workspaceName,
  workspaceId,
  joinedAt,
  status,
  permissions,
  permissionSource
}: MemberDetailsClientProps) {
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed" | "overdue">("all");
  const [taskSearch, setTaskSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const filteredTasks = member.tasks.filter((t) => {
    const q = taskSearch.toLowerCase().trim();
    if (q && !t.title.toLowerCase().includes(q)) {
      return false;
    }
    if (taskFilter === "all") return true;
    if (taskFilter === "pending") return t.performanceStatus === "pending";
    if (taskFilter === "completed") return t.performanceStatus === "on_time" || t.performanceStatus === "late";
    if (taskFilter === "overdue") return t.performanceStatus === "overdue";
    return true;
  });

  const getStatusBadge = (prodStatus: MemberPerformanceMetric["productivityStatus"]) => {
    switch (prodStatus) {
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

  const onTimePercent = member.onTimeRate !== null ? member.onTimeRate : 100;
  const barColor =
    onTimePercent >= 80 ? "bg-emerald-400" : onTimePercent >= 60 ? "bg-amber-400" : "bg-rose-400";

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12 px-3 sm:px-6 pt-4">
      {/* Top Breadcrumb & Options Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-variant/30 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link 
              href="/dashboard/workspace/members" 
              className="hover:text-stitch-primary transition-colors flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft size={14} />
              <span>Team Members</span>
            </Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">{member.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-headline text-on-surface">
            Member Profile & Performance Details
          </h1>
        </div>

        {/* Option Navigation Bar */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
          <Link
            href="/dashboard/workspace/members"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stitch-primary text-black shadow-sm"
          >
            <span>All Members</span>
          </Link>
          <Link
            href="/dashboard/workspace/performance"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <span>Performance</span>
          </Link>
          <Link
            href="/dashboard/workspace/roles"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <span>Custom Roles</span>
          </Link>
          <Link
            href="/dashboard/workspace/audit"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <span>Audit Log</span>
          </Link>
        </div>
      </div>

      {/* Hero Member Profile Card */}
      <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-stitch-primary/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-stitch-surface-container flex items-center justify-center text-stitch-primary border border-white/10 shrink-0 overflow-hidden relative shadow-inner">
              {member.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl sm:text-2xl font-bold uppercase">{member.name.substring(0, 2)}</span>
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-bold font-headline text-on-surface truncate">
                  {member.name}
                </h2>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(member.productivityStatus)}`}>
                  {member.productivityStatus}
                </span>
                {status === "suspended" ? (
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Suspended
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-400 truncate">{member.email}</p>

              <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                  {member.role === "owner" ? <Crown size={12} className="text-amber-400" /> : <Shield size={12} className="text-stitch-primary" />}
                  <span className="capitalize">{member.role} Tier</span>
                </span>

                {member.customRoleName && (
                  <span className="inline-flex items-center gap-1 font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                    <ShieldCheck size={12} />
                    <span>{member.customRoleName}</span>
                  </span>
                )}

                <span className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Calendar size={11} />
                  <span>Joined {formatDate(joinedAt)}</span>
                </span>
              </div>
            </div>
          </div>

          <Link
            href={`/dashboard/tasks?assignee=${member.userId}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stitch-primary text-black text-xs font-bold shadow-sm hover:opacity-90 transition-opacity self-start sm:self-auto shrink-0"
          >
            <span>View Tasks on Kanban</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>

      {/* 4 Summary Performance KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Assigned */}
        <div className="rounded-2xl bg-surface-container/60 border border-surface-variant/30 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Assigned Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-stitch-primary/10 text-stitch-primary flex items-center justify-center">
              <FileText size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold font-headline text-white">{member.assignedCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">{member.pendingCount} currently pending</p>
          </div>
        </div>

        {/* Completed & Rate */}
        <div className="rounded-2xl bg-surface-container/60 border border-surface-variant/30 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold font-headline text-emerald-400">{member.completedCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">{member.completionRate}% completion velocity</p>
          </div>
        </div>

        {/* On-Time Delivery Rate */}
        <div className="rounded-2xl bg-surface-container/60 border border-surface-variant/30 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">On-Time Delivery</span>
            <div className="w-8 h-8 rounded-xl bg-stitch-primary/10 text-stitch-primary flex items-center justify-center">
              <Zap size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold font-headline text-stitch-primary">
              {member.onTimeRate !== null ? `${member.onTimeRate}%` : "—"}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {member.onTimeCompletedCount} on-time vs {member.lateCompletedCount} late
            </p>
          </div>
        </div>

        {/* Overdue */}
        <div className="rounded-2xl bg-surface-container/60 border border-surface-variant/30 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Past Deadline</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              member.currentlyOverdueCount > 0 ? "bg-rose-500/10 text-rose-400" : "bg-slate-500/10 text-slate-400"
            }`}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-bold font-headline ${
              member.currentlyOverdueCount > 0 ? "text-rose-400" : "text-white"
            }`}>
              {member.currentlyOverdueCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {member.currentlyOverdueCount > 0 ? "Requires urgent attention" : "All deadlines on track"}
            </p>
          </div>
        </div>
      </div>

      {/* Turnaround Velocity Card */}
      {member.avgCompletionHours !== null && (
        <div className="rounded-2xl bg-stitch-surface border border-surface-variant/30 p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-on-surface">Average Completion Turnaround</h4>
              <p className="text-xs text-slate-400">
                Average duration from task assignment to completion by {member.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold text-amber-400 font-headline">
              {member.avgCompletionHours < 24
                ? `${member.avgCompletionHours} hours`
                : `${Math.round((member.avgCompletionHours / 24) * 10) / 10} days`}
            </div>
          </div>
        </div>
      )}

      {/* Permissions & Access Matrix ("kontar kontar access ace") */}
      {permissions && (
        <div className="rounded-2xl bg-stitch-surface border border-surface-variant/30 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-variant/30 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-stitch-primary/10 text-stitch-primary flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Configured Workspace Permissions & Access Matrix</h3>
                <p className="text-xs text-slate-400">Exact granular permissions granted to {member.name} in this workspace</p>
              </div>
            </div>

            {permissionSource && (
              <span className="text-[11px] font-semibold text-stitch-primary bg-stitch-primary/10 border border-stitch-primary/20 px-3 py-1 rounded-full self-start sm:self-auto">
                Authority: {permissionSource}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {Object.entries(permissions).map(([moduleKey, acts]: [string, any]) => {
              if (acts && typeof acts === "object") {
                return (
                  <div key={moduleKey} className="p-3.5 rounded-xl bg-black/20 border border-white/5 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-white capitalize block mb-1.5 flex items-center gap-1.5">
                        <Layers size={13} className="text-stitch-primary" />
                        {moduleKey.replace(/([A-Z])/g, " $1")} Module
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(acts).map(([actionName, enabled]) => (
                          <span
                            key={actionName}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                              enabled
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-white/5 text-slate-500 border-white/5 line-through opacity-50"
                            }`}
                          >
                            {enabled ? <Check size={10} /> : <X size={10} />}
                            <span className="capitalize">{actionName}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div 
                  key={moduleKey} 
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    acts 
                      ? "bg-stitch-primary/5 border-stitch-primary/20 text-on-surface" 
                      : "bg-black/20 border-white/5 text-slate-500 opacity-60"
                  }`}
                >
                  {acts ? <Check size={14} className="text-stitch-primary shrink-0" /> : <X size={14} className="text-slate-500 shrink-0" />}
                  <span className="truncate capitalize font-medium">{moduleKey.replace(/^can/, "").replace(/([A-Z])/g, " $1")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filterable Tasks List ("kon kon task korce") */}
      <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-surface-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-on-surface">Assigned Task History ({member.tasks.length})</h3>
            <p className="text-xs text-slate-400">Complete log of all tasks assigned to {member.name} with delivery status</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full sm:w-44 h-8 pl-8 pr-2.5 rounded-lg bg-black/20 border border-white/10 text-white text-xs outline-none focus:border-stitch-primary transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-black/30 border border-white/5 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
              {(["all", "pending", "completed", "overdue"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTaskFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                    taskFilter === f
                      ? "bg-stitch-primary text-black shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {f} ({
                    f === "all" ? member.tasks.length :
                    f === "pending" ? member.pendingCount :
                    f === "completed" ? member.completedCount :
                    member.currentlyOverdueCount
                  })
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-1">
            <p>No tasks found matching filter &quot;{taskFilter}&quot;{taskSearch ? ` and query "${taskSearch}"` : ""}.</p>
            {taskSearch && (
              <button
                onClick={() => setTaskSearch("")}
                className="text-stitch-primary hover:underline font-semibold text-xs"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-surface-variant/20">
            {filteredTasks.map((t) => {
              const isOverdue = t.performanceStatus === "overdue";

              return (
                <div 
                  key={t._id} 
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedTask(t)}
                        className="text-sm font-semibold text-white hover:text-stitch-primary transition-colors truncate text-left"
                      >
                        {t.title}
                      </button>

                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        t.priority === "high" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        t.priority === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}>
                        {t.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      {t.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue ? "text-rose-400 font-semibold" : ""}`}>
                          <Clock size={12} />
                          <span>Due: {formatDate(t.dueDate)}</span>
                        </span>
                      )}

                      {t.completedAt && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 size={12} />
                          <span>Done: {formatDate(t.completedAt)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delivery Status Indicator & Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {t.performanceStatus === "on_time" && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                        <CheckCircle2 size={13} />
                        <span>Delivered On-Time</span>
                      </span>
                    )}

                    {t.performanceStatus === "late" && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                        <Clock size={13} />
                        <span>Delivered Late</span>
                      </span>
                    )}

                    {t.performanceStatus === "overdue" && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-xl animate-pulse">
                        <AlertTriangle size={13} />
                        <span>Overdue Now</span>
                      </span>
                    )}

                    {t.performanceStatus === "pending" && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-stitch-primary bg-stitch-primary/10 border border-stitch-primary/20 px-2.5 py-1 rounded-xl">
                        <CircleDashed size={13} className="animate-spin" />
                        <span>In Progress</span>
                      </span>
                    )}

                    <button
                      onClick={() => setSelectedTask(t)}
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-surface-variant/40 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                      title="Quick Preview"
                    >
                      <Eye size={13} />
                      <span className="hidden sm:inline">Preview</span>
                    </button>

                    <Link
                      href={`/dashboard/tasks/${t.slug || t._id}`}
                      className="p-1.5 rounded-lg border border-surface-variant/40 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                      title="Open Task Details"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Quick Preview Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-surface-container border border-surface-variant/40 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-surface-variant/30 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stitch-primary">
                  Assigned Task Inspection
                </span>
                <h3 className="text-base font-bold text-on-surface mt-0.5">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Priority</span>
                  <span className="font-semibold text-white capitalize mt-0.5 block">{selectedTask.priority}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Performance Delivery</span>
                  <span className="font-semibold text-stitch-primary capitalize mt-0.5 block">
                    {selectedTask.performanceStatus.replace("_", " ")}
                  </span>
                </div>
              </div>

              {selectedTask.dueDate && (
                <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Due Date:</span>
                  <span className="font-semibold text-white">{formatDate(selectedTask.dueDate)}</span>
                </div>
              )}

              {selectedTask.completedAt && (
                <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Completion Timestamp:</span>
                  <span className="font-semibold text-emerald-400">{formatDate(selectedTask.completedAt)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-variant/30">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
              <Link
                href={`/dashboard/tasks/${selectedTask.slug || selectedTask._id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stitch-primary text-black font-bold text-xs hover:bg-stitch-primary/90 transition-all shadow-sm"
              >
                <span>Open Full Task Page</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
