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
  accountType?: string;
}

export function WorkspaceSwitcher({ workspaces, activeWorkspace, align = "left", accountType }: WorkspaceSwitcherProps) {
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
  // If the user has only 1 workspace or is an individual user with no team workspace, hide the switcher
  if (workspaces.length <= 1 || (accountType === "individual" && !workspaces.some(w => w.type === 'team'))) {
    return null;
  }

  const current = activeWorkspace || workspaces[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full p-2 rounded-xl border border-white/10 bg-white/[0.02]",
          "hover:bg-white/[0.05] hover:border-white/20 transition-all",
          isPending && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-stitch-primary/10 text-stitch-primary shrink-0">
            {current.type === 'personal' ? <UserIcon size={14} /> : <Briefcase size={14} />}
          </div>
          <div className="flex flex-col items-start overflow-hidden">
            <span className="text-xs font-semibold text-white truncate max-w-[120px]">{current.name}</span>
            <span className="text-[10px] text-slate-400 capitalize">{current.role}</span>
          </div>
        </div>
        <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div 
            className={cn(
              "absolute z-50 mt-1 w-60 bg-[#0c121e] border border-white/10 rounded-2xl shadow-2xl py-2 backdrop-blur-xl",
              align === 'right' ? "right-0" : "left-0"
            )}
          >
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Workspaces
            </div>
            
            <div className="max-h-[260px] overflow-y-auto">
              {workspaces.map((ws) => (
                <button
                  key={ws._id}
                  onClick={() => {
                    handleSelect(ws._id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-stitch-primary/10 text-stitch-primary shrink-0">
                      {ws.type === 'personal' ? <UserIcon size={12} /> : <Briefcase size={12} />}
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-xs font-medium text-slate-200 truncate">{ws.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{ws.role}</span>
                    </div>
                  </div>
                  {current._id === ws._id && <Check size={14} className="text-stitch-primary shrink-0 ml-1" />}
                </button>
              ))}
            </div>

            <div className="border-t border-white/10 mt-1 pt-1 px-1.5">
              {accountType !== "individual" && (
                <a 
                  href="/workspaces/new" 
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Plus size={13} />
                  <span>New Workspace</span>
                </a>
              )}
              <a 
                href="/dashboard/settings" 
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <Settings size={13} />
                <span>Workspace Settings</span>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
