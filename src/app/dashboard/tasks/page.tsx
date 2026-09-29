import { getTasks } from "@/actions/task.actions";
import KanbanBoard from "./KanbanBoard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/db";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  let taskSettings = {};
  if (session && session.user) {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await User.findById((session.user as any).id).lean();
    if (user && user.preferences && user.preferences.taskSettings) {
      taskSettings = JSON.parse(JSON.stringify(user.preferences.taskSettings));
    }
  }

  const { tasks } = await getTasks();

  return (
    <div className="w-full min-h-full mx-auto md:max-w-6xl">
      <KanbanBoard initialTasks={tasks} taskSettings={taskSettings} />
    </div>
  );
}
