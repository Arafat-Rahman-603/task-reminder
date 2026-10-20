import { getTasks } from "@/actions/task.actions";
import KanbanBoard from "./KanbanBoard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/db";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";
import { getWorkspaceMembers } from "@/actions/workspaceMember.actions";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  let taskSettings = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (session?.user as any)?.id || "";

  if (session && session.user) {
    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await User.findById((session.user as any).id).lean();
    if (user && user.preferences && user.preferences.taskSettings) {
      taskSettings = JSON.parse(JSON.stringify(user.preferences.taskSettings));
    }
  }

  const { tasks } = await getTasks();

  const workspaceInfo = await getActiveWorkspaceInfo();
  const activeWorkspace = workspaceInfo?.activeWorkspace;
  let workspaceMembers: any[] = [];
  if (activeWorkspace) {
    try {
      workspaceMembers = await getWorkspaceMembers(activeWorkspace._id.toString());
    } catch {
      workspaceMembers = [];
    }
  }

  return (
    <div className="w-full min-h-full mx-auto md:max-w-6xl">
      <KanbanBoard
        initialTasks={tasks}
        taskSettings={taskSettings}
        workspaceMembers={workspaceMembers}
        activeWorkspace={activeWorkspace}
        currentUserId={currentUserId}
      />
    </div>
  );
}
