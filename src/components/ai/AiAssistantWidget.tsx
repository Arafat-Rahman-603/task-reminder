"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  History,
  SquarePen,
  X,
  Mic,
  MicOff,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  Pin,
  Trash2,
  RotateCcw,
  AudioLines,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { updateAiSettings, getAiAndMcpSettings } from "@/actions/mcp.actions";
import { MarkdownRenderer } from "@/components/notes/MarkdownRenderer";
import {
  VoiceModeStage,
  type VoiceConversationSyncPayload,
} from "@/components/ai/VoiceModeStage";
import type { PermissionMode, ToolMutability } from "@/lib/ai/tools";

interface AiAssistantWidgetProps {
  activeWorkspaceId?: string;
  activeWorkspaceName?: string;
  initialAiSettings?: {
    hasCustomApiKey?: boolean;
    preferredModel?: string;
    permissionMode?: PermissionMode;
    voiceAutoSpeak?: boolean;
  };
  hasServerEnvKey?: boolean;
}

interface ExecutedActionItem {
  callId?: string;
  name: string;
  mutability: ToolMutability;
  args?: Record<string, unknown>;
  ok: boolean;
  summary?: string;
  error?: string;
}

interface PendingCallItem {
  callId: string;
  name: string;
  args: Record<string, unknown>;
  mutability: ToolMutability;
  description: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  executedActions?: ExecutedActionItem[];
  pendingCalls?: PendingCallItem[];
  resolved?: boolean;
}

interface ConversationListItem {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string | null;
  isPinned: boolean;
  workspaceId: string;
}

const PERMISSION_META: Record<
  PermissionMode,
  { label: string; desc: string; icon: typeof ShieldCheck }
> = {
  review: {
    label: "Review",
    desc: "Ask before write & delete",
    icon: ShieldAlert,
  },
  default_approved: {
    label: "Approved",
    desc: "Auto write, ask on delete",
    icon: ShieldCheck,
  },
  turbo: {
    label: "Turbo",
    desc: "Run all without prompt",
    icon: Zap,
  },
};

const QUICK_PROMPTS = [
  "Which tasks are pending?",
  "Summarize my active workspace",
  "Create a high-priority task for tomorrow",
];

function createMsgId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatToolLabel(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AiAssistantWidget({
  activeWorkspaceId,
  initialAiSettings,
}: AiAssistantWidgetProps) {
  const router = useRouter();
  const composerId = useId();
  const [isOpen, setIsOpen] = useState(false);

  // Conversation & History state (persisted in MongoDB)
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState("Manageo AI");

  // Messages & Composer state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [retryableError, setRetryableError] = useState<{
    message: string;
    lastUserText: string | null;
  } | null>(null);
  const [permMenuOpen, setPermMenuOpen] = useState(false);
  const [permissionMode, setPermissionMode] = useState<PermissionMode>(
    initialAiSettings?.permissionMode || "default_approved"
  );

  // Dictation (speech-to-text inside chat input box — user reviews & presses Send)
  const [dictating, setDictating] = useState(false);
  const [speechLang, setSpeechLang] = useState<"en-US" | "bn-BD">("en-US");
  const [dictationError, setDictationError] = useState<string | null>(null);

  // Hands-free Conversational Voice Mode overlay
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceExpanded, setVoiceExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const permMenuRef = useRef<HTMLDivElement | null>(null);
  const lastCompEndRef = useRef<number | null>(null);

  // Dictation refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dictationRecRef = useRef<any>(null);
  const dictationPrefixRef = useRef<string>("");

  const speechLangRef = useRef<"en-US" | "bn-BD">(speechLang);
  const permissionModeRef = useRef<PermissionMode>(permissionMode);
  const activeWorkspaceIdRef = useRef<string | undefined>(activeWorkspaceId);
  const activeConvIdRef = useRef<string | null>(activeConversationId);
  const hasAutoLoadedRef = useRef(false);

  useEffect(() => {
    speechLangRef.current = speechLang;
  }, [speechLang]);

  useEffect(() => {
    permissionModeRef.current = permissionMode;
  }, [permissionMode]);

  useEffect(() => {
    activeWorkspaceIdRef.current = activeWorkspaceId;
  }, [activeWorkspaceId]);

  useEffect(() => {
    activeConvIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const stopDictation = useCallback(() => {
    if (dictationRecRef.current) {
      try {
        dictationRecRef.current.stop();
      } catch {
        // ignore
      }
      dictationRecRef.current = null;
    }
    setDictating(false);
  }, []);

  const fetchConversations = useCallback(async (search = "") => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (activeWorkspaceIdRef.current) params.set("workspaceId", activeWorkspaceIdRef.current);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/ai/conversations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data.conversations) ? data.conversations : []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const loadConversationById = useCallback(async (convId: string) => {
    setRetryableError(null);
    try {
      const res = await fetch(`/api/ai/conversations/${convId}`);
      if (!res.ok) return;
      const data = await res.json();
      setActiveConversationId(data.conversation.id);
      setActiveTitle(data.conversation.title || "Manageo AI");
      setMessages(
        Array.isArray(data.messages)
          ? data.messages.map((m: ChatMessage) => ({
              id: m.id,
              role: m.role,
              content: m.content || "",
              executedActions: m.executedActions || [],
              pendingCalls: m.pendingCalls || [],
              resolved: m.resolved !== false,
            }))
          : []
      );
      setHistoryOpen(false);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    const onOpenEvent = () => setIsOpen(true);
    const onSettingsUpdated = () => {
      void getAiAndMcpSettings().then((res) => {
        if ("error" in res && res.error) return;
        const ai = (res.aiSettings || {}) as {
          permissionMode?: PermissionMode;
        };
        if (ai.permissionMode) setPermissionMode(ai.permissionMode);
      });
    };
    const onClickOutside = (ev: MouseEvent) => {
      if (permMenuRef.current && !permMenuRef.current.contains(ev.target as Node)) {
        setPermMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("manageo:open-ai-assistant", onOpenEvent);
    window.addEventListener("manageo:ai-settings-updated", onSettingsUpdated);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("manageo:open-ai-assistant", onOpenEvent);
      window.removeEventListener("manageo:ai-settings-updated", onSettingsUpdated);
      document.removeEventListener("mousedown", onClickOutside);
      stopDictation();
    };
  }, [stopDictation]);

  // Initial load of latest conversation when opened for the first time
  useEffect(() => {
    if (!isOpen || hasAutoLoadedRef.current) return;
    let cancelled = false;
    const params = new URLSearchParams();
    if (activeWorkspaceId) params.set("workspaceId", activeWorkspaceId);
    fetch(`/api/ai/conversations?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data || !Array.isArray(data.conversations)) return;
        hasAutoLoadedRef.current = true;
        setConversations(data.conversations);
        if (!activeConvIdRef.current && data.conversations.length > 0) {
          void loadConversationById(data.conversations[0].id);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, activeWorkspaceId, loadConversationById]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const startNewChat = () => {
    setActiveConversationId(null);
    setActiveTitle("Manageo AI");
    setMessages([]);
    setRetryableError(null);
    setHistoryOpen(false);
  };

  const handlePermissionChange = async (next: PermissionMode) => {
    setPermissionMode(next);
    setPermMenuOpen(false);
    await updateAiSettings({ permissionMode: next });
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await fetch(`/api/ai/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      startNewChat();
    }
  };

  const handlePinConversation = async (e: React.MouseEvent, item: ConversationListItem) => {
    e.stopPropagation();
    await fetch(`/api/ai/conversations/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !item.isPinned }),
    });
    void fetchConversations(historySearch);
  };

  const sendMessage = async (textOverride?: string, skipAppendUser = false) => {
    stopDictation();
    const trimmed = (textOverride ?? input).trim();
    if (!trimmed || sending) return;

    if (!skipAppendUser) {
      setMessages((prev) => [
        ...prev,
        { id: createMsgId(), role: "user", content: trimmed },
      ]);
      if (!textOverride) setInput("");
    }
    setDictationError(null);
    setRetryableError(null);
    setSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvIdRef.current || undefined,
          message: trimmed,
          workspaceId: activeWorkspaceIdRef.current,
          permissionMode: permissionModeRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRetryableError({
          message:
            data.code === "MISSING_API_KEY"
              ? "AI is not configured yet. Set a provider in Settings."
              : data.error || "Unable to complete request. Please try again.",
          lastUserText: trimmed,
        });
        setSending(false);
        return;
      }

      if (data.conversationId) {
        setActiveConversationId(data.conversationId);
        if (data.conversationTitle) setActiveTitle(data.conversationTitle);
        void fetchConversations(historySearch);
      }

      const assistantMsg: ChatMessage = {
        id: data.messageId || createMsgId(),
        role: "assistant",
        content: data.reply || "",
        executedActions: data.executedActions || [],
        pendingCalls: data.pendingCalls || [],
        resolved: data.status !== "requires_approval",
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (data.mutated) {
        router.refresh();
      }
    } catch {
      setRetryableError({
        message: "Connection interrupted. Please try again.",
        lastUserText: trimmed,
      });
    } finally {
      setSending(false);
    }
  };

  const handleResolvePendingCalls = async (
    msgId: string,
    pendingCalls: PendingCallItem[],
    decision: "approve" | "reject"
  ) => {
    if (sending) return;
    setSending(true);
    setRetryableError(null);

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, resolved: true } : m))
    );

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvIdRef.current || undefined,
          workspaceId: activeWorkspaceIdRef.current,
          permissionMode: permissionModeRef.current,
          pendingApprovals: pendingCalls.map((pc) => ({
            callId: pc.callId,
            name: pc.name,
            args: pc.args,
            decision,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRetryableError({
          message: data.error || "Could not complete the action.",
          lastUserText: null,
        });
        setSending(false);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: data.messageId || createMsgId(),
          role: "assistant",
          content: data.reply || "",
          executedActions: data.executedActions || [],
          pendingCalls: data.pendingCalls || [],
          resolved: data.status !== "requires_approval",
        },
      ]);
      if (data.mutated) router.refresh();
    } catch {
      setRetryableError({
        message: "Connection interrupted.",
        lastUserText: null,
      });
    } finally {
      setSending(false);
    }
  };

  // Mode 1: Dictation right into the chat composer textarea (user reviews & clicks Send)
  const toggleDictation = useCallback(() => {
    if (dictating) {
      stopDictation();
      return;
    }
    setDictationError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setDictationError("Speech dictation is not supported in this browser.");
      return;
    }

    setVoiceActive(false);
    setVoiceExpanded(false);
    const trimmedPrefix = input.trimEnd();
    dictationPrefixRef.current = trimmedPrefix ? `${trimmedPrefix} ` : "";

    const rec = new SpeechRec();
    rec.lang = speechLangRef.current;
    rec.interimResults = true;
    rec.continuous = true;
    dictationRecRef.current = rec;
    setDictating(true);

    let finalizedSegment = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (ev: any) => {
      let interim = "";
      finalizedSegment = "";
      for (let i = 0; i < ev.results.length; i++) {
        const res = ev.results[i];
        const txt = res[0]?.transcript || "";
        if (res.isFinal) finalizedSegment += txt;
        else interim += txt;
      }
      const combined = `${dictationPrefixRef.current}${finalizedSegment}${interim}`;
      setInput(combined);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (ev: any) => {
      if (ev?.error === "not-allowed" || ev?.error === "service-not-allowed") {
        setDictationError("Microphone permission denied.");
      }
      setDictating(false);
    };
    rec.onend = () => {
      dictationRecRef.current = null;
      setDictating(false);
    };
    try {
      rec.start();
    } catch {
      setDictating(false);
    }
  }, [dictating, input, stopDictation]);

  const handleVoiceConversationSync = useCallback(
    (payload: VoiceConversationSyncPayload) => {
      if (payload.conversationId) {
        setActiveConversationId(payload.conversationId);
        if (payload.conversationTitle) setActiveTitle(payload.conversationTitle);
        void fetchConversations(historySearch);
      }
      if (payload.userMessage) {
        const uText = payload.userMessage;
        setMessages((prev) => [
          ...prev,
          { id: createMsgId(), role: "user", content: uText },
        ]);
      }
      if (payload.assistantMessage) {
        const aMsg = payload.assistantMessage;
        setMessages((prev) => [
          ...prev,
          {
            id: aMsg.id,
            role: "assistant",
            content: aMsg.content,
            executedActions: aMsg.executedActions as ExecutedActionItem[] | undefined,
            pendingCalls: aMsg.pendingCalls as PendingCallItem[] | undefined,
            resolved: aMsg.resolved,
          },
        ]);
      }
      if (payload.mutated) {
        router.refresh();
      }
    },
    [fetchConversations, historySearch, router]
  );

  const PermIcon = PERMISSION_META[permissionMode].icon;

  return (
    <>
      {/* Floating Launcher Button (hidden on tiny screens while drawer is open so composer stays unobstructed) */}
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            stopDictation();
            setVoiceActive(false);
            setVoiceExpanded(false);
            setIsOpen(false);
          } else {
            setIsOpen(true);
          }
        }}
        aria-label="Toggle Manageo AI Assistant"
        title="Manageo AI (Ctrl + J)"
        className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 items-center gap-2 rounded-full bg-stitch-primary text-on-primary px-4 py-2.5 font-bold shadow-[0_8px_24px_rgba(0,0,0,0.35)] ring-2 ring-surface-container-highest/80 hover:brightness-105 active:scale-95 transition-all ${
          isOpen ? "hidden sm:flex" : "flex"
        }`}
      >
        {isOpen ? (
          <X className="w-4 h-4 shrink-0 stroke-[2.4]" />
        ) : (
          <span className="force-dark-scheme inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-950/90 p-0.5 ring-1 ring-white/15 shrink-0">
            <Logo variant="icon" alt="" aria-hidden="true" priority className="w-full h-full" />
          </span>
        )}
        <span className="text-xs font-bold tracking-wide">{isOpen ? "Close" : "AI"}</span>
      </button>

      {isOpen && (
        <aside
          aria-label="Manageo AI Assistant"
          className={
            voiceActive && voiceExpanded
              ? "fixed inset-3 sm:inset-6 z-50 w-auto sm:w-full sm:max-w-2xl sm:h-auto sm:mx-auto rounded-2xl bg-surface-container border border-surface-container-high shadow-2xl flex flex-col overflow-hidden text-on-surface"
              : "fixed inset-x-2 top-16 bottom-20 sm:inset-auto sm:top-auto sm:bottom-20 sm:right-6 z-50 w-auto sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:h-[min(620px,calc(100dvh-7rem))] rounded-2xl bg-surface-container border border-surface-container-high shadow-2xl flex flex-col overflow-hidden text-on-surface"
          }
        >
          {/* Single Compact 44px Header */}
          <header className="h-11 shrink-0 px-3 border-b border-surface-container-high flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => {
                  const next = !historyOpen;
                  setHistoryOpen(next);
                  if (next) void fetchConversations(historySearch);
                }}
                aria-label="Toggle chat history"
                title="Chat history"
                className={`p-1.5 rounded-lg transition-colors ${
                  historyOpen
                    ? "bg-surface-container-high text-on-surface"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <History className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold truncate">{activeTitle}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (voiceActive) {
                    setVoiceActive(false);
                    setVoiceExpanded(false);
                  } else {
                    stopDictation();
                    setHistoryOpen(false);
                    setVoiceActive(true);
                  }
                }}
                aria-label="Toggle full voice mode"
                title={voiceActive ? "Back to text chat" : "Voice Mode (Talk & Listen)"}
                className={`p-1.5 rounded-lg transition-colors ${
                  voiceActive
                    ? "bg-stitch-primary/15 text-stitch-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <AudioLines className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={startNewChat}
                aria-label="New conversation"
                title="New chat"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
              >
                <SquarePen className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  stopDictation();
                  setVoiceActive(false);
                  setVoiceExpanded(false);
                  setIsOpen(false);
                }}
                aria-label="Close assistant"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Main Panel Body */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            {/* Slide-Over DB Chat History Drawer */}
            {historyOpen && (
              <div className="absolute inset-0 z-20 bg-surface-container flex flex-col">
                <div className="p-3 border-b border-surface-container-high flex items-center gap-2">
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHistorySearch(val);
                      void fetchConversations(val);
                    }}
                    placeholder="Search history..."
                    className="flex-1 min-w-0 rounded-xl bg-surface-container-low border border-surface-container-high px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-stitch-primary"
                  />
                  <button
                    type="button"
                    onClick={startNewChat}
                    className="px-2.5 py-1.5 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold shrink-0 hover:brightness-105"
                  >
                    + New
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-10 text-xs text-on-surface-variant">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-10 px-4 text-xs text-on-surface-variant">
                      No saved chats yet. Your conversations are stored automatically.
                    </div>
                  ) : (
                    conversations.map((c) => {
                      const isCurrent = c.id === activeConversationId;
                      return (
                        <div
                          key={c.id}
                          onClick={() => void loadConversationById(c.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              void loadConversationById(c.id);
                            }
                          }}
                          className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                            isCurrent
                              ? "bg-stitch-primary/12 text-on-surface"
                              : "hover:bg-surface-container-low text-on-surface"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium truncate">{c.title}</div>
                            <div className="text-[10px] text-on-surface-variant">
                              {c.messageCount} messages
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => void handlePinConversation(e, c)}
                              title={c.isPinned ? "Unpin" : "Pin"}
                              className={`p-1 rounded-md hover:bg-surface-container-high ${
                                c.isPinned ? "text-stitch-primary" : "text-on-surface-variant"
                              }`}
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => void handleDeleteConversation(e, c.id)}
                              title="Delete"
                              className="p-1 rounded-md text-on-surface-variant hover:text-red-500 hover:bg-surface-container-high"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-3 py-2.5 border-t border-surface-container-high text-[11px] text-on-surface-variant flex items-center justify-between">
                  <span>Custom / Local Model?</span>
                  <Link
                    href="/dashboard/settings?tab=ai-mcp"
                    onClick={() => setIsOpen(false)}
                    className="text-stitch-primary font-medium hover:underline"
                  >
                    AI Settings →
                  </Link>
                </div>
              </div>
            )}

            {/* Proper Hands-Free Voice Mode (ChatGPT / Gemini Live Experience) */}
            {voiceActive ? (
              <VoiceModeStage
                activeWorkspaceId={activeWorkspaceId}
                permissionMode={permissionMode}
                speechLang={speechLang}
                onSpeechLangChange={setSpeechLang}
                activeConversationId={activeConversationId}
                onConversationSync={handleVoiceConversationSync}
                expanded={voiceExpanded}
                onToggleExpand={() => setVoiceExpanded((v) => !v)}
                onExit={() => {
                  setVoiceActive(false);
                  setVoiceExpanded(false);
                }}
              />
            ) : (
              /* Clean Conversation Stream */
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3.5 sm:px-4 py-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-2 space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-stitch-primary/12 border border-stitch-primary/20 flex items-center justify-center p-2">
                      <Logo variant="icon" alt="" aria-hidden="true" priority className="w-full h-full" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-on-surface">
                        How can I help today?
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Ask about tasks, notes, ideas, routines, or expenses.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {QUICK_PROMPTS.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => void sendMessage(q)}
                          className="px-3 py-1.5 rounded-full bg-surface-container-low border border-surface-container-high hover:border-stitch-primary/40 text-[11px] text-on-surface transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col min-w-0 max-w-full ${
                        m.role === "user" ? "items-end" : "items-start"
                      } space-y-1.5`}
                    >
                      {m.role === "user" ? (
                        <div className="max-w-[85%] min-w-0 rounded-2xl rounded-br-sm bg-stitch-primary/15 border border-stitch-primary/20 text-on-surface px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                          {m.content}
                        </div>
                      ) : (
                        <div className="w-full min-w-0 max-w-full overflow-x-hidden break-words [overflow-wrap:anywhere] space-y-2 text-on-surface">
                          {m.content && (
                            <MarkdownRenderer
                              content={m.content}
                              className="text-[13px] leading-relaxed"
                            />
                          )}

                          {/* Quiet native <details> disclosure for executed tools */}
                          {m.executedActions && m.executedActions.length > 0 && (
                            <details className="group text-[11px] text-on-surface-variant">
                              <summary className="inline-flex items-center gap-1 cursor-pointer list-none select-none hover:text-on-surface">
                                <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                                <span>
                                  Used {m.executedActions.length}{" "}
                                  {m.executedActions.length === 1 ? "action" : "actions"}
                                </span>
                              </summary>
                              <div className="mt-1.5 pl-4 space-y-1">
                                {m.executedActions.map((act, idx) => (
                                  <div
                                    key={`${m.id}-act-${idx}`}
                                    className="flex items-center gap-1.5"
                                  >
                                    {act.ok ? (
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                    ) : (
                                      <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                                    )}
                                    <span className="truncate">{formatToolLabel(act.name)}</span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}

                          {/* Minimal Confirmation Card when approval is needed */}
                          {m.pendingCalls && m.pendingCalls.length > 0 && !m.resolved && (
                            <div className="rounded-xl border border-surface-container-high bg-surface-container-low p-3 space-y-2.5">
                              <div className="text-xs font-semibold text-on-surface">
                                Confirm {m.pendingCalls.map((c) => formatToolLabel(c.name)).join(", ")}
                              </div>
                              <div className="space-y-1.5">
                                {m.pendingCalls.map((pc) => (
                                  <div
                                    key={pc.callId}
                                    className="text-[11px] text-on-surface-variant space-y-0.5"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-on-surface">
                                        {formatToolLabel(pc.name)}
                                      </span>
                                      <span className="uppercase text-[10px] opacity-75">
                                        {pc.mutability}
                                      </span>
                                    </div>
                                    {Object.keys(pc.args || {}).length > 0 && (
                                      <div className="text-[11px] opacity-85 truncate">
                                        {Object.entries(pc.args)
                                          .slice(0, 3)
                                          .map(([k, v]) => `${k}: ${String(v)}`)
                                          .join(" • ")}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 pt-0.5">
                                <button
                                  type="button"
                                  disabled={sending}
                                  onClick={() =>
                                    void handleResolvePendingCalls(
                                      m.id,
                                      m.pendingCalls!,
                                      "approve"
                                    )
                                  }
                                  className="flex-1 py-1.5 rounded-lg bg-stitch-primary text-on-primary text-xs font-semibold hover:brightness-105 disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={sending}
                                  onClick={() =>
                                    void handleResolvePendingCalls(
                                      m.id,
                                      m.pendingCalls!,
                                      "reject"
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg border border-surface-container-high text-xs text-on-surface-variant hover:text-on-surface disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {sending && (
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-stitch-primary" />
                    <span>Thinking...</span>
                  </div>
                )}

                {retryableError && (
                  <div className="w-full min-w-0 rounded-xl border border-surface-container-high bg-surface-container-low px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
                    <span className="min-w-0 flex-1 leading-snug break-words [overflow-wrap:anywhere]">
                      {retryableError.message}
                    </span>
                    {retryableError.lastUserText && (
                      <button
                        type="button"
                        onClick={() =>
                          void sendMessage(retryableError.lastUserText!, true)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stitch-primary/15 text-stitch-primary text-[11px] font-medium shrink-0 hover:bg-stitch-primary/25"
                      >
                        <RotateCcw className="w-3 h-3" /> Retry
                      </button>
                    )}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Sleek Auto-Sizing Composer */}
            {!voiceActive && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendMessage();
                }}
                className="p-3 pt-1.5"
              >
                <div className="rounded-2xl bg-surface-container-low border border-surface-container-high focus-within:border-stitch-primary/60 px-3 pt-2.5 pb-2 transition-colors">
                  {dictating && (
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-red-500 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Listening — speaking types here (review &amp; press Send)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSpeechLang((l) => (l === "en-US" ? "bn-BD" : "en-US"))
                        }
                        className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] text-on-surface-variant"
                      >
                        {speechLang === "en-US" ? "EN" : "বাংলা"}
                      </button>
                    </div>
                  )}
                  {dictationError && (
                    <div className="mb-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                      {dictationError}
                    </div>
                  )}
                  <label htmlFor={composerId} className="sr-only">
                    Message Manageo AI
                  </label>
                  <textarea
                    id={composerId}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onCompositionEnd={(e) => {
                      lastCompEndRef.current = e.timeStamp;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (
                          e.nativeEvent.isComposing ||
                          e.keyCode === 229 ||
                          (lastCompEndRef.current !== null &&
                            Math.abs(e.timeStamp - lastCompEndRef.current) < 50)
                        ) {
                          return;
                        }
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder="Ask or tell Manageo..."
                    style={{ fieldSizing: "content" } as React.CSSProperties}
                    className="w-full h-auto min-h-[1.5lh] max-h-[7lh] resize-none bg-transparent text-[13px] leading-relaxed text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
                  />

                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    {/* Compact Permission Popover */}
                    <div ref={permMenuRef} className="relative flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPermMenuOpen((v) => !v)}
                        title={PERMISSION_META[permissionMode].desc}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                      >
                        <PermIcon className="w-3 h-3" />
                        <span>{PERMISSION_META[permissionMode].label}</span>
                        <ChevronDown className="w-3 h-3 opacity-70" />
                      </button>

                      {permMenuOpen && (
                        <div className="absolute bottom-full left-0 mb-1.5 w-48 rounded-xl bg-surface-container border border-surface-container-high shadow-xl p-1 z-30">
                          {(Object.keys(PERMISSION_META) as PermissionMode[]).map((pm) => {
                            const Meta = PERMISSION_META[pm];
                            const Icon = Meta.icon;
                            const active = permissionMode === pm;
                            return (
                              <button
                                key={pm}
                                type="button"
                                onClick={() => void handlePermissionChange(pm)}
                                className={`w-full text-left px-2.5 py-2 rounded-lg flex items-start gap-2 transition-colors ${
                                  active
                                    ? "bg-stitch-primary/12 text-stitch-primary"
                                    : "text-on-surface hover:bg-surface-container-low"
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                <div>
                                  <div className="text-[11px] font-semibold">{Meta.label}</div>
                                  <div className="text-[10px] text-on-surface-variant">
                                    {Meta.desc}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Dictation, Voice Mode & Submit */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={toggleDictation}
                        aria-label={dictating ? "Stop dictating" : "Dictate to input box"}
                        title={
                          dictating
                            ? "Stop dictation (review text before sending)"
                            : "Dictate into message box"
                        }
                        className={`p-1.5 rounded-lg transition-colors ${
                          dictating
                            ? "bg-red-500/15 text-red-500 ring-1 ring-red-500/40 animate-pulse"
                            : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                        }`}
                      >
                        {dictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          stopDictation();
                          setHistoryOpen(false);
                          setVoiceActive(true);
                        }}
                        aria-label="Open full voice mode"
                        title="Hands-free Voice Mode (Talk & Listen)"
                        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-stitch-primary transition-colors"
                      >
                        <AudioLines className="w-4 h-4" />
                      </button>
                      <button
                        type="submit"
                        disabled={sending || !input.trim()}
                        aria-label="Send message"
                        className="p-2 rounded-xl bg-stitch-primary text-on-primary disabled:opacity-40 hover:brightness-105 transition-all"
                      >
                        <ArrowUp className="w-4 h-4 stroke-[2.25]" />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
