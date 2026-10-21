import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";
import { getSingleMemberPerformance } from "@/actions/workspaceAnalytics.actions";
import MemberDetailsClient from "./MemberDetailsClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const { id: memberUserId } = await props.params;

  const workspaceInfo = await getActiveWorkspaceInfo();
  if (!workspaceInfo || !workspaceInfo.activeWorkspace) {
    redirect("/dashboard");
  }

  const activeWorkspace = workspaceInfo.activeWorkspace;
  const res = await getSingleMemberPerformance(activeWorkspace._id, memberUserId);

  if (!res.success || !res.data) {
    return (
      <div className="w-full max-w-3xl mx-auto p-8 text-center space-y-4 my-12 bg-stitch-surface border border-surface-variant/30 rounded-2xl">
        <h2 className="text-xl font-bold text-rose-400">Member Not Found</h2>
        <p className="text-sm text-slate-400">{res.error || "Unable to load performance details for this team member."}</p>
        <div className="pt-2">
          <Link 
            href="/dashboard/settings?tab=workspace&subtab=performance"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stitch-primary text-black font-bold text-xs shadow-sm hover:opacity-90 transition-opacity"
          >
            <ArrowLeft size={14} />
            <span>Back to Team Performance</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <MemberDetailsClient
      member={res.data.member}
      workspaceName={res.data.workspaceName}
      workspaceId={activeWorkspace._id}
      joinedAt={res.data.joinedAt}
      status={res.data.status}
      permissions={res.data.permissions}
      permissionSource={res.data.permissionSource}
    />
  );
}
