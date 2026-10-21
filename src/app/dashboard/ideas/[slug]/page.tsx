import { getIdeaBySlug } from "@/actions/idea.actions";
import { notFound } from "next/navigation";
import IdeaDetailClient from "./IdeaDetailClient";

export const metadata = {
  title: "Idea Details - Manageo",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function IdeaDetailPage({ params }: { params: any }) {
  const { slug } = await params;
  const idea = await getIdeaBySlug(slug);
  
  if (!idea) {
    return notFound();
  }

  let workspaceMembers: any[] = [];
  if (idea.workspaceId) {
    try {
      const { getWorkspaceMembers } = await import("@/actions/workspaceMember.actions");
      workspaceMembers = await getWorkspaceMembers(idea.workspaceId.toString());
    } catch {
      workspaceMembers = [];
    }
  }

  return (
    <div className="w-full h-full max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pt-24 lg:pt-8 animate-in fade-in duration-500">
      <IdeaDetailClient idea={idea} workspaceMembers={workspaceMembers} />
    </div>
  );
}
