"use client";

import { useState } from "react";
import { ChevronDown, Briefcase, User as UserIcon, Check, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { setActiveWorkspace } from "@/actions/workspace.actions";

interface WorkspaceInfo {
  _id: string;
  name: string;
  type: string;
  role: string;
}

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceInfo[];
  activeWorkspace?: WorkspaceInfo;
  align?: "left" | "right";
}

export function WorkspaceSwitcher({ workspaces, activeWorkspace, align = "left" }: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSelect = async (id: string) => {
    if (activeWorkspace?._id === id || isPending) return;
    setIsPending(true);
    try {
      await setActiveWorkspace(id);
      window.location.reload(); // Hard reload to fetch new workspace data context
    } catch (error) {
      console.error("Failed to switch workspace", error);
      setIsPending(false);
    }
  };

  if (!workspaces || workspaces.length === 0) return null;
  const current = activeWorkspace || workspaces[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full p-2 rounded-lg border border-surface-variant/30",
          "hover:bg-stitch-surface hover:border-surface-variant transition-colors",
          isPending && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 text-primary">
            {current.type === 'personal' ? <UserIcon size={16} /> : <Briefcase size={16} />}
          </div>
          <div className="flex flex-col items-start overflow-hidden">
            <span className="text-sm font-medium truncate max-w-[120px]">{current.name}</span>
            <span className="text-xs text-secondary-text capitalize">{current.role}</span>
          </div>
        </div>
        <ChevronDown size={16} className="text-secondary-text shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div 
            className={cn(
              "absolute z-50 mt-1 w-64 bg-stitch-surface border border-surface-variant/30 rounded-lg shadow-lg py-2",
              align === 'right' ? "right-0" : "left-0"
            )}
          >
            <div className="px-3 py-1 text-xs font-semibold text-secondary-text uppercase tracking-wider">
              Workspaces
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {workspaces.map((ws) => (
                <button
                  key={ws._id}
                  onClick={() => {
                    handleSelect(ws._id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-variant/20 transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary shrink-0">
                      {ws.type === 'personal' ? <UserIcon size={14} /> : <Briefcase size={14} />}
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-sm font-medium truncate">{ws.name}</span>
                      <span className="text-xs text-secondary-text capitalize">{ws.role}</span>
                    </div>
                  </div>
                  {current._id === ws._id && <Check size={16} className="text-primary shrink-0" />}
                </button>
              ))}
            </div>

            <div className="border-t border-surface-variant/30 mt-2 pt-2 px-2">
              <a 
                href="/workspaces/new" 
                className="flex items-center gap-2 px-2 py-2 text-sm text-secondary-text hover:text-primary hover:bg-primary/5 rounded transition-colors"
              >
                <Plus size={16} />
                Create Team Workspace
              </a>
              <a 
                href="/dashboard/settings" 
                className="flex items-center gap-2 px-2 py-2 text-sm text-secondary-text hover:text-primary hover:bg-primary/5 rounded transition-colors"
              >
                <Settings size={16} />
                Manage Settings
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
