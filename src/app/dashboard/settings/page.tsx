import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getCustomSections } from "@/actions/customSection.actions";
import { getResolvedNavigation } from "@/actions/navigation.actions";
import { sanitizeUserForClient } from "@/lib/sanitize-preferences";

import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage(props: {
  searchParams?: Promise<{ tab?: string; subtab?: string }>;
}) {
  const session = await getServerSession(authOptions);
  // Layout already protects this route, but just in case:
  if (!session || !session.user) {
    return <div className="p-4 text-on-surface">Please log in to view settings.</div>;
  }

  const searchParams = (await props.searchParams) || {};
  const initialTab = searchParams.tab || "personalization";
  const initialSubTab = searchParams.subtab;

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

  const safeUser = sanitizeUserForClient(user) || {};

  return (
    <div className="w-full min-w-0 min-h-full">
      <SettingsClient 
        user={safeUser}
        initialModules={userModulesMap}
        customSections={sections ? JSON.parse(JSON.stringify(sections)) : []}
        navGroups={groups ? JSON.parse(JSON.stringify(groups)) : []}
        activeWorkspace={workspaceInfo?.activeWorkspace}
        initialTab={initialTab}
        initialSubTab={initialSubTab}
      />
    </div>
  );
}
