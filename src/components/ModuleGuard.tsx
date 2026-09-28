import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/db";
import { ModuleDisabled } from "./ModuleDisabled";
import { SYSTEM_MODULES } from "@/config/modules";
import { redirect } from "next/navigation";

export async function ModuleGuard({ moduleId, children }: { moduleId: string, children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;
  const user = await User.findById(userId).select("preferences.modules").lean();

  const moduleDef = SYSTEM_MODULES[moduleId];
  if (!moduleDef) {
    return <>{children}</>;
  }

  const isEnabled = user?.preferences?.modules?.[moduleId] !== undefined 
    ? user.preferences.modules[moduleId] 
    : moduleDef.defaultEnabled;

  if (!isEnabled) {
    return <ModuleDisabled moduleName={moduleDef.label} />;
  }

  return <>{children}</>;
}
