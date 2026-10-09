import { getNoteGroups } from "@/actions/note.actions";
import NotesClient from "./NotesClient";

export default async function NotesPage() {
  const { groups } = await getNoteGroups();

  return (
    <div className="w-full min-h-full max-w-lg mx-auto md:max-w-5xl">
      <NotesClient initialGroups={groups} />
    </div>
  );
}
