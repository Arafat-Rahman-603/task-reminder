"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings, LogOut, FolderOpen, Plus, User as UserIcon, ChevronDown } from "lucide-react";
import { signOut } from "next-auth/react";
import { SYSTEM_MODULES } from "@/config/modules";
import { useState } from "react";
import { NotificationsButton } from "./NotificationsButton";
import { useLanguage } from "@/context/LanguageContext";

import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

/**
 * NavItem is a pre-resolved, server-computed nav entry.
 * The server filters by (implemented && enabled) before passing these down.
 * The client NEVER re-filters — it only looks up icons.
 */
export interface NavGroupItem {
  id: string;
  type: 'module' | 'custom' | 'link';
  label: string;
  icon?: string;
  href: string;
  isHidden: boolean;
}

export interface NavGroup {
  _id: string;
  name: string;
  isCollapsed: boolean;
  items: NavGroupItem[];
}

interface SidebarProps {
  navGroups: NavGroup[];
  workspaces?: any[];
  activeWorkspace?: any;
  accountType?: string;
}

export function Sidebar({ navGroups = [], workspaces = [], activeWorkspace, accountType }: SidebarProps) {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const { t } = useLanguage();

  const toggleGroup = (id: string) => {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="hidden md:flex h-full w-64 flex-col bg-stitch-surface border-r border-surface-variant/30">
      {/* Logo */}
      <div className="flex h-20 shrink-0 items-center justify-between px-5 border-b border-surface-variant/30">
        <div className="flex items-center gap-2.5 w-full">
          <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain" />
        </div>
        <div className="flex items-center -mr-2">
          <NotificationsButton align="left" />
        </div>
      </div>

      <div className="px-3 py-3 border-b border-surface-variant/30">
        <WorkspaceSwitcher workspaces={workspaces} activeWorkspace={activeWorkspace} align="left" accountType={accountType} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin scrollbar-thumb-surface-variant scrollbar-track-transparent">
        {navGroups.map((group) => {
          const isCollapsed = collapsedGroups[group._id] ?? group.isCollapsed ?? false;
          const visibleItems = group.items.filter(i => !i.isHidden);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group._id}>
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group._id)}
                className="w-full flex items-center justify-between px-2 mb-1.5 group"
              >
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest group-hover:text-stitch-primary transition-colors">
                  {t(group.name.toLowerCase().replace(/ /g, '_'), group.name)}
                </span>
                <div className="flex items-center gap-1">
                  {group.name === "My Sections" && (
                    <Link
                      href="/dashboard/custom/new"
                      onClick={e => e.stopPropagation()}
                      className="p-0.5 rounded hover:text-stitch-primary transition-colors text-on-surface-variant"
                      title="New Section"
                    >
                      <Plus className="h-3 w-3" />
                    </Link>
                  )}
                  <ChevronDown className={cn(
                    "w-3 h-3 text-on-surface-variant transition-transform duration-200",
                    isCollapsed ? "-rotate-90" : ""
                  )} />
                </div>
              </button>

              {/* Nav Items */}
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const IconComponent = item.type === 'module'
                      ? SYSTEM_MODULES[item.id]?.icon
                      : (item.type === 'custom' ? FolderOpen : null);

                    const isActive = item.href === '/dashboard' 
                      ? pathname === '/dashboard'
                      : (pathname === item.href || pathname.startsWith(`${item.href}/`));

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all relative",
                          isActive
                            ? "bg-primary/15 text-stitch-primary shadow-[0_0_12px_rgba(125,211,252,0.08)]"
                            : "text-on-surface-variant hover:bg-surface-container/70 hover:text-on-surface"
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-stitch-primary rounded-full" />
                        )}
                        {IconComponent && (
                          <IconComponent
                            className={cn(
                              "h-4 w-4 flex-shrink-0 transition-colors",
                              isActive ? "text-stitch-primary" : "text-on-surface-variant group-hover:text-on-surface"
                            )}
                            aria-hidden="true"
                          />
                        )}
                        <span className="truncate">{t(item.label.toLowerCase().replace(/ /g, '_'), item.label)}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom User Actions */}
      <div className="border-t border-surface-variant/30 p-3 space-y-0.5 shrink-0">
        <Link
          href="/dashboard/profile"
          className={cn(
            "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all",
            pathname === "/dashboard/profile"
              ? "bg-primary/15 text-stitch-primary"
              : "text-on-surface-variant hover:bg-surface-container/70 hover:text-on-surface"
          )}
        >
          <UserIcon className="h-4 w-4 flex-shrink-0" />
          {t("profile")}
        </Link>
        <Link
          href="/dashboard/settings"
          className={cn(
            "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all",
            pathname === "/dashboard/settings"
              ? "bg-primary/15 text-stitch-primary"
              : "text-on-surface-variant hover:bg-surface-container/70 hover:text-on-surface"
          )}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {t("settings")}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-on-surface-variant transition-all hover:bg-error/10 hover:text-error"
        >
          <LogOut className="h-4 w-4 flex-shrink-0 group-hover:text-error" />
          Logout
        </button>
      </div>
    </div>
  );
}
