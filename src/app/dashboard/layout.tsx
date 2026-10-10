import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { getResolvedNavigation } from "@/actions/navigation.actions";
import { CommandMenu } from "@/components/CommandMenu";
import { ForceLogout } from "@/components/ForceLogout";
import User from "@/models/User";
import dbConnect from "@/lib/db";

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

  if (!user) {
    return <ForceLogout />;
  }

  // Serialize Mongoose Map → plain object
  let userModulesMap: Record<string, boolean> = {};
  if (user?.preferences?.modules) {
    userModulesMap = JSON.parse(JSON.stringify(user.preferences.modules));
  }

  // Server-side nav computation — dynamically builds user groups
  const { groups } = await getResolvedNavigation(userModulesMap);

  const { getActiveWorkspaceInfo } = await import("@/actions/workspace.actions");
  const workspaceInfo = await getActiveWorkspaceInfo();
  const workspaces = workspaceInfo?.workspaces || [];
  const activeWorkspace = workspaceInfo?.activeWorkspace;

  const accountType = (session.user as any).accountType || "individual";

  return (
    // Use 100dvh so mobile browser chrome collapse/expand doesn't break layout
    // overflow-hidden on container + overflow-y-auto on main = one predictable scroll surface
    <div className="flex w-full overflow-hidden bg-stitch-background text-on-surface font-sans selection:bg-stitch-primary/20 selection:text-stitch-primary" style={{ height: "100dvh" }}>
      <CommandMenu userModules={userModulesMap} />
      {/* Desktop sidebar */}
      <Sidebar navGroups={groups || []} workspaces={workspaces} activeWorkspace={activeWorkspace} accountType={accountType} />
      {/* Mobile nav drawer + fixed top bar & bottom bar */}
      <MobileNav navGroups={groups || []} workspaces={workspaces} activeWorkspace={activeWorkspace} accountType={accountType} />
      <main
        className="flex-1 overflow-y-auto overscroll-contain"
        // overscroll-contain prevents scroll chaining to the window on iOS
      >
        {/* Top safe-area spacer (mobile only) — pushes content below fixed header + notch */}
        <div
          className="md:hidden shrink-0"
          style={{ height: "calc(4rem + env(safe-area-inset-top, 0px))" }}
          aria-hidden="true"
        />
        <div className="mx-auto max-w-7xl pt-4 pb-4 px-4 md:px-8 md:pt-8 md:pb-8">
          {children}
        </div>
        {/* Bottom safe-area spacer (mobile only) — pushes content above fixed bottom bar + home indicator */}
        <div
          className="md:hidden shrink-0"
          style={{ height: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
          aria-hidden="true"
        />
      </main>
    </div>
  );
}
