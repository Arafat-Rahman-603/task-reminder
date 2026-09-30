"use server";

import dbConnect from "@/lib/db";
import NavigationGroup from "@/models/NavigationGroup";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SYSTEM_MODULES } from "@/config/modules";
import { getCustomSections } from "./customSection.actions";

export async function getResolvedNavigation(userModulesMap: Record<string, boolean>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized", groups: [] };
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    let groups = await NavigationGroup.find({ userId }).sort({ sortOrder: 1 }).lean();
    const { sections } = await getCustomSections();

    // If user has no groups, generate default ones based on categories + custom sections
    if (!groups || groups.length === 0) {
      const defaultGroups: any[] = [
        { name: 'System', items: [] },
        { name: 'Productivity', items: [] },
        { name: 'Money', items: [] },
        { name: 'Personal', items: [] },
        { name: 'My Sections', items: [] }
      ];

      // Add modules
      Object.values(SYSTEM_MODULES).forEach(mod => {
        if (!mod.implemented) return;
        const userPref = userModulesMap[mod.id];
        const isEnabled = userPref !== undefined ? userPref : mod.defaultEnabled;
        if (!isEnabled) return;
        
        const group = defaultGroups.find(g => g.name === mod.category);
        if (group) {
          group.items.push({
            id: mod.id,
            type: 'module',
            label: mod.label,
            href: mod.route,
            isHidden: false
          });
        }
      });

      // Add custom sections
      if (sections) {
        sections.forEach((sec: any) => {
          const groupName = sec.group || 'My Sections';
          let group = defaultGroups.find(g => g.name === groupName);
          if (!group) {
            group = { name: groupName, items: [] };
            defaultGroups.push(group);
          }
          group.items.push({
            id: sec.slug,
            type: 'custom',
            label: sec.name,
            href: `/dashboard/custom/${sec.slug}`,
            isHidden: false
          });
        });
      }

      // Filter out empty groups
      const resolvedGroups = defaultGroups.filter(g => g.items.length > 0).map((g, i) => ({
        _id: `default-${i}`,
        name: g.name,
        isCollapsed: false,
        items: g.items
      }));

      return { success: true, groups: JSON.parse(JSON.stringify(resolvedGroups)) };
    }

    // Process user-defined groups (hydrate URLs and filter disabled modules)
    const hydratedGroups = groups.map((g: any) => {
      const activeItems = g.items.map((item: any) => {
        if (item.type === 'module') {
          const mod = SYSTEM_MODULES[item.id];
          if (!mod || !mod.implemented) return null;
          const userPref = userModulesMap[mod.id];
          const isEnabled = userPref !== undefined ? userPref : mod.defaultEnabled;
          if (!isEnabled) return null;
          return { ...item, label: item.label || mod.label, href: mod.route };
        } else if (item.type === 'custom') {
          const sec = sections?.find((s: any) => s.slug === item.id);
          if (!sec) return null;
          return { ...item, label: item.label || sec.name, href: `/dashboard/custom/${sec.slug}` };
        }
        return item; // links remain as is
      }).filter(Boolean);

      return {
        ...g,
        _id: g._id.toString(),
        items: activeItems
      };
    });

    return { success: true, groups: JSON.parse(JSON.stringify(hydratedGroups.filter((g: any) => g.items.length > 0))) };

  } catch (error) {
    console.error("Failed to resolve navigation:", error);
    return { success: false, error: "Failed to resolve navigation", groups: [] };
  }
}
