"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  ArrowLeft,
  ShieldCheck,
  Search,
  Filter,
  Check,
  X,
  FileText,
  User as UserIcon,
  Headphones,
  ArrowRight,
} from "lucide-react";
import {
  createSupportTicket,
  replyToSupportTicket,
  updateTicketStatus,
  markTicketReadByUser,
} from "@/actions/ticket.actions";
import { formatDate, formatTime } from "@/lib/dateUtils";

export default function SupportClient({
  initialTickets,
  user,
  isStaff = false,
}: {
  initialTickets: any[];
  user: any;
  isStaff?: boolean;
}) {
  const [tickets, setTickets] = useState<any[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const handleSelectTicket = async (t: any) => {
    setSelectedTicket(t);
    if (t.userHasUnread) {
      setTickets((prev) =>
        prev.map((item) =>
          item._id === t._id ? { ...item, userHasUnread: false } : item
        )
      );
      try {
        await markTicketReadByUser(t._id);
      } catch (err) {
        console.error("Failed to mark ticket read:", err);
      }
    }
  };

  // New Ticket Form State
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<
    "billing" | "technical" | "account" | "feature_request" | "general"
  >("general");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">(
    "medium"
  );
  const [initialMessage, setInitialMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply State
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) {
      showFeedback("error", "Subject and message are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createSupportTicket({
        subject,
        category,
        priority,
        message: initialMessage,
      });

      if (res.success) {
        showFeedback(
          "success",
          `Ticket #${res.ticketNumber} created successfully! Our support specialists have been notified.`
        );
        setIsNewTicketOpen(false);
        setSubject("");
        setInitialMessage("");

        // Add to local state
        const newTicketObj = {
          _id: res.ticketId,
          ticketNumber: res.ticketNumber,
          subject,
          category,
          priority,
          status: "open",
          createdAt: new Date().toISOString(),
          lastReplyAt: new Date().toISOString(),
          messages: [
            {
              senderName: user.name || "Customer",
              senderRole: "user",
              message: initialMessage,
              createdAt: new Date().toISOString(),
            },
          ],
        };
        setTickets([newTicketObj, ...tickets]);
        setSelectedTicket(newTicketObj);
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to create ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setIsReplying(true);
    try {
      await replyToSupportTicket(selectedTicket._id, { message: replyText });

      const newMsg = {
        senderName: user.name || "You",
        senderRole: "user",
        message: replyText,
        createdAt: new Date().toISOString(),
      };

      const updatedTicket = {
        ...selectedTicket,
        status: "open",
        lastReplyAt: new Date().toISOString(),
        messages: [...(selectedTicket.messages || []), newMsg],
      };

      setSelectedTicket(updatedTicket);
      setTickets((prev) =>
        prev.map((t) => (t._id === selectedTicket._id ? updatedTicket : t))
      );
      setReplyText("");
      showFeedback("success", "Reply sent to support desk.");
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!confirm("Are you sure you want to mark this support ticket as resolved?")) return;
    try {
      await updateTicketStatus(ticketId, "resolved");
      const updated = { ...selectedTicket, status: "resolved" };
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t._id === ticketId ? updated : t)));
      showFeedback("success", "Ticket marked as resolved. Thank you!");
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to update ticket");
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketNumber?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Staff Workspace Quick Banner */}
      {isStaff && (
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Support Specialist Operations Desk Available</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Staff Portal</span>
              </h3>
              <p className="text-xs text-slate-300">
                You are currently viewing personal ticket submissions. Switch to the Support Agent Desk to view customer queues, reply to users, and manage tickets.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/support/agent"
            className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
          >
            <span>Open Support Agent Desk</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-variant">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <LifeBuoy className="w-6 h-6 text-stitch-primary" />
            <span>Manageo Support & Help Desk</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Open inquiries, consult with assigned support specialists, and track ticket resolutions.
          </p>
        </div>

        <button
          onClick={() => setIsNewTicketOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-stitch-primary text-black font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Open New Ticket</span>
        </button>
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

      {/* Main Ticket Layout: Sidebar list + Conversation View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* Left Column: Tickets Roster */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-surface border border-surface-variant space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket # or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-stitch-primary"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {["all", "open", "in_progress", "resolved"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg font-semibold capitalize whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? "bg-stitch-primary text-black font-bold"
                      : "bg-surface-container text-slate-400 hover:text-white"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Cards List */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredTickets.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface border border-surface-variant text-center space-y-3">
                <MessageSquare className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">No support tickets found.</p>
                <button
                  onClick={() => setIsNewTicketOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-stitch-primary/10 text-stitch-primary text-xs font-semibold hover:bg-stitch-primary/20 transition-colors"
                >
                  Create your first ticket
                </button>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?._id === t._id;
                return (
                  <div
                    key={t._id}
                    onClick={() => handleSelectTicket(t)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-stitch-primary/10 border-stitch-primary shadow-[0_0_15px_rgba(125,211,252,0.15)]"
                        : "bg-surface border-surface-variant hover:border-white/20 hover:bg-surface-container"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-stitch-primary">
                            {t.ticketNumber}
                          </span>
                          {t.userHasUnread && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500 text-white animate-pulse shadow-sm shadow-rose-500/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              New Reply
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{t.subject}</h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                          t.status === "open"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : t.status === "in_progress"
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-surface-variant/40 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="capitalize">{t.category}</span>
                      <span suppressHydrationWarning className="font-mono">
                        {formatDate(t.lastReplyAt || t.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation Thread */}
        <div className="lg:col-span-7 bg-surface rounded-2xl border border-surface-variant p-6 flex flex-col justify-between">
          {selectedTicket ? (
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              {/* Ticket Top Bar */}
              <div className="pb-4 border-b border-surface-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-stitch-primary">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        selectedTicket.priority === "urgent"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : selectedTicket.priority === "high"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                      }`}
                    >
                      {selectedTicket.priority} Priority
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{selectedTicket.subject}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.status !== "resolved" && (
                    <button
                      onClick={() => handleCloseTicket(selectedTicket._id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Thread */}
              <div className="space-y-4 flex-1 max-h-[380px] overflow-y-auto pr-1">
                {selectedTicket.messages?.map((msg: any, idx: number) => {
                  const isStaff = msg.senderRole === "admin" || msg.senderRole === "support";
                  const isMyMessage = !isStaff;

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}
                    >
                      {/* Sender Name & Timestamp */}
                      <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
                        {isStaff ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-stitch-primary" />
                            <span className="font-bold text-white">{msg.senderName}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-stitch-primary text-black font-extrabold uppercase">
                              Staff
                            </span>
                            <span suppressHydrationWarning className="text-slate-500 font-mono text-[10px]">
                              {formatTime(msg.createdAt)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span suppressHydrationWarning className="text-slate-500 font-mono text-[10px]">
                              {formatTime(msg.createdAt)}
                            </span>
                            <span className="font-bold text-white">{msg.senderName}</span>
                          </>
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] ${
                          isMyMessage
                            ? "bg-stitch-primary/15 border border-stitch-primary/30 text-white rounded-tr-none shadow-[0_0_15px_rgba(125,211,252,0.1)]"
                            : "bg-surface-container-high border border-surface-variant text-slate-200 rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="pt-2 flex flex-wrap gap-2">
                            {msg.attachments.map((att: any, attIdx: number) => (
                              <a
                                key={attIdx}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-white/10 text-stitch-primary hover:underline text-[10px]"
                              >
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

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-surface-variant space-y-2">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response to support..."
                  className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-stitch-primary"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Press send to notify assigned support agents.
                  </span>
                  <button
                    type="submit"
                    disabled={isReplying || !replyText.trim()}
                    className="px-4 py-2 rounded-xl bg-stitch-primary text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isReplying ? "Sending..." : "Send Reply"}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-8">
              <LifeBuoy className="w-12 h-12 text-slate-600" />
              <h3 className="text-sm font-bold text-white">Select a Ticket to View Discussion</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Choose an inquiry from the left panel to review messages, replies, and collaborate directly with our team.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Open New Ticket */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-surface border border-surface-variant shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-stitch-primary" />
                  <span>Create New Support Ticket</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Submit a detailed inquiry for priority assistance from our specialists.
                </p>
              </div>
              <button
                onClick={() => setIsNewTicketOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Issue connecting bank feed or Custom Section permissions"
                  className="w-full h-10 px-3 rounded-xl bg-black/20 border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    style={{ colorScheme: "dark" }}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-high border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary [&>option]:bg-[#141c2e] [&>option]:text-white"
                  >
                    <option value="general" className="bg-[#141c2e] text-white">General Support</option>
                    <option value="billing" className="bg-[#141c2e] text-white">Billing & Invoices</option>
                    <option value="technical" className="bg-[#141c2e] text-white">Technical Issue</option>
                    <option value="account" className="bg-[#141c2e] text-white">Account & Auth</option>
                    <option value="feature_request" className="bg-[#141c2e] text-white">Feature Request</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Priority</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    style={{ colorScheme: "dark" }}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-high border border-white/10 text-white text-xs focus:outline-none focus:border-stitch-primary [&>option]:bg-[#141c2e] [&>option]:text-white"
                  >
                    <option value="low" className="bg-[#141c2e] text-white">Low (General question)</option>
                    <option value="medium" className="bg-[#141c2e] text-white">Medium (Standard request)</option>
                    <option value="high" className="bg-[#141c2e] text-white">High (Workflow blocked)</option>
                    <option value="urgent" className="bg-[#141c2e] text-white">Urgent (Critical downtime)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase">
                  Description of Issue
                </label>
                <textarea
                  rows={4}
                  required
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Please describe the steps to reproduce, relevant workspace names, or specific error messages..."
                  className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-stitch-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-variant">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-stitch-primary text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Creating Ticket..." : "Submit Ticket"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
