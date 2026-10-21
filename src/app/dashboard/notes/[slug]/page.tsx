import { getNoteGroup, getNotes } from "@/actions/note.actions";
import { notFound } from "next/navigation";
import GroupClient from "./GroupClient";

export default async function NoteGroupPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const { group } = await getNoteGroup(params.slug);

  if (!group) {
    return notFound();
  }

  const { notes } = await getNotes(group._id);

  let workspaceMembers: any[] = [];
  if (group.workspaceId) {
    try {
      const { getWorkspaceMembers } = await import("@/actions/workspaceMember.actions");
      workspaceMembers = await getWorkspaceMembers(group.workspaceId.toString());
    } catch {
      workspaceMembers = [];
    }
  }

  return (
    <div className="w-full min-h-full max-w-lg mx-auto md:max-w-5xl">
      <GroupClient group={group} initialNotes={notes} workspaceMembers={workspaceMembers} />
    </div>
  );
}
