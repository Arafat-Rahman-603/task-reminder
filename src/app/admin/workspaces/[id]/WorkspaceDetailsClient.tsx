"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Users,
  Crown,
  Calendar,
  Clock,
  Check,
  X,
  ExternalLink,
  Mail,
  ShieldCheck,
  CheckCircle2,
  User,
  Layers,
  Send,
} from "lucide-react";
import {
  updateWorkspaceSubscriptionPlan,
  updateUpgradeRequestStatus,
  sendDirectUserMessage,
} from "@/actions/admin.actions";
import { formatDate } from "@/lib/dateUtils";

export default function WorkspaceDetailsClient({ initialData }: { initialData: any }) {
  const router = useRouter();

  const [data, setData] = useState(initialData);
  const [selectedPlan, setSelectedPlan] = useState(data.workspace.subscription?.plan || "free");
  const [validityDays, setValidityDays] = useState(30);
  const [planUpdating, setPlanUpdating] = useState(false);

  // Direct Message to Owner Modal
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [msgSubject, setMsgSubject] = useState(`Notice Regarding Workspace: ${data.workspace.name}`);
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

  const ws = data.workspace;
  const currentPlan = ws.subscription?.plan || "free";
  const currentStatus = ws.subscription?.status || "active";
  const periodEnd = ws.subscription?.currentPeriodEnd
    ? new Date(ws.subscription.currentPeriodEnd)
    : null;

  const formatPeriodEnd = () => {
    if (currentPlan === "free") return "Lifetime Access (Free Tier)";
    if (!periodEnd) return "Active • Monthly Cycle";
    const diffDays = Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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
      await updateWorkspaceSubscriptionPlan(ws._id, selectedPlan, validityDays);
      const newExpiry =
        selectedPlan === "free"
          ? null
          : new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();

      setData((prev: any) => ({
        ...prev,
        workspace: {
          ...prev.workspace,
          subscription: {
            ...prev.workspace.subscription,
            plan: selectedPlan,
            status: "active",
            currentPeriodEnd: newExpiry,
          },
        },
      }));
      showFeedback("success", `Workspace subscription updated to ${selectedPlan.toUpperCase()}.`);
      router.refresh();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to update workspace plan");
    } finally {
      setPlanUpdating(false);
    }
  };

  const handleUpgradeStatus = async (reqId: string, status: "approved" | "rejected") => {
    if (!confirm(`Are you sure you want to mark this request as ${status}?`)) return;
    try {
      await updateUpgradeRequestStatus(reqId, status);
      setData((prev: any) => ({
        ...prev,
        upgradeRequests: prev.upgradeRequests.map((r: any) =>
          r._id === reqId ? { ...r, status } : r
        ),
      }));
      showFeedback("success", `Upgrade request ${status} successfully.`);
      router.refresh();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to update request");
    }
  };

  const handleSendMessageToOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ws.ownerId?._id || !msgSubject || !msgBody) {
      showFeedback("error", "Subject and message are required.");
      return;
    }
    setMsgSending(true);
    try {
      const res = await sendDirectUserMessage({
        userId: ws.ownerId._id,
        subject: msgSubject,
        message: msgBody,
        sendEmailToUser: sendEmailFlag,
        sendNotificationToUser: sendNotifFlag,
      });
      showFeedback(
        "success",
        `Message dispatched to workspace owner ${ws.ownerId.email}!`
      );
      setIsMessageModalOpen(false);
      setMsgBody("");
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to send message to owner");
    } finally {
      setMsgSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-variant">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-stitch-primary" />
          <span>Back to Platform Admin Overview</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Workspace ID: {ws._id}</span>
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

      {/* Workspace Hero Card */}
      <div className="p-6 rounded-3xl bg-surface border border-surface-variant shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-2xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.2)] shrink-0">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{ws.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  ws.type === "team"
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                    : "bg-white/5 text-slate-300 border border-white/10"
                }`}
              >
                {ws.type} Workspace
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/30">
                {currentPlan}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span>
                Owner:{" "}
                {ws.ownerId ? (
                  <Link
                    href={`/admin/users/${ws.ownerId._id}`}
                    className="text-stitch-primary hover:underline font-medium"
                  >
                    {ws.ownerId.name} ({ws.ownerId.email})
                  </Link>
                ) : (
                  "N/A"
                )}
              </span>
              <span>•</span>
              <span suppressHydrationWarning>Created: {formatDate(ws.createdAt)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {ws.ownerId && (
            <button
              onClick={() => setIsMessageModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-stitch-primary/10 hover:bg-stitch-primary/20 text-stitch-primary border border-stitch-primary/30 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Workspace Owner</span>
            </button>
          )}
        </div>
      </div>

      {/* Subscription & Plan Override */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-surface border border-surface-variant space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Crown className="w-4 h-4 text-stitch-primary" />
              <span>Workspace Plan & Cycle</span>
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
              <span>Cycle / Expiry:</span>
              <span className="font-mono text-white text-right">{formatPeriodEnd()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Roster Count:</span>
              <span className="font-mono text-white font-bold">{data.metrics?.memberCount || 0} Members</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Tasks:</span>
              <span className="font-mono text-white font-bold">{data.metrics?.taskCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Change Plan Control */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-surface border border-surface-variant space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-stitch-primary" />
              <span>Modify Workspace Subscription & Duration</span>
            </span>
            <span className="text-[11px] text-slate-400">Admin Control</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase">
                Assign Plan
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
                <span>{planUpdating ? "Updating..." : "Apply To Workspace"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Members Roster Table */}
      <div className="bg-surface rounded-2xl border border-surface-variant overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-variant flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-stitch-primary" />
              <span>Full Workspace Member Roster</span>
            </h3>
            <p className="text-xs text-slate-400">All registered users with tenant membership in {ws.name}</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {data.members?.length || 0} Members
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-surface-variant text-slate-400 uppercase tracking-wider font-semibold">
                <th className="px-6 py-3.5 min-w-[200px]">Member</th>
                <th className="px-6 py-3.5 min-w-[140px]">Workspace Role</th>
                <th className="px-6 py-3.5 min-w-[140px]">Account Type</th>
                <th className="px-6 py-3.5 min-w-[120px]">Platform Role</th>
                <th className="px-6 py-3.5 min-w-[130px]">Joined Date</th>
                <th className="px-6 py-3.5 text-right min-w-[130px]">View Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/50">
              {data.members?.map((m: any) => {
                const u = m.userId;
                if (!u) return null;
                return (
                  <tr key={m._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stitch-primary/10 border border-stitch-primary/30 flex items-center justify-center font-bold text-stitch-primary shrink-0">
                          {u.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <span className="font-semibold text-white block">{u.name}</span>
                          <span className="text-[11px] text-slate-400 block font-mono">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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

                    <td className="px-6 py-4 capitalize text-slate-300">
                      {u.accountType?.replace("_", " ") || "individual"}
                    </td>

                    <td className="px-6 py-4">
                      {u.isPlatformAdmin ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stitch-primary text-black">
                          Admin
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">User</span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono text-slate-400" suppressHydrationWarning>
                      {formatDate(m.joinedAt || m.createdAt)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/users/${u._id}`}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition-all"
                      >
                        <span>Inspect User</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Requests for this Workspace */}
      {data.upgradeRequests && data.upgradeRequests.length > 0 && (
        <div className="bg-surface rounded-2xl border border-surface-variant overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-variant">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Workspace Upgrade History</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-surface-variant text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Requested By</th>
                  <th className="px-6 py-3.5">Plan Requested</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Admin Notes</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/50">
                {data.upgradeRequests.map((req: any) => (
                  <tr key={req._id}>
                    <td className="px-6 py-4 font-mono text-slate-400" suppressHydrationWarning>
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {req.requestedBy?.name || "Member"} ({req.requestedBy?.email || ""})
                    </td>
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
                            onClick={() => handleUpgradeStatus(req._id, "approved")}
                            className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpgradeStatus(req._id, "rejected")}
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

      {/* Message Owner Modal */}
      {isMessageModalOpen && ws.ownerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-surface-variant shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-stitch-primary" />
                  <span>Message Workspace Owner</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recipient: <span className="text-white font-medium">{ws.ownerId.name}</span> ({ws.ownerId.email})
                </p>
              </div>
              <button
                onClick={() => setIsMessageModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendMessageToOwner} className="space-y-3.5">
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
                  placeholder="Write message to the owner..."
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
