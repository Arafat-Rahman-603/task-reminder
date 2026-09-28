import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getCustomSections } from "@/actions/customSection.actions";
import { getResolvedNavigation } from "@/actions/navigation.actions";
import { SYSTEM_MODULES } from "@/config/modules";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;
  const user = await User.findById(userId).lean();

  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userModulesMap = (user.preferences as any)?.modules ? JSON.parse(JSON.stringify((user.preferences as any).modules)) : {};

  const [{ sections }, { groups }] = await Promise.all([
    getCustomSections(),
    getResolvedNavigation(userModulesMap)
  ]);

  return (
    <div className="w-full min-h-full px-4 pt-4">
      <SettingsClient 
        user={JSON.parse(JSON.stringify(user))}
        initialModules={userModulesMap}
        customSections={sections}
        navGroups={groups}
      />
    </div>
  );
}
