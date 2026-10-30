import { getNoteGroup, getNote } from "@/actions/note.actions";
import { notFound } from "next/navigation";
import NoteClient from "./NoteClient";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";

export default async function NotePage(
  props: {
    params: Promise<{ slug: string, noteSlug: string }>;
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

  const { note } = await getNote(group._id, params.noteSlug);

  if (!note) {
    return notFound();
  }

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
    <div className="w-full min-h-full max-w-lg mx-auto md:max-w-3xl">
      <NoteClient 
        group={group} 
        note={note} 
        workspaceMembers={workspaceMembers} 
        isTeamWorkspace={isTeamWorkspace}
      />
    </div>
  );
}
