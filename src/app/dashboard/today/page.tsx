import { getTasks } from "@/actions/task.actions";
import TaskList from "../tasks/TaskList";
import NewTaskForm from "../tasks/NewTaskForm";

export default async function TodayPage() {
  const { tasks } = await getTasks();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todayTasks = tasks.filter((t: any) => t.status !== "Completed" && t.status !== "Cancelled");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Today</h1>
        <p className="text-muted-foreground mt-1">{today} — Focus on what matters right now.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Active Tasks
              <span className="ml-2 text-sm font-normal text-muted-foreground">({todayTasks.length})</span>
            </h2>
            {todayTasks.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">You&apos;re all caught up for today! 🎉</p>
              </div>
            ) : (
              <TaskList tasks={todayTasks} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Add Task</h2>
            <NewTaskForm />
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 text-center">
            <h3 className="font-semibold mb-2 text-foreground">Morning Checklist</h3>
            <p className="text-sm text-muted-foreground">
              Add your tasks above to build your daily focus list.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
