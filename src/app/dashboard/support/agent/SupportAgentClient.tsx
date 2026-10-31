"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Users,
  MessageSquare,
  Send,
  Search,
  Filter,
  Check,
  X,
  ShieldCheck,
  Headphones,
  Sparkles,
  RefreshCw,
  Mail,
  ChevronRight,
  UserCheck,
  Layers,
  AlertTriangle,
  User as UserIcon,
} from "lucide-react";
import {
  replyToSupportTicket,
  updateTicketStatus,
  assignSupportTicket,
  claimSupportTicket,
  sendDirectAgentEmail,
  getSupportAgentDashboardData,
  getSupportCustomerDirectory,
  markTicketReadByStaff,
} from "@/actions/ticket.actions";
import { formatDate, formatTime } from "@/lib/dateUtils";
import MemberAvatar from "@/components/workspace/MemberAvatar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupportAgentAny = any;

export default function SupportAgentClient({
  initialData,
  initialCustomers,
  user: _user,
}: {
  initialData: SupportAgentAny;
  initialCustomers: SupportAgentAny[];
  user: SupportAgentAny;
}) {
  const [activeTab, setActiveTab] = useState<"tickets" | "customers">("tickets");
  const [tickets, setTickets] = useState<SupportAgentAny[]>(initialData.tickets || []);
  const [metrics, setMetrics] = useState<SupportAgentAny>(initialData.metrics || {});
  const [agents, setAgents] = useState<SupportAgentAny[]>(initialData.agents || []);
  const [customers, setCustomers] = useState<SupportAgentAny[]>(initialCustomers || []);
  const [selectedTicket, setSelectedTicket] = useState<SupportAgentAny | null>(
    initialData.tickets && initialData.tickets.length > 0 ? initialData.tickets[0] : null
  );

  const handleSelectTicket = async (ticket: SupportAgentAny) => {
    setSelectedTicket(ticket);
    if (ticket.staffHasUnread) {
      setTickets((prev) =>
        prev.map((t) => (t._id === ticket._id ? { ...t, staffHasUnread: false } : t))
      );
      try {
        await markTicketReadByStaff(ticket._id);
      } catch (err) {
        console.error("Failed to mark ticket read by staff:", err);
      }
    }
  };

  // Filters for Tickets
  const [scopeFilter, setScopeFilter] = useState<"all" | "mine" | "unassigned" | "urgent">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [ticketSearch, setTicketSearch] = useState<string>("");

  // Filters for Customers
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [customerPlanFilter, setCustomerPlanFilter] = useState<string>("all");

  // Reply Draft
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // Email Modal State
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
    customer: SupportAgentAny | null;
    subject: string;
    message: string;
    isSending: boolean;
  }>({
    isOpen: false,
    customer: null,
    subject: "",
    message: "",
    isSending: false,
  });

  // UI feedback & Refreshing state
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [freshData, freshCustomers] = await Promise.all([
        getSupportAgentDashboardData(),
        getSupportCustomerDirectory(),
      ]);
      setTickets(freshData.tickets || []);
      setMetrics(freshData.metrics || {});
      setAgents(freshData.agents || []);
      setCustomers(freshCustomers || []);
      if (selectedTicket) {
        const updated = freshData.tickets?.find((t: SupportAgentAny) => t._id === selectedTicket._id);
        if (updated) setSelectedTicket(updated);
      }
      showFeedback("success", "Queue refreshed successfully");
    } catch (err: unknown) {
      const e = err as Error;
      showFeedback("error", e.message || "Failed to refresh desk");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Reply to ticket
  const handleSendReply = async (newStatus?: "in_progress" | "resolved" | "closed") => {
    if (!replyText.trim() || !selectedTicket) return;

    setIsReplying(true);
    try {
      const res = await replyToSupportTicket(selectedTicket._id, { message: replyText.trim() });
      if (res.success) {
        const updatedTicket = { ...res.ticket };

        if (newStatus && newStatus !== updatedTicket.status) {
          await updateTicketStatus(selectedTicket._id, newStatus);
          updatedTicket.status = newStatus;
          if (newStatus === "resolved") updatedTicket.resolvedAt = new Date().toISOString();
          if (newStatus === "closed") updatedTicket.closedAt = new Date().toISOString();
        }

        setSelectedTicket(updatedTicket);
        setTickets((prev) =>
          prev.map((t) => (t._id === selectedTicket._id ? updatedTicket : t))
        );
        setReplyText("");
        showFeedback("success", "Reply dispatched to customer.");
      }
    } catch (err: unknown) {
      const e = err as Error;
      showFeedback("error", e.message || "Failed to send response");
    } finally {
      setIsReplying(false);
    }
  };

  // Status Change
  const handleStatusChange = async (ticketId: string, status: "open" | "in_progress" | "resolved" | "closed") => {
    try {
      await updateTicketStatus(ticketId, status);
      const updated = { ...selectedTicket, status };
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t._id === ticketId ? { ...t, status } : t)));
      showFeedback("success", `Ticket status updated to ${status.toUpperCase()}`);
    } catch (err: unknown) {
      const e = err as Error;
      showFeedback("error", e.message || "Failed to update status");
    }
  };

  // Claim Ticket (Assign to Me)
  const handleClaimTicket = async (ticketId: string) => {
    try {
      await claimSupportTicket(ticketId);
      const currentAgentObj = {
        _id: initialData.currentAgent?._id,
        name: initialData.currentAgent?.name,
        email: initialData.currentAgent?.email,
      };
      const updated = {
        ...selectedTicket,
        assignedTo: currentAgentObj,
        status: selectedTicket.status === "open" ? "in_progress" : selectedTicket.status,
      };
      setSelectedTicket(updated);
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? updated : t))
      );
      showFeedback("success", "Ticket assigned to your queue!");
    } catch (err: unknown) {
      const e = err as Error;
      showFeedback("error", e.message || "Failed to claim ticket");
    }
  };

  // Assign to specific agent
  const handleAssignAgent = async (ticketId: string, agentId: string) => {
    try {
      await assignSupportTicket(ticketId, agentId === "unassigned" ? null : agentId);
      const targetAgent = agents.find((a) => a._id === agentId);
      const updated = {
        ...selectedTicket,
        assignedTo: targetAgent ? { _id: targetAgent._id, name: targetAgent.name, email: targetAgent.email } : null,
      };
      setSelectedTicket(updated);
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? updated : t))
      );
      showFeedback("success", targetAgent ? `Ticket assigned to ${targetAgent.name}` : "Ticket unassigned");
    } catch (err: unknown) {
      const e = err as Error;
      showFeedback("error", e.message || "Failed to assign ticket");
    }
  };

  // Send Direct Email to Customer
  const handleSendDirectEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailModal.customer || !emailModal.subject.trim() || !emailModal.message.trim()) {
      showFeedback("error", "Subject and message are required.");
      return;
    }

    setEmailModal((prev) => ({ ...prev, isSending: true }));
    try {
      await sendDirectAgentEmail({
        userId: emailModal.customer._id,
        subject: emailModal.subject.trim(),
        message: emailModal.message.trim(),
      });
      showFeedback("success", `Direct message sent to ${emailModal.customer.email}`);
      setEmailModal({ isOpen: false, customer: null, subject: "", message: "", isSending: false });
    } catch (err: unknown) {
      const e = err as Error;
      showFeedback("error", e.message || "Failed to send email");
      setEmailModal((prev) => ({ ...prev, isSending: false }));
    }
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    // Scope Filter
    if (scopeFilter === "mine") {
      if (t.assignedTo?._id !== initialData.currentAgent?._id) return false;
    } else if (scopeFilter === "unassigned") {
      if (t.assignedTo) return false;
    } else if (scopeFilter === "urgent") {
      if (t.priority !== "urgent" && t.priority !== "high") return false;
    }

    // Status Filter
    if (statusFilter !== "all" && t.status !== statusFilter) return false;

    // Priority Filter
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;

    // Category Filter
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;

    // Search Query
    if (ticketSearch.trim()) {
      const q = ticketSearch.toLowerCase();
      const matchNumber = t.ticketNumber?.toLowerCase().includes(q);
      const matchSubject = t.subject?.toLowerCase().includes(q);
      const matchUser = t.userId?.name?.toLowerCase().includes(q) || t.userId?.email?.toLowerCase().includes(q);
      if (!matchNumber && !matchSubject && !matchUser) return false;
    }

    return true;
  });

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    if (customerPlanFilter !== "all" && (c.plan || "free").toLowerCase() !== customerPlanFilter.toLowerCase()) {
      return false;
    }
    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      const matchWorkspace = c.workspaces?.some((ws: SupportAgentAny) => ws.name?.toLowerCase().includes(q));
      if (!matchName && !matchEmail && !matchWorkspace) return false;
    }
    return true;
  });

  // Canned Responses
  const cannedResponses = [
    "Hello! Our support engineering team is investigating your report and will follow up shortly.",
    "Could you please share a screenshot or details about the exact browser/action where you experienced this?",
    "We have identified and resolved the issue. Could you please refresh your page and confirm on your end?",
    "Billing update: Your transaction records and subscription tier have been synchronized successfully.",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-semibold transition-all ${
            feedback.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
              : "bg-red-950/90 border-red-500/50 text-red-200"
          }`}
        >
          {feedback.type === "success" ? <Check className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-variant">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Headphones className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-extrabold text-white">Support Specialist Operations Desk</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Agent Workspace
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Logged in as <strong className="text-white">{initialData.currentAgent?.name}</strong> ({initialData.currentAgent?.email}) • Centralized customer queues, live replies, and user management.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-surface-container border border-surface-variant text-slate-300 text-xs font-semibold hover:text-white flex items-center gap-2 transition-all hover:border-slate-500 disabled:opacity-50"
            title="Refresh tickets queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/dashboard/support"
            className="px-3.5 py-2 rounded-xl bg-surface-container-high border border-surface-variant text-slate-300 text-xs font-semibold hover:text-white flex items-center gap-2 transition-all"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-stitch-primary" />
            <span>My Personal Tickets</span>
          </Link>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-surface-container border border-surface-variant flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned to Me</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-cyan-400">{metrics.myAssigned || 0}</span>
            <span className="text-[10px] text-cyan-300/80 font-medium">Active: {metrics.myOpen || 0}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container border border-surface-variant flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Open Tickets</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-400">{metrics.open || 0}</span>
            <span className="text-[10px] text-slate-400 font-medium">Pending 1st reply</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container border border-surface-variant flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unassigned</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400">{metrics.unassigned || 0}</span>
            <span className="text-[10px] text-amber-300/80 font-medium">Needs claim</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container border border-surface-variant flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Progress</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-400">{metrics.inProgress || 0}</span>
            <span className="text-[10px] text-purple-300/80 font-medium">Ongoing</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container border border-surface-variant flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Resolved</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400">{metrics.resolved || 0}</span>
            <span className="text-[10px] text-emerald-300/80 font-medium">Closed: {metrics.closed || 0}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container border border-surface-variant flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Customers</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{metrics.totalCustomers || customers.length}</span>
            <span className="text-[10px] text-slate-400 font-medium">Registered</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-surface-variant pb-2">
        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === "tickets"
              ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-surface-container"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Tickets & Inquiries Queue ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("customers")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === "customers"
              ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-surface-container"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Directory & History ({customers.length})</span>
        </button>
      </div>

      {/* TAB 1: TICKETS QUEUE & WORKSPACE */}
      {activeTab === "tickets" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-surface-container border border-surface-variant space-y-3">
            {/* Quick Scope Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Scope:
              </span>
              <button
                onClick={() => setScopeFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  scopeFilter === "all"
                    ? "bg-stitch-primary text-black"
                    : "bg-surface-container-high text-slate-300 hover:text-white"
                }`}
              >
                All Tickets ({tickets.length})
              </button>
              <button
                onClick={() => setScopeFilter("mine")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  scopeFilter === "mine"
                    ? "bg-cyan-500 text-black"
                    : "bg-surface-container-high text-slate-300 hover:text-white"
                }`}
              >
                Assigned to Me ({tickets.filter((t) => t.assignedTo?._id === initialData.currentAgent?._id).length})
              </button>
              <button
                onClick={() => setScopeFilter("unassigned")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  scopeFilter === "unassigned"
                    ? "bg-amber-400 text-black"
                    : "bg-surface-container-high text-slate-300 hover:text-white"
                }`}
              >
                Unassigned ({tickets.filter((t) => !t.assignedTo).length})
              </button>
              <button
                onClick={() => setScopeFilter("urgent")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  scopeFilter === "urgent"
                    ? "bg-red-500 text-white"
                    : "bg-surface-container-high text-slate-300 hover:text-white"
                }`}
              >
                Urgent & High ({tickets.filter((t) => t.priority === "urgent" || t.priority === "high").length})
              </button>
            </div>

            {/* Dropdown Filters & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-surface-variant/50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ticket #, subject, or customer..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-high border border-surface-variant text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-surface-variant text-xs text-white focus:outline-none focus:border-cyan-500 [&>option]:bg-[#141c2e] [&>option]:text-white"
                >
                  <option value="all">Status: All Statuses</option>
                  <option value="open">Status: Open</option>
                  <option value="in_progress">Status: In Progress</option>
                  <option value="resolved">Status: Resolved</option>
                  <option value="closed">Status: Closed</option>
                </select>
              </div>

              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-surface-variant text-xs text-white focus:outline-none focus:border-cyan-500 [&>option]:bg-[#141c2e] [&>option]:text-white"
                >
                  <option value="all">Priority: All Priorities</option>
                  <option value="urgent">Priority: Urgent</option>
                  <option value="high">Priority: High</option>
                  <option value="medium">Priority: Medium</option>
                  <option value="low">Priority: Low</option>
                </select>
              </div>

              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-surface-variant text-xs text-white focus:outline-none focus:border-cyan-500 [&>option]:bg-[#141c2e] [&>option]:text-white"
                >
                  <option value="all">Category: All Categories</option>
                  <option value="technical">Category: Technical Issue</option>
                  <option value="billing">Category: Billing & Payment</option>
                  <option value="account">Category: Account & Security</option>
                  <option value="feature_request">Category: Feature Request</option>
                  <option value="general">Category: General Inquiry</option>
                </select>
              </div>
            </div>
          </div>

          {/* Two-Column Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Tickets Queue List (5 cols) */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[780px] overflow-y-auto pr-1">
              {filteredTickets.length === 0 ? (
                <div className="p-8 rounded-2xl bg-surface-container border border-surface-variant text-center space-y-2">
                  <LifeBuoy className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-sm font-bold text-white">No tickets match this filter</p>
                  <p className="text-xs text-slate-400">Clear your filters or select a different scope.</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isSelected = selectedTicket?._id === ticket._id;
                  const isAssignedToMe = ticket.assignedTo?._id === initialData.currentAgent?._id;

                  return (
                    <div
                      key={ticket._id}
                      onClick={() => handleSelectTicket(ticket)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-surface-container-high border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500"
                          : "bg-surface-container border-surface-variant hover:border-slate-500/80 hover:bg-surface-container-high/60"
                      }`}
                    >
                      {/* Top: Ticket Number, Badges */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400">{ticket.ticketNumber}</span>
                          {ticket.staffHasUnread && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500 text-white animate-pulse shadow-sm shadow-rose-500/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              Unread
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              ticket.status === "open"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : ticket.status === "in_progress"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : ticket.status === "resolved"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
                            }`}
                          >
                            {ticket.status.replace("_", " ")}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            ticket.priority === "urgent"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : ticket.priority === "high"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </div>

                      {/* Subject */}
                      <h4 className="text-sm font-bold text-white line-clamp-1">{ticket.subject}</h4>

                      {/* Snippet */}
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {ticket.messages && ticket.messages.length > 0
                          ? ticket.messages[ticket.messages.length - 1].message
                          : "No messages yet."}
                      </p>

                      {/* Customer Info & Assigned Agent */}
                      <div className="mt-3 pt-2.5 border-t border-surface-variant/60 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <MemberAvatar
                            name={ticket.userId?.name || "Customer"}
                            avatarUrl={ticket.userId?.avatarUrl || ticket.userId?.image}
                            avatarPublicId={ticket.userId?.avatarPublicId}
                            size="sm"
                            className="w-4 h-4 text-[9px]"
                          />
                          <span className="text-slate-300 font-medium">{ticket.userId?.name || "Customer"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {ticket.assignedTo ? (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                isAssignedToMe
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                                  : "bg-slate-800 text-slate-300 border border-slate-700"
                              }`}
                            >
                              {isAssignedToMe ? "Assigned to You" : ticket.assignedTo.name}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              Unassigned
                            </span>
                          )}
                          <span suppressHydrationWarning className="text-[10px] text-slate-500">
                            {formatDate(ticket.lastReplyAt || ticket.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Ticket Conversation Workspace (7 cols) */}
            <div className="lg:col-span-7 bg-surface-container border border-surface-variant rounded-2xl overflow-hidden flex flex-col min-h-[680px]">
              {selectedTicket ? (
                <>
                  {/* Workspace Header */}
                  <div className="p-5 border-b border-surface-variant bg-surface-container-high/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-extrabold text-cyan-400">{selectedTicket.ticketNumber}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                            {selectedTicket.category}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                              selectedTicket.priority === "urgent"
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {selectedTicket.priority} Priority
                          </span>
                        </div>
                        <h2 className="text-lg font-extrabold text-white mt-1">{selectedTicket.subject}</h2>
                      </div>

                      {/* Status Selector */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs font-semibold text-slate-400">Status:</span>
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => handleStatusChange(selectedTicket._id, e.target.value as "open" | "in_progress" | "resolved" | "closed")}
                          style={{ colorScheme: "dark" }}
                          className="px-3 py-1.5 rounded-xl bg-[#141c2e] border border-cyan-500/40 text-xs font-bold text-white focus:outline-none [&>option]:bg-[#141c2e] [&>option]:text-white"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>

                    {/* Customer Info Strip & Assignment Controls */}
                    <div className="p-3 rounded-xl bg-surface-container border border-surface-variant/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 border border-slate-700">
                          <MemberAvatar
                            name={selectedTicket.userId?.name || "Customer"}
                            avatarUrl={selectedTicket.userId?.avatarUrl || selectedTicket.userId?.image}
                            avatarPublicId={selectedTicket.userId?.avatarPublicId}
                            size="md"
                            className="w-full h-full border-0"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-white">{selectedTicket.userId?.name || "Customer"}</strong>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                              {selectedTicket.userId?.subscription?.plan || "free"} plan
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">{selectedTicket.userId?.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Assign Agent Selector */}
                        <select
                          value={selectedTicket.assignedTo?._id || "unassigned"}
                          onChange={(e) => handleAssignAgent(selectedTicket._id, e.target.value)}
                          style={{ colorScheme: "dark" }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#141c2e] border border-surface-variant text-xs text-white [&>option]:bg-[#141c2e] [&>option]:text-white"
                        >
                          <option value="unassigned">-- Unassigned --</option>
                          {agents.map((agent) => (
                            <option key={agent._id} value={agent._id}>
                              {agent.name} ({agent.isPlatformAdmin ? "Admin" : "Agent"})
                            </option>
                          ))}
                        </select>

                        {/* Claim Button */}
                        {selectedTicket.assignedTo?._id !== initialData.currentAgent?._id && (
                          <button
                            onClick={() => handleClaimTicket(selectedTicket._id)}
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/30 transition-all flex items-center gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Claim Ticket</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Conversation Messages */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[460px]">
                    {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                      selectedTicket.messages.map((msg: SupportAgentAny, index: number) => {
                        const isAgentOrAdmin = msg.senderRole === "support" || msg.senderRole === "admin";
                        return (
                          <div
                            key={index}
                            className={`flex flex-col ${isAgentOrAdmin ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                              {isAgentOrAdmin ? (
                                <>
                                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    {msg.senderRole === "admin" ? "Platform Admin" : "Support Specialist"}
                                  </span>
                                  <strong className="text-white">{msg.senderName}</strong>
                                </>
                              ) : (
                                <>
                                  <strong className="text-white">{msg.senderName}</strong>
                                  <span className="text-[10px] text-slate-500">Customer</span>
                                </>
                              )}
                              <span>•</span>
                              <span suppressHydrationWarning>{formatTime(msg.createdAt)}</span>
                            </div>

                            <div
                              className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                isAgentOrAdmin
                                  ? "bg-cyan-950/40 text-cyan-50 border border-cyan-500/30 rounded-tr-none shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                                  : "bg-surface-container-high text-slate-200 border border-surface-variant rounded-tl-none"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-xs text-slate-500 py-8">No conversation messages found.</p>
                    )}
                  </div>

                  {/* Canned Responses & Reply Box */}
                  <div className="p-4 border-t border-surface-variant bg-surface-container-high/30 space-y-3">
                    {/* Canned Templates */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" /> Quick Response Templates:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cannedResponses.map((text, idx) => (
                          <button
                            key={idx}
                            onClick={() => setReplyText(text)}
                            className="px-2.5 py-1 rounded-lg bg-surface-container border border-surface-variant text-[11px] text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all text-left line-clamp-1"
                          >
                            {text.substring(0, 42)}...
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Response Textarea */}
                    <div className="relative">
                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Draft an official support reply to the customer..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-surface-variant text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="text-[11px] text-slate-400">
                        Replying as: <strong className="text-white">{initialData.currentAgent?.name}</strong> (Manageo Staff)
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendReply("resolved")}
                          disabled={isReplying || !replyText.trim()}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                        >
                          Send & Resolve
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendReply("in_progress")}
                          disabled={isReplying || !replyText.trim()}
                          className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isReplying ? "Sending..." : "Send Reply"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3 text-slate-400">
                  <LifeBuoy className="w-12 h-12 text-slate-600" />
                  <h3 className="text-base font-bold text-white">Select a Ticket to Review</h3>
                  <p className="text-xs max-w-sm">
                    Choose an inquiry from the queue on the left to inspect conversation history, claim the ticket, or send replies.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER DIRECTORY & HISTORY */}
      {activeTab === "customers" && (
        <div className="space-y-4">
          {/* Customer Search & Filter */}
          <div className="p-4 rounded-2xl bg-surface-container border border-surface-variant flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customers by name, email, or workspace..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-high border border-surface-variant text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <span className="text-xs font-semibold text-slate-400">Filter Plan:</span>
              <select
                value={customerPlanFilter}
                onChange={(e) => setCustomerPlanFilter(e.target.value)}
                style={{ colorScheme: "dark" }}
                className="px-3 py-2 rounded-xl bg-surface-container-high border border-surface-variant text-xs text-white focus:outline-none [&>option]:bg-[#141c2e] [&>option]:text-white"
              >
                <option value="all">All Plans</option>
                <option value="free">Free Plan</option>
                <option value="pro">Pro Plan</option>
                <option value="enterprise">Enterprise Plan</option>
              </select>
            </div>
          </div>

          {/* Customer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full p-12 text-center rounded-2xl bg-surface-container border border-surface-variant space-y-2">
                <Users className="w-8 h-8 text-slate-500 mx-auto" />
                <h4 className="text-sm font-bold text-white">No customers found</h4>
                <p className="text-xs text-slate-400">Try modifying your search query or filter.</p>
              </div>
            ) : (
              filteredCustomers.map((cust) => (
                <div
                  key={cust._id}
                  className="p-5 rounded-2xl bg-surface-container border border-surface-variant hover:border-slate-500/80 transition-all space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm">
                          <MemberAvatar
                            name={cust.name || "Customer"}
                            avatarUrl={cust.avatarUrl || cust.image}
                            avatarPublicId={cust.avatarPublicId}
                            size="md"
                            className="w-full h-full border-0"
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white line-clamp-1">{cust.name}</h4>
                          <p className="text-xs text-slate-400 line-clamp-1">{cust.email}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          cust.plan === "enterprise"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : cust.plan === "pro"
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {cust.plan || "free"}
                      </span>
                    </div>

                    {/* Workspaces & Member Type */}
                    <div className="p-2.5 rounded-xl bg-surface-container-high/60 border border-surface-variant/50 text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-500" /> Workspaces & Tenancy:
                      </span>
                      {cust.workspaces && cust.workspaces.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cust.workspaces.map((ws: SupportAgentAny, idx: number) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-surface-container border border-surface-variant text-slate-300"
                            >
                              {ws.name} ({ws.role})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">Personal workspace only</span>
                      )}
                    </div>

                    {/* Support Statistics */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-surface-container-high/40 border border-surface-variant/40">
                        <span className="text-[10px] text-slate-400">Total Tickets</span>
                        <p className="text-sm font-bold text-white mt-0.5">{cust.totalTickets || 0}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-surface-container-high/40 border border-surface-variant/40">
                        <span className="text-[10px] text-slate-400">Open Tickets</span>
                        <p className={`text-sm font-bold mt-0.5 ${(cust.openTickets || 0) > 0 ? "text-cyan-400" : "text-slate-400"}`}>
                          {cust.openTickets || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-surface-variant/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setEmailModal({
                          isOpen: true,
                          customer: cust,
                          subject: "",
                          message: "",
                          isSending: false,
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-surface-container-high border border-surface-variant text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Mail className="w-3 h-3 text-cyan-400" />
                      <span>Direct Email</span>
                    </button>

                    <button
                      onClick={() => {
                        setTicketSearch(cust.email);
                        setActiveTab("tickets");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <span>Filter Tickets</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DIRECT EMAIL MODAL */}
      {emailModal.isOpen && emailModal.customer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface-container border border-surface-variant rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-surface-variant flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-cyan-400" />
                  <span>Send Direct Email to Customer</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recipient: <strong className="text-white">{emailModal.customer.name}</strong> ({emailModal.customer.email})
                </p>
              </div>
              <button
                onClick={() => setEmailModal({ isOpen: false, customer: null, subject: "", message: "", isSending: false })}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-container-high"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendDirectEmail} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Important update regarding your Manageo account / ticket"
                  value={emailModal.subject}
                  onChange={(e) => setEmailModal({ ...emailModal, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-surface-variant text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Message Content</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Write official support notification to customer..."
                  value={emailModal.message}
                  onChange={(e) => setEmailModal({ ...emailModal, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-surface-variant text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailModal({ isOpen: false, customer: null, subject: "", message: "", isSending: false })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailModal.isSending}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{emailModal.isSending ? "Sending..." : "Send Message"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
