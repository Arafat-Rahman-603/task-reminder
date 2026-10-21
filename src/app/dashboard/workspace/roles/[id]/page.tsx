import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";
import { getWorkspaceRoles } from "@/actions/workspaceRole.actions";
import { getWorkspaceMembers } from "@/actions/workspaceMember.actions";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Users, Check, X, Shield, Crown } from "lucide-react";
import MemberAvatar from "@/components/workspace/MemberAvatar";

export const dynamic = "force-dynamic";

export default async function RoleDetailsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const { id: roleId } = await props.params;

  const workspaceInfo = await getActiveWorkspaceInfo();
  if (!workspaceInfo || !workspaceInfo.activeWorkspace) {
    redirect("/dashboard");
  }

  const activeWorkspace = workspaceInfo.activeWorkspace;
  const [roles, members] = await Promise.all([
    getWorkspaceRoles(activeWorkspace._id),
    getWorkspaceMembers(activeWorkspace._id),
  ]);

  const role = roles.find((r: any) => r._id === roleId);

  if (!role) {
    return (
      <div className="w-full max-w-2xl mx-auto my-12 p-8 bg-stitch-surface border border-surface-variant/30 rounded-2xl text-center space-y-4">
        <h2 className="text-xl font-bold text-rose-400">Custom Role Not Found</h2>
        <p className="text-sm text-slate-400">The requested role could not be located in this workspace.</p>
        <Link href="/dashboard/workspace/roles" className="inline-block px-4 py-2 rounded-xl bg-stitch-primary text-black font-bold text-xs">
          Back to Roles
        </Link>
      </div>
    );
  }

  const assignedMembers = members.filter((m: any) => m.customRoleId === roleId);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 px-3 sm:px-6 pt-4">
      {/* Top Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/dashboard/workspace/roles" className="hover:text-stitch-primary transition-colors flex items-center gap-1.5 font-medium">
          <ArrowLeft size={14} />
          <span>Custom Roles</span>
        </Link>
        <span>/</span>
        <span className="text-on-surface font-semibold">{role.name}</span>
      </div>

      {/* Role Profile Card */}
      <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-md text-lg shrink-0"
              style={{ backgroundColor: role.color || "#38bdf8" }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-on-surface">{role.name}</h1>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                  Base Authority: {role.baseRole}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {role.description || "Custom functional role configured for this workspace."}
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/workspace/roles"
            className="px-3.5 py-1.5 rounded-xl border border-surface-variant/40 hover:bg-white/5 text-xs text-slate-300 font-medium transition-all"
          >
            Manage in Roles Tab
          </Link>
        </div>
      </div>

      {/* Permissions Breakdown Card */}
      <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-stitch-primary" />
          <h3 className="text-sm font-bold text-on-surface">Configured Module Permissions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {Object.entries(role.permissions || {}).map(([moduleKey, acts]: [string, any]) => {
            if (!acts || typeof acts !== "object") return null;
            return (
              <div key={moduleKey} className="p-3.5 rounded-xl bg-black/20 border border-white/5 space-y-2">
                <span className="text-xs font-bold text-white capitalize block">
                  {moduleKey.replace(/([A-Z])/g, " $1")} Module
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(acts).map(([actionName, enabled]) => (
                    <span
                      key={actionName}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                        enabled
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-white/5 text-slate-500 border-white/5 line-through opacity-50"
                      }`}
                    >
                      {enabled ? <Check size={11} /> : <X size={11} />}
                      <span className="capitalize">{actionName}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assigned Members Card */}
      <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-surface-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-stitch-primary" />
            <h3 className="text-sm font-bold text-on-surface">Members Assigned This Role</h3>
          </div>
          <span className="text-xs text-slate-400">
            {assignedMembers.length} {assignedMembers.length === 1 ? "member" : "members"}
          </span>
        </div>

        {assignedMembers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No team members are currently assigned the &quot;{role.name}&quot; role.
          </div>
        ) : (
          <div className="divide-y divide-surface-variant/20">
            {assignedMembers.map((m: any) => {
              const u = m.userId;
              return (
                <div key={m._id} className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <MemberAvatar
                      name={u?.name}
                      avatarPublicId={u?.avatarPublicId}
                      avatarUrl={u?.avatarUrl || u?.image}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">{u?.name || "Team Member"}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{u?.email}</p>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/workspace/members/${u?._id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-surface-variant/40 hover:bg-white/5 text-xs text-slate-300 font-medium transition-all shrink-0"
                  >
                    <span>View Performance</span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
