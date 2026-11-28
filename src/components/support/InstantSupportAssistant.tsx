"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  LifeBuoy,
  Loader2,
  RotateCcw,
  Sparkles,
  Ticket,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { MarkdownRenderer } from "@/components/notes/MarkdownRenderer";
import type {
  SupportQuickLink,
  SupportTicketDraft,
  TicketCategory,
  TicketPriority,
} from "@/lib/ai/support-knowledge";

interface SupportChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  quickLinks?: SupportQuickLink[];
  suggestTicket?: boolean;
  ticketDraft?: SupportTicketDraft;
  source?: "ai" | "fallback";
}

export interface EscalatedTicketDraft {
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  message: string;
}

interface InstantSupportAssistantProps {
  userName?: string;
  compact?: boolean;
  initialQuestion?: string;
  ticketCount?: number;
  onSwitchToTickets?: () => void;
  onEscalateToTicket?: (draft: EscalatedTicketDraft) => void;
}

const STARTER_TOPICS = [
  "How do I connect ChatGPT to Manageo MCP?",
  "Why is Money or a module missing in my sidebar?",
  "I forgot my Vault Custom Password — how do I reset it?",
  "How do I invite teammates or switch workspaces?",
  "How does Hands-Free Voice Mode work?",
  "How do I upgrade my plan or request billing help?",
];

export default function InstantSupportAssistant({
  userName,
  compact = false,
  initialQuestion,
  ticketCount = 0,
  onSwitchToTickets,
  onEscalateToTicket,
}: InstantSupportAssistantProps) {
  const uid = useId();
  const inputId = `${uid}-support-input`;

  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [markedSolved, setMarkedSolved] = useState(false);

  const messagesRef = useRef<SupportChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentInitialRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const submitQuestion = useCallback(async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    const userMsg: SupportChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const nextHistory = [...messagesRef.current, userMsg];
    messagesRef.current = nextHistory;
    setMessages(nextHistory);
    setInput("");
    setErrorMsg(null);
    setMarkedSolved(false);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory.slice(-12).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const payload = (await response.json()) as {
        reply?: string;
        quickLinks?: SupportQuickLink[];
        suggestTicket?: boolean;
        ticketDraft?: SupportTicketDraft;
        source?: "ai" | "fallback";
        error?: string;
      };

      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || "Unable to reach instant support right now.");
      }

      const assistantMsg: SupportChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: payload.reply,
        quickLinks: payload.quickLinks,
        suggestTicket: Boolean(payload.suggestTicket),
        ticketDraft: payload.ticketDraft,
        source: payload.source,
      };

      const updated = [...nextHistory, assistantMsg];
      messagesRef.current = updated;
      setMessages(updated);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Unable to get an instant answer right now. You can try again or open a ticket."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = initialQuestion?.trim();
    if (!q || sentInitialRef.current) return;
    sentInitialRef.current = true;
    const timer = setTimeout(() => {
      void submitQuestion(q);
    }, 0);
    return () => clearTimeout(timer);
  }, [initialQuestion, submitQuestion]);

  const handleReset = () => {
    messagesRef.current = [];
    setMessages([]);
    setInput("");
    setErrorMsg(null);
    setMarkedSolved(false);
  };

  const handleEscalate = (msg?: SupportChatMessage) => {
    const fallbackQuestion =
      [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const draft = msg?.ticketDraft;
    const payload: EscalatedTicketDraft = {
      subject: draft?.subject || fallbackQuestion.slice(0, 64) || "Support Request",
      category: draft?.category || "general",
      priority: draft?.priority || "medium",
      message:
        draft?.summary ||
        (fallbackQuestion ? `Question: ${fallbackQuestion}` : ""),
    };

    if (onEscalateToTicket) {
      onEscalateToTicket(payload);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && input.trim()) {
        void submitQuestion(input);
      }
    }
  };

  const lastAssistantMsg = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  return (
    <div className="rounded-2xl bg-surface border border-outline-variant/60 shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-outline-variant/40 bg-surface-container/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-stitch-primary/15 border border-stitch-primary/25 flex items-center justify-center p-1.5 shrink-0">
            <Logo variant="icon" alt="" aria-hidden="true" className="w-full h-full" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-on-surface">
                Instant AI Support Specialist
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                <Sparkles className="w-3 h-3" /> 24/7 Instant Help
              </span>
            </div>
            <p className="text-xs text-on-surface-variant truncate">
              Ask anything about Manageo in English or বাংলা — tickets only needed for billing or staff action.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-outline-variant/50 bg-surface-container-low hover:bg-surface-container text-xs font-medium text-on-surface"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Topic
            </button>
          )}
          {onSwitchToTickets && (
            <button
              type="button"
              onClick={onSwitchToTickets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/50 bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface"
            >
              <Ticket className="w-3.5 h-3.5 text-stitch-primary" />
              <span>My Tickets ({ticketCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className={`overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-4 ${
          compact ? "min-h-[260px] max-h-[360px]" : "min-h-[340px] max-h-[460px]"
        }`}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-4 space-y-4">
            <div className="space-y-1.5 max-w-lg">
              <p className="text-sm font-semibold text-on-surface">
                Hi {userName || "there"} — how can we help you right now?
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Get immediate step-by-step answers for ChatGPT/MCP connectors, Vault OTP resets,
                missing modules, Team workspaces, or Voice mode without waiting for a ticket reply.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
              {STARTER_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => void submitQuestion(topic)}
                  className="px-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/60 hover:border-stitch-primary/50 hover:bg-surface-container text-xs text-on-surface transition-colors text-left"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[82%] rounded-2xl px-4 py-3 text-xs sm:text-sm ${
                    isUser
                      ? "bg-stitch-primary text-on-primary rounded-tr-none font-medium"
                      : "bg-surface-container-low border border-outline-variant/60 text-on-surface rounded-tl-none"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                      {m.content}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <MarkdownRenderer content={m.content} />

                      {m.quickLinks && m.quickLinks.length > 0 && (
                        <div className="pt-2 border-t border-outline-variant/40 flex flex-wrap gap-1.5">
                          {m.quickLinks.map((ql) => (
                            <Link
                              key={ql.href}
                              href={ql.href}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/60 hover:border-stitch-primary text-[11px] font-semibold text-stitch-primary transition-colors"
                            >
                              <span>{ql.label}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Loader2 className="w-4 h-4 animate-spin text-stitch-primary" />
            <span>Checking Manageo docs &amp; your workspace setup...</span>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Resolution / Smart Ticket Deflection Bar */}
      {lastAssistantMsg && !loading && (
        <div className="px-4 sm:px-5 py-2.5 border-t border-outline-variant/40 bg-surface-container-low/70 flex flex-wrap items-center justify-between gap-2">
          {markedSolved ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Glad that solved it! Ask another question anytime.</span>
            </div>
          ) : (
            <span className="text-xs text-on-surface-variant">
              {lastAssistantMsg.suggestTicket
                ? "This looks like it may need our human specialists."
                : "Did this solve your question?"}
            </span>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {!markedSolved && (
              <button
                type="button"
                onClick={() => setMarkedSolved(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/12 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Issue Solved
              </button>
            )}

            {onEscalateToTicket ? (
              <button
                type="button"
                onClick={() => handleEscalate(lastAssistantMsg)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  lastAssistantMsg.suggestTicket
                    ? "bg-stitch-primary text-on-primary hover:brightness-105"
                    : "border border-outline-variant/60 bg-surface-container text-on-surface hover:border-stitch-primary/50"
                }`}
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>
                  {lastAssistantMsg.suggestTicket
                    ? "Create Pre-filled Ticket"
                    : "Still Need Help? Create Ticket"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href="/dashboard/support?view=tickets"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/60 bg-surface-container text-on-surface hover:border-stitch-primary/50 text-xs font-semibold transition-colors"
              >
                <LifeBuoy className="w-3.5 h-3.5 text-stitch-primary" />
                <span>Open Human Ticket Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading && input.trim()) {
            void submitQuestion(input);
          }
        }}
        className="p-3 sm:p-4 border-t border-outline-variant/40 bg-surface-container/40 flex items-end gap-2"
      >
        <label htmlFor={inputId} className="sr-only">
          Describe your question or issue for Instant AI Support
        </label>
        <textarea
          id={inputId}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about ChatGPT MCP, Vault password reset, missing modules, billing..."
          className="flex-1 min-w-0 resize-none rounded-xl bg-surface-container-low border border-outline-variant/50 px-3.5 py-2.5 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-stitch-primary"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send support question"
          className="shrink-0 h-10 w-10 rounded-xl bg-stitch-primary text-on-primary flex items-center justify-center hover:brightness-105 disabled:opacity-45 transition-all"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
