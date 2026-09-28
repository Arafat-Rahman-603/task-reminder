import { getTasks } from "@/actions/task.actions";
import { getIdeas } from "@/actions/idea.actions";
import { getAccounts } from "@/actions/account.actions";
import Link from "next/link";
import { CheckSquare, Wallet, Lightbulb, TrendingUp } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/db";
import { SYSTEM_MODULES } from "@/config/modules";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  await dbConnect();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await User.findById((session?.user as any)?.id).select("preferences.modules").lean();
  const userModules = user?.preferences?.modules || {};

  const isModuleEnabled = (id: string) => {
    const mod = SYSTEM_MODULES[id];
    if (!mod || !mod.implemented) return false;
    return userModules[id] !== undefined ? userModules[id] : mod.defaultEnabled;
  };

  const tasksEnabled = isModuleEnabled("tasks");
  const ideasEnabled = isModuleEnabled("ideas");
  const moneyEnabled = isModuleEnabled("money");

  const [tasksRes, ideasRes, accountsRes] = await Promise.all([
    tasksEnabled ? getTasks() : Promise.resolve({ tasks: [] }),
    ideasEnabled ? getIdeas() : Promise.resolve({ ideas: [] }),
    moneyEnabled ? getAccounts() : Promise.resolve({ accounts: [] })
  ]);

  const tasks = tasksRes.tasks || [];
  const ideas = ideasRes.ideas || [];
  const accounts = accountsRes.accounts || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingTasks = tasks.filter((t: any) => t.status === "Pending" || t.status === "In Progress");
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalBalance = accounts.reduce((acc: number, curr: any) => {
    const val = curr.balance?.$numberDecimal ? parseFloat(curr.balance.$numberDecimal) : 0;
    return acc + val;
  }, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1">Your Personal OS at a glance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat Cards */}
        {tasksEnabled && (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <CheckSquare className="h-5 w-5" />
              <h3 className="text-sm font-medium">Pending Tasks</h3>
            </div>
            <div className="text-3xl font-bold">{pendingTasks.length}</div>
          </div>
        )}

        {ideasEnabled && (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Lightbulb className="h-5 w-5" />
              <h3 className="text-sm font-medium">Captured Ideas</h3>
            </div>
            <div className="text-3xl font-bold">{ideas.length}</div>
          </div>
        )}

        {moneyEnabled && (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Wallet className="h-5 w-5" />
              <h3 className="text-sm font-medium">Total Liquid Assets</h3>
            </div>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(totalBalance)}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <TrendingUp className="h-5 w-5 text-success" />
            <h3 className="text-sm font-medium">System Status</h3>
          </div>
          <div className="text-lg font-bold text-success">All Systems Normal</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        {tasksEnabled && (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Active Tasks</h2>
              <Link href="/dashboard/tasks" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            {pendingTasks.length === 0 ? (
              <p className="text-muted-foreground italic">No pending tasks.</p>
            ) : (
              <div className="space-y-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {pendingTasks.slice(0, 5).map((task: any) => (
                  <div key={task._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-sm border border-border" />
                      <span className="font-medium text-sm">{task.title}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      task.priority === 'High' ? 'bg-danger/20 text-danger' :
                      task.priority === 'Medium' ? 'bg-warning/20 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Center */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {tasksEnabled && (
              <Link href="/dashboard/tasks?new=true" className="p-4 rounded-lg border border-border hover:border-muted-foreground transition-colors flex flex-col items-center justify-center gap-2 text-foreground">
                <CheckSquare className="h-6 w-6" />
                <span className="text-sm font-medium">New Task</span>
              </Link>
            )}
            {moneyEnabled && (
              <Link href="/dashboard/money/transactions/new?type=expense" className="p-4 rounded-lg border border-border hover:border-muted-foreground transition-colors flex flex-col items-center justify-center gap-2 text-foreground">
                <Wallet className="h-6 w-6" />
                <span className="text-sm font-medium">Log Expense</span>
              </Link>
            )}
            {ideasEnabled && (
              <Link href="/dashboard/ideas" className="p-4 rounded-lg border border-border hover:border-muted-foreground transition-colors flex flex-col items-center justify-center gap-2 text-foreground">
                <Lightbulb className="h-6 w-6 text-yellow-500" />
                <span className="text-sm font-medium">Capture Idea</span>
              </Link>
            )}
            <button className="p-4 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity flex flex-col items-center justify-center gap-2">
              <span className="text-xl font-bold">Cmd + K</span>
              <span className="text-sm font-medium">Open Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
