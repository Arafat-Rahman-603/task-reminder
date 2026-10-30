import { getIdeas } from "@/actions/idea.actions";
import { getDashboardBlocks } from "@/actions/dashboard.actions";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";
import IdeasClient from "./IdeasClient";
import { ModuleGuard } from "@/components/ModuleGuard";

export default async function IdeasPage() {
  return (
    <ModuleGuard moduleId="ideas">
      <IdeasPageContent />
    </ModuleGuard>
  );
}

async function IdeasPageContent() {
  const [{ ideas }, { blocks }, workspaceInfo] = await Promise.all([
    getIdeas(),
    getDashboardBlocks("ideas_dashboard"),
    getActiveWorkspaceInfo(),
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

  const isTeamWorkspace = Boolean(
    workspaceInfo?.activeWorkspace?.type === "team" ||
    (workspaceInfo?.activeWorkspace?.type !== "personal" && workspaceMembers && workspaceMembers.length > 1)
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
