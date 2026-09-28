"use client";

import { useState } from "react";
import { createTask } from "@/actions/task.actions";
import { useRouter } from "next/navigation";

export default function NewTaskForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      title: formData.get("title") as string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
      priority: formData.get("priority") as any,
    };

    const res = await createTask(data);
    if (res.success) {
      form.reset();
      router.refresh();
      if (onSuccess) onSuccess();
    } else {
      setError(res.error || "Failed to create task");
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && <div className="text-xs font-medium text-danger-foreground bg-danger/20 p-2 rounded-xl">{error}</div>}
      
      <input
        name="title"
        type="text"
        required
        placeholder="Task title..."
        className="w-full h-10 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all"
      />

      <div className="flex gap-2">
        <select
          name="priority"
          className="flex-1 h-10 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface text-sm focus:outline-none focus:bg-surface-container-high transition-all"
          defaultValue="Medium"
        >
          <option value="Low">Low Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="High">High Priority</option>
          <option value="Urgent">Urgent</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="px-4 h-10 rounded-xl bg-stitch-primary text-on-primary text-sm font-semibold hover:bg-primary-fixed-dim transition-colors disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>
    </form>
  );
}
