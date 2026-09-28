import { getTasks } from "@/actions/task.actions";
import KanbanBoard from "./KanbanBoard";

export default async function TasksPage() {
  const { tasks } = await getTasks();

  return (
    <div className="w-full min-h-full max-w-lg mx-auto md:max-w-4xl">
      <KanbanBoard initialTasks={tasks} />
    </div>
  );
}
