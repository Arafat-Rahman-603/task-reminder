"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Building2,
  Crown,
  ShieldCheck,
  Activity,
  Search,
  Check,
  X,
  Trash2,
  Bell,
  ArrowLeft,
  RefreshCw,
  Database,
  Mail,
  HardDrive,
  CheckCircle2,
  Clock,
  Send,
  UserCheck,
  UserX,
  Sliders,
  ChevronDown,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Plus,
  Cpu,
  Server,
  Inbox,
  Eye,
  Edit,
  ExternalLink,
  Receipt,
  LifeBuoy,
  Headphones,
  Ban,
  AlertTriangle,
} from "lucide-react";
import {
  updateUpgradeRequestStatus,
  togglePlatformAdmin,
  updateUserPlan,
  deleteUserAccount,
  broadcastPlatformNotification,
  sendDirectUserMessage,
  updateContactMessageStatus,
  replyToContactMessage,
  createOrUpdateCustomPlan,
  deleteCustomPlan,
  updateCustomizerConfig,
  suspendUserAccount,
  toggleSupportTeamRole,
  sendTargetedAdminMessage,
  recordManualRenewalPayment,
} from "@/actions/admin.actions";
import {
  assignSupportTicket,
  updateTicketStatus,
  replyToSupportTicket,
} from "@/actions/ticket.actions";
import { formatDate, formatDateTime, formatTime } from "@/lib/dateUtils";


export interface CustomizerRatesConfig {
  basePrice: number;
  baseIncludedSections: number;
  pricePerSection: number;
  baseIncludedMembers: number;
  pricePerMember: number;
  baseIncludedStorageGB: number;
  pricePerGBStorage: number;
}

export interface AdminUserItem {
  _id: string;
  id?: string;
  name: string;
  email: string;
  plan?: string;
  provider?: string;
  emailVerified?: boolean | string | Date;
  isPlatformAdmin?: boolean;
  isSupportTeam?: boolean;
  isSuspended?: boolean;
  createdAt: string | Date;
  accountType?: string;
  subscription?: {
    plan?: string;
    status?: string;
    expiresAt?: string | Date;
  };
  workspaces: Array<{
    id?: string;
    _id?: string;
    name: string;
    role?: string;
    type?: string;
    memberCount?: number;
  }>;
}

export interface AdminWorkspaceItem {
  _id: string;
  name: string;
  type: string;
  ownerId?: { _id?: string; name?: string; email?: string } | string;
  createdAt: string | Date;
  memberCount?: number;
  metrics?: Record<string, unknown>;
  subscription?: {
    plan?: string;
    status?: string;
    expiresAt?: string | Date;
  };
  members: Array<{
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  }>;
}

export interface AdminUpgradeRequestItem {
  _id: string;
  name?: string;
  email?: string;
  company?: string;
  plan: string;
  requestedPlan?: string;
  status: "pending" | "approved" | "rejected" | string;
  notes?: string;
  adminNotes?: string;
  price?: number;
  priceNum?: number;
  durationDays?: number;
  createdAt: string | Date;
  workspaceId?: {
    _id: string;
    name: string;
  } | null;
  userId?: {
    _id: string;
    name: string;
    email: string;
  } | null;
}

export interface AdminContactItem {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived" | string;
  createdAt: string | Date;
}

export interface AdminPlanItem {
  _id?: string;
  id?: string;
  slug?: string;
  name: string;
  price?: string;
  priceNum?: number;
  period?: string;
  target?: string;
  description?: string;
  maxMembers?: number;
  maxCustomSections?: number;
  maxStorageMB?: number;
  featureLabels?: string[];
  features?: string[];
  limits?: Record<string, unknown>;
  isActive?: boolean;
}

export interface AdminSupportAgentItem {
  _id: string;
  name: string;
  email: string;
  isSupportTeam?: boolean;
}

export interface AdminSupportTicketItem {
  _id: string;
  ticketNumber?: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed" | string;
  priority: "low" | "medium" | "high" | "urgent" | string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  assignedTo?: AdminSupportAgentItem | null;
  messages?: Array<{
    _id: string;
    sender: "user" | "agent" | "system" | string;
    senderName?: string;
    message: string;
    createdAt: string | Date;
    attachments?: Array<{
      url: string;
      publicId: string;
      originalFilename?: string;
      resourceType?: string;
    }>;
  }>;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AdminTransactionItem {
  _id: string;
  amount: number;
  currency: string;
  description?: string;
  notes?: string;
  date: string | Date;
  type: string;
  category?: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface AdminOverviewData {
  stats: Record<string, unknown>;
  metrics?: { totalUsers?: number; totalWorkspaces?: number; totalTransactions?: number; totalRevenue?: number; [key: string]: unknown };
  recentUsers: AdminUserItem[];
  recentWorkspaces: AdminWorkspaceItem[];
  recentRequests: AdminUpgradeRequestItem[];
}

export interface AdminBillingOverviewData {
  overdue?: Array<{ id: string; currentPeriodEnd?: string | Date; [key: string]: unknown }>;
  dueSoon?: Array<{ id: string; currentPeriodEnd?: string | Date; [key: string]: unknown }>;
  activePaid?: Array<{ id: string; currentPeriodEnd?: string | Date; [key: string]: unknown }>;
  totalPaidCount?: number;
  overdueCount?: number;
  dueSoonCount?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AdminAny = any;

type Tab =
  | "overview"
  | "users"
  | "workspaces"
  | "transactions"
  | "billing"
  | "plans"
  | "contacts"
  | "support"
  | "upgrades"
  | "system";

export default function AdminClient({
  initialOverview,
  initialUsers,
  initialWorkspaces,
  initialRequests,
  initialDiagnostics,
  initialTransactions,
  initialContacts,
  initialPlans,
  initialCustomizerConfig,
  initialBillingOverview,
  initialSupportTicketsData,
  initialSupportAgents,
}: {
  initialOverview: AdminAny;
  initialUsers: AdminAny[];
  initialWorkspaces: AdminAny[];
  initialRequests: AdminAny[];
  initialDiagnostics: AdminAny;
  initialTransactions: AdminAny;
  initialContacts: AdminAny[];
  initialPlans: AdminAny[];
  initialCustomizerConfig?: AdminAny;
  initialBillingOverview?: AdminAny;
  initialSupportTicketsData?: AdminAny;
  initialSupportAgents?: AdminAny[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [overview, _setOverview] = useState(initialOverview);
  const [users, setUsers] = useState(initialUsers);
  const [workspaces, _setWorkspaces] = useState(initialWorkspaces);
  const [requests, setRequests] = useState(initialRequests);
  const [diagnostics, _setDiagnostics] = useState(initialDiagnostics);
  const [transactionsData, _setTransactionsData] = useState(initialTransactions);
  const [contacts, setContacts] = useState(initialContacts);
  const [plans, setPlans] = useState(initialPlans);
  const [customizerConfig, setCustomizerConfig] = useState(
    initialCustomizerConfig || {
      basePrice: 4.99,
      baseIncludedSections: 3,
      pricePerSection: 0.40,
      baseIncludedMembers: 1,
      pricePerMember: 1.50,
      baseIncludedStorageGB: 1,
      pricePerGBStorage: 0.25,
    }
  );
  const [customizerSaving, setCustomizerSaving] = useState(false);

  // Users Filters
  const [userSearch, setUserSearch] = useState("");
  const [userPlanFilter, setUserPlanFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [userAdminOnly, setUserAdminOnly] = useState(false);

  // Workspace Filters
  const [wsSearch, setWsSearch] = useState("");
  const [wsTypeFilter, setWsTypeFilter] = useState("all");

  // Upgrade Request Filters
  const [requestStatusFilter, setRequestStatusFilter] = useState("all");

  // Transactions Filters
  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("all");

  // Contacts Filters
  const [contactSearch, setContactSearch] = useState("");
  const [contactStatusFilter, setContactStatusFilter] = useState("all");

  // Direct Message Modal
  const [directMsgUser, setDirectMsgUser] = useState<AdminAny | null>(null);
  const [directMsgSubject, setDirectMsgSubject] = useState("");
  const [directMsgBody, setDirectMsgBody] = useState("");
  const [directMsgSendEmail, setDirectMsgSendEmail] = useState(true);
  const [directMsgSendNotification, setDirectMsgSendNotification] = useState(true);
  const [directMsgSending, setDirectMsgSending] = useState(false);

  // Contact Reply Modal
  const [selectedContact, setSelectedContact] = useState<AdminAny | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);

  // Custom Plan Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanSlug, setEditingPlanSlug] = useState<string | null>(null);
  const [planFormName, setPlanFormName] = useState("");
  const [planFormPrice, setPlanFormPrice] = useState("$29");
  const [planFormPriceNum, setPlanFormPriceNum] = useState(29);
  const [planFormPeriod, setPlanFormPeriod] = useState("/month");
  const [planFormTarget, setPlanFormTarget] = useState<"individual" | "team" | "enterprise">("team");
  const [planFormDescription, setPlanFormDescription] = useState("");
  const [planFormMaxMembers, setPlanFormMaxMembers] = useState(10);
  const [planFormMaxSections, setPlanFormMaxSections] = useState(25);
  const [planFormMaxStorageMB, setPlanFormMaxStorageMB] = useState(10240);
  const [planFormFeatures, setPlanFormFeatures] = useState("");
  const [planFormIsActive, setPlanFormIsActive] = useState(true);
  const [planFormSaving, setPlanFormSaving] = useState(false);

  // Broadcast Notification Form
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastUrl, setBroadcastUrl] = useState("/dashboard");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Active Dropdowns / Modals
  const [activePlanDropdown, setActivePlanDropdown] = useState<string | null>(null);

  // Billing & Renewals State
  const [billingOverview, _setBillingOverview] = useState(
    initialBillingOverview || {
      overdue: [],
      dueSoon: [],
      activePaid: [],
      totalPaidCount: 0,
      overdueCount: 0,
      dueSoonCount: 0,
    }
  );
  const [billingSubTab, setBillingSubTab] = useState<
    "all" | "overdue" | "dueSoon" | "activePaid"
  >("all");
  const [manualPaymentUser, setManualPaymentUser] = useState<AdminAny | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(29.99);
  const [paymentPlan, setPaymentPlan] = useState("pro");
  const [paymentDurationDays, setPaymentDurationDays] = useState(30);
  const [paymentRecording, setPaymentRecording] = useState(false);

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState(
    initialSupportTicketsData?.tickets || []
  );
  const [supportStats, _setSupportStats] = useState(
    initialSupportTicketsData || {}
  );
  const [supportAgents, _setSupportAgents] = useState(
    initialSupportAgents || []
  );
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("all");
  const [activeTicket, setActiveTicket] = useState<AdminAny | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [ticketReplySending, setTicketReplySending] = useState(false);
  const [ticketNextStatus, setTicketNextStatus] = useState<string>("in_progress");

  // Multi-Audience / Targeted Messaging State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isTargetedMsgModalOpen, setIsTargetedMsgModalOpen] = useState(false);
  const [msgTargetType, setMsgTargetType] = useState<"all" | "selected" | "single" | "plan">("all");
  const [msgPlanFilter, setMsgPlanFilter] = useState("pro");
  const [msgSingleUser, setMsgSingleUser] = useState<AdminAny | null>(null);
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgSendEmail, setMsgSendEmail] = useState(true);
  const [msgSendNotif, setMsgSendNotif] = useState(true);
  const [msgSending, setMsgSending] = useState(false);

  // Upgrade Request Edit Terms State
  const [editingRequest, setEditingRequest] = useState<AdminAny | null>(null);
  const [editReqPlan, setEditReqPlan] = useState("");
  const [editReqPrice, setEditReqPrice] = useState<number>(0);
  const [editReqDuration, setEditReqDuration] = useState<number>(30);
  const [editReqSubmitting, setEditReqSubmitting] = useState(false);

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllUsers = (userList: AdminAny[]) => {
    if (selectedUserIds.length === userList.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(userList.map((u) => u._id));
    }
  };

  const handleSuspendUser = async (userId: string, currentSuspended: boolean) => {
    const action = currentSuspended ? "reactivate" : "suspend";
    const reason = !currentSuspended ? prompt("Enter suspension reason (optional):") || undefined : undefined;
    if (!confirm(`Are you sure you want to ${action} this user's account?`)) return;
    try {
      await suspendUserAccount(userId, !currentSuspended, reason);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, isSuspended: !currentSuspended, status: !currentSuspended ? "suspended" : "active" }
            : u
        )
      );
      showFeedback("success", `User account ${action}ed successfully.`);
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || `Failed to ${action} user`);
    }
  };

  const handleToggleSupport = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? "revoke support role from" : "assign support role to";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await toggleSupportTeamRole(userId, !currentStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isSupportTeam: !currentStatus } : u
        )
      );
      showFeedback("success", `Support team role ${!currentStatus ? "granted" : "revoked"} successfully.`);
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to update support role");
    }
  };

  const handleSendTargetedMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgSubject.trim() || !msgBody.trim()) {
      showFeedback("error", "Subject and message body are required.");
      return;
    }
    setMsgSending(true);
    try {
      const res = await sendTargetedAdminMessage({
        targetType: msgTargetType,
        targetIds:
          msgTargetType === "single" && msgSingleUser
            ? [msgSingleUser._id]
            : msgTargetType === "selected"
            ? selectedUserIds
            : [],
        planFilter: msgPlanFilter !== "all" ? msgPlanFilter : undefined,
        subject: msgSubject,
        message: msgBody,
        sendEmailToUsers: msgSendEmail,
        sendNotificationToUsers: msgSendNotif,
      });
      showFeedback(
        "success",
        `Notice dispatched to ${res.recipientCount} user(s) (Emails: ${res.emailCount}, Notifications: ${res.notifCount}).`
      );
      setIsTargetedMsgModalOpen(false);
      setMsgSubject("");
      setMsgBody("");
      setSelectedUserIds([]);
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to dispatch message");
    } finally {
      setMsgSending(false);
    }
  };

  const handleOpenEditRequest = (req: AdminAny) => {
    setEditingRequest(req);
    setEditReqPlan(req.requestedPlan || "pro");
    setEditReqPrice(
      req.priceNum ||
        (req.requestedPlan?.toLowerCase().includes("pro")
          ? 3.69
          : req.requestedPlan?.toLowerCase().includes("enterprise")
          ? 49.0
          : 29.99)
    );
    setEditReqDuration(30);
  };

  const handleApproveWithTerms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;
    setEditReqSubmitting(true);
    try {
      await updateUpgradeRequestStatus(editingRequest._id, "approved", {
        plan: editReqPlan,
        priceNum: Number(editReqPrice),
        durationDays: Number(editReqDuration),
      });
      setRequests((prev) =>
        prev.map((r) =>
          r._id === editingRequest._id
            ? { ...r, status: "approved", requestedPlan: editReqPlan, priceNum: editReqPrice }
            : r
        )
      );
      showFeedback(
        "success",
        `Request approved with ${editReqPlan.toUpperCase()} ($${Number(editReqPrice).toFixed(2)}) for ${editReqDuration} days! Income transaction recorded in finances.`
      );
      setEditingRequest(null);
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to approve request");
    } finally {
      setEditReqSubmitting(false);
    }
  };

  const handleRecordManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPaymentUser) return;
    setPaymentRecording(true);
    try {
      await recordManualRenewalPayment({
        userId: manualPaymentUser._id || manualPaymentUser.id || "",
        plan: paymentPlan,
        amount: Number(paymentAmount),
        durationDays: Number(paymentDurationDays),
      });
      showFeedback(
        "success",
        `Manual payment of $${Number(paymentAmount).toFixed(2)} recorded for ${manualPaymentUser.name || manualPaymentUser.email}. Subscription extended & platform income logged!`
      );
      setManualPaymentUser(null);
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to record manual payment");
    } finally {
      setPaymentRecording(false);
    }
  };

  const handleAssignTicket = async (ticketId: string, agentId: string) => {
    try {
      await assignSupportTicket(ticketId, agentId || null);
      setSupportTickets((prev: AdminAny[]) =>
        prev.map((t) =>
          t._id === ticketId
            ? {
                ...t,
                assignedTo: supportAgents.find((a: AdminAny) => a._id === agentId) || null,
              }
            : t
        )
      );
      showFeedback("success", "Ticket assignment updated.");
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to assign ticket");
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: AdminAny) => {
    try {
      await updateTicketStatus(ticketId, status as "open" | "in_progress" | "resolved" | "closed");
      setSupportTickets((prev: AdminAny[]) =>
        prev.map((t) => (t._id === ticketId ? { ...t, status } : t))
      );
      if (activeTicket && activeTicket._id === ticketId) {
        setActiveTicket((prev: AdminAny) => (prev ? { ...prev, status } : null));
      }
      showFeedback("success", `Ticket status updated to ${status.toUpperCase()}.`);
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to update status");
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !ticketReplyText.trim()) return;
    setTicketReplySending(true);
    try {
      const res = await replyToSupportTicket(activeTicket._id, ticketReplyText);
      if (ticketNextStatus && ticketNextStatus !== activeTicket.status) {
        await updateTicketStatus(activeTicket._id, ticketNextStatus as AdminAny);
      }
      if (res.ticket) {
        setActiveTicket(res.ticket);
        setSupportTickets((prev: AdminAny[]) =>
          prev.map((t) => (t._id === activeTicket._id ? res.ticket : t))
        );
      }
      showFeedback("success", "Staff reply sent & user notified!");
      setTicketReplyText("");
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to send staff reply");
    } finally {
      setTicketReplySending(false);
    }
  };

  const showFeedback = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const refreshData = () => {
    startTransition(() => {
      router.refresh();
      showFeedback("success", "Admin dashboard data refreshed.");
    });
  };

  // Handlers for Upgrade Requests
  const handleUpgradeStatus = async (
    id: string,
    status: "approved" | "rejected"
  ) => {
    if (!confirm(`Are you sure you want to mark this request as ${status}?`)) return;
    try {
      await updateUpgradeRequestStatus(id, status);
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status } : r))
      );
      showFeedback("success", `Upgrade request ${status} successfully.`);
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to update request");
    }
  };

  // Handlers for Users
  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? "remove admin rights from" : "grant platform admin to";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await togglePlatformAdmin(userId, !currentStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isPlatformAdmin: !currentStatus } : u
        )
      );
      showFeedback(
        "success",
        `Platform admin role ${!currentStatus ? "granted" : "revoked"} successfully.`
      );
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to update admin role");
    }
  };

  const handlePlanChange = async (userId: string, plan: string) => {
    try {
      await updateUserPlan(userId, plan);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, plan, subscription: { ...u.subscription, plan } } : u
        )
      );
      setActivePlanDropdown(null);
      showFeedback("success", `User subscription updated to ${plan.toUpperCase()}.`);
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to update user plan");
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (
      !confirm(
        `DANGER: Are you sure you want to permanently delete user account ${email}? This action cannot be undone.`
      )
    )
      return;
    try {
      await deleteUserAccount(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      showFeedback("success", `User ${email} has been permanently deleted.`);
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to delete user account");
    }
  };

  // Direct Message to User
  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directMsgUser || !directMsgSubject || !directMsgBody) {
      showFeedback("error", "Subject and message are required.");
      return;
    }
    setDirectMsgSending(true);
    try {
      const res = await sendDirectUserMessage({
        userId: directMsgUser._id,
        subject: directMsgSubject,
        message: directMsgBody,
        sendEmailToUser: directMsgSendEmail,
        sendNotificationToUser: directMsgSendNotification,
      });
      showFeedback(
        "success",
        `Message dispatched to ${directMsgUser.email} (Email: ${
          res.emailSent ? "Delivered" : "Skipped/Failed"
        }, Notification: ${res.notificationCreated ? "Created" : "Skipped"}).`
      );
      setDirectMsgUser(null);
      setDirectMsgSubject("");
      setDirectMsgBody("");
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to send direct message");
    } finally {
      setDirectMsgSending(false);
    }
  };

  // Contact Inquiries
  const handleReplyContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !replyText.trim()) return;
    setReplySending(true);
    try {
      await replyToContactMessage(selectedContact._id, replyText);
      setContacts((prev) =>
        prev.map((c) =>
          c._id === selectedContact._id
            ? {
                ...c,
                status: "replied",
                adminReplyNotes: replyText,
                repliedAt: new Date().toISOString(),
              }
            : c
        )
      );
      showFeedback("success", `Reply dispatched to ${selectedContact.email} via email!`);
      setSelectedContact(null);
      setReplyText("");
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to dispatch reply");
    } finally {
      setReplySending(false);
    }
  };

  const handleToggleContactStatus = async (
    msgId: string,
    currentStatus: "read" | "unread" | "replied"
  ) => {
    const nextStatus = currentStatus === "unread" ? "read" : "unread";
    try {
      await updateContactMessageStatus(msgId, nextStatus);
      setContacts((prev) =>
        prev.map((c) => (c._id === msgId ? { ...c, status: nextStatus } : c))
      );
      showFeedback("success", `Message marked as ${nextStatus}.`);
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to update status");
    }
  };

  // Plan Management Handlers
  const openNewPlanModal = () => {
    setEditingPlanSlug(null);
    setPlanFormName("");
    setPlanFormPrice("$29");
    setPlanFormPriceNum(29);
    setPlanFormPeriod("/month");
    setPlanFormTarget("team");
    setPlanFormDescription("Tailored workspace package designed for growing operations.");
    setPlanFormMaxMembers(10);
    setPlanFormMaxSections(20);
    setPlanFormMaxStorageMB(10240);
    setPlanFormFeatures("Unlimited Custom Fields\nDedicated Priority Support\nAdvanced Audit Logs");
    setPlanFormIsActive(true);
    setIsPlanModalOpen(true);
  };

  const openEditPlanModal = (plan: AdminAny) => {
    setEditingPlanSlug(plan.slug || null);
    setPlanFormName(plan.name);
    setPlanFormPrice(plan.price || "");
    setPlanFormPriceNum(plan.priceNum || 0);
    setPlanFormPeriod(plan.period || "/month");
    setPlanFormTarget((plan.target as "individual" | "team") || "team");
    setPlanFormDescription(plan.description || "");
    setPlanFormMaxMembers(plan.maxMembers || 5);
    setPlanFormMaxSections(plan.maxCustomSections || 10);
    setPlanFormMaxStorageMB(plan.maxStorageMB || 1024);
    setPlanFormFeatures((plan.featureLabels || []).join("\n"));
    setPlanFormIsActive(plan.isActive ?? true);
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planFormName.trim()) {
      showFeedback("error", "Plan name is required.");
      return;
    }
    setPlanFormSaving(true);
    try {
      const featureList = planFormFeatures
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);

      await createOrUpdateCustomPlan({
        slug: editingPlanSlug || undefined,
        name: planFormName,
        price: planFormPrice,
        priceNum: Number(planFormPriceNum) || 0,
        period: planFormPeriod,
        description: planFormDescription,
        target: planFormTarget,
        maxMembers: Number(planFormMaxMembers) || 1,
        maxCustomSections: Number(planFormMaxSections) || 5,
        maxStorageMB: Number(planFormMaxStorageMB) || 512,
        featureLabels: featureList.length > 0 ? featureList : ["Custom Module Quota"],
        isActive: planFormIsActive,
      });

      showFeedback("success", `Plan "${planFormName}" saved successfully.`);
      setIsPlanModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to save plan");
    } finally {
      setPlanFormSaving(false);
    }
  };

  const handleDeletePlan = async (slug: string, name: string) => {
    if (!confirm(`Are you sure you want to delete custom plan "${name}"?`)) return;
    try {
      await deleteCustomPlan(slug);
      setPlans((prev) => prev.filter((p) => p.slug !== slug));
      showFeedback("success", `Plan "${name}" removed.`);
      router.refresh();
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to delete plan");
    }
  };

  const handleSaveCustomizerConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCustomizerSaving(true);
    try {
      const res = await updateCustomizerConfig(customizerConfig);
      if (res.success) {
        setCustomizerConfig(res.config);
        showFeedback("success", "Customizer pricing architecture rates updated successfully!");
        router.refresh();
      }
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to save customizer pricing");
    } finally {
      setCustomizerSaving(false);
    }
  };

  // Broadcast Notification
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) {
      showFeedback("error", "Title and announcement message are required.");
      return;
    }
    setBroadcastSending(true);
    try {
      const res = await broadcastPlatformNotification(
        broadcastTitle,
        broadcastBody,
        broadcastUrl
      );
      showFeedback(
        "success",
        `Announcement sent to ${res.count || "all"} active users!`
      );
      setBroadcastTitle("");
      setBroadcastBody("");
      setBroadcastUrl("/dashboard");
    } catch (err: unknown) {
      showFeedback("error", (err instanceof Error ? err.message : String(err)) || "Failed to broadcast notification");
    } finally {
      setBroadcastSending(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const s = userSearch.toLowerCase().trim();
    const matchesSearch =
      !s ||
      u.name?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s);
    const matchesPlan =
      userPlanFilter === "all" ||
      (userPlanFilter === "free" && (!u.plan || u.plan === "free")) ||
      u.plan === userPlanFilter;
    const matchesType =
      userTypeFilter === "all" || u.accountType === userTypeFilter;
    const matchesAdmin = !userAdminOnly || u.isPlatformAdmin;

    return matchesSearch && matchesPlan && matchesType && matchesAdmin;
  });

  // Filtered Workspaces
  const filteredWorkspaces = workspaces.filter((w) => {
    const s = wsSearch.toLowerCase().trim();
    const matchesSearch =
      !s ||
      w.name?.toLowerCase().includes(s) ||
      (typeof w.ownerId === "object" && w.ownerId ? w.ownerId.email?.toLowerCase() : "").includes(s) ||
      (typeof w.ownerId === "object" && w.ownerId ? w.ownerId.name?.toLowerCase() : "").includes(s);
    const matchesType = wsTypeFilter === "all" || w.type === wsTypeFilter;

    return matchesSearch && matchesType;
  });

  // Filtered Upgrade Requests
  const filteredRequests = requests.filter((r) => {
    if (requestStatusFilter === "all") return true;
    return r.status === requestStatusFilter;
  });

  // Filtered Transactions
  const filteredTransactions = (transactionsData?.transactions || []).filter((tx: AdminAny) => {
    const s = txSearch.toLowerCase().trim();
    const matchesSearch =
      !s ||
      tx.notes?.toLowerCase().includes(s) ||
      tx.category?.toLowerCase().includes(s) ||
      tx.userId?.name?.toLowerCase().includes(s) ||
      tx.userId?.email?.toLowerCase().includes(s);
    const matchesType = txTypeFilter === "all" || tx.type === txTypeFilter;
    return matchesSearch && matchesType;
  });

  // Filtered Contacts
  const filteredContacts = contacts.filter((c: AdminAny) => {
    const s = contactSearch.toLowerCase().trim();
    const matchesSearch =
      !s ||
      c.name?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.subject?.toLowerCase().includes(s) ||
      c.message?.toLowerCase().includes(s);
    const matchesStatus =
      contactStatusFilter === "all" || c.status === contactStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const m = overview.metrics || {};
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const unreadContactsCount = contacts.filter((c) => c.status === "unread").length;
  const diag = diagnostics || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-variant">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-stitch-primary/10 border border-stitch-primary/30 flex items-center justify-center text-stitch-primary shadow-[0_0_15px_rgba(125,211,252,0.2)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Platform Administration
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Operational
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Manageo Core System, Infrastructure Diagnostics & Multi-Tenant Oversight
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={refreshData}
            disabled={isPending}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isPending ? "animate-spin text-stitch-primary" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-stitch-primary text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.4)] transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to App</span>
          </Link>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-sm font-medium flex items-center justify-between transition-all backdrop-blur-md ${
            actionMessage.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/15 border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modern Tabs Navigation Bar */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-surface-container-low rounded-2xl border border-surface-variant">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "users", label: "Users & Workspaces", icon: Users, badge: users.length },
          { id: "workspaces", label: "Workspaces Roster", icon: Building2, badge: workspaces.length },
          {
            id: "transactions",
            label: "Transactions Ledger",
            icon: CreditCard,
            badge: transactionsData?.metrics?.transactionCount || 0,
          },
          {
            id: "billing",
            label: "Billing & Renewals",
            icon: Receipt,
            badge: (billingOverview?.overdueCount || 0) > 0 ? `${billingOverview.overdueCount} Overdue` : undefined,
            alertBadge: (billingOverview?.overdueCount || 0) > 0,
          },
          { id: "plans", label: "Plan Builder", icon: Sliders, badge: plans.length },
          {
            id: "contacts",
            label: "Contact Inquiries",
            icon: Inbox,
            badge: unreadContactsCount,
            alertBadge: unreadContactsCount > 0,
          },
          {
            id: "support",
            label: "Support Tickets",
            icon: LifeBuoy,
            badge: supportTickets.filter((t: AdminAny) => t.status === "open").length,
            alertBadge: supportTickets.some((t: AdminAny) => t.status === "open"),
          },
          {
            id: "upgrades",
            label: "Upgrade Requests",
            icon: Crown,
            badge: pendingCount,
            alertBadge: pendingCount > 0,
          },
          { id: "system", label: "System & Diagnostics", icon: Server },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-stitch-primary text-black shadow-[0_0_15px_rgba(125,211,252,0.3)]"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-black/20 text-black"
                      : tab.alertBadge
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-white/10 text-slate-300"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metric KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
                <Users className="w-4 h-4 text-stitch-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{m.totalUsers || 0}</span>
                <span className="text-xs text-emerald-400 font-medium">
                  {m.verifiedUsers || 0} Verified
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-surface-variant flex items-center justify-between text-[11px] text-slate-400">
                <span>Individuals: {m.individualUsers || 0}</span>
                <span>Team Owners: {m.teamOwners || 0}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Workspaces</span>
                <Building2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{m.totalWorkspaces || 0}</span>
                <span className="text-xs text-indigo-300 font-medium">
                  {m.teamWorkspaces || 0} Teams
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-surface-variant flex items-center justify-between text-[11px] text-slate-400">
                <span>Personal: {m.personalWorkspaces || 0}</span>
                <span>Tenants: {m.totalWorkspaces || 0}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Pending Upgrades</span>
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-extrabold ${
                    pendingCount > 0 ? "text-amber-400" : "text-white"
                  }`}
                >
                  {pendingCount}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Approved: {m.approvedUpgrades || 0}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-surface-variant flex items-center justify-between text-[11px] text-slate-400">
                <span>Rejected: {m.rejectedUpgrades || 0}</span>
                <button
                  onClick={() => setActiveTab("upgrades")}
                  className="text-stitch-primary hover:underline font-semibold"
                >
                  Review Requests →
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">System Availability</span>
                <Server className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-400">
                  {diag.system?.availability || "99.98%"}
                </span>
                <span className="text-xs text-slate-400 font-medium">Uptime: {diag.system?.uptime || "Running"}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-surface-variant flex items-center justify-between text-[11px] text-slate-400">
                <span>Downtime: 0m</span>
                <button
                  onClick={() => setActiveTab("system")}
                  className="text-stitch-primary hover:underline font-semibold"
                >
                  View Health →
                </button>
              </div>
            </div>
          </div>

          {/* Subscriptions & Content Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plan Breakdown */}
            <div className="p-6 rounded-2xl bg-surface border border-surface-variant space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Crown className="w-4 h-4 text-stitch-primary" />
                <span>Subscription Plan Distribution</span>
              </h2>
              <div className="space-y-3">
                {[
                  {
                    name: "Free Tier",
                    count: m.planDistribution?.free || 0,
                    color: "bg-slate-400",
                    textColor: "text-slate-300",
                  },
                  {
                    name: "Pro Plan",
                    count: m.planDistribution?.pro || 0,
                    color: "bg-stitch-primary",
                    textColor: "text-stitch-primary",
                  },
                  {
                    name: "Enterprise",
                    count: m.planDistribution?.enterprise || 0,
                    color: "bg-purple-400",
                    textColor: "text-purple-300",
                  },
                ].map((plan) => {
                  const percent =
                    m.totalUsers > 0
                      ? Math.round((plan.count / m.totalUsers) * 100)
                      : 0;
                  return (
                    <div key={plan.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{plan.name}</span>
                        <span className={`font-mono font-bold ${plan.textColor}`}>
                          {plan.count} ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-black/40 overflow-hidden">
                        <div
                          className={`h-full ${plan.color} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max(percent, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform Content Counts */}
            <div className="p-6 rounded-2xl bg-surface border border-surface-variant space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-stitch-primary" />
                <span>Platform Content & Records</span>
              </h2>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-surface-container-high border border-surface-variant text-center">
                  <span className="text-xs text-slate-400">Tasks</span>
                  <p className="text-xl font-extrabold text-white mt-1">{m.totalTasks || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-high border border-surface-variant text-center">
                  <span className="text-xs text-slate-400">Invoices</span>
                  <p className="text-xl font-extrabold text-white mt-1">{m.totalInvoices || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-high border border-surface-variant text-center">
                  <span className="text-xs text-slate-400">Transactions</span>
                  <p className="text-xl font-extrabold text-white mt-1">
                    {transactionsData?.metrics?.transactionCount || m.totalTransactions || 0}
                  </p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs text-slate-300">
                <span>Database Engine: MongoDB Cluster</span>
                <span className="text-emerald-400 font-medium">{diag.database?.latencyMs || 5}ms latency</span>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="p-6 rounded-2xl bg-surface border border-surface-variant space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-stitch-primary" />
                <span>Admin Quick Actions</span>
              </h2>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => setActiveTab("users")}
                  className="p-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-surface-variant text-left transition-all"
                >
                  <Users className="w-4 h-4 text-stitch-primary mb-1.5" />
                  <p className="text-xs font-bold text-white">Manage Users</p>
                  <p className="text-[10px] text-slate-400">Rosters & messages</p>
                </button>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className="p-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-surface-variant text-left transition-all"
                >
                  <DollarSign className="w-4 h-4 text-emerald-400 mb-1.5" />
                  <p className="text-xs font-bold text-white">Transactions</p>
                  <p className="text-[10px] text-slate-400">Platform billing records</p>
                </button>
                <button
                  onClick={() => setActiveTab("plans")}
                  className="p-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-surface-variant text-left transition-all"
                >
                  <Crown className="w-4 h-4 text-amber-400 mb-1.5" />
                  <p className="text-xs font-bold text-white">Plan Builder</p>
                  <p className="text-[10px] text-slate-400">Create custom plans</p>
                </button>
                <button
                  onClick={() => setActiveTab("system")}
                  className="p-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-surface-variant text-left transition-all"
                >
                  <Server className="w-4 h-4 text-purple-400 mb-1.5" />
                  <p className="text-xs font-bold text-white">Diagnostics</p>
                  <p className="text-[10px] text-slate-400">RAM, CPU & Uptime</p>
                </button>
              </div>
            </div>
          </div>

          {/* Recently Registered Users */}
          <div className="bg-surface rounded-2xl border border-surface-variant overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-variant flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Recent User Registrations</h3>
                <p className="text-xs text-slate-400">Newest accounts created on the platform</p>
              </div>
              <button
                onClick={() => setActiveTab("users")}
                className="text-xs text-stitch-primary hover:underline font-semibold"
              >
                View all {users.length} users →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-surface-variant text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Provider</th>
                    <th className="px-6 py-3">Plan</th>
                    <th className="px-6 py-3">Verification</th>
                    <th className="px-6 py-3">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/50">
                  {overview.recentUsers?.map((u: AdminAny) => (
                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-stitch-primary/10 border border-stitch-primary/30 flex items-center justify-center font-bold text-stitch-primary">
                            {u.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <Link href={`/admin/users/${u._id}`} className="hover:underline">
                              <span className="font-semibold text-white block">{u.name}</span>
                            </Link>
                            <span className="text-[11px] text-slate-400 block">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 capitalize text-slate-300">
                        {u.accountType?.replace("_", " ") || "individual"}
                      </td>
                      <td className="px-6 py-3.5 capitalize text-slate-400">
                        {u.provider || "credentials"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/20">
                          {u.subscription?.plan || "free"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        {u.emailVerified || u.provider?.toLowerCase().includes("google") ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-amber-400 font-medium">Pending OTP</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400 font-mono" suppressHydrationWarning>
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT WITH WORKSPACE RELATIONSHIPS & DIRECT MESSAGING */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Controls & Search Toolbar */}
          <div className="p-4 rounded-2xl bg-surface border border-surface-variant flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Batch Action when users are selected */}
              {selectedUserIds.length > 0 && (
                <div className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-stitch-primary/15 border border-stitch-primary/30">
                  <span className="text-xs font-bold text-stitch-primary">
                    {selectedUserIds.length} selected
                  </span>
                  <button
                    onClick={() => {
                      setMsgTargetType("selected");
                      setMsgSubject("Notice to Selected Accounts");
                      setMsgBody("");
                      setIsTargetedMsgModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stitch-primary text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Message ({selectedUserIds.length})</span>
                  </button>
                  <button
                    onClick={() => setSelectedUserIds([])}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Standalone Targeted Message Dispatcher */}
              <button
                onClick={() => {
                  setMsgTargetType(selectedUserIds.length > 0 ? "selected" : "all");
                  setMsgSubject("");
                  setMsgBody("");
                  setIsTargetedMsgModalOpen(true);
                }}
                className="h-10 px-3.5 rounded-xl bg-stitch-primary text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Announcement</span>
              </button>

              <select
                value={userPlanFilter}
                onChange={(e) => setUserPlanFilter(e.target.value)}
                style={{ colorScheme: "dark" }}
                className="h-10 px-3 rounded-xl bg-surface-container-high border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary [&>option]:bg-[#141c2e] [&>option]:text-white"
              >
                <option value="all" className="bg-[#141c2e] text-white">All Plans</option>
                <option value="free" className="bg-[#141c2e] text-white">Free</option>
                <option value="pro" className="bg-[#141c2e] text-white">Pro</option>
                <option value="enterprise" className="bg-[#141c2e] text-white">Enterprise</option>
              </select>

              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
                style={{ colorScheme: "dark" }}
                className="h-10 px-3 rounded-xl bg-surface-container-high border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary [&>option]:bg-[#141c2e] [&>option]:text-white"
              >
                <option value="all" className="bg-[#141c2e] text-white">All Types</option>
                <option value="individual" className="bg-[#141c2e] text-white">Individual</option>
                <option value="team_owner" className="bg-[#141c2e] text-white">Team Owner</option>
              </select>

              <button
                type="button"
                onClick={() => setUserAdminOnly(!userAdminOnly)}
                className={`h-10 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  userAdminOnly
                    ? "bg-stitch-primary/20 text-stitch-primary border-stitch-primary/40"
                    : "bg-black/20 text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admins Only</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-surface rounded-2xl border border-surface-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-surface-variant text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="px-4 py-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                        onChange={() => handleSelectAllUsers(filteredUsers)}
                        className="rounded border-white/20 text-stitch-primary focus:ring-0 cursor-pointer"
                        title="Select/Deselect All"
                      />
                    </th>
                    <th className="px-6 py-3.5 min-w-[200px]">User Details</th>
                    <th className="px-6 py-3.5 min-w-[130px]">Account Type</th>
                    <th className="px-6 py-3.5 min-w-[160px]">Subscription Plan</th>
                    <th className="px-6 py-3.5 min-w-[120px]">Status</th>
                    <th className="px-6 py-3.5 min-w-[130px]">Platform Roles</th>
                    <th className="px-6 py-3.5 min-w-[280px]">Workspaces & Member Type</th>
                    <th className="px-6 py-3.5 text-right min-w-[180px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/50">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                        No users found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr
                        key={u._id}
                        className={`transition-colors ${
                          selectedUserIds.includes(u._id)
                            ? "bg-stitch-primary/5 hover:bg-stitch-primary/10"
                            : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u._id)}
                            onChange={() => handleToggleSelectUser(u._id)}
                            className="rounded border-white/20 text-stitch-primary focus:ring-0 cursor-pointer"
                          />
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-stitch-primary/10 border border-stitch-primary/30 flex items-center justify-center font-bold text-stitch-primary shrink-0">
                              {u.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div>
                              <Link href={`/admin/users/${u._id}`} className="hover:underline">
                                <span className="font-semibold text-white block">{u.name}</span>
                              </Link>
                              <span className="text-[11px] text-slate-400 block">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 capitalize text-slate-300">
                          {u.accountType?.replace("_", " ") || "individual"}
                          <span className="block text-[10px] text-slate-500 font-mono">
                            via {u.provider || "credentials"}
                          </span>
                        </td>

                        <td className="px-6 py-4 relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActivePlanDropdown(
                                activePlanDropdown === u._id ? null : u._id
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/30 hover:bg-stitch-primary/20 transition-all text-left whitespace-nowrap"
                          >
                            <span className="max-w-[140px] truncate" title={u.plan || "free"}>
                              {u.plan || "free"}
                            </span>
                            <ChevronDown className="w-3 h-3 shrink-0" />
                          </button>

                          {activePlanDropdown === u._id && (
                            <div className="absolute z-20 left-6 mt-1 w-36 rounded-xl bg-surface-container-high border border-surface-variant shadow-2xl p-1.5 space-y-1">
                              {["free", "pro", "enterprise"].map((p) => (
                                <button
                                  key={p}
                                  onClick={() => handlePlanChange(u._id, p)}
                                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold capitalize text-slate-200 hover:bg-stitch-primary hover:text-black transition-colors"
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Status (Suspended vs Active) */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            {u.isSuspended ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                <Ban className="w-3 h-3" /> Suspended
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <Check className="w-3 h-3" /> Active
                              </span>
                            )}
                            {u.emailVerified || u.provider?.toLowerCase().includes("google") ? (
                              <span className="text-[10px] text-emerald-400 font-medium">Verified</span>
                            ) : (
                              <span className="text-[10px] text-amber-400/80 font-medium">Pending OTP</span>
                            )}
                          </div>
                        </td>

                        {/* Roles: Platform Admin & Support Team */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 items-center">
                            {u.isPlatformAdmin && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stitch-primary text-black shadow-[0_0_10px_rgba(125,211,252,0.3)]">
                                Admin
                              </span>
                            )}
                            {u.isSupportTeam && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                <Headphones className="w-3 h-3" /> Support
                              </span>
                            )}
                            {!u.isPlatformAdmin && !u.isSupportTeam && (
                              <span className="text-slate-500 text-[11px]">User</span>
                            )}
                          </div>
                        </td>

                        {/* WORKSPACES & MEMBER TYPE */}
                        <td className="px-6 py-4">
                          {u.workspaces && u.workspaces.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-w-sm">
                              {u.workspaces.map((ws: AdminAny, idx: number) => (
                                <Link
                                  href={`/admin/workspaces/${ws.id || ws._id}`}
                                  key={idx}
                                  title={ws.name}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high border border-surface-variant hover:border-stitch-primary/40 text-slate-300 transition-colors whitespace-nowrap"
                                >
                                  <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  <span className="font-medium text-white max-w-[140px] truncate">
                                    {ws.name}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                                      ws.role === "owner"
                                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                        : ws.role === "admin"
                                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                        : "bg-stitch-primary/20 text-stitch-primary border border-stitch-primary/30"
                                    }`}
                                  >
                                    {ws.role}
                                  </span>
                                  <span className="text-slate-400 font-mono text-[9px] shrink-0">
                                    ({ws.memberCount || 1} {ws.memberCount === 1 ? "mbr" : "mbrs"})
                                  </span>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px] italic">No active workspaces</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect User Details Page */}
                            <Link
                              href={`/admin/users/${u._id}`}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all"
                              title="Inspect Detailed User Profile & History"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {/* Direct Message Button */}
                            <button
                              onClick={() => {
                                setDirectMsgUser(u);
                                setDirectMsgSubject(`Notice from Platform Administration`);
                                setDirectMsgBody("");
                              }}
                              className="p-2 rounded-lg bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/20 hover:bg-stitch-primary/20 transition-all"
                              title="Send Direct Email or Notification"
                            >
                              <Mail className="w-4 h-4" />
                            </button>

                            {/* Suspend / Reactivate User */}
                            <button
                              onClick={() => handleSuspendUser(u._id, Boolean(u.isSuspended))}
                              className={`p-2 rounded-lg border transition-all ${
                                u.isSuspended
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                              }`}
                              title={u.isSuspended ? "Reactivate User Account" : "Suspend User Account"}
                            >
                              <Ban className="w-4 h-4" />
                            </button>

                            {/* Toggle Support Team Role */}
                            <button
                              onClick={() => handleToggleSupport(u._id, Boolean(u.isSupportTeam))}
                              className={`p-2 rounded-lg border transition-all ${
                                u.isSupportTeam
                                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30"
                                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10"
                              }`}
                              title={
                                u.isSupportTeam
                                  ? "Revoke Support Team Role"
                                  : "Assign Support Team Role"
                              }
                            >
                              <Headphones className="w-4 h-4" />
                            </button>

                            {/* Toggle Admin Rights */}
                            <button
                              onClick={() => handleToggleAdmin(u._id, Boolean(u.isPlatformAdmin))}
                              className={`p-2 rounded-lg border transition-all ${
                                u.isPlatformAdmin
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                                  : "bg-white/5 text-slate-300 border-white/10 hover:text-white hover:bg-white/10"
                              }`}
                              title={
                                u.isPlatformAdmin
                                  ? "Revoke Admin Rights"
                                  : "Promote to Platform Admin"
                              }
                            >
                              {u.isPlatformAdmin ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>

                            {/* Delete User */}
                            <button
                              onClick={() => handleDeleteUser(u._id, u.email)}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WORKSPACES MANAGEMENT */}
      {activeTab === "workspaces" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-surface border border-surface-variant flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search workspace by name or owner..."
                value={wsSearch}
                onChange={(e) => setWsSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
              />
            </div>

            <select
              value={wsTypeFilter}
              onChange={(e) => setWsTypeFilter(e.target.value)}
              style={{ colorScheme: "dark" }}
              className="h-10 px-3 rounded-xl bg-surface-container-high border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary [&>option]:bg-[#141c2e] [&>option]:text-white"
            >
              <option value="all" className="bg-[#141c2e] text-white">All Types</option>
              <option value="personal" className="bg-[#141c2e] text-white">Personal Workspaces</option>
              <option value="team" className="bg-[#141c2e] text-white">Team Workspaces</option>
            </select>
          </div>

          <div className="bg-surface rounded-2xl border border-surface-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-surface-variant text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3.5">Workspace</th>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Owner Details</th>
                    <th className="px-6 py-3.5">Members & Roster</th>
                    <th className="px-6 py-3.5">Subscription</th>
                    <th className="px-6 py-3.5">Created Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/50">
                  {filteredWorkspaces.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No workspaces found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredWorkspaces.map((ws) => (
                      <tr key={ws._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 shrink-0">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <Link href={`/admin/workspaces/${ws._id}`} className="hover:underline">
                              <span className="font-semibold text-white block text-sm">
                                {ws.name}
                              </span>
                            </Link>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              ws.type === "team"
                                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                                : "bg-white/5 text-slate-300 border border-white/10"
                            }`}
                          >
                            {ws.type}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {ws.ownerId ? (
                            <Link href={`/admin/users/${ws.ownerId._id}`} className="hover:underline">
                              <span className="font-medium text-slate-200 block">
                                {ws.ownerId.name || "Unknown"}
                              </span>
                            </Link>
                          ) : (
                            <span className="font-medium text-slate-200 block">Unknown</span>
                          )}
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {ws.ownerId?.email || "N/A"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-white text-xs block">
                              {ws.memberCount} {ws.memberCount === 1 ? "Member" : "Members"}
                            </span>
                            {ws.members && ws.members.length > 0 && (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {ws.members.slice(0, 3).map((m: AdminAny, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 border border-white/5 text-slate-300"
                                  >
                                    {m.name} ({m.role})
                                  </span>
                                ))}
                                {ws.members.length > 3 && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 text-slate-400">
                                    +{ws.members.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/20">
                            {ws.plan || "free"}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-mono text-slate-400" suppressHydrationWarning>
                          {formatDate(ws.createdAt)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/workspaces/${ws._id}`}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TRANSACTIONS & BILLING OVERSIGHT */}
      {activeTab === "transactions" && (
        <div className="space-y-6">
          {/* Summary Volume KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Income Volume</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span suppressHydrationWarning className="text-3xl font-extrabold text-emerald-400">
                  ${(transactionsData?.metrics?.totalIncome || 0).toLocaleString("en-US")}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Total credited across user transactions</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Expense Volume</span>
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span suppressHydrationWarning className="text-3xl font-extrabold text-rose-400">
                  ${(transactionsData?.metrics?.totalExpense || 0).toLocaleString("en-US")}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Total debited across user transactions</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Net Platform Volume</span>
                <DollarSign className="w-4 h-4 text-stitch-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span suppressHydrationWarning className="text-3xl font-extrabold text-stitch-primary">
                  ${(transactionsData?.metrics?.netVolume || 0).toLocaleString("en-US")}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {transactionsData?.metrics?.transactionCount || 0} Transactions, {transactionsData?.metrics?.invoiceCount || 0} Invoices
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-4 rounded-2xl bg-surface border border-surface-variant flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search transaction by notes, category or user..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              {["all", "Income", "Expense"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTxTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                    txTypeFilter === t
                      ? "bg-stitch-primary text-black font-bold shadow-[0_0_10px_rgba(125,211,252,0.3)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-surface rounded-2xl border border-surface-variant overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-variant flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-stitch-primary" />
                <span>Platform Transaction Records</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {filteredTransactions.length} records shown
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-surface-variant text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">User / Account</th>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Description</th>
                    <th className="px-6 py-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/50">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx: AdminAny) => (
                      <tr key={tx._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-400" suppressHydrationWarning>
                          {tx.date ? formatDate(tx.date) : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white block">
                            {tx.userId?.name || "System"}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {tx.userId?.email || ""}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              tx.type === "Income"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {tx.category || "General"}
                        </td>
                        <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                          {tx.notes || tx.description || "—"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-sm">
                          <span
                            className={
                              tx.type === "Income" ? "text-emerald-400" : "text-rose-400"
                            }
                          >
                            {tx.type === "Income" ? "+" : "-"}${Number(tx.amount || 0).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BILLING & SUBSCRIPTION RENEWALS */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          {/* Billing Overview KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Paid Subscribers</span>
                <CreditCard className="w-4 h-4 text-stitch-primary" />
              </div>
              <span className="text-3xl font-extrabold text-white">
                {billingOverview.totalPaidCount || 0}
              </span>
              <p className="mt-2 text-[11px] text-slate-400">Total active recurring paid platform accounts</p>
            </div>

            <div
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                (billingOverview.overdueCount || 0) > 0
                  ? "bg-rose-500/10 border-rose-500/30"
                  : "bg-surface border-surface-variant"
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">
                  Overdue / Unpaid
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-3xl font-extrabold text-rose-400">
                {billingOverview.overdueCount || 0}
              </span>
              <p className="mt-2 text-[11px] text-slate-400">Accounts past validity with renewal pending</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Renewing in Next 30 Days
                </span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-3xl font-extrabold text-amber-400">
                {billingOverview.dueSoonCount || 0}
              </span>
              <p className="mt-2 text-[11px] text-slate-400">Upcoming renewals requiring attention</p>
            </div>
          </div>

          {/* Sub-Filters and Actions Toolbar */}
          <div className="p-4 rounded-2xl bg-surface border border-surface-variant flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
              {[
                { id: "all", label: "All Paid Subscriptions", count: billingOverview.totalPaidCount || 0 },
                { id: "overdue", label: "Overdue Accounts", count: billingOverview.overdueCount || 0 },
                { id: "dueSoon", label: "Renewing Soon", count: billingOverview.dueSoonCount || 0 },
                { id: "activePaid", label: "Healthy / Active", count: billingOverview.activePaid?.length || 0 },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setBillingSubTab(filter.id as AdminAny)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    billingSubTab === filter.id
                      ? "bg-stitch-primary text-black font-bold shadow-[0_0_10px_rgba(125,211,252,0.3)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMsgTargetType("plan");
                  setMsgPlanFilter("pro");
                  setMsgSubject("Platform Subscription Update");
                  setMsgBody("");
                  setIsTargetedMsgModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Mail className="w-3.5 h-3.5 text-stitch-primary" />
                <span>Message Plan Group</span>
              </button>
            </div>
          </div>

          {/* Billing Schedule Roster Table */}
          <div className="bg-surface rounded-2xl border border-surface-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-surface-variant text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3.5 min-w-[200px]">Subscriber</th>
                    <th className="px-6 py-3.5 min-w-[140px]">Plan Tier</th>
                    <th className="px-6 py-3.5 min-w-[140px]">Account Status</th>
                    <th className="px-6 py-3.5 min-w-[180px]">Expiration / Period End</th>
                    <th className="px-6 py-3.5 text-right min-w-[240px]">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/50">
                  {(() => {
                    const list =
                      billingSubTab === "overdue"
                        ? billingOverview.overdue || []
                        : billingSubTab === "dueSoon"
                        ? billingOverview.dueSoon || []
                        : billingSubTab === "activePaid"
                        ? billingOverview.activePaid || []
                        : [
                            ...(billingOverview.overdue || []),
                            ...(billingOverview.dueSoon || []),
                            ...(billingOverview.activePaid || []),
                          ];

                    if (list.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                            No billing records found in this category.
                          </td>
                        </tr>
                      );
                    }

                    return list.map((item: AdminAny, idx: number) => {
                      const isOverdue =
                        billingOverview.overdue?.some((o: AdminAny) => o.id === item.id) ||
                        (item.currentPeriodEnd && new Date(item.currentPeriodEnd) < new Date());
                      const isDueSoon =
                        !isOverdue &&
                        billingOverview.dueSoon?.some((d: AdminAny) => d.id === item.id);

                      return (
                        <tr key={item.id || idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-stitch-primary/10 border border-stitch-primary/30 flex items-center justify-center font-bold text-stitch-primary shrink-0">
                                {item.name?.charAt(0).toUpperCase() || "U"}
                              </div>
                              <div>
                                <Link href={`/admin/users/${item.id}`} className="hover:underline">
                                  <span className="font-semibold text-white block">{item.name}</span>
                                </Link>
                                <span className="text-[11px] text-slate-400 block font-mono">
                                  {item.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-stitch-primary/15 text-stitch-primary border border-stitch-primary/30">
                              {item.plan || "PRO"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              {item.isSuspended ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                  <Ban className="w-3 h-3" /> Suspended
                                </span>
                              ) : isOverdue ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                                  <AlertTriangle className="w-3 h-3" /> Overdue
                                </span>
                              ) : isDueSoon ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  <Clock className="w-3 h-3" /> Renewing Soon
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <Check className="w-3 h-3" /> Active
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {item.currentPeriodEnd ? (
                              <div className="space-y-0.5 font-mono text-xs">
                                <span className="text-white block" suppressHydrationWarning>
                                  {formatDate(item.currentPeriodEnd)}
                                </span>
                                <span
                                  className={`text-[10px] block ${
                                    isOverdue
                                      ? "text-rose-400 font-semibold"
                                      : isDueSoon
                                      ? "text-amber-400 font-medium"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {isOverdue
                                    ? `Expired ${Math.abs(
                                        Math.round(
                                          (Date.now() - new Date(item.currentPeriodEnd).getTime()) /
                                            (1000 * 60 * 60 * 24)
                                        )
                                      )}d ago`
                                    : `In ${Math.max(
                                        0,
                                        Math.round(
                                          (new Date(item.currentPeriodEnd).getTime() - Date.now()) /
                                            (1000 * 60 * 60 * 24)
                                        )
                                      )} days`}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">No period end set</span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Record Manual Payment */}
                              <button
                                onClick={() => {
                                  setManualPaymentUser(item);
                                  setPaymentPlan(item.plan || "pro");
                                  setPaymentAmount(
                                    item.plan === "enterprise"
                                      ? 49.0
                                      : item.plan === "pro"
                                      ? 3.69
                                      : 29.99
                                  );
                                  setPaymentDurationDays(30);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1 transition-all"
                                title="Record renewal payment and auto-log platform income"
                              >
                                <DollarSign className="w-3.5 h-3.5" /> Record Payment
                              </button>

                              {/* Send Renewal Notice */}
                              <button
                                onClick={() => {
                                  setMsgTargetType("single");
                                  setMsgSingleUser(item);
                                  setMsgSubject(`Important: Subscription Renewal Notice (${item.plan?.toUpperCase() || "PRO"})`);
                                  setMsgBody(
                                    `Hello ${item.name || "Subscriber"},\n\nThis is a notification regarding your Manageo ${item.plan?.toUpperCase() || "PRO"} subscription. Your current billing period ${
                                      isOverdue ? "has expired" : "is scheduled for renewal"
                                    }. Please review your account or record renewal payment to maintain access.\n\nThank you,\nPlatform Administration`
                                  );
                                  setIsTargetedMsgModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/30 hover:bg-stitch-primary/20 text-xs font-semibold flex items-center gap-1 transition-all"
                                title="Send Renewal Reminder via Email & In-App"
                              >
                                <Mail className="w-3.5 h-3.5" /> Reminder
                              </button>

                              {/* Suspend / Reactivate */}
                              <button
                                onClick={() => handleSuspendUser(item.id, item.isSuspended)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  item.isSuspended
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                    : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                                }`}
                                title={item.isSuspended ? "Reactivate Account" : "Suspend Account for Non-Payment"}
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PLATFORM PLAN BUILDER (CUSTOM PLANS FOR ADMIN) */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-variant">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-stitch-primary" />
                <span>Subscription Plan Builder & Pricing Architecture</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure base tiers or create customized plan limits (storage, workspaces, members).
              </p>
            </div>
            <button
              onClick={openNewPlanModal}
              className="px-4 py-2 rounded-xl bg-stitch-primary text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Plan</span>
            </button>
          </div>

          {/* DYNAMIC CUSTOMIZER ARCHITECTURE & MARGINAL RATES */}
          <div className="p-6 rounded-3xl bg-surface border border-surface-variant space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-variant">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-stitch-primary" />
                  <span>Dynamic Customizer Pricing Architecture (Tailored Plans)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configure live base rates and incremental unit prices for custom tailored plans built by users on their Profile page.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveCustomizerConfig}
                disabled={customizerSaving}
                className="px-5 py-2.5 rounded-xl bg-stitch-primary text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all disabled:opacity-50 self-start sm:self-auto"
              >
                <Check className="w-4 h-4" />
                <span>{customizerSaving ? "Saving Rates..." : "Save Customizer Rates"}</span>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Base Monthly Fee */}
                <div className="p-4 rounded-2xl bg-surface-container-high/60 border border-surface-variant space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Base Platform Monthly Fee ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={customizerConfig.basePrice}
                      onChange={(e) =>
                        setCustomizerConfig({
                          ...customizerConfig,
                          basePrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full h-10 pl-7 pr-3 rounded-xl bg-black/30 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-stitch-primary"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block">Baseline platform fee charged for any custom plan</span>
                </div>

                {/* Sections Config */}
                <div className="p-4 rounded-2xl bg-surface-container-high/60 border border-surface-variant space-y-3">
                  <span className="text-[11px] font-bold text-stitch-primary uppercase tracking-wider block">
                    Custom Database Sections
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Base Included</label>
                      <input
                        type="number"
                        min="0"
                        value={customizerConfig.baseIncludedSections}
                        onChange={(e) =>
                          setCustomizerConfig({
                            ...customizerConfig,
                            baseIncludedSections: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full h-9 px-2.5 rounded-lg bg-black/30 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-stitch-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">$/Addtl Sec</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customizerConfig.pricePerSection}
                        onChange={(e) =>
                          setCustomizerConfig({
                            ...customizerConfig,
                            pricePerSection: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full h-9 px-2.5 rounded-lg bg-black/30 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-stitch-primary"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Base: {customizerConfig.baseIncludedSections} free, then ${Number(customizerConfig.pricePerSection).toFixed(2)}/ea
                  </span>
                </div>

                {/* Members Config */}
                <div className="p-4 rounded-2xl bg-surface-container-high/60 border border-surface-variant space-y-3">
                  <span className="text-[11px] font-bold text-stitch-primary uppercase tracking-wider block">
                    Workspace Team Members
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Base Included</label>
                      <input
                        type="number"
                        min="1"
                        value={customizerConfig.baseIncludedMembers}
                        onChange={(e) =>
                          setCustomizerConfig({
                            ...customizerConfig,
                            baseIncludedMembers: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full h-9 px-2.5 rounded-lg bg-black/30 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-stitch-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">$/Addtl Mbr</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customizerConfig.pricePerMember}
                        onChange={(e) =>
                          setCustomizerConfig({
                            ...customizerConfig,
                            pricePerMember: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full h-9 px-2.5 rounded-lg bg-black/30 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-stitch-primary"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Base: {customizerConfig.baseIncludedMembers} free, then ${Number(customizerConfig.pricePerMember).toFixed(2)}/ea
                  </span>
                </div>

                {/* Storage Config */}
                <div className="p-4 rounded-2xl bg-surface-container-high/60 border border-surface-variant space-y-3">
                  <span className="text-[11px] font-bold text-stitch-primary uppercase tracking-wider block">
                    Cloud Storage (GB)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Base GB</label>
                      <input
                        type="number"
                        min="1"
                        value={customizerConfig.baseIncludedStorageGB}
                        onChange={(e) =>
                          setCustomizerConfig({
                            ...customizerConfig,
                            baseIncludedStorageGB: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full h-9 px-2.5 rounded-lg bg-black/30 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-stitch-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">$/Addtl GB</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customizerConfig.pricePerGBStorage}
                        onChange={(e) =>
                          setCustomizerConfig({
                            ...customizerConfig,
                            pricePerGBStorage: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full h-9 px-2.5 rounded-lg bg-black/30 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-stitch-primary"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Base: {customizerConfig.baseIncludedStorageGB} GB free, then ${Number(customizerConfig.pricePerGBStorage).toFixed(2)}/GB
                  </span>
                </div>
              </div>

              {/* Live Pricing Formula Simulator */}
              <div className="p-4 rounded-2xl bg-black/20 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-stitch-primary/10 border border-stitch-primary/30 flex items-center justify-center text-stitch-primary font-bold shrink-0">
                    Σ
                  </div>
                  <div>
                    <span className="font-bold text-white block">Formula Preview (Sample: 15 Sections, 10 Members, 10 GB Storage):</span>
                    <span className="text-slate-400 text-[11px] font-mono">
                      ${Number(customizerConfig.basePrice || 0).toFixed(2)} (Base) +{" "}
                      ${(Math.max(0, 15 - Number(customizerConfig.baseIncludedSections || 0)) * Number(customizerConfig.pricePerSection || 0)).toFixed(2)} (12 Secs) +{" "}
                      ${(Math.max(0, 10 - Number(customizerConfig.baseIncludedMembers || 0)) * Number(customizerConfig.pricePerMember || 0)).toFixed(2)} (9 Mbrs) +{" "}
                      ${(Math.max(0, 10 - Number(customizerConfig.baseIncludedStorageGB || 0)) * Number(customizerConfig.pricePerGBStorage || 0)).toFixed(2)} (9 GB)
                    </span>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-stitch-primary/20 border border-stitch-primary/40 text-right self-start md:self-auto shrink-0">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Simulated User Price</span>
                  <span className="text-lg font-mono font-extrabold text-stitch-primary">
                    $
                    {(
                      Number(customizerConfig.basePrice || 0) +
                      Math.max(0, 15 - Number(customizerConfig.baseIncludedSections || 0)) * Number(customizerConfig.pricePerSection || 0) +
                      Math.max(0, 10 - Number(customizerConfig.baseIncludedMembers || 0)) * Number(customizerConfig.pricePerMember || 0) +
                      Math.max(0, 10 - Number(customizerConfig.baseIncludedStorageGB || 0)) * Number(customizerConfig.pricePerGBStorage || 0)
                    ).toFixed(2)}
                    <span className="text-xs text-slate-300">/mo</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid of Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan: AdminAny) => (
              <div
                key={plan.slug}
                className="p-6 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between relative overflow-hidden group hover:border-stitch-primary/40 transition-all"
              >
                {plan.isCustom && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Custom Plan
                  </span>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-stitch-primary" />
                    <h3 className="text-lg font-extrabold text-white">{plan.name}</h3>
                  </div>

                  <p className="text-xs text-slate-400 min-h-[32px]">{plan.description}</p>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-xs text-slate-400">{plan.period}</span>
                  </div>

                  <div className="pt-3 border-t border-surface-variant space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Target Audience:</span>
                      <span className="font-semibold capitalize text-white">{plan.target}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Max Workspace Members:</span>
                      <span className="font-mono font-bold text-stitch-primary">
                        {plan.maxMembers >= 9999 ? "Unlimited" : plan.maxMembers}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Custom Sections / DBs:</span>
                      <span className="font-mono font-bold text-stitch-primary">
                        {plan.maxCustomSections >= 9999 ? "Unlimited" : plan.maxCustomSections}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Storage Quota:</span>
                      <span className="font-mono font-bold text-stitch-primary">
                        {plan.maxStorageMB >= 1024
                          ? `${(plan.maxStorageMB / 1024).toFixed(0)} GB`
                          : `${plan.maxStorageMB} MB`}
                      </span>
                    </div>
                  </div>

                  {plan.featureLabels && plan.featureLabels.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Features Included:
                      </span>
                      <ul className="space-y-1">
                        {plan.featureLabels.map((feat: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-surface-variant flex items-center justify-between gap-2">
                  <button
                    onClick={() => openEditPlanModal(plan)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Configure</span>
                  </button>
                  {plan.isCustom && (
                    <button
                      onClick={() => handleDeletePlan(plan.slug, plan.name)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                      title="Delete Custom Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CONTACT INQUIRIES & REPLIES */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-surface border border-surface-variant flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search contact inquiries by name, email or message..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              {["all", "unread", "read", "replied"].map((st) => (
                <button
                  key={st}
                  onClick={() => setContactStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                    contactStatusFilter === st
                      ? "bg-stitch-primary text-black font-bold shadow-[0_0_10px_rgba(125,211,252,0.3)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-surface-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-surface-variant text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Sender</th>
                    <th className="px-6 py-3.5">Subject</th>
                    <th className="px-6 py-3.5">Message Snippet</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/50">
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No contact inquiries found.
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((c: AdminAny) => (
                      <tr key={c._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-400" suppressHydrationWarning>
                          {formatDate(c.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white block">{c.name}</span>
                          <span className="text-[11px] text-slate-400 block font-mono">{c.email}</span>
                          {c.phone && <span className="text-[10px] text-slate-500 block">{c.phone}</span>}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-200">
                          {c.subject || "General Inquiry"}
                        </td>
                        <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                          {c.message}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              c.status === "unread"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : c.status === "replied"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedContact(c);
                                setReplyText("");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/30 hover:bg-stitch-primary/20 text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View & Reply</span>
                            </button>
                            <button
                              onClick={() => handleToggleContactStatus(c._id, c.status)}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all"
                              title="Toggle read/unread"
                            >
                              {c.status === "unread" ? "Mark Read" : "Mark Unread"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SUPPORT TICKETS & HELPDESK */}
      {activeTab === "support" && (
        <div className="space-y-6">
          {/* Support KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Tickets</span>
                <LifeBuoy className="w-4 h-4 text-stitch-primary" />
              </div>
              <span className="text-3xl font-extrabold text-white">
                {supportStats.totalCount || supportTickets.length}
              </span>
              <p className="mt-2 text-[11px] text-slate-400">All customer inquiries submitted</p>
            </div>

            <div
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                supportTickets.filter((t: AdminAny) => t.status === "open").length > 0
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-surface border-surface-variant"
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Open & Unaddressed
                </span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-3xl font-extrabold text-amber-400">
                {supportTickets.filter((t: AdminAny) => t.status === "open").length}
              </span>
              <p className="mt-2 text-[11px] text-slate-400">Pending initial response from staff</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                  In Progress
                </span>
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-3xl font-extrabold text-purple-400">
                {supportTickets.filter((t: AdminAny) => t.status === "in_progress").length}
              </span>
              <p className="mt-2 text-[11px] text-slate-400">Under active investigation</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Resolved / Closed
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-3xl font-extrabold text-emerald-400">
                {
                  supportTickets.filter(
                    (t: AdminAny) => t.status === "resolved" || t.status === "closed"
                  ).length
                }
              </span>
              <p className="mt-2 text-[11px] text-slate-400">Successfully closed issues</p>
            </div>
          </div>

          {/* Search, Filter Toolbar & Staff Roles */}
          <div className="p-4 rounded-2xl bg-surface border border-surface-variant flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket #, subject or user..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {(["all", "open", "in_progress", "resolved", "closed"] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setTicketStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                        ticketStatusFilter === st
                          ? "bg-stitch-primary text-black font-bold shadow-[0_0_10px_rgba(125,211,252,0.3)]"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {st.replace("_", " ")}
                    </button>
                  )
                )}
              </div>

              <select
                value={ticketPriorityFilter}
                onChange={(e) => setTicketPriorityFilter(e.target.value)}
                style={{ colorScheme: "dark" }}
                className="h-9 px-3 rounded-xl bg-surface-container-high border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary [&>option]:bg-[#141c2e] [&>option]:text-white"
              >
                <option value="all" className="bg-[#141c2e] text-white">All Priorities</option>
                <option value="low" className="bg-[#141c2e] text-white">Low</option>
                <option value="medium" className="bg-[#141c2e] text-white">Medium</option>
                <option value="high" className="bg-[#141c2e] text-white">High</option>
                <option value="urgent" className="bg-[#141c2e] text-white">Urgent</option>
              </select>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-surface rounded-2xl border border-surface-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-surface-variant text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3.5 min-w-[120px]">Ticket ID</th>
                    <th className="px-6 py-3.5 min-w-[180px]">Customer</th>
                    <th className="px-6 py-3.5 min-w-[220px]">Subject & Category</th>
                    <th className="px-6 py-3.5 min-w-[100px]">Priority</th>
                    <th className="px-6 py-3.5 min-w-[120px]">Status</th>
                    <th className="px-6 py-3.5 min-w-[180px]">Assigned Agent</th>
                    <th className="px-6 py-3.5 min-w-[130px]">Last Update</th>
                    <th className="px-6 py-3.5 text-right min-w-[130px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/50">
                  {(() => {
                    const filtered = supportTickets.filter((t: AdminAny) => {
                      const s = ticketSearch.toLowerCase().trim();
                      const matchesSearch =
                        !s ||
                        t.ticketNumber?.toLowerCase().includes(s) ||
                        t.subject?.toLowerCase().includes(s) ||
                        t.userId?.name?.toLowerCase().includes(s) ||
                        t.userId?.email?.toLowerCase().includes(s);
                      const matchesStatus =
                        ticketStatusFilter === "all" || t.status === ticketStatusFilter;
                      const matchesPriority =
                        ticketPriorityFilter === "all" || t.priority === ticketPriorityFilter;
                      return matchesSearch && matchesStatus && matchesPriority;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                            No support tickets found matching your filters.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((t: AdminAny) => {
                      const priorityColor =
                        t.priority === "urgent"
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                          : t.priority === "high"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : t.priority === "medium"
                          ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                          : "bg-slate-500/20 text-slate-400 border-slate-500/30";

                      const statusColor =
                        t.status === "open"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : t.status === "in_progress"
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          : t.status === "resolved"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-slate-500/20 text-slate-400 border-slate-500/30";

                      return (
                        <tr key={t._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-stitch-primary">
                            {t.ticketNumber}
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-semibold text-white block">
                              {t.userId?.name || "Customer"}
                            </span>
                            <span className="text-[11px] text-slate-400 block font-mono">
                              {t.userId?.email || ""}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-200 block">
                              {t.subject}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                              Category: {t.category || "General"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${priorityColor}`}
                            >
                              {t.priority}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}
                            >
                              {t.status.replace("_", " ")}
                            </span>
                          </td>

                          {/* Assigned Agent Select */}
                          <td className="px-6 py-4">
                            <select
                              value={t.assignedTo?._id || t.assignedTo || ""}
                              onChange={(e) => handleAssignTicket(t._id, e.target.value)}
                              style={{ colorScheme: "dark" }}
                              className="h-8 px-2.5 rounded-lg bg-surface-container border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary [&>option]:bg-[#141c2e] [&>option]:text-white"
                            >
                              <option value="" className="bg-[#141c2e] text-white">Unassigned</option>
                              {supportAgents.map((agent: AdminAny) => (
                                <option key={agent._id} value={agent._id} className="bg-[#141c2e] text-white">
                                  {agent.name} {agent.isPlatformAdmin ? "(Admin)" : "(Agent)"}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="px-6 py-4 font-mono text-slate-400" suppressHydrationWarning>
                            {formatDate(t.lastReplyAt || t.updatedAt || t.createdAt)}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setActiveTicket(t);
                                setTicketReplyText("");
                                setTicketNextStatus(
                                  t.status === "open" ? "in_progress" : t.status
                                );
                              }}
                              className="px-3 py-1.5 rounded-lg bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/30 hover:bg-stitch-primary/20 text-xs font-bold flex items-center gap-1.5 transition-all ml-auto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View & Reply</span>
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: UPGRADE REQUESTS */}
      {activeTab === "upgrades" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-surface border border-surface-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(["all", "pending", "approved", "rejected"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setRequestStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                    requestStatusFilter === st
                      ? "bg-stitch-primary text-black font-bold shadow-[0_0_10px_rgba(125,211,252,0.3)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Showing {filteredRequests.length} requests
            </span>
          </div>

          <div className="bg-surface rounded-2xl border border-surface-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-surface-variant text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3.5 min-w-[120px]">Date</th>
                    <th className="px-6 py-3.5 min-w-[180px]">Workspace</th>
                    <th className="px-6 py-3.5 min-w-[200px]">Requested By</th>
                    <th className="px-6 py-3.5 min-w-[200px]">Plan Requested</th>
                    <th className="px-6 py-3.5 min-w-[140px]">Price / Rate</th>
                    <th className="px-6 py-3.5 min-w-[120px]">Status</th>
                    <th className="px-6 py-3.5 text-right min-w-[220px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/50">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No upgrade requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-white/[0.02] transition-colors">
                        <td suppressHydrationWarning className="px-6 py-4 font-mono text-slate-400">
                          {formatDate(req.createdAt)}
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-semibold text-white block">
                            {req.workspaceId?.name || "Unknown"}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase">
                            {req.workspaceId?.type || ""}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-200 block">
                            {req.requestedBy?.name || "Unknown"}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {req.requestedBy?.email || ""}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="inline-flex flex-col items-start gap-1">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-stitch-primary/15 text-stitch-primary border border-stitch-primary/30 whitespace-nowrap">
                              {req.requestedPlan?.toLowerCase().startsWith("custom")
                                ? "Custom Tailored"
                                : req.requestedPlan}
                            </span>
                            {req.requestedPlan?.includes("(") && (
                              <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                                {req.requestedPlan.substring(
                                  req.requestedPlan.indexOf("(") + 1,
                                  req.requestedPlan.lastIndexOf(")")
                                )}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Price Column */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-white text-sm">
                              {req.price ||
                                (req.priceNum ? `$${Number(req.priceNum).toFixed(2)}/mo` : null) ||
                                (req.requestedPlan?.toLowerCase().includes("pro")
                                  ? "$3.69/mo"
                                  : req.requestedPlan?.toLowerCase().includes("enterprise")
                                  ? "$49.00/mo"
                                  : "$29.99/mo")}
                            </span>
                            {req.billingCycle && (
                              <span className="text-[10px] text-slate-400 capitalize">
                                Cycle: {req.billingCycle}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              req.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : req.status === "rejected"
                                ? "bg-red-500/10 text-red-400 border border-red-500/30"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          {req.status === "pending" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpgradeStatus(req._id, "approved")}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1 transition-all"
                                title="Approve & Log Income Transaction"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleOpenEditRequest(req)}
                                className="px-3 py-1.5 rounded-lg bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/30 hover:bg-stitch-primary/20 text-xs font-bold flex items-center gap-1 transition-all"
                                title="Edit Terms & Price Before Approving"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit Terms
                              </button>
                              <button
                                onClick={() => handleUpgradeStatus(req._id, "rejected")}
                                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 text-xs font-bold flex items-center gap-1 transition-all"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: REAL-TIME SYSTEM & INFRASTRUCTURE DIAGNOSTICS */}
      {activeTab === "system" && (
        <div className="space-y-6">
          {/* Uptime, Availability & Health Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Application Uptime</span>
                <Clock className="w-4 h-4 text-stitch-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">
                  {diag.system?.uptime || "Active"}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Host Uptime: {diag.system?.sysUptime}</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">System Availability</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-emerald-400">
                  {diag.system?.availability || "99.98%"}
                </span>
                <span className="text-xs text-slate-400 font-medium">SLO Target</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Downtime: {diag.system?.downtimeMinutes || 0} minutes</p>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">System RAM Usage</span>
                <Cpu className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">
                  {diag.memory?.usedRAM_GB || 0} GB
                </span>
                <span className="text-xs text-slate-400">/ {diag.memory?.totalRAM_GB || 0} GB</span>
              </div>
              <div className="mt-2 w-full bg-black/40 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${diag.memory?.usagePercent || 30}%` }}
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">CPU Utilization</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-amber-400">
                  {diag.cpu?.usagePercent || 5}%
                </span>
                <span className="text-xs text-slate-400">({diag.cpu?.cores || 1} Cores)</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400 truncate">{diag.cpu?.model}</p>
            </div>
          </div>

          {/* Deep Dives: Memory, Storage & Integration Diagnostic Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real Hardware & Database Storage Diagnostics */}
            <div className="p-6 rounded-2xl bg-surface border border-surface-variant space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-stitch-primary" />
                  <span>Database & Storage Diagnostics</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Operational
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-high border border-surface-variant">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-semibold text-white block">MongoDB Cluster</span>
                      <span className="text-[10px] text-slate-400">Database: {diag.database?.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-300 font-mono font-bold block">
                      {diag.database?.latencyMs}ms Latency
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                      {diag.database?.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-surface-container-high border border-surface-variant text-center">
                    <span className="text-[10px] text-slate-400 block">Collections</span>
                    <span className="text-lg font-mono font-bold text-white">
                      {diag.database?.totalCollections || 0}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-high border border-surface-variant text-center">
                    <span className="text-[10px] text-slate-400 block">Data Size</span>
                    <span className="text-lg font-mono font-bold text-stitch-primary">
                      {diag.database?.dataSizeMB || "0"} MB
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-high border border-surface-variant text-center">
                    <span className="text-[10px] text-slate-400 block">Storage Allocated</span>
                    <span className="text-lg font-mono font-bold text-indigo-400">
                      {diag.database?.storageSizeMB || "0"} MB
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-container-high border border-surface-variant space-y-2">
                  <span className="text-[11px] font-semibold text-slate-300 block">
                    Node.js Runtime Memory Breakdown
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-slate-400">
                    <div>
                      <span>Process Heap Used:</span>{" "}
                      <span className="font-mono text-white font-bold">
                        {diag.memory?.processHeapUsedMB || 0} MB
                      </span>
                    </div>
                    <div>
                      <span>Process RSS:</span>{" "}
                      <span className="font-mono text-white font-bold">
                        {diag.memory?.processRssMB || 0} MB
                      </span>
                    </div>
                    <div>
                      <span>Free Host Memory:</span>{" "}
                      <span className="font-mono text-white font-bold">
                        {diag.memory?.freeRAM_GB || 0} GB
                      </span>
                    </div>
                    <div>
                      <span>RAM Utilization:</span>{" "}
                      <span className="font-mono text-stitch-primary font-bold">
                        {diag.memory?.usagePercent || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Integrations & Environment */}
            <div className="p-6 rounded-2xl bg-surface border border-surface-variant space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-stitch-primary" />
                  <span>Integration Gateways & Environment</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/30">
                  Live Status
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-high border border-surface-variant">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-stitch-primary" />
                    <div>
                      <span className="font-semibold text-white block">Resend Email Gateway</span>
                      <span className="text-[10px] text-slate-400">Transactional OTP & System Dispatch</span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      diag.integrations?.resend
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {diag.integrations?.resend ? "Configured & Active" : "Missing API Key"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-high border border-surface-variant">
                  <div className="flex items-center gap-2.5">
                    <HardDrive className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="font-semibold text-white block">Cloudinary Media Gateway</span>
                      <span className="text-[10px] text-slate-400">Authenticated Storage & Documents</span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      diag.integrations?.cloudinary
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                    }`}
                  >
                    {diag.integrations?.cloudinary ? "Authenticated Mode" : "Optional / Idle"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-container-high border border-surface-variant space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-300 block">
                    Server Runtime Environment
                  </span>
                  <div className="space-y-1 text-slate-400">
                    <div className="flex justify-between">
                      <span>Node Engine:</span>
                      <span className="font-mono text-white font-medium">{diag.environment?.nodeVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operating Platform:</span>
                      <span className="font-mono text-white font-medium">{diag.environment?.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Server Clock:</span>
                      <span className="font-mono text-slate-300" suppressHydrationWarning>
                        {diag?.timestamp ? formatTime(diag.timestamp) : "Live"} (UTC)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Broadcast Platform Notification Tool */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-variant space-y-5">
            <div className="pb-3 border-b border-surface-variant">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-stitch-primary" />
                <span>Broadcast System Announcement</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Dispatches an in-app system notification to every registered user on the platform.
              </p>
            </div>

            <form onSubmit={handleBroadcast} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scheduled Maintenance or New Feature Release"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase">
                    Destination URL
                  </label>
                  <input
                    type="text"
                    placeholder="/dashboard"
                    value={broadcastUrl}
                    onChange={(e) => setBroadcastUrl(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
                  />
                </div>
              </div>

              <div className="space-y-3.5 flex flex-col justify-between">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase">
                    Announcement Body
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter detailed notification content here..."
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={broadcastSending}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-stitch-primary to-blue-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {broadcastSending ? "Broadcasting..." : `Send to All Users (${users.length})`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: DIRECT USER MESSAGING MODAL */}
      {directMsgUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-surface-variant shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-stitch-primary" />
                  <span>Dispatch Direct Message</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recipient: <span className="text-white font-medium">{directMsgUser.name}</span> ({directMsgUser.email})
                </p>
              </div>
              <button
                onClick={() => setDirectMsgUser(null)}
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
                  placeholder="e.g. Account Verification or Custom Quota Notice"
                  value={directMsgSubject}
                  onChange={(e) => setDirectMsgSubject(e.target.value)}
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
                  value={directMsgBody}
                  onChange={(e) => setDirectMsgBody(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
                />
              </div>

              <div className="p-3 rounded-xl bg-surface-container-high border border-surface-variant flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={directMsgSendNotification}
                    onChange={(e) => setDirectMsgSendNotification(e.target.checked)}
                    className="rounded border-white/20 text-stitch-primary focus:ring-0"
                  />
                  <span>Send In-App Notification</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={directMsgSendEmail}
                    onChange={(e) => setDirectMsgSendEmail(e.target.checked)}
                    className="rounded border-white/20 text-stitch-primary focus:ring-0"
                  />
                  <span>Dispatch Email (Resend)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDirectMsgUser(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={directMsgSending}
                  className="px-5 py-2 rounded-xl bg-stitch-primary text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{directMsgSending ? "Sending..." : "Dispatch Message"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONTACT MESSAGE DETAIL & EMAIL REPLY MODAL */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl bg-surface border border-surface-variant shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-stitch-primary" />
                  <span>Contact Inquiry Details</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  From: <span className="text-white font-medium">{selectedContact.name}</span> ({selectedContact.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-high border border-surface-variant space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 font-mono">
                <span>Subject: {selectedContact.subject || "General Inquiry"}</span>
                <span suppressHydrationWarning>{formatDateTime(selectedContact.createdAt)}</span>
              </div>
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed pt-1">
                {selectedContact.message}
              </p>
            </div>

            {selectedContact.adminReplyNotes && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                <span className="font-semibold text-emerald-400 block" suppressHydrationWarning>
                  Previous Admin Reply (Replied on {formatDate(selectedContact.repliedAt)}):
                </span>
                <p className="text-slate-300">{selectedContact.adminReplyNotes}</p>
              </div>
            )}

            <form onSubmit={handleReplyContact} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase">
                  Dispatch Email Reply
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={`Write your response to ${selectedContact.name}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedContact(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={replySending || !replyText.trim()}
                  className="px-5 py-2 rounded-xl bg-stitch-primary text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{replySending ? "Dispatching Email..." : "Send Email Reply"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CUSTOM PLAN BUILDER MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface border border-surface-variant shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-stitch-primary" />
                  <span>{editingPlanSlug ? "Configure Plan" : "Create Customized Plan"}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Define custom member counts, section limits, storage allocation, and pricing.
                </p>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Agency Pro or Growth 25"
                    value={planFormName}
                    onChange={(e) => setPlanFormName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase">
                    Target Audience
                  </label>
                  <select
                    value={planFormTarget}
                    onChange={(e) => setPlanFormTarget(e.target.value as AdminAny)}
                    style={{ colorScheme: "dark" }}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-high border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary [&>option]:bg-[#141c2e] [&>option]:text-white"
                  >
                    <option value="individual" className="bg-[#141c2e] text-white">Individual</option>
                    <option value="team" className="bg-[#141c2e] text-white">Team Workspaces</option>
                    <option value="enterprise" className="bg-[#141c2e] text-white">Enterprise</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase">
                    Price Display (e.g. $29)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="$29"
                    value={planFormPrice}
                    onChange={(e) => setPlanFormPrice(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase">
                    Price Numeric (for calculations)
                  </label>
                  <input
                    type="number"
                    required
                    value={planFormPriceNum}
                    onChange={(e) => setPlanFormPriceNum(Number(e.target.value))}
                    className="w-full h-10 px-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="Tailored plan description..."
                  value={planFormDescription}
                  onChange={(e) => setPlanFormDescription(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
                />
              </div>

              {/* Resource Quotas Grid */}
              <div className="p-4 rounded-xl bg-surface-container-high border border-surface-variant space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Resource Quotas & Allocation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block">
                      Max Members
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={planFormMaxMembers}
                      onChange={(e) => setPlanFormMaxMembers(Number(e.target.value))}
                      className="w-full h-9 px-3 rounded-lg bg-black/30 border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block">
                      Custom Sections
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={planFormMaxSections}
                      onChange={(e) => setPlanFormMaxSections(Number(e.target.value))}
                      className="w-full h-9 px-3 rounded-lg bg-black/30 border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block">
                      Storage Quota (MB)
                    </label>
                    <input
                      type="number"
                      min={100}
                      value={planFormMaxStorageMB}
                      onChange={(e) => setPlanFormMaxStorageMB(Number(e.target.value))}
                      className="w-full h-9 px-3 rounded-lg bg-black/30 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase">
                  Features (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder={"Unlimited Tasks & Routines\nCustom Database Fields\nPriority Email Support"}
                  value={planFormFeatures}
                  onChange={(e) => setPlanFormFeatures(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planFormIsActive}
                    onChange={(e) => setPlanFormIsActive(e.target.checked)}
                    className="rounded border-white/20 text-stitch-primary focus:ring-0"
                  />
                  <span>Active & Available for Users</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={planFormSaving}
                    className="px-5 py-2 rounded-xl bg-stitch-primary text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all disabled:opacity-50"
                  >
                    <span>{planFormSaving ? "Saving..." : "Save Plan"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: MULTI-AUDIENCE TARGETED MESSAGING MODAL */}
      {isTargetedMsgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-surface-variant shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-stitch-primary" />
                  <span>Dispatch Targeted Platform Notice</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send transactional emails and in-app dashboard notifications to chosen recipients.
                </p>
              </div>
              <button
                onClick={() => setIsTargetedMsgModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendTargetedMessage} className="space-y-4">
              {/* Audience Target Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase">
                  Target Audience
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "all", label: `All Users (${users.length})` },
                    {
                      id: "selected",
                      label: `Selected (${selectedUserIds.length})`,
                      disabled: selectedUserIds.length === 0,
                    },
                    { id: "plan", label: "By Subscription Plan" },
                    {
                      id: "single",
                      label: msgSingleUser
                        ? `User: ${msgSingleUser.name || msgSingleUser.email}`
                        : "Single Account",
                      disabled: !msgSingleUser,
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => setMsgTargetType(opt.id as AdminAny)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                        msgTargetType === opt.id
                          ? "bg-stitch-primary/20 border-stitch-primary/50 text-stitch-primary"
                          : "bg-surface-container-high border-surface-variant text-slate-300 hover:bg-white/5"
                      } ${opt.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan filter if targetType === 'plan' */}
              {msgTargetType === "plan" && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase">
                    Filter by Subscription Plan Tier
                  </label>
                  <select
                    value={msgPlanFilter}
                    onChange={(e) => setMsgPlanFilter(e.target.value)}
                    style={{ colorScheme: "dark" }}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-high border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary [&>option]:bg-[#141c2e] [&>option]:text-white"
                  >
                    <option value="pro" className="bg-[#141c2e] text-white">Pro Plan Subscribers</option>
                    <option value="enterprise" className="bg-[#141c2e] text-white">Enterprise Plan Subscribers</option>
                    <option value="free" className="bg-[#141c2e] text-white">Free Starter Users</option>
                  </select>
                </div>
              )}

              {/* Channels checkboxes */}
              <div className="p-3 rounded-xl bg-surface-container-high border border-surface-variant flex items-center justify-between">
                <span className="text-xs font-bold text-white">Delivery Channels:</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={msgSendNotif}
                      onChange={(e) => setMsgSendNotif(e.target.checked)}
                      className="rounded border-white/20 text-stitch-primary focus:ring-0"
                    />
                    <span>In-App Alert</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={msgSendEmail}
                      onChange={(e) => setMsgSendEmail(e.target.checked)}
                      className="rounded border-white/20 text-stitch-primary focus:ring-0"
                    />
                    <span>Direct Email (Resend)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Important Notice: Scheduled Platform Update"
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase">
                  Notice Body / Announcement Content
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type the message body to dispatch..."
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-variant">
                <button
                  type="button"
                  onClick={() => setIsTargetedMsgModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={msgSending || !msgSubject.trim() || !msgBody.trim()}
                  className="px-5 py-2 rounded-xl bg-stitch-primary text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{msgSending ? "Dispatching..." : "Send Announcement"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT TERMS & APPROVE UPGRADE REQUEST */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-surface-variant shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit className="w-4 h-4 text-stitch-primary" />
                  <span>Edit Terms & Approve Request</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adjust custom pricing, tier label, or validity duration before approving.
                </p>
              </div>
              <button
                onClick={() => setEditingRequest(null)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-high border border-surface-variant space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Workspace:</span>
                <span className="font-semibold text-white">
                  {editingRequest.workspaceId?.name || "Workspace"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Requested By:</span>
                <span className="font-semibold text-white">
                  {editingRequest.requestedBy?.name || editingRequest.requestedBy?.email}
                </span>
              </div>
            </div>

            <form onSubmit={handleApproveWithTerms} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase">
                  Plan Tier / Name
                </label>
                <input
                  type="text"
                  required
                  value={editReqPlan}
                  onChange={(e) => setEditReqPlan(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-black/20 border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase">
                    Approved Price ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editReqPrice}
                      onChange={(e) => setEditReqPrice(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 pl-7 pr-3 rounded-xl bg-black/20 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-stitch-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase">
                    Validity (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editReqDuration}
                    onChange={(e) => setEditReqDuration(parseInt(e.target.value) || 30)}
                    className="w-full h-10 px-3 rounded-xl bg-black/20 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-stitch-primary"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                Approving will automatically record an <strong>Income transaction (${Number(editReqPrice).toFixed(2)})</strong> in platform financials and extend the workspace validity by <strong>{editReqDuration} days</strong>.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-variant">
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editReqSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editReqSubmitting ? "Approving..." : "Confirm & Record Income"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: MANUAL RENEWAL PAYMENT RECORDING */}
      {manualPaymentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-surface-variant shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Record Renewal Payment</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record offline or manual payment, extend validity date, and log platform income.
                </p>
              </div>
              <button
                onClick={() => setManualPaymentUser(null)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-high border border-surface-variant space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">User:</span>
                <span className="font-semibold text-white">
                  {manualPaymentUser.name || manualPaymentUser.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Plan:</span>
                <span className="font-mono text-stitch-primary uppercase font-bold">
                  {manualPaymentUser.plan || "PRO"}
                </span>
              </div>
            </div>

            <form onSubmit={handleRecordManualPayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase">
                  Subscription Plan
                </label>
                <select
                  value={paymentPlan}
                  onChange={(e) => setPaymentPlan(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-high border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary [&>option]:bg-[#141c2e] [&>option]:text-white"
                >
                  <option value="pro" className="bg-[#141c2e] text-white">Pro Plan</option>
                  <option value="enterprise" className="bg-[#141c2e] text-white">Enterprise Plan</option>
                  <option value="custom" className="bg-[#141c2e] text-white">Custom Tailored Plan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase">
                    Amount Received ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 pl-7 pr-3 rounded-xl bg-black/20 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-stitch-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase">
                    Extend By (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={paymentDurationDays}
                    onChange={(e) => setPaymentDurationDays(parseInt(e.target.value) || 30)}
                    className="w-full h-10 px-3 rounded-xl bg-black/20 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-stitch-primary"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                This will activate the user&apos;s subscription for <strong>{paymentDurationDays} days</strong> and create an <strong>Income transaction</strong> in platform ledger.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-variant">
                <button
                  type="button"
                  onClick={() => setManualPaymentUser(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentRecording}
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{paymentRecording ? "Recording..." : "Record Payment & Issue Renewal"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: SUPPORT TICKET DETAILS & REPLY THREAD */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-surface border border-surface-variant shadow-2xl p-6 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-stitch-primary text-sm">
                    {activeTicket.ticketNumber}
                  </span>
                  <span className="text-white font-bold text-base truncate max-w-md">
                    {activeTicket.subject}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5" suppressHydrationWarning>
                  Opened by {activeTicket.userId?.name || "Customer"} ({activeTicket.userId?.email || ""}) • {formatDateTime(activeTicket.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setActiveTicket(null)}
                className="text-slate-400 hover:text-white text-lg shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Quick Status and Priority Toggles */}
            <div className="p-3 rounded-xl bg-surface-container-high border border-surface-variant flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Status:</span>
                <select
                  value={activeTicket.status}
                  onChange={(e) => handleUpdateTicketStatus(activeTicket._id, e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="h-7 px-2 rounded-lg bg-surface-container border border-white/10 text-white font-semibold text-xs focus:outline-none focus:border-stitch-primary capitalize [&>option]:bg-[#141c2e] [&>option]:text-white"
                >
                  <option value="open" className="bg-[#141c2e] text-white">Open</option>
                  <option value="in_progress" className="bg-[#141c2e] text-white">In Progress</option>
                  <option value="resolved" className="bg-[#141c2e] text-white">Resolved</option>
                  <option value="closed" className="bg-[#141c2e] text-white">Closed</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Priority:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stitch-primary/10 text-stitch-primary border border-stitch-primary/30">
                  {activeTicket.priority}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Assigned:</span>
                <select
                  value={activeTicket.assignedTo?._id || activeTicket.assignedTo || ""}
                  onChange={(e) => handleAssignTicket(activeTicket._id, e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="h-7 px-2 rounded-lg bg-surface-container border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary [&>option]:bg-[#141c2e] [&>option]:text-white"
                >
                  <option value="" className="bg-[#141c2e] text-white">Unassigned</option>
                  {supportAgents.map((agent: AdminAny) => (
                    <option key={agent._id} value={agent._id} className="bg-[#141c2e] text-white">
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scrollable Conversation Thread */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[360px]">
              {(activeTicket.messages || []).map((msg: AdminAny, i: number) => {
                const isStaff = msg.senderRole === "admin" || msg.senderRole === "support";
                return (
                  <div
                    key={i}
                    className={`flex flex-col ${isStaff ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
                      {isStaff ? (
                        <>
                          <span suppressHydrationWarning className="text-slate-500 font-mono text-[10px]">
                            {formatTime(msg.createdAt)}
                          </span>
                          <span className="font-bold text-white">{msg.senderName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-stitch-primary text-black">
                            Staff
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-white">{msg.senderName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-white/10 text-slate-300">
                            Customer
                          </span>
                          <span suppressHydrationWarning className="text-slate-500 font-mono text-[10px]">
                            {formatTime(msg.createdAt)}
                          </span>
                        </>
                      )}
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl border text-xs sm:text-sm leading-relaxed max-w-[85%] ${
                        isStaff
                          ? "bg-stitch-primary/15 border-stitch-primary/30 text-white rounded-tr-none shadow-[0_0_15px_rgba(125,211,252,0.1)]"
                          : "bg-surface-container-high border-surface-variant text-slate-200 rounded-tl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-2">
                          {msg.attachments.map((att: AdminAny, attIdx: number) => (
                            <a
                              key={attIdx}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-white/10 text-stitch-primary hover:underline text-[10px]"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{att.originalFilename || "Attachment"}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Staff Reply Form */}
            <form
              onSubmit={handleReplyTicket}
              className="space-y-3 pt-2 border-t border-surface-variant shrink-0"
            >
              <div className="space-y-1">
                <textarea
                  required
                  rows={3}
                  placeholder={`Write staff response to ${
                    activeTicket.userId?.name || "customer"
                  }...`}
                  value={ticketReplyText}
                  onChange={(e) => setTicketReplyText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Next status on reply:</span>
                  <select
                    value={ticketNextStatus}
                    onChange={(e) => setTicketNextStatus(e.target.value)}
                    style={{ colorScheme: "dark" }}
                    className="h-7 px-2 rounded-lg bg-surface-container border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary capitalize [&>option]:bg-[#141c2e] [&>option]:text-white"
                  >
                    <option value="in_progress" className="bg-[#141c2e] text-white">Keep In Progress</option>
                    <option value="resolved" className="bg-[#141c2e] text-white">Mark as Resolved</option>
                    <option value="closed" className="bg-[#141c2e] text-white">Close Ticket</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTicket(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={ticketReplySending || !ticketReplyText.trim()}
                    className="px-5 py-2 rounded-xl bg-stitch-primary text-black font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{ticketReplySending ? "Sending..." : "Send Staff Reply"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
