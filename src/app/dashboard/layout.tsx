import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar, NavItem } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { getCustomSections } from "@/actions/customSection.actions";
import { CommandMenu } from "@/components/CommandMenu";
import User from "@/models/User";
import dbConnect from "@/lib/db";
import { SYSTEM_MODULES, ModuleCategory } from "@/config/modules";

/**
 * Compute the navigation item list entirely on the server.
 * The client receives a plain, serializable array — no filtering happens client-side.
 * This eliminates the server/client divergence that caused hydration mismatches.
 */
function buildNavItems(userModulesMap: Record<string, boolean>): NavItem[] {
  return Object.values(SYSTEM_MODULES)
    .filter((mod) => {
      if (!mod.implemented) return false;
      const userPref = userModulesMap[mod.id];
      // If user has an explicit preference use it, otherwise fall back to defaultEnabled
      return userPref !== undefined ? userPref : mod.defaultEnabled;
    })
    .map((mod) => ({
      id: mod.id,
      label: mod.label,
      route: mod.route,
      category: mod.category as ModuleCategory,
    }));
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;
  const user = await User.findById(userId);

  if (!user?.preferences?.currency) {
    redirect("/onboarding");
  }

  // Serialize Mongoose Map → plain object
  const userModulesMap: Record<string, boolean> =
    user?.preferences?.modules instanceof Map
      ? Object.fromEntries(user.preferences.modules as Map<string, boolean>)
      : (user?.preferences?.modules as Record<string, boolean>) || {};

  // Server-side nav computation — never repeated on client
  const navItems = buildNavItems(userModulesMap);

  const { sections } = await getCustomSections();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <CommandMenu userModules={userModulesMap} />
      {/* Desktop sidebar */}
      <Sidebar navItems={navItems} customSections={sections} />
      {/* Mobile nav drawer + fixed top bar */}
      <MobileNav navItems={navItems} customSections={sections} />
      <main className="flex-1 overflow-y-auto">
        {/* pt accounts for mobile fixed top bar (h-14); md resets it */}
        <div className="mx-auto max-w-7xl px-4 pt-18 pb-8 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
