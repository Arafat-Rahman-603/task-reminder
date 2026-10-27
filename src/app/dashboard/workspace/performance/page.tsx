import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";
import WorkspacePerformanceTab from "@/components/workspace/WorkspacePerformanceTab";
import Link from "next/link";
import { Users, ShieldCheck, History, Sliders } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WorkspacePerformancePage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const workspaceInfo = await getActiveWorkspaceInfo();
  if (!workspaceInfo || !workspaceInfo.activeWorkspace) {
    redirect("/dashboard");
  }

  const activeWorkspace = workspaceInfo.activeWorkspace;
  const isOwnerOrAdmin = ["owner", "admin"].includes(activeWorkspace.role);
  const isTeam = activeWorkspace.type === "team";

  if (!isTeam) {
    return (
      <div className="w-full max-w-2xl mx-auto my-12 p-8 bg-stitch-surface border border-surface-variant/30 rounded-2xl text-center space-y-4">
        <h2 className="text-xl font-bold text-on-surface">Team Workspace Required</h2>
        <p className="text-sm text-slate-400">Team performance analytics are available for collaborative Team Workspaces.</p>
        <Link href="/dashboard" className="inline-block px-4 py-2 rounded-xl bg-stitch-primary text-black font-bold text-xs">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12 px-3 sm:px-6 pt-4">
      {/* Header Navigation & Quick Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-variant/30 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/dashboard/settings?tab=workspace" className="hover:text-stitch-primary transition-colors font-medium">
              Workspace Settings
            </Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">Team Performance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-headline text-on-surface">
            Team Analytics & Performance
          </h1>
        </div>

        {/* Option Navigation Bar */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
          <Link
            href="/dashboard/workspace/members"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Users size={13} />
            <span>Members</span>
          </Link>
          <Link
            href="/dashboard/workspace/performance"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stitch-primary text-black shadow-sm"
          >
            <Sliders size={13} />
            <span>Performance</span>
          </Link>
          <Link
            href="/dashboard/workspace/roles"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ShieldCheck size={13} />
            <span>Custom Roles</span>
          </Link>
          <Link
            href="/dashboard/workspace/audit"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <History size={13} />
            <span>Audit Log</span>
          </Link>
        </div>
      </div>

      <WorkspacePerformanceTab
        workspaceId={activeWorkspace._id}
        isOwnerOrAdmin={isOwnerOrAdmin}
      />
    </div>
  );
}
