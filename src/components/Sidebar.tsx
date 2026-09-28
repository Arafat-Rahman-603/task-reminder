"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings, LogOut, FolderOpen, Plus } from "lucide-react";
import { signOut } from "next-auth/react";
import { SYSTEM_MODULES, ModuleCategory } from "@/config/modules";

/**
 * NavItem is a pre-resolved, server-computed nav entry.
 * The server filters by (implemented && enabled) before passing these down.
 * The client NEVER re-filters — it only looks up icons.
 */
export interface NavItem {
  id: string;
  label: string;
  route: string;
  category: ModuleCategory;
}

export interface CustomSectionItem {
  _id: string;
  name: string;
  slug: string;
}

interface SidebarProps {
  navItems: NavItem[];
  customSections?: CustomSectionItem[];
}

export function Sidebar({ navItems = [], customSections = [] }: SidebarProps) {
  const pathname = usePathname();

  // Group pre-filtered items by category — no filtering, no SYSTEM_MODULES access needed
  const categoryOrder: ModuleCategory[] = ["System", "Productivity", "Money", "Personal"];
  const grouped = categoryOrder.reduce((acc, cat) => {
    acc[cat] = navItems.filter((item) => item.category === cat);
    return acc;
  }, {} as Record<ModuleCategory, NavItem[]>);

  return (
    <div className="hidden md:flex h-full w-64 flex-col bg-surface border-r border-border">
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Personal OS</h1>
      </div>

      <nav className="flex-1 space-y-6 px-4 py-4 overflow-y-auto">
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
                  // Look up icon from static registry (both server and client have same bundle)
                  const IconComponent = SYSTEM_MODULES[item.id]?.icon;
                  const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`);
                  return (
                    <Link
                      key={item.id}
                      href={item.route}
                      className={cn(
                        "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-secondary text-secondary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {IconComponent && (
                        <IconComponent
                          className={cn(
                            "mr-3 h-4 w-4 flex-shrink-0 transition-colors",
                            isActive ? "text-secondary-foreground" : "text-muted-foreground group-hover:text-foreground"
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
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={section._id}
                    href={href}
                    className={cn(
                      "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <FolderOpen
                      className={cn(
                        "mr-3 h-4 w-4 flex-shrink-0 transition-colors",
                        isActive ? "text-secondary-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                      aria-hidden="true"
                    />
                    {section.name}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </nav>

      <div className="border-t border-border p-4 space-y-0.5 shrink-0 bg-surface">
        <Link
          href="/dashboard/settings"
          className="group flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
        >
          <Settings className="mr-3 h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-foreground" />
          Settings
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="mr-3 h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-danger" />
          Logout
        </button>
      </div>
    </div>
  );
}
