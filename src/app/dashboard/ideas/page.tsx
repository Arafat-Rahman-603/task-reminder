import { getIdeas } from "@/actions/idea.actions";
import { getDashboardBlocks } from "@/actions/dashboard.actions";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";
import IdeasClient from "./IdeasClient";
import { ModuleGuard } from "@/components/ModuleGuard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function IdeasPage() {
  return (
    <ModuleGuard moduleId="ideas">
      <IdeasPageContent />
    </ModuleGuard>
  );
}

async function IdeasPageContent() {
  const [{ ideas }, { blocks }, workspaceInfo, session] = await Promise.all([
    getIdeas(),
    getDashboardBlocks("ideas_dashboard"),
    getActiveWorkspaceInfo(),
    getServerSession(authOptions),
  ]);

  let workspaceMembers: unknown[] = [];
  if (workspaceInfo?.activeWorkspace?._id) {
    try {
      const { getWorkspaceMembers } = await import("@/actions/workspaceMember.actions");
      workspaceMembers = await getWorkspaceMembers(workspaceInfo.activeWorkspace._id.toString());
    } catch {
      workspaceMembers = [];
    }
  }

  const isIndividualAccount = (session?.user as { accountType?: string })?.accountType === "individual";
  const isTeamWorkspace = Boolean(
    !isIndividualAccount &&
    workspaceInfo?.activeWorkspace?.type === "team"
  );

  return (
    <div className="w-full min-h-full max-w-lg mx-auto md:max-w-5xl">
      <IdeasClient 
        initialIdeas={ideas} 
        initialBlocks={blocks} 
        workspaceMembers={workspaceMembers} 
        isTeamWorkspace={isTeamWorkspace}
      />
    </div>
  );
}
