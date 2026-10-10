import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getCustomSections } from "@/actions/customSection.actions";
import { getResolvedNavigation } from "@/actions/navigation.actions";
import { SYSTEM_MODULES } from "@/config/modules";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  // Layout already protects this route, but just in case:
  if (!session || !session.user) {
    return <div className="p-4 text-on-surface">Please log in to view settings.</div>;
  }

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;
  const user = await User.findById(userId).lean();

  if (!user) {
    return <div className="p-4 text-on-surface">User not found.</div>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userModulesMap = (user.preferences as any)?.modules ? JSON.parse(JSON.stringify((user.preferences as any).modules)) : {};

  const [{ sections }, { groups }, workspaceInfo] = await Promise.all([
    getCustomSections(true),
    getResolvedNavigation(userModulesMap),
    import('@/actions/workspace.actions').then(m => m.getActiveWorkspaceInfo())
  ]);

  return (
    <div className="w-full min-h-full px-4 pt-4">
      <SettingsClient 
        user={JSON.parse(JSON.stringify(user))}
        initialModules={userModulesMap}
        customSections={sections ? JSON.parse(JSON.stringify(sections)) : []}
        navGroups={groups ? JSON.parse(JSON.stringify(groups)) : []}
        activeWorkspace={workspaceInfo?.activeWorkspace}
      />
    </div>
  );
}
