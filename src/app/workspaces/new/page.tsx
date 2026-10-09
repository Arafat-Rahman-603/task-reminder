"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/actions/workspace.actions";
import { ChevronLeft, Briefcase, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Workspace name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await createWorkspace({ name, description });
      // Since it automatically switches, reloading will load the dashboard with the new context
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Failed to create workspace");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stitch-background text-on-background flex flex-col">
      <header className="flex items-center h-16 px-4 md:px-8 border-b border-surface-variant/30 bg-stitch-surface sticky top-0 z-10">
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 text-secondary-text hover:text-primary transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back to Dashboard</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stitch-surface border border-surface-variant/30 rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Briefcase size={24} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Create Team Workspace</h1>
            <p className="text-secondary-text text-sm">
              A shared space for you and your team to collaborate on tasks and routines.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Workspace Name <span className="text-error">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp"
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl bg-stitch-background border border-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-surface-variant"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-error/10 text-error rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-secondary-text text-xs">(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this workspace for?"
                disabled={isSubmitting}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-stitch-background border border-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-surface-variant resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium bg-stitch-primary text-white hover:bg-stitch-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Briefcase size={18} />}
              {isSubmitting ? "Creating..." : "Create Workspace"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
