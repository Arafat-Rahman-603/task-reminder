"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FolderOpen, Sun } from "lucide-react";
import { SYSTEM_MODULES } from "@/config/modules";

export function CommandMenu({ userModules = {} }: { userModules?: Record<string, boolean> }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  // Generate dynamic actions based on enabled modules
  const actions = Object.values(SYSTEM_MODULES)
    .filter(mod => {
      const isEnabled = userModules[mod.id] !== undefined ? userModules[mod.id] : mod.defaultEnabled;
      return isEnabled && mod.supportsQuickAdd && mod.implemented;
    })
    .map(mod => ({
      id: mod.id,
      name: `Create ${mod.label.slice(0, -1)}`, // naïve singularization e.g., Tasks -> Create Task
      icon: mod.icon,
      href: mod.route + "?new=true", // Example standard route for quick creation
      type: "Action"
    }));

  // Add system actions
  const systemActions = [
    { id: "nav-today", name: "Go to Today", icon: Sun, href: "/dashboard/today", type: "Navigation" },
    { id: "nav-settings", name: "Settings", icon: FolderOpen, href: "/dashboard/settings", type: "Navigation" }
  ];

  const allItems = [...actions, ...systemActions];

  const filtered = allItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (item: { action?: () => void; href?: string; [key: string]: unknown }) => {
    setOpen(false);
    setSearch("");
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 sm:pt-48 bg-background/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-elevated shadow-2xl ring-1 ring-border overflow-hidden transform transition-all">
        <div className="flex items-center border-b border-border px-4 py-3 gap-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground text-base"
            placeholder="What do you want to do? (e.g. 'Task')"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button 
            onClick={() => setOpen(false)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 custom-scrollbar">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No results found.</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left rounded-lg text-foreground hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                  {item.type}
                </span>
              </button>
            ))
          )}
        </div>
        <div className="border-t border-border px-4 py-2 bg-muted/50 flex justify-between items-center text-xs text-muted-foreground">
          <span>Search or navigate</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-sans shadow-sm">ESC</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
}
