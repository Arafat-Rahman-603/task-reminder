"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, Settings, LogOut, FolderOpen, Plus } from "lucide-react";
import { signOut } from "next-auth/react";
import { SYSTEM_MODULES, ModuleCategory } from "@/config/modules";
import type { NavItem, CustomSectionItem } from "./Sidebar";

interface MobileNavProps {
  navItems: NavItem[];
  customSections?: CustomSectionItem[];
}

export function MobileNav({ navItems = [], customSections = [] }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const categoryOrder: ModuleCategory[] = ["System", "Productivity", "Money", "Personal"];
  const grouped = categoryOrder.reduce((acc, cat) => {
    acc[cat] = navItems.filter((item) => item.category === cat);
    return acc;
  }, {} as Record<ModuleCategory, NavItem[]>);

  const close = () => setOpen(false);

  return (
    <>
      {/* Fixed top bar — mobile only */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4 bg-surface border-b border-border">
        <span className="font-bold text-foreground">Personal OS</span>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Slide-in drawer */}
      <div
        className={cn(
          "md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col bg-surface border-r border-border transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
          <span className="font-bold text-foreground">Personal OS</span>
          <button
            onClick={close}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {categoryOrder.map((cat) => {
            const items = grouped[cat];
            if (!items || items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                  {cat}
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const IconComponent = SYSTEM_MODULES[item.id]?.icon;
                    const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`);
                    return (
                      <Link
                        key={item.id}
                        href={item.route}
                        onClick={close}
                        className={cn(
                          "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                          isActive
                            ? "bg-secondary text-secondary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {IconComponent && (
                          <IconComponent
                            className={cn(
                              "mr-3 h-4 w-4 flex-shrink-0",
                              isActive ? "text-secondary-foreground" : "text-muted-foreground"
                            )}
                            aria-hidden="true"
                          />
                        )}
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Custom Sections */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3 flex justify-between items-center">
              My Sections
              <Link
                href="/dashboard/custom/new"
                onClick={close}
                className="hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                title="New Section"
              >
                <Plus className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-0.5">
              {customSections.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground italic">No custom sections.</p>
              ) : (
                customSections.map((section) => {
                  const href = `/dashboard/custom/${section.slug}`;
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={section._id}
                      href={href}
                      onClick={close}
                      className={cn(
                        "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-secondary text-secondary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <FolderOpen className="mr-3 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      {section.name}
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </nav>

        <div className="border-t border-border p-4 space-y-0.5 shrink-0">
          <Link
            href="/dashboard/settings"
            onClick={close}
            className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <Settings className="mr-3 h-4 w-4 flex-shrink-0" />
            Settings
          </Link>
          <button
            onClick={() => { close(); signOut({ callbackUrl: "/" }); }}
            className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-danger/10 hover:text-danger transition-all"
          >
            <LogOut className="mr-3 h-4 w-4 flex-shrink-0" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
