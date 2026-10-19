"use client";

import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { useSectionSecurity } from "@/context/SectionSecurityContext";
import { SectionUnlockScreen } from "./SectionUnlockScreen";
import { SYSTEM_MODULES } from "@/config/modules";

interface SectionSecurityGuardProps {
  children: React.ReactNode;
}

export function SectionSecurityGuard({ children }: SectionSecurityGuardProps) {
  const pathname = usePathname();
  const { isSectionLocked, lockedSections, lockSection } = useSectionSecurity();

  // Determine section from pathname
  let sectionId: string | null = null;
  let sectionName: string = "Section";

  if (pathname) {
    if (pathname.startsWith("/dashboard/custom/")) {
      // Extract custom section slug
      const parts = pathname.split("/dashboard/custom/")[1]?.split("/");
      const slug = parts?.[0];
      if (slug && slug !== "new") {
        sectionId = slug;
        sectionName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
      }
    } else if (pathname === "/dashboard") {
      sectionId = "dashboard";
      sectionName = SYSTEM_MODULES.dashboard?.label || "Dashboard";
    } else {
      // Match against SYSTEM_MODULES dynamically (e.g. today, tasks, notes, ideas, money, routines, etc.)
      const modules = Object.values(SYSTEM_MODULES).sort((a, b) => (b.route?.length || 0) - (a.route?.length || 0));
      for (const mod of modules) {
        if (!mod.route || mod.route === "/dashboard") continue;
        if (pathname === mod.route || pathname.startsWith(mod.route + "/")) {
          sectionId = mod.id;
          sectionName = mod.label;
          break;
        }
      }
    }
  }

  // If this route corresponds to a locked section and is not unlocked in current session
  if (sectionId && isSectionLocked(sectionId)) {
    return <SectionUnlockScreen sectionId={sectionId} sectionName={sectionName} />;
  }

  // If currently unlocked and in lockedSections, display small subtle re-lock option in corner
  const isProtectedAndUnlocked = sectionId && lockedSections.includes(sectionId);

  return (
    <>
      {isProtectedAndUnlocked && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={() => lockSection(sectionId!)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-high text-xs text-on-surface-variant hover:text-stitch-primary transition-all shadow-sm"
            title="Lock this section immediately"
          >
            <Lock className="w-3.5 h-3.5 text-stitch-primary" />
            <span className="text-[11px] font-medium">Re-lock Section</span>
          </button>
        </div>
      )}
      {children}
    </>
  );
}
