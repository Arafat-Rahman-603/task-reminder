import { getTaskBySlug } from "@/actions/task.actions";
import { notFound } from "next/navigation";
import TaskDetailClient from "./TaskDetailClient";

export default async function TaskDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const task = await getTaskBySlug(slug);

  if (!task) {
    notFound();
  }

  return <TaskDetailClient task={task} />;
}
