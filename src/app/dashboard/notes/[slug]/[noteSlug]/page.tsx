import { getNoteGroup, getNote } from "@/actions/note.actions";
import { notFound } from "next/navigation";
import NoteClient from "./NoteClient";

export default async function NotePage(
  props: {
    params: Promise<{ slug: string, noteSlug: string }>;
  }
) {
  const params = await props.params;
  const { group } = await getNoteGroup(params.slug);

  if (!group) {
    return notFound();
  }

  const { note } = await getNote(group._id, params.noteSlug);

  if (!note) {
    return notFound();
  }

  return (
    <div className="w-full min-h-full max-w-lg mx-auto md:max-w-3xl">
      <NoteClient group={group} note={note} />
    </div>
  );
}
