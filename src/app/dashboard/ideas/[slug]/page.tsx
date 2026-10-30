import { getIdeaBySlug } from "@/actions/idea.actions";
import { notFound } from "next/navigation";
import IdeaDetailClient from "./IdeaDetailClient";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";

export const metadata = {
  title: "Idea Details - Manageo",
};


export default async function IdeaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ idea }, workspaceInfo] = await Promise.all([
    getIdeaBySlug(slug).then(res => ({ idea: res })),
    getActiveWorkspaceInfo(),
  ]);
  
  if (!idea) {
    return notFound();
  }

  let workspaceMembers: unknown[] = [];
  if (idea.workspaceId) {
    try {
      const { getWorkspaceMembers } = await import("@/actions/workspaceMember.actions");
      workspaceMembers = await getWorkspaceMembers(idea.workspaceId.toString());
    } catch {
      workspaceMembers = [];
    }
  }

  const isTeamWorkspace = Boolean(
    workspaceInfo?.activeWorkspace?.type === "team" ||
    (workspaceInfo?.activeWorkspace?.type !== "personal" && workspaceMembers && workspaceMembers.length > 1)
  );

  return (
    <div className="w-full h-full max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pt-24 lg:pt-8 animate-in fade-in duration-500">
      <IdeaDetailClient 
        idea={idea} 
        workspaceMembers={workspaceMembers} 
        isTeamWorkspace={isTeamWorkspace}
      />
    </div>
  );
}
