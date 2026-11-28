"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Plus,
  CheckCircle2,
  MessageSquare,
  Send,
  ShieldCheck,
  Search,
  Check,
  Headphones,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  createSupportTicket,
  replyToSupportTicket,
  updateTicketStatus,
  markTicketReadByUser,
} from "@/actions/ticket.actions";
import { formatDate, formatTime } from "@/lib/dateUtils";
import InstantSupportAssistant, {
  type EscalatedTicketDraft,
} from "@/components/support/InstantSupportAssistant";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupportAny = any;

export default function SupportClient({
  initialTickets,
  user,
  isStaff = false,
  initialView = "ai",
}: {
  initialTickets: SupportAny[];
  user: SupportAny;
  isStaff?: boolean;
  initialView?: "ai" | "tickets";
}) {
  const [activeView, setActiveView] = useState<"ai" | "tickets">(initialView);
  const [aiSessionKey, setAiSessionKey] = useState(0);
  const [queuedAiQuestion, setQueuedAiQuestion] = useState<string | undefined>(undefined);
  const aiTabRef = useRef<HTMLButtonElement | null>(null);
  const ticketsTabRef = useRef<HTMLButtonElement | null>(null);

  const [tickets, setTickets] = useState<SupportAny[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<SupportAny | null>(null);

  const handleSelectTicket = async (t: SupportAny) => {
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
    } catch (err: unknown) {
      const e = err as Error;
      showFeedback("error", e.message || "Failed to create ticket.");
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
    } catch (err: unknown) {
      const e = err as Error;
      showFeedback("error", e.message || "Failed to send reply");
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
    } catch (err: unknown) {
      const e = err as Error;
      showFeedback("error", e.message || "Failed to update ticket");
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketNumber?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const hasUnreadTickets = tickets.some((t) => Boolean(t.userHasUnread));

  const handleModeTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (
      e.key === "ArrowRight" ||
      e.key === "ArrowLeft" ||
      e.key === "Home" ||
      e.key === "End"
    ) {
      e.preventDefault();
      const next =
        e.key === "Home"
          ? "ai"
          : e.key === "End"
          ? "tickets"
          : activeView === "ai"
          ? "tickets"
          : "ai";
      setActiveView(next);
      if (next === "ai") aiTabRef.current?.focus();
      else ticketsTabRef.current?.focus();
    }
  };

  const handleEscalateDraft = (draft: EscalatedTicketDraft) => {
    setSubject(draft.subject);
    setCategory(draft.category);
    setPriority(draft.priority);
    setInitialMessage(draft.message);
    setActiveView("tickets");
    setIsNewTicketOpen(true);
  };

  const handleTryAiFromModal = () => {
    const combined = [subject.trim(), initialMessage.trim()].filter(Boolean).join(" — ");
    setQueuedAiQuestion(
      combined || "I need help resolving an issue before opening a support ticket."
    );
    setAiSessionKey((k) => k + 1);
    setIsNewTicketOpen(false);
    setActiveView("ai");
  };

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto py-1 sm:py-4 space-y-4 sm:space-y-6">
      {/* Staff Workspace Quick Banner */}
      {isStaff && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 dark:bg-cyan-950/40 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span>Support Specialist Operations Desk Available</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">Staff Portal</span>
              </h3>
              <p className="text-xs text-on-surface-variant">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-outline-variant/40">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface flex items-center gap-2.5 [text-wrap:balance]">
            <LifeBuoy className="w-5 h-5 sm:w-6 sm:h-6 text-stitch-primary shrink-0" />
            <span>Manageo Support &amp; Help Desk</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 text-pretty">
            Get instant answers from our AI Support Specialist or open a ticket for human team assistance.
          </p>
        </div>

        <button
          onClick={() => setIsNewTicketOpen(true)}
          className="w-full sm:w-auto min-h-11 sm:min-h-10 px-4 py-2.5 rounded-xl bg-stitch-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Open New Ticket</span>
        </button>
      </div>

      {/* Mode Switch Tabs (Instant AI Support vs. Human Tickets) */}
      <div
        role="tablist"
        aria-label="Support Modes"
        className="flex overflow-x-auto border-b border-outline-variant/40"
      >
        <button
          ref={aiTabRef}
          type="button"
          role="tab"
          aria-selected={activeView === "ai"}
          tabIndex={activeView === "ai" ? 0 : -1}
          onClick={() => setActiveView("ai")}
          onKeyDown={handleModeTabKeyDown}
          className="relative flex-1 sm:flex-none justify-center whitespace-nowrap inline-flex items-center gap-2 px-3 sm:px-4 min-h-11 py-2.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface aria-selected:text-stitch-primary aria-selected:after:content-[''] aria-selected:after:absolute aria-selected:after:inset-x-0 aria-selected:after:bottom-0 aria-selected:after:border-b-2 aria-selected:after:border-stitch-primary focus-visible:outline-2 focus-visible:outline-stitch-primary focus-visible:-outline-offset-2 cursor-pointer transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Instant AI Support</span>
        </button>
        <button
          ref={ticketsTabRef}
          type="button"
          role="tab"
          aria-selected={activeView === "tickets"}
          tabIndex={activeView === "tickets" ? 0 : -1}
          onClick={() => setActiveView("tickets")}
          onKeyDown={handleModeTabKeyDown}
          className="relative flex-1 sm:flex-none justify-center whitespace-nowrap inline-flex items-center gap-2 px-3 sm:px-4 min-h-11 py-2.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface aria-selected:text-stitch-primary aria-selected:after:content-[''] aria-selected:after:absolute aria-selected:after:inset-x-0 aria-selected:after:bottom-0 aria-selected:after:border-b-2 aria-selected:after:border-stitch-primary focus-visible:outline-2 focus-visible:outline-stitch-primary focus-visible:-outline-offset-2 cursor-pointer transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          <span>Human Tickets ({tickets.length})</span>
          {hasUnreadTickets && (
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" aria-label="Unread replies" />
          )}
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-sm font-medium flex items-center justify-between transition-all backdrop-blur-md ${
            feedback.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-300"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Primary View: Instant AI Support */}
      {activeView === "ai" && (
        <InstantSupportAssistant
          key={aiSessionKey}
          userName={user?.name}
          initialQuestion={queuedAiQuestion}
          ticketCount={tickets.length}
          onSwitchToTickets={() => setActiveView("tickets")}
          onEscalateToTicket={handleEscalateDraft}
        />
      )}

      {/* Main Ticket Layout: Responsive Master-Detail on mobile, Split Columns on Desktop */}
      {activeView === "tickets" && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 min-w-0">
        {/* Left Column: Tickets Roster */}
        <div className={`${selectedTicket ? "hidden lg:block" : "block"} lg:col-span-5 space-y-4 min-w-0`}>
          <div className="p-4 rounded-2xl bg-surface border border-outline-variant/60 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search ticket # or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/60 text-xs focus:outline-none focus:border-stitch-primary"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {["all", "open", "in_progress", "resolved"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg font-semibold capitalize whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? "bg-stitch-primary text-on-primary font-bold"
                      : "bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
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
              <div className="p-8 rounded-2xl bg-surface border border-outline-variant/60 text-center space-y-3">
                <MessageSquare className="w-8 h-8 text-on-surface-variant/60 mx-auto" />
                <p className="text-xs text-on-surface-variant">No support tickets found.</p>
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
                        : "bg-surface border-outline-variant/40 hover:border-outline-variant/80 hover:bg-surface-container"
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
                        <h4 className="text-xs font-bold text-on-surface line-clamp-1">{t.subject}</h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                          t.status === "open"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                            : t.status === "in_progress"
                            ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-outline-variant/40 flex items-center justify-between text-[10px] text-on-surface-variant">
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
        <div
          className={`${
            selectedTicket ? "flex" : "hidden lg:flex"
          } lg:col-span-7 min-w-0 bg-surface rounded-2xl border border-outline-variant/60 p-4 sm:p-6 flex-col justify-between min-h-[420px] lg:min-h-[540px]`}
        >
          {selectedTicket ? (
            <div className="space-y-4 sm:space-y-5 flex-1 flex flex-col justify-between min-w-0">
              {/* Mobile Back Button */}
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="inline-flex items-center gap-1.5 min-h-10 px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/50 text-xs font-semibold text-on-surface cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to All Tickets</span>
                </button>
              </div>
              {/* Ticket Top Bar */}
              <div className="pb-4 border-b border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-stitch-primary">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        selectedTicket.priority === "urgent"
                          ? "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30"
                          : selectedTicket.priority === "high"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                          : "bg-surface-container-high text-on-surface-variant border border-outline-variant/60"
                      }`}
                    >
                      {selectedTicket.priority} Priority
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-on-surface mt-1">{selectedTicket.subject}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.status !== "resolved" && (
                    <button
                      onClick={() => handleCloseTicket(selectedTicket._id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Thread */}
              <div className="space-y-4 flex-1 max-h-[55dvh] sm:max-h-[380px] overflow-y-auto overscroll-contain pr-1">
                {selectedTicket.messages?.map((msg: SupportAny, idx: number) => {
                  const isStaff = msg.senderRole === "admin" || msg.senderRole === "support";
                  const isMyMessage = !isStaff;

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}
                    >
                      {/* Sender Name & Timestamp */}
                      <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-on-surface-variant">
                        {isStaff ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-stitch-primary" />
                            <span className="font-bold text-on-surface">{msg.senderName}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-stitch-primary text-on-primary font-extrabold uppercase">
                              Staff
                            </span>
                            <span suppressHydrationWarning className="text-on-surface-variant/70 font-mono text-[10px]">
                              {formatTime(msg.createdAt)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span suppressHydrationWarning className="text-on-surface-variant/70 font-mono text-[10px]">
                              {formatTime(msg.createdAt)}
                            </span>
                            <span className="font-bold text-on-surface">{msg.senderName}</span>
                          </>
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed min-w-0 max-w-[92%] sm:max-w-[85%] ${
                          isMyMessage
                            ? "bg-stitch-primary/15 border border-stitch-primary/30 text-on-surface rounded-tr-none shadow-[0_0_15px_rgba(125,211,252,0.1)]"
                            : "bg-surface-container-high border border-outline-variant/60 text-on-surface rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{msg.message}</p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="pt-2 flex flex-wrap gap-2">
                            {msg.attachments.map((att: SupportAny, attIdx: number) => (
                              <a
                                key={attIdx}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container border border-outline-variant/40 text-stitch-primary hover:underline text-[10px]"
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
              <form onSubmit={handleSendReply} className="pt-4 border-t border-outline-variant/40 space-y-2.5">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response to support..."
                  className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-base sm:text-xs placeholder:text-on-surface-variant/60 focus:outline-none focus:border-stitch-primary"
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] text-on-surface-variant">
                    Press send to notify assigned support agents.
                  </span>
                  <button
                    type="submit"
                    disabled={isReplying || !replyText.trim()}
                    className="w-full sm:w-auto justify-center min-h-11 sm:min-h-9 px-4 py-2 rounded-xl bg-stitch-primary text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isReplying ? "Sending..." : "Send Reply"}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-8">
              <LifeBuoy className="w-12 h-12 text-on-surface-variant/50" />
              <h3 className="text-sm font-bold text-on-surface">Select a Ticket to View Discussion</h3>
              <p className="text-xs text-on-surface-variant max-w-sm">
                Choose an inquiry from the left panel to review messages, replies, and collaborate directly with our team.
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* MODAL: Open New Ticket */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain rounded-2xl sm:rounded-3xl bg-surface border border-outline-variant/60 shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="flex items-start sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/40">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-stitch-primary shrink-0" />
                  <span>Create New Support Ticket</span>
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Submit a detailed inquiry for priority assistance from our specialists.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close ticket modal"
                onClick={() => setIsNewTicketOpen(false)}
                className="w-10 h-10 sm:w-8 sm:h-8 shrink-0 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl border border-stitch-primary/30 bg-stitch-primary/10 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-on-surface">
                Want an immediate answer without waiting in the ticket queue?
              </span>
              <button
                type="button"
                onClick={handleTryAiFromModal}
                className="inline-flex items-center gap-1 min-h-9 font-bold text-stitch-primary hover:underline cursor-pointer self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                Ask Instant AI First →
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Issue connecting bank feed or Custom Section permissions"
                  className="w-full min-h-11 sm:min-h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/60 text-base sm:text-xs focus:outline-none focus:border-stitch-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">Category</label>
                  <select
                    value={category}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value as "account" | "billing" | "technical" | "feature_request" | "general")}
                    className="w-full min-h-11 sm:min-h-10 px-3 rounded-xl bg-surface-container-high border border-outline-variant/40 text-on-surface text-base sm:text-xs focus:outline-none focus:border-stitch-primary [&>option]:bg-surface-container [&>option]:text-on-surface"
                  >
                    <option value="general" className="bg-surface-container text-on-surface">General Support</option>
                    <option value="billing" className="bg-surface-container text-on-surface">Billing & Invoices</option>
                    <option value="technical" className="bg-surface-container text-on-surface">Technical Issue</option>
                    <option value="account" className="bg-surface-container text-on-surface">Account & Auth</option>
                    <option value="feature_request" className="bg-surface-container text-on-surface">Feature Request</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">Priority</label>
                  <select
                    value={priority}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value as "high" | "low" | "medium" | "urgent")}
                    className="w-full min-h-11 sm:min-h-10 px-3 rounded-xl bg-surface-container-high border border-outline-variant/40 text-on-surface text-base sm:text-xs focus:outline-none focus:border-stitch-primary [&>option]:bg-surface-container [&>option]:text-on-surface"
                  >
                    <option value="low" className="bg-surface-container text-on-surface">Low (General question)</option>
                    <option value="medium" className="bg-surface-container text-on-surface">Medium (Standard request)</option>
                    <option value="high" className="bg-surface-container text-on-surface">High (Workflow blocked)</option>
                    <option value="urgent" className="bg-surface-container text-on-surface">Urgent (Critical downtime)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase">
                  Description of Issue
                </label>
                <textarea
                  rows={4}
                  required
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Please describe the steps to reproduce, relevant workspace names, or specific error messages..."
                  className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-base sm:text-xs placeholder:text-on-surface-variant/60 focus:outline-none focus:border-stitch-primary"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="min-h-11 sm:min-h-10 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-semibold justify-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-11 sm:min-h-10 px-5 py-2 rounded-xl bg-stitch-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(125,211,252,0.5)] transition-all disabled:opacity-50 cursor-pointer"
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
