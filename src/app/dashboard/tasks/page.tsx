import { getTasks } from "@/actions/task.actions";
import NewTaskForm from "./NewTaskForm";
import TaskList from "./TaskList";

export default async function TasksPage() {
  const { tasks } = await getTasks();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inboxTasks = tasks.filter((t: any) => t.status === "Inbox" || t.status === "Planned");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inProgressTasks = tasks.filter((t: any) => t.status === "In Progress");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completedTasks = tasks.filter((t: any) => t.status === "Completed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Manage your to-dos, projects, and daily objectives.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Quick Add</h2>
            <NewTaskForm />
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Task Board</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">To Do</h3>
                <TaskList tasks={inboxTasks} />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">In Progress</h3>
                <TaskList tasks={inProgressTasks} />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Completed</h3>
                <TaskList tasks={completedTasks} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
