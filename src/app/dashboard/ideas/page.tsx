import { getIdeas } from "@/actions/idea.actions";
import Link from "next/link";
import { Lightbulb, PlusCircle, ArrowRight, MoreHorizontal } from "lucide-react";
import NewIdeaForm from "./NewIdeaForm";

export default async function IdeasPage() {
  const { ideas } = await getIdeas();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inboxIdeas = ideas.filter((i: any) => i.status === "Inbox" || i.status === "Exploring");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeIdeas = ideas.filter((i: any) => i.status === "Planned" || i.status === "In Progress");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ideas</h1>
          <p className="text-muted-foreground dark:text-zinc-400 mt-1">
            Capture thoughts, business plans, and future projects.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-surface shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Capture Idea
            </h2>
            <NewIdeaForm />
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Idea Pipeline</h2>
              <div className="flex gap-2">
                <span className="text-sm px-3 py-1 bg-muted rounded-full font-medium">
                  {ideas.length} Total
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
                  Exploring ({inboxIdeas.length})
                </h3>
                <div className="space-y-3">
                  {inboxIdeas.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-4 bg-muted/50 rounded-lg border border-dashed border-border text-center">No ideas currently exploring.</p>
                  ) : (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    inboxIdeas.map((idea: any) => (
                      <div key={idea._id} className="p-4 rounded-lg border border-border bg-surface hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{idea.title}</h4>
                          <button className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-zinc-900 dark:hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                        {idea.description && <p className="text-sm text-muted-foreground dark:text-zinc-400 line-clamp-2 mb-3">{idea.description}</p>}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                           <span className="text-xs font-medium px-2 py-1 bg-muted rounded text-muted-foreground">
                             {idea.status}
                           </span>
                           <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                             Convert <ArrowRight className="h-3 w-3" />
                           </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  Active Plans ({activeIdeas.length})
                </h3>
                <div className="space-y-3">
                  {activeIdeas.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-4 bg-muted/50 rounded-lg border border-dashed border-border text-center">No active plans.</p>
                  ) : (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    activeIdeas.map((idea: any) => (
                      <div key={idea._id} className="p-4 rounded-lg border border-border bg-surface hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{idea.title}</h4>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                           <span className="text-xs font-medium px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                             {idea.status}
                           </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
