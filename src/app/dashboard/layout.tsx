import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { getResolvedNavigation } from "@/actions/navigation.actions";
import { CommandMenu } from "@/components/CommandMenu";
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

  if (!user?.preferences?.currency) {
    redirect("/onboarding");
  }

  // Serialize Mongoose Map → plain object
  let userModulesMap: Record<string, boolean> = {};
  if (user?.preferences?.modules) {
    userModulesMap = JSON.parse(JSON.stringify(user.preferences.modules));
  }

  // Server-side nav computation — dynamically builds user groups
  const { groups } = await getResolvedNavigation(userModulesMap);

  return (
    <div className="flex h-screen overflow-hidden bg-stitch-background text-on-surface font-sans selection:bg-stitch-primary/20 selection:text-stitch-primary">
      <CommandMenu userModules={userModulesMap} />
      {/* Desktop sidebar */}
      <Sidebar navGroups={groups || []} />
      {/* Mobile nav drawer + fixed top bar & bottom bar */}
      <MobileNav navGroups={groups || []} />
      <main className="flex-1 overflow-y-auto">
        <div className="md:hidden h-16 w-full pt-[env(safe-area-inset-top,0px)] shrink-0" aria-hidden="true" />
        <div className="mx-auto max-w-7xl pt-4 pb-4 px-4 md:px-8 md:pt-8 md:pb-8 min-h-full">
          {children}
        </div>
        <div className="md:hidden h-16 w-full pb-[env(safe-area-inset-bottom,0px)] shrink-0" aria-hidden="true" />
      </main>
    </div>
  );
}
