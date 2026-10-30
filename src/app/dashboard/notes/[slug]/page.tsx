import { getNoteGroup, getNotes } from "@/actions/note.actions";
import { notFound } from "next/navigation";
import GroupClient from "./GroupClient";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";

export default async function NoteGroupPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const [{ group }, workspaceInfo] = await Promise.all([
    getNoteGroup(params.slug),
    getActiveWorkspaceInfo(),
  ]);

  if (!group) {
    return notFound();
  }

  const { notes } = await getNotes(group._id);

  let workspaceMembers: unknown[] = [];
  if (group.workspaceId) {
    try {
      const { getWorkspaceMembers } = await import("@/actions/workspaceMember.actions");
      workspaceMembers = await getWorkspaceMembers(group.workspaceId.toString());
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
      <GroupClient 
        group={group} 
        initialNotes={notes} 
        workspaceMembers={workspaceMembers} 
        isTeamWorkspace={isTeamWorkspace}
      />
    </div>
  );
}
