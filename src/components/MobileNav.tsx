"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, Settings, LogOut, FolderOpen, Plus, User as UserIcon, LayoutDashboard, CheckSquare, LineChart, SlidersHorizontal, Bell, Zap, Lock, LifeBuoy, ShieldCheck, Headphones } from "lucide-react";
import { signOut } from "next-auth/react";
import { SYSTEM_MODULES } from "@/config/modules";
import type { NavGroup } from "./Sidebar";
import { NotificationsButton } from "./NotificationsButton";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { useSectionSecurity } from "@/context/SectionSecurityContext";

interface MobileNavProps {
  navGroups: NavGroup[];
  workspaces?: any[];
  activeWorkspace?: any;
  accountType?: string;
  isPlatformAdmin?: boolean;
  isSupportTeam?: boolean;
  unreadSupportCount?: number;
  staffUnreadSupportCount?: number;
}

export function MobileNav({
  navGroups = [],
  workspaces = [],
  activeWorkspace,
  accountType,
  isPlatformAdmin = false,
  isSupportTeam = false,
  unreadSupportCount = 0,
  staffUnreadSupportCount = 0,
}: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const { lockedSections, isSectionLocked } = useSectionSecurity();

  const close = () => setOpen(false);

  return (
    <>
      {/* Fixed top bar — extends bg into status bar area on notched devices */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 bg-stitch-surface/80 backdrop-blur-xl shadow-[0_1px_16px_rgba(125,211,252,0.05)]"
        style={{ paddingTop: "var(--safe-area-top, env(safe-area-inset-top, 0px))" }}
      >
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center py-1 group">
              <img 
                src="/logo.png" 
                alt="Manageo" 
                className="h-[38px] w-auto max-w-[150px] object-contain drop-shadow-[0_2px_8px_rgba(125,211,252,0.3)] transition-transform duration-200 group-hover:scale-105" 
              />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsButton />
            <button 
              onClick={() => setOpen(true)}
              aria-label="User Profile & Menu" 
              className="relative w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-stitch-primary transition-colors"
            >
              <Menu className="w-[24px] h-[24px]" />
              {(unreadSupportCount > 0 || staffUnreadSupportCount > 0) && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-stitch-surface animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Slide-in drawer — fills full screen height including safe areas */}
      <div
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-stitch-surface border-r border-surface-variant/30 transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          paddingTop: "var(--safe-area-top, env(safe-area-inset-top, 0px))",
          paddingBottom: "var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-surface-variant/30 shrink-0">
          <Link href="/dashboard" onClick={close} className="flex items-center py-1">
            <img 
              src="/logo.png" 
              alt="Manageo" 
              className="h-[38px] w-auto max-w-[150px] object-contain drop-shadow-[0_2px_8px_rgba(125,211,252,0.25)]" 
            />
          </Link>
          <button
            onClick={close}
            className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 py-3 border-b border-surface-variant/30">
          <WorkspaceSwitcher workspaces={workspaces} activeWorkspace={activeWorkspace} align="left" accountType={accountType} />
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group._id}>
              <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 px-3 flex justify-between items-center">
                {t(group.name.toLowerCase().replace(/ /g, '_'), group.name)}
                {group.name === "My Sections" && (
                  <Link
                    href="/dashboard/custom/new"
                    onClick={close}
                    className="hover:text-on-surface transition-colors p-1 rounded hover:bg-surface-variant/40"
                    title="New Section"
                  >
                    <Plus className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <div className="space-y-0.5">
                {group.items.filter(i => !i.isHidden).map((item) => {
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
                      onClick={close}
                      className={cn(
                        "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-stitch-primary text-on-primary"
                          : "text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface"
                      )}
                    >
                      {IconComponent && (
                        <IconComponent
                          className={cn(
                            "mr-3 h-4 w-4 flex-shrink-0",
                            isActive ? "text-on-primary" : "text-on-surface-variant"
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
                              isActive ? "text-on-primary" : (isCurrentlyLocked ? "text-stitch-primary" : "text-on-surface-variant/40")
                            )}
                          />
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-surface-variant/30 p-4 space-y-0.5 shrink-0">
          <Link
            href="/dashboard/profile"
            onClick={close}
            className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface transition-all"
          >
            <UserIcon className="mr-3 h-4 w-4 flex-shrink-0" />
            {t("profile", "Profile")}
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={close}
            className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface transition-all"
          >
            <Settings className="mr-3 h-4 w-4 flex-shrink-0" />
            {t("settings", "Settings")}
          </Link>

          {/* Platform Admin Portal Link */}
          {isPlatformAdmin && (
            <Link
              href="/admin"
              onClick={close}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
            >
              <div className="flex items-center">
                <ShieldCheck className="mr-3 h-4 w-4 flex-shrink-0 text-amber-400" />
                <span>Admin Panel</span>
              </div>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-400 text-black">
                ADMIN
              </span>
            </Link>
          )}

          {/* Support Portal Link */}
          {isSupportTeam || isPlatformAdmin ? (
            <Link
              href="/dashboard/support/agent"
              onClick={close}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
            >
              <div className="flex items-center">
                <Headphones className="mr-3 h-4 w-4 flex-shrink-0 text-cyan-400" />
                <span>Support Agent Desk</span>
              </div>
              <div className="flex items-center gap-1.5">
                {staffUnreadSupportCount > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-pulse shadow-sm shadow-rose-500/50">
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
              onClick={close}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface transition-all"
            >
              <div className="flex items-center">
                <LifeBuoy className="mr-3 h-4 w-4 flex-shrink-0" />
                <span>Support Desk</span>
              </div>
              {unreadSupportCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping inline-block" />
                  <span className="flex items-center justify-center min-w-[20px] h-[18px] px-1.5 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-sm shadow-rose-500/50">
                    {unreadSupportCount}
                  </span>
                </div>
              )}
            </Link>
          )}

          <button
            onClick={() => { close(); signOut({ callbackUrl: "/" }); }}
            className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-error/20 hover:text-error transition-all"
          >
            <LogOut className="mr-3 h-4 w-4 flex-shrink-0" />
            {t("logout", "Logout")}
          </button>
        </div>
      </div>
      
      {/* Fixed bottom tab bar — respects home indicator via safe-area-inset-bottom */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stitch-surface/80 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.4)] border-t border-surface-variant/30"
        style={{ paddingBottom: "var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex justify-around items-center h-16 px-2">
          <Link href="/dashboard" className={cn("flex flex-col items-center justify-center gap-1 w-16 h-12 transition-all", pathname === "/dashboard" ? "text-stitch-primary font-semibold" : "text-on-surface-variant hover:text-on-surface")}>
            <LayoutDashboard className="w-[22px] h-[22px]" />
            <span className="text-[10px] tracking-tight">{t('overview', 'Overview')}</span>
          </Link>
          <Link href="/dashboard/tasks" className={cn("flex flex-col items-center justify-center gap-1 w-16 h-12 transition-all", pathname.startsWith("/dashboard/tasks") ? "text-stitch-primary font-semibold" : "text-on-surface-variant hover:text-on-surface")}>
            <CheckSquare className="w-[22px] h-[22px]" />
            <span className="text-[10px] tracking-tight">{t('tasks', 'Tasks')}</span>
          </Link>
          <Link href="/dashboard/ideas" className={cn("flex flex-col items-center justify-center gap-1 w-16 h-12 transition-all", pathname.startsWith("/dashboard/ideas") ? "text-stitch-primary font-semibold" : "text-on-surface-variant hover:text-on-surface")}>
            <Zap className="w-[22px] h-[22px]" />
            <span className="text-[10px] tracking-tight">{t('ideas', 'Ideas')}</span>
          </Link>
          <Link href="/dashboard/settings" className={cn("flex flex-col items-center justify-center gap-1 w-16 h-12 transition-all", pathname.startsWith("/dashboard/settings") ? "text-stitch-primary font-semibold" : "text-on-surface-variant hover:text-on-surface")}>
            <SlidersHorizontal className="w-[22px] h-[22px]" />
            <span className="text-[10px] tracking-tight">{t('settings', 'Settings')}</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
