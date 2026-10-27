// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TaskSlugPageAny = any;
import { getTaskBySlug } from "@/actions/task.actions";
import { notFound } from "next/navigation";
import TaskDetailClient from "./TaskDetailClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function TaskDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const task = await getTaskBySlug(slug);

  if (!task) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (session?.user as any)?.id || "";

  let workspaceMembers: TaskSlugPageAny[] = [];
  if (task.workspaceId) {
    try {
      const { getWorkspaceMembers } = await import("@/actions/workspaceMember.actions");
      workspaceMembers = await getWorkspaceMembers(task.workspaceId.toString());
    } catch {
      workspaceMembers = [];
    }
  }

  return (
    <TaskDetailClient
      task={task}
      workspaceMembers={workspaceMembers}
      currentUserId={currentUserId}
    />
  );
}
