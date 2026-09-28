"use client";

import { useState } from "react";
import { createIdea } from "@/actions/idea.actions";

export default function NewIdeaForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
      priority: formData.get("priority") as any,
    };

    const res = await createIdea(data);
    if (res.success) {
      (e.target as HTMLFormElement).reset();
    } else {
      setError(res.error || "Failed to capture idea");
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
          placeholder="New idea..."
          className="block w-full rounded-md border-0 py-2 px-3 bg-background text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-focus sm:text-sm sm:leading-6 transition-colors"
        />
      </div>

      <div>
        <textarea
          name="description"
          placeholder="Quick summary..."
          rows={3}
          className="block w-full rounded-md border-0 py-2 px-3 bg-background text-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-focus sm:text-sm sm:leading-6 transition-colors"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
      >
        {loading ? "Capturing..." : "Capture Idea"}
      </button>
    </form>
  );
}
