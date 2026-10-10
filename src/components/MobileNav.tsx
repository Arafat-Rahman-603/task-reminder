"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, Settings, LogOut, FolderOpen, Plus, User as UserIcon, LayoutDashboard, CheckSquare, LineChart, SlidersHorizontal, Bell, Zap } from "lucide-react";
import { signOut } from "next-auth/react";
import { SYSTEM_MODULES } from "@/config/modules";
import type { NavGroup } from "./Sidebar";
import { NotificationsButton } from "./NotificationsButton";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { useLanguage } from "@/context/LanguageContext";

interface MobileNavProps {
  navGroups: NavGroup[];
  workspaces?: any[];
  activeWorkspace?: any;
  accountType?: string;
}

export function MobileNav({ navGroups = [], workspaces = [], activeWorkspace, accountType }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const close = () => setOpen(false);

  // Listen for cross-tab notification updates
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const NOTIFICATION_CHANNEL = new BroadcastChannel('manageo-notifications');
    
    const handleMessage = (event: MessageEvent) => {
      console.log('[MobileNav] Cross-tab notification update received');
      // Trigger notification refresh
      if (typeof window !== 'undefined' && (window as any).refreshNotifications) {
        (window as any).refreshNotifications();
      }
    };

    NOTIFICATION_CHANNEL.addEventListener('message', handleMessage);
    return () => NOTIFICATION_CHANNEL.removeEventListener('message', handleMessage);
  }, []);

  return (
    <>
      {/* Fixed top bar — extends bg into status bar area on notched devices */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 bg-stitch-surface/80 backdrop-blur-xl shadow-[0_1px_16px_rgba(125,211,252,0.05)]"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain drop-shadow-[0_2px_4px_rgba(125,211,252,0.4)]" />
          </div>
          <div className="flex items-center gap-2">
            <NotificationsButton />
            <button 
              onClick={() => setOpen(true)}
              aria-label="User Profile & Menu" 
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-stitch-primary transition-colors"
            >
              <Menu className="w-[24px] h-[24px]" />
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
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-surface-variant/30 shrink-0">
          <span className="font-bold text-on-surface">{t("menu", "Menu")}</span>
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
                      {t(item.label.toLowerCase().replace(/ /g, '_'), item.label)}
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
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
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
