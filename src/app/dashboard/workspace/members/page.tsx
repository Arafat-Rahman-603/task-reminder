import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";
import { getWorkspaceMembers } from "@/actions/workspaceMember.actions";
import { getWorkspaceRoles } from "@/actions/workspaceRole.actions";
import Link from "next/link";
import MembersListClient from "./MembersListClient";

export const dynamic = "force-dynamic";

export default async function WorkspaceMembersPage() {
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
        <p className="text-sm text-slate-400">Team member management is available for collaborative Team Workspaces.</p>
        <Link href="/dashboard" className="inline-block px-4 py-2 rounded-xl bg-stitch-primary text-black font-bold text-xs">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const [members, customRoles] = await Promise.all([
    getWorkspaceMembers(activeWorkspace._id),
    getWorkspaceRoles(activeWorkspace._id),
  ]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12 px-3 sm:px-6 pt-4">
      <MembersListClient
        workspace={activeWorkspace}
        initialMembers={members}
        customRoles={customRoles}
        isOwnerOrAdmin={isOwnerOrAdmin}
      />
    </div>
  );
}
