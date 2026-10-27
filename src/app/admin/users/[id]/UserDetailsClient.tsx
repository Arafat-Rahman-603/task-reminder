"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AdminAny = any;

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserCheck,
  UserX,
  Mail,
  Building2,
  Crown,
  Trash2,
  CheckCircle2,
  Clock,
  Send,
  Check,
  ExternalLink,
} from "lucide-react";
import {
  togglePlatformAdmin,
  updateUserPlan,
  deleteUserAccount,
  sendDirectUserMessage,
  updateUpgradeRequestStatus,
} from "@/actions/admin.actions";
import { formatDate } from "@/lib/dateUtils";

export default function UserDetailsClient({ initialData }: { initialData: AdminAny }) {
  const router = useRouter();
  
  const [data, setData] = useState(initialData);
  const [selectedPlan, setSelectedPlan] = useState(data.user.subscription?.plan || "free");
  const [validityDays, setValidityDays] = useState(30);
  const [planUpdating, setPlanUpdating] = useState(false);

  // Direct Message Modal State
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [msgSubject, setMsgSubject] = useState(`Notice from Platform Administration`);
  const [msgBody, setMsgBody] = useState("");
  const [sendEmailFlag, setSendEmailFlag] = useState(true);
  const [sendNotifFlag, setSendNotifFlag] = useState(true);
  const [msgSending, setMsgSending] = useState(false);

  // Feedback Banner
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const [now] = useState(() => Date.now());

  const user = data.user;
  const currentPlan = user.subscription?.plan || "free";
  const currentStatus = user.subscription?.status || "active";
  const periodEnd = user.subscription?.currentPeriodEnd
    ? new Date(user.subscription.currentPeriodEnd)
    : null;

  // Format expiry
  const formatPeriodEnd = () => {
    if (currentPlan === "free") return "Lifetime Access (Free Tier)";
    if (!periodEnd) return "Active • Monthly Cycle (No fixed expiration)";
    const diffDays = Math.ceil((periodEnd.getTime() - now) / (1000 * 60 * 60 * 24));
    const formatted = periodEnd.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    if (diffDays <= 0) return `Expired on ${formatted}`;
    return `Valid until ${formatted} (${diffDays} days remaining)`;
  };

  const handleApplyPlan = async () => {
    setPlanUpdating(true);
    try {
      await updateUserPlan(user._id, selectedPlan, validityDays);
      const newExpiry =
        selectedPlan === "free"
          ? null
          : new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();

      setData((prev: AdminAny) => ({
        ...prev,
        user: {
          ...prev.user,
          subscription: {
            ...prev.user.subscription,
            plan: selectedPlan,
            status: "active",
            currentPeriodEnd: newExpiry,
          },
        },
      }));
      showFeedback("success", `User plan updated to ${selectedPlan.toUpperCase()} successfully.`);
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)) || "Failed to update plan");
    } finally {
      setPlanUpdating(false);
    }
  };

  const handleToggleAdmin = async () => {
    const isCurrentlyAdmin = user.isPlatformAdmin;
    const action = isCurrentlyAdmin ? "revoke admin access from" : "grant platform admin to";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      await togglePlatformAdmin(user._id, !isCurrentlyAdmin);
      setData((prev: AdminAny) => ({
        ...prev,
        user: { ...prev.user, isPlatformAdmin: !isCurrentlyAdmin },
      }));
      showFeedback(
        "success",
        `Platform admin role ${!isCurrentlyAdmin ? "granted" : "revoked"} successfully.`
      );
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)) || "Failed to toggle admin role");
    }
  };

  const handleDeleteUser = async () => {
    if (
      !confirm(
        `DANGER: Are you sure you want to delete ${user.name} (${user.email})? All associated personal workspaces and data will be permanently wiped.`
      )
    )
      return;

    try {
      await deleteUserAccount(user._id);
      alert("User account has been permanently deleted.");
      router.push("/admin");
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)) || "Failed to delete user");
    }
  };

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgSubject || !msgBody) {
      showFeedback("error", "Subject and message are required.");
      return;
    }
    setMsgSending(true);
    try {
      const res = await sendDirectUserMessage({
        userId: user._id,
        subject: msgSubject,
        message: msgBody,
        sendEmailToUser: sendEmailFlag,
        sendNotificationToUser: sendNotifFlag,
      });
      showFeedback(
        "success",
        `Message dispatched to ${user.email} (Email: ${res.emailSent ? "Delivered" : "Skipped"}, Notification: ${res.notificationCreated ? "Created" : "Skipped"}).`
      );
      setIsMessageModalOpen(false);
      setMsgBody("");
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)) || "Failed to send message");
    } finally {
      setMsgSending(false);
    }
  };

  const handleUpgradeRequestAction = async (
    reqId: string,
    status: "approved" | "rejected"
  ) => {
    if (!confirm(`Are you sure you want to mark this upgrade request as ${status}?`)) return;
    try {
      await updateUpgradeRequestStatus(reqId, status);
      setData((prev: AdminAny) => ({
        ...prev,
        upgradeRequests: prev.upgradeRequests.map((r: AdminAny) =>
          r._id === reqId ? { ...r, status } : r
        ),
      }));
      showFeedback("success", `Upgrade request ${status} successfully.`);
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? (err instanceof Error ? err.message : String(err)) : String(err)) || "Failed to update upgrade request");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-variant">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-stitch-primary" />
          <span>Back to Platform Admin Overview</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">User ID: {user._id}</span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-sm font-medium flex items-center justify-between transition-all backdrop-blur-md ${
            feedback.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/15 border-red-500/30 text-red-300"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* User Hero Card */}
      <div className="p-6 rounded-3xl bg-surface border border-surface-variant shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-stitch-primary/10 border border-stitch-primary/30 flex items-center justify-center text-stitch-primary text-2xl font-bold shadow-[0_0_20px_rgba(125,211,252,0.2)] shrink-0">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              user.name?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{user.name}</h1>
              {user.isPlatformAdmin && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stitch-primary text-black">
                  Platform Admin
                </span>
              )}
              {user.emailVerified || user.provider?.toLowerCase().includes("google") ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Unverified Email
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span>{user.email}</span>
              <span>•</span>
              <span className="capitalize">Type: {user.accountType?.replace("_", " ") || "individual"}</span>
              <span>•</span>
              <span>Auth: {user.provider || "credentials"}</span>
              <span>•</span>
              <span suppressHydrationWarning>Joined: {formatDate(user.createdAt)}</span>
            </p>
          </div>
        </div>

        {/* Quick Actions Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsMessageModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-stitch-primary/10 hover:bg-stitch-primary/20 text-stitch-primary border border-stitch-primary/30 text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Mail className="w-4 h-4" />
            <span>Send Direct Message</span>
          </button>

          <button
            onClick={handleToggleAdmin}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              user.isPlatformAdmin
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                : "bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10"
            }`}
          >
            {user.isPlatformAdmin ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            <span>{user.isPlatformAdmin ? "Revoke Admin" : "Grant Admin"}</span>
          </button>

          <button
            onClick={handleDeleteUser}
            className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
            title="Permanently Delete User"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subscription & Validity Control Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-surface border border-surface-variant space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Crown className="w-4 h-4 text-stitch-primary" />
              <span>Current Subscription</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-stitch-primary/15 text-stitch-primary border border-stitch-primary/30 whitespace-nowrap">
              {currentPlan}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Status:</span>
              <span className="font-semibold text-emerald-400 capitalize">{currentStatus}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Validity & Cycle:</span>
              <span className="font-mono text-white text-right">{formatPeriodEnd()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Timezone:</span>
              <span className="font-mono text-slate-200">{user.preferences?.timezone || "UTC"}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Currency:</span>
              <span className="font-mono text-slate-200">{user.preferences?.currency || "USD"}</span>
            </div>
          </div>
        </div>

        {/* Plan Configuration Control */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-surface border border-surface-variant space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-stitch-primary" />
              <span>Modify Plan & Set Validity Period</span>
            </span>
            <span className="text-[11px] text-slate-400">Admin Override</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase">
                Assign Plan Tier
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-black/20 border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary"
              >
                <option value="free">Free Tier</option>
                <option value="pro">Pro Plan</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase">
                Validity Duration
              </label>
              <select
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl bg-black/20 border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary"
              >
                <option value={30}>30 Days (1 Month)</option>
                <option value={90}>90 Days (Quarterly)</option>
                <option value={180}>180 Days (Half Year)</option>
                <option value={365}>365 Days (1 Year)</option>
                <option value={3650}>Lifetime (10 Years)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleApplyPlan}
                disabled={planUpdating}
                className="w-full h-10 rounded-xl bg-stitch-primary text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{planUpdating ? "Saving..." : "Apply Subscription"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workspaces Table for this User */}
      <div className="bg-surface rounded-2xl border border-surface-variant overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-variant flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>User Workspaces & Tenant Memberships</span>
            </h3>
            <p className="text-xs text-slate-400">All workspaces where {user.name} is an owner or collaborator</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {data.memberships?.length || 0} Workspaces
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-surface-variant text-slate-400 uppercase tracking-wider font-semibold">
                <th className="px-6 py-3.5 min-w-[200px]">Workspace</th>
                <th className="px-6 py-3.5 min-w-[120px]">Type</th>
                <th className="px-6 py-3.5 min-w-[140px]">User Role</th>
                <th className="px-6 py-3.5 min-w-[180px]">Owner</th>
                <th className="px-6 py-3.5 min-w-[150px]">Subscription</th>
                <th className="px-6 py-3.5 text-right min-w-[140px]">View Workspace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/50">
              {data.memberships?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    User is not a member of any workspaces.
                  </td>
                </tr>
              ) : (
                data.memberships?.map((m: AdminAny) => {
                  const ws = m.workspaceId;
                  if (!ws) return null;
                  return (
                    <tr key={m._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white block text-sm">{ws.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {ws._id}</span>
                      </td>
                      <td className="px-6 py-4 capitalize text-slate-300">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/5 border border-white/10">
                          {ws.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            m.role === "owner"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : m.role === "admin"
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              : "bg-stitch-primary/20 text-stitch-primary border border-stitch-primary/30"
                          }`}
                        >
                          {m.role || "member"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-200 block">{(typeof ws.ownerId === "object" && ws.ownerId ? ws.ownerId.name : "Unknown") || "System"}</span>
                        <span className="text-[11px] text-slate-400 block font-mono">{(typeof ws.ownerId === "object" && ws.ownerId ? ws.ownerId.email : "") || ""}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/20">
                          {ws.subscription?.plan || "free"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/workspaces/${ws._id}`}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition-all"
                        >
                          <span>Inspect Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Requests History */}
      {data.upgradeRequests && data.upgradeRequests.length > 0 && (
        <div className="bg-surface rounded-2xl border border-surface-variant overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-variant">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Submitted Upgrade Requests</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-surface-variant text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Workspace</th>
                  <th className="px-6 py-3.5">Requested Plan</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Admin Notes</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/50">
                {data.upgradeRequests.map((req: AdminAny) => (
                  <tr key={req._id}>
                    <td className="px-6 py-4 font-mono text-slate-400" suppressHydrationWarning>
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{req.workspaceId?.name || "Personal"}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stitch-primary/10 text-stitch-primary">
                        {req.requestedPlan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          req.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : req.status === "rejected"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{req.adminNotes || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      {req.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpgradeRequestAction(req._id, "approved")}
                            className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpgradeRequestAction(req._id, "rejected")}
                            className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Direct Message Modal */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-surface-variant shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-stitch-primary" />
                  <span>Dispatch Direct Message</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recipient: <span className="text-white font-medium">{user.name}</span> ({user.email})
                </p>
              </div>
              <button
                onClick={() => setIsMessageModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendDirectMessage} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase">
                  Message Content
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write the message directly to the user..."
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
                />
              </div>

              <div className="p-3 rounded-xl bg-surface-container-high border border-surface-variant flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendNotifFlag}
                    onChange={(e) => setSendNotifFlag(e.target.checked)}
                    className="rounded border-white/20 text-stitch-primary focus:ring-0"
                  />
                  <span>Send In-App Notification</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmailFlag}
                    onChange={(e) => setSendEmailFlag(e.target.checked)}
                    className="rounded border-white/20 text-stitch-primary focus:ring-0"
                  />
                  <span>Dispatch Email (Resend)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={msgSending}
                  className="px-5 py-2 rounded-xl bg-stitch-primary text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{msgSending ? "Sending..." : "Dispatch Message"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
