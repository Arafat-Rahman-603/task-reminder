"use client";

import { useState } from "react";
import { createTask } from "@/actions/task.actions";

export default function NewTaskForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
      priority: formData.get("priority") as any,
    };

    const res = await createTask(data);
    if (res.success) {
      (e.target as HTMLFormElement).reset();
    } else {
      setError(res.error || "Failed to create task");
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/30 p-2 rounded-md">{error}</div>}
      
      <div>
        <input
          name="title"
          type="text"
          required
          placeholder="Task title..."
          className="block w-full rounded-md border-0 py-2 px-3 bg-background text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-focus sm:text-sm sm:leading-6 transition-colors"
        />
      </div>

      <div>
        <select
          name="priority"
          className="block w-full rounded-md border-0 py-1.5 px-3 bg-background text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-focus sm:text-sm sm:leading-6 transition-colors"
        >
          <option value="Low">Low Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="High">High Priority</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Adding..." : "Add Task"}
      </button>
    </form>
  );
}
