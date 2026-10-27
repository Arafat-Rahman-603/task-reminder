"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings, LogOut, FolderOpen, Plus, User as UserIcon, ChevronDown, Lock, LifeBuoy, ShieldCheck, Headphones, Building2, BarChart3, Users, History } from "lucide-react";
import { signOut } from "next-auth/react";
import { SYSTEM_MODULES } from "@/config/modules";
import { useState } from "react";
import { NotificationsButton } from "./NotificationsButton";
import { useLanguage } from "@/context/LanguageContext";
import { useSectionSecurity } from "@/context/SectionSecurityContext";

import { WorkspaceSwitcher, WorkspaceInfo } from "./WorkspaceSwitcher";
import { Logo } from "./Logo";

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
  workspaces?: WorkspaceInfo[];
  activeWorkspace?: WorkspaceInfo | null;
  accountType?: string;
  isPlatformAdmin?: boolean;
  isSupportTeam?: boolean;
  unreadSupportCount?: number;
  staffUnreadSupportCount?: number;
}

export function Sidebar({
  navGroups = [],
  workspaces = [],
  activeWorkspace,
  accountType,
  isPlatformAdmin = false,
  isSupportTeam = false,
  unreadSupportCount = 0,
  staffUnreadSupportCount = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const { t } = useLanguage();
  const { lockedSections, isSectionLocked } = useSectionSecurity();

  const toggleGroup = (id: string) => {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="hidden md:flex h-full w-64 shrink-0 flex-col bg-stitch-surface border-r border-surface-variant/30">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-surface-variant/30">
        <Logo variant="sidebar" href="/dashboard" priority />
        <div className="flex items-center -mr-2">
          <NotificationsButton align="left" />
        </div>
      </div>

      <div className="px-3 py-3 border-b border-surface-variant/30">
        <WorkspaceSwitcher workspaces={workspaces} activeWorkspace={activeWorkspace ?? undefined} align="left" accountType={accountType} />
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
                className="w-full flex items-center justify-between px-2 py-0.5 mb-1.5 group bg-transparent hover:bg-surface-variant/20 rounded-lg transition-colors"
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

                    const sectionKey = item.type === 'custom' ? item.href.replace('/dashboard/custom/', '') : item.id;
                    const isProtected = lockedSections.includes(sectionKey);
                    const isCurrentlyLocked = isSectionLocked(sectionKey);

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
                        <span className="truncate flex-1">{t(item.label.toLowerCase().replace(/ /g, '_'), item.label)}</span>
                        {isProtected && (
                          <span title={isCurrentlyLocked ? "Locked with password" : "Unlocked for this session"} className="ml-auto shrink-0 flex items-center">
                            <Lock
                              className={cn(
                                "w-3.5 h-3.5 transition-colors",
                                isCurrentlyLocked ? "text-stitch-primary" : "text-on-surface-variant/40"
                              )}
                            />
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
              {/* Dedicated Workspace Navigation Group right below System */}
              {group.name === "System" && activeWorkspace?.type === "team" && (
                <div className="mt-5">
                  <button
                    onClick={() => toggleGroup("team_workspace")}
                    className="w-full flex items-center justify-between px-2 py-0.5 mb-1.5 group bg-transparent hover:bg-surface-variant/20 rounded-lg transition-colors"
                  >
                    <span className="text-[10px] font-bold text-stitch-primary uppercase tracking-widest flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{activeWorkspace?.name || "Workspace"}</span>
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/20">
                        TEAM
                      </span>
                      <ChevronDown className={cn(
                        "w-3 h-3 text-stitch-primary transition-transform duration-200",
                        collapsedGroups["team_workspace"] ? "-rotate-90" : ""
                      )} />
                    </div>
                  </button>

                  {!collapsedGroups["team_workspace"] && (
                    <div className="space-y-0.5">
                      <Link
                        href="/dashboard/workspace/performance"
                        className={cn(
                          "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all relative",
                          pathname.startsWith("/dashboard/workspace/performance")
                            ? "bg-primary/15 text-stitch-primary shadow-[0_0_12px_rgba(125,211,252,0.08)]"
                            : "text-on-surface-variant hover:bg-surface-container/70 hover:text-on-surface"
                        )}
                      >
                        {pathname.startsWith("/dashboard/workspace/performance") && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-stitch-primary rounded-full" />
                        )}
                        <BarChart3
                          className={cn(
                            "h-4 w-4 flex-shrink-0 transition-colors",
                            pathname.startsWith("/dashboard/workspace/performance") ? "text-stitch-primary" : "text-on-surface-variant group-hover:text-on-surface"
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate flex-1">Team Performance</span>
                      </Link>

                      <Link
                        href="/dashboard/workspace/members"
                        className={cn(
                          "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all relative",
                          pathname === "/dashboard/workspace/members" || (pathname.startsWith("/dashboard/workspace/members/") && !pathname.includes("performance"))
                            ? "bg-primary/15 text-stitch-primary shadow-[0_0_12px_rgba(125,211,252,0.08)]"
                            : "text-on-surface-variant hover:bg-surface-container/70 hover:text-on-surface"
                        )}
                      >
                        {(pathname === "/dashboard/workspace/members" || (pathname.startsWith("/dashboard/workspace/members/") && !pathname.includes("performance"))) && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-stitch-primary rounded-full" />
                        )}
                        <Users
                          className={cn(
                            "h-4 w-4 flex-shrink-0 transition-colors",
                            pathname.startsWith("/dashboard/workspace/members") ? "text-stitch-primary" : "text-on-surface-variant group-hover:text-on-surface"
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate flex-1">Team Members</span>
                      </Link>

                      <Link
                        href="/dashboard/workspace/roles"
                        className={cn(
                          "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all relative",
                          pathname.startsWith("/dashboard/workspace/roles")
                            ? "bg-primary/15 text-stitch-primary shadow-[0_0_12px_rgba(125,211,252,0.08)]"
                            : "text-on-surface-variant hover:bg-surface-container/70 hover:text-on-surface"
                        )}
                      >
                        {pathname.startsWith("/dashboard/workspace/roles") && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-stitch-primary rounded-full" />
                        )}
                        <ShieldCheck
                          className={cn(
                            "h-4 w-4 flex-shrink-0 transition-colors",
                            pathname.startsWith("/dashboard/workspace/roles") ? "text-stitch-primary" : "text-on-surface-variant group-hover:text-on-surface"
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate flex-1">Custom Roles</span>
                      </Link>

                      <Link
                        href="/dashboard/workspace/audit"
                        className={cn(
                          "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all relative",
                          pathname.startsWith("/dashboard/workspace/audit")
                            ? "bg-primary/15 text-stitch-primary shadow-[0_0_12px_rgba(125,211,252,0.08)]"
                            : "text-on-surface-variant hover:bg-surface-container/70 hover:text-on-surface"
                        )}
                      >
                        {pathname.startsWith("/dashboard/workspace/audit") && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-stitch-primary rounded-full" />
                        )}
                        <History
                          className={cn(
                            "h-4 w-4 flex-shrink-0 transition-colors",
                            pathname.startsWith("/dashboard/workspace/audit") ? "text-stitch-primary" : "text-on-surface-variant group-hover:text-on-surface"
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate flex-1">Audit Log</span>
                      </Link>
                    </div>
                  )}
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

        {/* Platform Admin Portal Link */}
        {isPlatformAdmin && (
          <Link
            href="/admin"
            className={cn(
              "group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
              pathname.startsWith("/admin") && "ring-1 ring-amber-400"
            )}
          >
            <div className="flex items-center gap-2.5 truncate">
              <ShieldCheck className="h-4 w-4 flex-shrink-0 text-amber-400" />
              <span className="truncate">Admin Panel</span>
            </div>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-400 text-black shrink-0">
              ADMIN
            </span>
          </Link>
        )}

        {/* Support Portal Link: Highlighted Agent Operations Desk for Support Team / Admin, clean for regular users */}
        {isSupportTeam || isPlatformAdmin ? (
          <Link
            href="/dashboard/support/agent"
            className={cn(
              "group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20",
              pathname.startsWith("/dashboard/support/agent") &&
                "ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
            )}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Headphones className="h-4 w-4 flex-shrink-0 text-cyan-400" />
              <span className="truncate">Support Agent Desk</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {staffUnreadSupportCount > 0 && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse">
                  {staffUnreadSupportCount}
                </span>
              )}
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-cyan-400 text-black">
                AGENT
              </span>
            </div>
          </Link>
        ) : (
          <Link
            href="/dashboard/support"
            className={cn(
              "group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all",
              pathname === "/dashboard/support"
                ? "bg-primary/15 text-stitch-primary"
                : "text-on-surface-variant hover:bg-surface-container/70 hover:text-on-surface"
            )}
          >
            <div className="flex items-center gap-2.5 truncate">
              <LifeBuoy className="h-4 w-4 flex-shrink-0" />
              <span>Support Desk</span>
            </div>
            {unreadSupportCount > 0 && (
              <span className="flex items-center gap-1.5 ml-auto">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-red-500 text-white shadow-sm">
                  {unreadSupportCount}
                </span>
              </span>
            )}
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-on-surface-variant transition-all hover:bg-error/10 hover:text-error bg-transparent"
        >
          <LogOut className="h-4 w-4 flex-shrink-0 group-hover:text-error" />
          Logout
        </button>
      </div>
    </div>
  );
}
