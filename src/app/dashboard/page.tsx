import { getTasks } from "@/actions/task.actions";
import { getIdeas } from "@/actions/idea.actions";
import { getAccounts } from "@/actions/account.actions";
import Link from "next/link";
import { CheckSquare, Wallet, Lightbulb, TrendingUp, Bell, User as UserIcon, Zap, CheckCircle2, CircleDashed, CheckCircle, Clock, AlertCircle, Stars, ArrowRight, GitCommit, MessageSquare, Flag, XCircle } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/db";
import { SYSTEM_MODULES } from "@/config/modules";
import { EmptyState } from "@/components/ui/EmptyState";
import PWAInstallButton from "@/components/pwa/PWAInstallButton";
import { DashboardToolbar } from "./DashboardToolbar";
// Removed DashboardNotificationHealth import

export default async function DashboardPage(props: { searchParams?: Promise<any> | any }) {
  const params = await props.searchParams;
  const searchParams = params || {};
  const session = await getServerSession(authOptions);
  await dbConnect();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await User.findById((session?.user as any)?.id).select("name preferences.modules").lean();
  const userModules = user?.preferences?.modules || {};
  const userName = user?.name?.split(' ')[0] || "Alex";

  const isModuleEnabled = (id: string) => {
    const mod = SYSTEM_MODULES[id];
    if (!mod || !mod.implemented) return false;
    return userModules[id] !== undefined ? userModules[id] : mod.defaultEnabled;
  };

  const tasksEnabled = isModuleEnabled("tasks");
  const ideasEnabled = isModuleEnabled("ideas");
  const moneyEnabled = isModuleEnabled("money");

  const [tasksRes, ideasRes, accountsRes] = await Promise.all([
    tasksEnabled ? getTasks(searchParams) : Promise.resolve({ tasks: [] }),
    ideasEnabled ? getIdeas(searchParams) : Promise.resolve({ ideas: [] }),
    // Assets are generally snapshot balances, so date filters are often ignored. We pass searchParams just in case.
    moneyEnabled ? getAccounts() : Promise.resolve({ accounts: [] })
  ]);

  const tasks = tasksRes.tasks || [];
  const ideas = ideasRes.ideas || [];
  const accounts = accountsRes.accounts || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingTasks = tasks.filter((t: any) => t.status !== "Completed" && t.status !== "Cancelled" && t.status !== "Archived");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completedTasks = tasks.filter((t: any) => t.status === "Completed");
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cancelledTasks = tasks.filter((t: any) => t.status === "Cancelled");
  
  // Completion rate (real data)
  const totalTasksCount = tasks.length || 1; // prevent div by zero
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const circumference = 2 * Math.PI * 40;
  
  const completedLen = (completedTasks.length / totalTasksCount) * circumference;
  const pendingLen = (pendingTasks.length / totalTasksCount) * circumference;
  const cancelledLen = (cancelledTasks.length / totalTasksCount) * circumference;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalBalance = accounts.reduce((acc: number, curr: any) => {
    const val = parseFloat(curr.balance?.$numberDecimal || curr.balance || "0");
    return acc + val;
  }, 0);

  return (
    <div className="flex flex-col w-full space-y-5 pb-6">
      {/* Floating Ambient Backdrop Glows */}
      <div className="relative w-full overflow-hidden rounded-3xl bg-surface-container-low/70 backdrop-blur-2xl p-5 shadow-xl">
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-stitch-primary/15 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-tertiary/10 blur-3xl pointer-events-none"></div>
        
        {/* Greeting & Status Badge */}
        <div className="relative flex items-center justify-between z-10 mb-4">
          <div>
            <h1 className="text-xl font-headline font-bold tracking-tight text-on-surface flex items-center gap-1.5">
              Good morning, {userName} <span className="inline-block animate-bounce origin-bottom-right">👋</span>
            </h1>
            <p className="text-xs font-medium text-on-surface-variant mt-0.5">
              You have <span className="text-stitch-primary font-semibold">{pendingTasks.length} tasks</span> pending
            </p>
          </div>
          <DashboardToolbar />
        </div>
        
        {/* Task Completion Score Card with SVG Glow Gauge */}
        <div className="relative rounded-2xl bg-surface-container/80 backdrop-blur-xl p-4 shadow-lg flex items-center justify-between">
          <div className="flex flex-col space-y-1.5 max-w-[58%]">
            <div className="flex items-center gap-1.5">
              <Zap className="text-stitch-primary w-[18px] h-[18px]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Task Completion</span>
            </div>
            <div className="text-2xl font-bold font-headline text-on-surface tracking-tight">{completionRate}<span className="text-sm font-normal text-on-surface-variant font-body">%</span></div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-stitch-primary">
              <TrendingUp className="w-[14px] h-[14px]" />
              <span>{completedTasks.length} completed of {tasks.length} total</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-medium text-on-surface-variant mt-1.5">
              <span className="flex items-center gap-1"><CircleDashed className="w-3 h-3 text-tertiary" /> {pendingTasks.length} pending</span>
              <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-error" /> {cancelledTasks.length} cancelled</span>
            </div>
            <p className="text-[11px] text-on-surface-variant/90 leading-tight pt-1 hidden sm:block">
              {tasks.length === 0 ? "No tasks yet. Add your first task to get started." : completionRate >= 80 ? "Excellent! You're crushing it today." : completionRate >= 50 ? "Good progress! Keep going." : "Just getting started. You've got this."}
            </p>
          </div>
          
          {/* Circular Radial Indicator */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle className="text-surface-variant/70 fill-none" cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8"></circle>
              {completedLen > 0 && (
                <circle className="text-stitch-primary fill-none transition-all duration-1000 ease-out" cx="50" cy="50" r="40" stroke="currentColor" strokeDasharray={`${completedLen} ${circumference - completedLen}`} strokeDashoffset={0} strokeLinecap="round" strokeWidth="8"></circle>
              )}
              {pendingLen > 0 && (
                <circle className="text-tertiary fill-none transition-all duration-1000 ease-out" cx="50" cy="50" r="40" stroke="currentColor" strokeDasharray={`${pendingLen} ${circumference - pendingLen}`} strokeDashoffset={-completedLen} strokeLinecap="round" strokeWidth="8"></circle>
              )}
              {cancelledLen > 0 && (
                <circle className="text-error fill-none transition-all duration-1000 ease-out" cx="50" cy="50" r="40" stroke="currentColor" strokeDasharray={`${cancelledLen} ${circumference - cancelledLen}`} strokeDashoffset={-(completedLen + pendingLen)} strokeLinecap="round" strokeWidth="8"></circle>
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-bold font-headline text-on-surface">{completionRate}%</span>
              <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-medium">Done</span>
            </div>
          </div>
        </div>
      </div>      {/* PWA Install Promo */}
      <PWAInstallButton variant="card" />

      {/* Notification Health Card */}
      {/* Dashboard Grid */}

      {/* Metric Quick-Stat Cards: Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Stat 1: Total Tasks */}
        {tasksEnabled && (
          <div className="relative overflow-hidden rounded-2xl bg-surface-container/60 backdrop-blur-xl p-3.5 shadow-md flex flex-col justify-between hover:bg-surface-container/80 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center text-stitch-primary shadow-inner">
                <CheckSquare className="w-[18px] h-[18px]" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-variant text-on-surface-variant">Active</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold font-headline text-on-surface tracking-tight">{tasks.length}</span>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">Total Tasks</p>
            </div>
          </div>
        )}
        
        {/* Stat 2: Captured Ideas */}
        {ideasEnabled && (
          <div className="relative overflow-hidden rounded-2xl bg-surface-container/60 backdrop-blur-xl p-3.5 shadow-md flex flex-col justify-between hover:bg-surface-container/80 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-primary-container/40 flex items-center justify-center text-stitch-primary shadow-inner">
                <Lightbulb className="w-[18px] h-[18px]" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-container text-on-primary-container">Focused</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold font-headline text-on-surface tracking-tight">{ideas.length}</span>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">Captured Ideas</p>
            </div>
          </div>
        )}
        
        {/* Stat 3: Liquid Assets (Money) */}
        {moneyEnabled && (
          <div className="relative overflow-hidden rounded-2xl bg-surface-container/60 backdrop-blur-xl p-3.5 shadow-md flex flex-col justify-between hover:bg-surface-container/80 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center text-tertiary shadow-inner">
                <Wallet className="w-[18px] h-[18px]" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-tertiary-container text-on-tertiary-container">Liquid</span>
            </div>
            <div className="mt-3">
              <span className="text-xl font-bold font-headline text-on-surface tracking-tight truncate block">
                {new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(totalBalance)}
              </span>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">Total Assets</p>
            </div>
          </div>
        )}
        
        {/* Stat 4: Completed Tasks */}
        {tasksEnabled && (
          <div className="relative overflow-hidden rounded-2xl bg-surface-container/60 backdrop-blur-xl p-3.5 shadow-md flex flex-col justify-between hover:bg-surface-container/80 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center text-success shadow-inner">
                <CheckCircle className="w-[18px] h-[18px]" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/20 text-success">Done</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold font-headline text-on-surface tracking-tight">{completedTasks.length}</span>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">Completed</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Tasks Section */}
        {tasksEnabled && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Stars className="text-stitch-primary w-5 h-5" />
                <h2 className="text-sm font-bold font-headline uppercase tracking-wider text-on-surface">Priority Tasks</h2>
              </div>
              <Link href="/dashboard/tasks" className="text-xs font-semibold text-stitch-primary hover:text-primary-fixed transition-colors flex items-center gap-0.5">
                View All <ArrowRight className="w-[14px] h-[14px]" />
              </Link>
            </div>
            
            {/* Task List Stack */}
            <div className="space-y-2.5">
              {pendingTasks.length === 0 ? (
                <EmptyState 
                  title="No pending tasks" 
                  description="You are all caught up." 
                />
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                pendingTasks.slice(0, 4).map((task: any) => (
                  <div key={task._id} className="task-card group relative rounded-2xl bg-surface-container/60 backdrop-blur-xl p-4 shadow-md transition-all duration-200 hover:bg-surface-container/90">
                    <div className="flex items-start gap-3">
                      <button aria-label="Toggle Complete" className="task-checkbox mt-0.5 w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container group-hover:text-stitch-primary transition-all active:scale-90">
                        <CircleDashed className="w-[18px] h-[18px]" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="task-title text-sm font-semibold text-on-surface truncate">{task.title}</h3>
                          {task.dueDate && (
                            <span className="text-[11px] font-medium text-on-surface-variant shrink-0 flex items-center gap-1">
                              <Clock className="w-[12px] h-[12px]" /> 
                              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5">
                            {task.priority === 'High' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-error-container text-on-error-container">High Priority</span>}
                            {task.priority === 'Medium' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary-container text-on-secondary-container">Medium</span>}
                            {task.priority === 'Low' && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-container-high text-on-surface-variant">Low</span>}
                            {task.category && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-container-high text-on-surface-variant">{task.category}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Quick Actions (Replacing Recent Activity for functionality) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Zap className="text-stitch-secondary w-5 h-5" />
              <h2 className="text-sm font-bold font-headline uppercase tracking-wider text-on-surface">Quick Actions</h2>
            </div>
          </div>
          
          <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl p-4 shadow-lg space-y-4">
            {tasksEnabled && (
              <Link href="/dashboard/tasks?new=true" className="flex items-start gap-3 group">
                <div className="relative flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-stitch-primary/20 text-stitch-primary flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  {moneyEnabled && <div className="w-0.5 h-7 bg-surface-variant mt-1 group-hover:bg-stitch-primary/50 transition-colors"></div>}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs font-semibold text-on-surface truncate group-hover:text-stitch-primary transition-colors">Create New Task</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Quickly add a new task to your inbox.</p>
                </div>
              </Link>
            )}
            
            {moneyEnabled && (
              <Link href="/dashboard/money/transactions/new?type=expense" className="flex items-start gap-3 group">
                <div className="relative flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-error-container text-error flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                    <Wallet className="w-4 h-4" />
                  </div>
                  {ideasEnabled && <div className="w-0.5 h-7 bg-surface-variant mt-1 group-hover:bg-error/50 transition-colors"></div>}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs font-semibold text-on-surface truncate group-hover:text-error transition-colors">Log Expense</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Record a new transaction instantly.</p>
                </div>
              </Link>
            )}
            
            {ideasEnabled && (
              <Link href="/dashboard/ideas" className="flex items-start gap-3 group">
                <div className="relative flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-stitch-secondary flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs font-semibold text-on-surface truncate group-hover:text-stitch-secondary transition-colors">Capture Idea</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Jot down thoughts before you forget them.</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
