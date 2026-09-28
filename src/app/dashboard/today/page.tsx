import { getTasks } from "@/actions/task.actions";
import TodayClient from "./TodayClient";

export default async function TodayPage() {
  const { tasks } = await getTasks();

  return (
    <div className="w-full min-h-full max-w-lg mx-auto md:max-w-4xl">
      <TodayClient tasks={tasks} />
    </div>
  );
}
