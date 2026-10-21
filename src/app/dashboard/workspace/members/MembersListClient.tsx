"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  BarChart3, 
  ShieldCheck, 
  History, 
  Search, 
  ExternalLink, 
  Crown, 
  Shield, 
  User, 
  Pause, 
  UserCheck, 
  Plus, 
  SlidersHorizontal,
  Mail,
  ArrowRight
} from "lucide-react";

interface MembersListClientProps {
  workspace: any;
  initialMembers: any[];
  customRoles: any[];
  isOwnerOrAdmin: boolean;
}

export default function MembersListClient({
  workspace,
  initialMembers,
  customRoles,
  isOwnerOrAdmin
}: MembersListClientProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredMembers = initialMembers.filter((m) => {
    const user = m.userId || {};
    const name = (user.name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const q = search.toLowerCase();

    const matchesSearch = !q || name.includes(q) || email.includes(q);

    if (!matchesSearch) return false;

    if (roleFilter === "all") return true;
    if (roleFilter === "owner") return m.role === "owner";
    if (roleFilter === "admin") return m.role === "admin";
    if (roleFilter === "member") return m.role === "member";
    if (roleFilter === "viewer") return m.role === "viewer";
    if (roleFilter === "custom") return !!m.customRoleId;
    if (roleFilter === "suspended") return m.status === "suspended";

    return true;
  });

  const totalMembers = initialMembers.length;
  const activeMembers = initialMembers.filter(m => m.status !== "suspended").length;
  const adminCount = initialMembers.filter(m => m.role === "admin" || m.role === "owner").length;
  const customRoleAssignedCount = initialMembers.filter(m => !!m.customRoleId).length;

  return (
    <div className="space-y-6">
      {/* Header Navigation & Options Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-variant/30 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/dashboard/settings?tab=workspace" className="hover:text-stitch-primary transition-colors font-medium">
              Workspace Settings
            </Link>
            <span>/</span>
            <span className="text-on-surface font-semibold">Team Members</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-headline text-on-surface">
            Team Members & Access
          </h1>
        </div>

        {/* Option Navigation Bar */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
          <Link
            href="/dashboard/workspace/members"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stitch-primary text-black shadow-sm"
          >
            <Users size={13} />
            <span>Members</span>
          </Link>
          <Link
            href="/dashboard/workspace/performance"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <BarChart3 size={13} />
            <span>Performance</span>
          </Link>
          <Link
            href="/dashboard/workspace/roles"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ShieldCheck size={13} />
            <span>Custom Roles</span>
          </Link>
          <Link
            href="/dashboard/workspace/audit"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <History size={13} />
            <span>Audit Log</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="rounded-2xl bg-surface-container/60 border border-surface-variant/30 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Total Roster</span>
          <div className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold font-headline text-white">
            {totalMembers}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">Workspace team members</span>
        </div>

        <div className="rounded-2xl bg-surface-container/60 border border-surface-variant/30 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Active Members</span>
          <div className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold font-headline text-emerald-400">
            {activeMembers}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">Full collaborative access</span>
        </div>

        <div className="rounded-2xl bg-surface-container/60 border border-surface-variant/30 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Leadership Tier</span>
          <div className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold font-headline text-stitch-primary">
            {adminCount}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">Owners and Administrators</span>
        </div>

        <div className="rounded-2xl bg-surface-container/60 border border-surface-variant/30 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Custom Roles</span>
          <div className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold font-headline text-purple-400">
            {customRoleAssignedCount}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">Tailored permission profiles</span>
        </div>
      </div>

      {/* Search, Filter & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members by name or email..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-black/20 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-stitch-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 bg-black/20 border border-white/10 text-slate-300 text-xs rounded-xl outline-none focus:border-stitch-primary shrink-0"
          >
            <option value="all" className="bg-neutral-900">All Roles</option>
            <option value="owner" className="bg-neutral-900">Owners</option>
            <option value="admin" className="bg-neutral-900">Admins</option>
            <option value="member" className="bg-neutral-900">Standard Members</option>
            <option value="viewer" className="bg-neutral-900">Viewers</option>
            <option value="custom" className="bg-neutral-900">Custom Role Assigned</option>
            <option value="suspended" className="bg-neutral-900">Suspended</option>
          </select>

          {isOwnerOrAdmin && (
            <Link
              href="/dashboard/settings?tab=workspace&subtab=members"
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-stitch-primary text-black font-semibold text-xs hover:bg-stitch-primary/90 transition-all shrink-0"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Invite Member</span>
              <span className="sm:hidden">Invite</span>
            </Link>
          )}
        </div>
      </div>

      {/* Members Cards Roster */}
      <div className="bg-stitch-surface border border-surface-variant/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-surface-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-stitch-primary" />
            <h3 className="text-sm font-bold text-on-surface">Active Workspace Roster</h3>
          </div>
          <span className="text-xs text-slate-400">
            Showing {filteredMembers.length} of {totalMembers} members
          </span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <p>No team members matched the selected search or filter criteria.</p>
            {(search || roleFilter !== "all") && (
              <button
                onClick={() => { setSearch(""); setRoleFilter("all"); }}
                className="text-stitch-primary hover:underline font-semibold"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-surface-variant/20">
            {filteredMembers.map((member) => {
              const user = member.userId || {};
              const targetUserId = user._id || member.userId;
              const isOwner = member.role === "owner";
              const isSuspended = member.status === "suspended";
              const avatarSrc = user.avatarPublicId
                ? `/api/assets/${user.avatarPublicId}?resourceType=image`
                : user.avatarUrl || user.image || member.avatarUrl || member.image || null;

              return (
                <div
                  key={member._id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors ${
                    isSuspended ? "opacity-60 bg-amber-500/[0.02]" : ""
                  }`}
                >
                  {/* User Profile */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-stitch-surface-container flex items-center justify-center text-stitch-primary border border-white/10 shrink-0 overflow-hidden relative shadow-inner">
                      {avatarSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarSrc}
                          alt={user.name || "Member"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold uppercase">
                          {(user.name || "TM").substring(0, 2)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/dashboard/workspace/members/${targetUserId}`}
                          className="font-bold text-xs sm:text-sm text-white hover:text-stitch-primary transition-colors truncate"
                        >
                          {user.name || "Team Member"}
                        </Link>

                        {isOwner && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            <Crown size={10} /> Owner
                          </span>
                        )}
                        {member.customRoleName && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                            <ShieldCheck size={10} /> {member.customRoleName}
                          </span>
                        )}
                        {!isOwner && !member.customRoleName && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md capitalize">
                            <Shield size={10} /> {member.role}
                          </span>
                        )}
                        {isSuspended && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            <Pause size={9} /> Suspended
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 truncate">
                        {user.email || "No email available"}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Link
                      href={`/dashboard/workspace/members/${targetUserId}`}
                      className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 rounded-xl bg-stitch-primary text-black font-bold text-xs hover:bg-stitch-primary/90 transition-all shadow-sm"
                    >
                      <span>Details & KPIs</span>
                      <ArrowRight size={13} />
                    </Link>

                    {isOwnerOrAdmin && (
                      <Link
                        href={`/dashboard/settings?tab=workspace&subtab=members`}
                        className="inline-flex items-center gap-1 h-8 sm:h-9 px-2.5 rounded-xl border border-surface-variant/40 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                        title="Manage Role & Access"
                      >
                        <SlidersHorizontal size={13} />
                        <span className="hidden md:inline">Manage</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
