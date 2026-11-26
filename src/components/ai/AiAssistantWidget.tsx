"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
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
  Radio,
  AudioLines,
  Volume2,
  VolumeX,
  Square,
} from "lucide-react";
import { updateAiSettings, getAiAndMcpSettings } from "@/actions/mcp.actions";
import { MarkdownRenderer } from "@/components/notes/MarkdownRenderer";
import {
  stripMarkdownForSpeech,
  detectSpeechLang,
  splitTextForSpeech,
} from "@/lib/ai/voice-utils";
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

interface VoiceChatPendingApproval {
  msgId: string;
  pendingCalls: PendingCallItem[];
}

interface VoiceLogEntry {
  id: string;
  speaker: "you" | "ai" | "action";
  text: string;
  ok?: boolean;
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

interface VoicePendingCall {
  callId: string;
  name: string;
  args: Record<string, unknown>;
  mutability: ToolMutability;
  description: string;
}

function createMsgId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function float32ToBase64Pcm16(float32: Float32Array): string {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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

  // Full-duplex Voice Mode overlay
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<
    "idle" | "connecting" | "live" | "listening" | "thinking" | "speaking" | "error"
  >("idle");
  const [voiceStatusText, setVoiceStatusText] = useState("Tap mic to speak your command");
  const [voiceInterimText, setVoiceInterimText] = useState("");
  const [voiceMuted, setVoiceMuted] = useState<boolean>(
    initialAiSettings?.voiceAutoSpeak === false
  );
  const [voiceLogs, setVoiceLogs] = useState<VoiceLogEntry[]>([]);
  const [voicePendingApproval, setVoicePendingApproval] =
    useState<VoicePendingCall | null>(null);
  const [voiceChatPending, setVoiceChatPending] =
    useState<VoiceChatPendingApproval | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const voiceLogsEndRef = useRef<HTMLDivElement | null>(null);
  const permMenuRef = useRef<HTMLDivElement | null>(null);
  const lastCompEndRef = useRef<number | null>(null);

  // Dictation refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dictationRecRef = useRef<any>(null);
  const dictationPrefixRef = useRef<string>("");

  // Voice refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liveSessionRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRecRef = useRef<any>(null);
  const ttsRunIdRef = useRef<number>(0);
  const voiceActiveRef = useRef<boolean>(false);
  const voiceMutedRef = useRef<boolean>(false);
  const speechLangRef = useRef<"en-US" | "bn-BD">(speechLang);
  const permissionModeRef = useRef<PermissionMode>(permissionMode);
  const activeWorkspaceIdRef = useRef<string | undefined>(activeWorkspaceId);
  const activeConvIdRef = useRef<string | null>(activeConversationId);
  const hasAutoLoadedRef = useRef(false);

  useEffect(() => {
    voiceActiveRef.current = voiceActive;
  }, [voiceActive]);

  useEffect(() => {
    voiceMutedRef.current = voiceMuted;
  }, [voiceMuted]);

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

  useEffect(() => {
    voiceLogsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [voiceLogs, voiceInterimText, voiceStatus]);

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

  const cancelSpeechOutput = useCallback(() => {
    ttsRunIdRef.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }, []);

  const stopVoiceSession = useCallback(() => {
    cancelSpeechOutput();
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // ignore
      }
      processorRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (playbackCtxRef.current) {
      void playbackCtxRef.current.close().catch(() => {});
      playbackCtxRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (liveSessionRef.current) {
      try {
        liveSessionRef.current.close?.();
      } catch {
        // ignore
      }
      liveSessionRef.current = null;
    }
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {
        // ignore
      }
      speechRecRef.current = null;
    }
    nextPlayTimeRef.current = 0;
    setVoiceInterimText("");
    setVoiceStatus("idle");
  }, [cancelSpeechOutput]);

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
          voiceAutoSpeak?: boolean;
        };
        if (ai.permissionMode) setPermissionMode(ai.permissionMode);
        setVoiceMuted(ai.voiceAutoSpeak === false);
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
      stopVoiceSession();
    };
  }, [stopDictation, stopVoiceSession]);

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

  const enqueuePcmAudio = useCallback((base64Pcm: string) => {
    if (voiceMutedRef.current) return;
    try {
      if (!playbackCtxRef.current) {
        playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
        nextPlayTimeRef.current = playbackCtxRef.current.currentTime;
      }
      const ctx = playbackCtxRef.current;
      const binary = atob(base64Pcm);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const view = new DataView(bytes.buffer);
      const floatSamples = new Float32Array(bytes.byteLength / 2);
      for (let i = 0; i < floatSamples.length; i++) {
        floatSamples[i] = view.getInt16(i * 2, true) / 32768;
      }
      const audioBuffer = ctx.createBuffer(1, floatSamples.length, 24000);
      audioBuffer.getChannelData(0).set(floatSamples);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      const startAt = Math.max(ctx.currentTime, nextPlayTimeRef.current);
      source.start(startAt);
      nextPlayTimeRef.current = startAt + audioBuffer.duration;
    } catch {
      // ignore audio frame errors
    }
  }, []);

  const appendVoiceLog = useCallback((entry: Omit<VoiceLogEntry, "id">) => {
    setVoiceLogs((prev) => [...prev.slice(-30), { id: createMsgId(), ...entry }]);
  }, []);

  const speakReplyAloud = useCallback(
    (rawText: string, onDone?: () => void) => {
      cancelSpeechOutput();
      const spoken = stripMarkdownForSpeech(rawText);
      if (
        !spoken ||
        voiceMutedRef.current ||
        typeof window === "undefined" ||
        !("speechSynthesis" in window)
      ) {
        onDone?.();
        return;
      }

      const chunks = splitTextForSpeech(spoken, 185);
      if (chunks.length === 0) {
        onDone?.();
        return;
      }

      const runId = ttsRunIdRef.current;
      const targetLang = detectSpeechLang(spoken, speechLangRef.current);
      const voices = window.speechSynthesis.getVoices?.() || [];
      const matchingVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith(targetLang.toLowerCase())) ||
        voices.find((v) =>
          v.lang.toLowerCase().startsWith(targetLang.split("-")[0].toLowerCase())
        );

      setVoiceStatus("speaking");
      setVoiceStatusText("Speaking reply...");

      let idx = 0;
      const speakNext = () => {
        if (ttsRunIdRef.current !== runId || !voiceActiveRef.current) return;
        if (idx >= chunks.length) {
          onDone?.();
          return;
        }
        const utter = new SpeechSynthesisUtterance(chunks[idx]);
        utter.lang = targetLang;
        if (matchingVoice) utter.voice = matchingVoice;
        utter.rate = 1.03;
        idx += 1;
        utter.onend = speakNext;
        utter.onerror = speakNext;
        try {
          window.speechSynthesis.speak(utter);
        } catch {
          onDone?.();
        }
      };

      speakNext();
    },
    [cancelSpeechOutput]
  );

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

    stopVoiceSession();
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
  }, [dictating, input, stopDictation, stopVoiceSession]);

  const startBrowserVoiceListeningRef = useRef<() => void>(() => {});

  const runVoiceCommand = useCallback(
    async (spokenText: string) => {
      const cleaned = spokenText.trim();
      if (!cleaned || !voiceActiveRef.current) return;

      appendVoiceLog({ speaker: "you", text: cleaned });
      setMessages((prev) => [
        ...prev,
        { id: createMsgId(), role: "user", content: cleaned },
      ]);
      setVoiceInterimText("");
      setVoiceStatus("thinking");
      setVoiceStatusText("Thinking & executing...");

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: activeConvIdRef.current || undefined,
            message: cleaned,
            workspaceId: activeWorkspaceIdRef.current,
            permissionMode: permissionModeRef.current,
            voiceMode: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          const errText =
            data.code === "MISSING_API_KEY"
              ? "AI is not configured yet. Please check Settings."
              : data.error || "Unable to complete your request.";
          appendVoiceLog({ speaker: "ai", text: errText });
          speakReplyAloud(errText, () => {
            if (voiceActiveRef.current) {
              setVoiceStatus("idle");
              setVoiceStatusText("Tap mic to try again");
            }
          });
          return;
        }

        if (data.conversationId) {
          setActiveConversationId(data.conversationId);
          if (data.conversationTitle) setActiveTitle(data.conversationTitle);
          void fetchConversations(historySearch);
        }

        if (Array.isArray(data.executedActions)) {
          for (const act of data.executedActions as ExecutedActionItem[]) {
            appendVoiceLog({
              speaker: "action",
              text: formatToolLabel(act.name),
              ok: act.ok,
            });
          }
        }

        const msgId = data.messageId || createMsgId();
        setMessages((prev) => [
          ...prev,
          {
            id: msgId,
            role: "assistant",
            content: data.reply || "",
            executedActions: data.executedActions || [],
            pendingCalls: data.pendingCalls || [],
            resolved: data.status !== "requires_approval",
          },
        ]);

        if (data.mutated) router.refresh();

        if (data.status === "requires_approval" && Array.isArray(data.pendingCalls) && data.pendingCalls.length > 0) {
          setVoiceChatPending({ msgId, pendingCalls: data.pendingCalls });
          const promptText =
            data.reply || "Please approve or cancel this action to continue.";
          appendVoiceLog({ speaker: "ai", text: promptText });
          speakReplyAloud(promptText, () => {
            if (voiceActiveRef.current) {
              setVoiceStatus("idle");
              setVoiceStatusText("Waiting for your approval");
            }
          });
          return;
        }

        const replyText = data.reply || "Done.";
        appendVoiceLog({ speaker: "ai", text: replyText });
        speakReplyAloud(replyText, () => {
          if (voiceActiveRef.current && !voiceMutedRef.current) {
            startBrowserVoiceListeningRef.current();
          } else if (voiceActiveRef.current) {
            setVoiceStatus("idle");
            setVoiceStatusText("Tap mic to speak next command");
          }
        });
      } catch {
        const errText = "Connection interrupted. Please tap mic to try again.";
        appendVoiceLog({ speaker: "ai", text: errText });
        setVoiceStatus("error");
        setVoiceStatusText(errText);
      }
    },
    [appendVoiceLog, fetchConversations, historySearch, router, speakReplyAloud]
  );

  const startBrowserVoiceListening = useCallback(() => {
    if (!voiceActiveRef.current) return;
    cancelSpeechOutput();
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {
        // ignore
      }
      speechRecRef.current = null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceStatus("error");
      setVoiceStatusText("Microphone speech capture is unavailable in this browser.");
      return;
    }

    const rec = new SpeechRec();
    rec.lang = speechLangRef.current;
    rec.interimResults = true;
    rec.continuous = false;
    speechRecRef.current = rec;
    setVoiceInterimText("");
    setVoiceStatus("listening");
    setVoiceStatusText("Listening — speak your command...");

    let finalSpoken = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (ev: any) => {
      let interim = "";
      finalSpoken = "";
      for (let i = 0; i < ev.results.length; i++) {
        const r = ev.results[i];
        const t = r[0]?.transcript || "";
        if (r.isFinal) finalSpoken += t;
        else interim += t;
      }
      setVoiceInterimText(`${finalSpoken}${interim}`.trim());
    };
    rec.onerror = () => {
      speechRecRef.current = null;
      if (voiceActiveRef.current) {
        setVoiceInterimText("");
        setVoiceStatus("idle");
        setVoiceStatusText("Tap mic to speak");
      }
    };
    rec.onend = () => {
      speechRecRef.current = null;
      const command = finalSpoken.trim();
      setVoiceInterimText("");
      if (command && voiceActiveRef.current) {
        void runVoiceCommand(command);
      } else if (voiceActiveRef.current) {
        setVoiceStatus((prev) => (prev === "listening" ? "idle" : prev));
        setVoiceStatusText("Tap mic to speak");
      }
    };
    try {
      rec.start();
    } catch {
      setVoiceStatus("idle");
      setVoiceStatusText("Tap mic to speak");
    }
  }, [cancelSpeechOutput, runVoiceCommand]);

  useEffect(() => {
    startBrowserVoiceListeningRef.current = startBrowserVoiceListening;
  }, [startBrowserVoiceListening]);

  const handleVoiceChatApproval = async (decision: "approve" | "reject") => {
    const pending = voiceChatPending;
    if (!pending) return;
    setVoiceChatPending(null);
    setMessages((prev) =>
      prev.map((m) => (m.id === pending.msgId ? { ...m, resolved: true } : m))
    );
    setVoiceStatus("thinking");
    setVoiceStatusText(decision === "approve" ? "Executing action..." : "Cancelling...");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvIdRef.current || undefined,
          workspaceId: activeWorkspaceIdRef.current,
          permissionMode: permissionModeRef.current,
          voiceMode: true,
          pendingApprovals: pending.pendingCalls.map((pc) => ({
            callId: pc.callId,
            name: pc.name,
            args: pc.args,
            decision,
          })),
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.executedActions)) {
        for (const act of data.executedActions as ExecutedActionItem[]) {
          appendVoiceLog({
            speaker: "action",
            text: formatToolLabel(act.name),
            ok: act.ok,
          });
        }
      }
      if (data.mutated) router.refresh();
      const replyText = data.reply || (decision === "approve" ? "Done." : "Cancelled.");
      appendVoiceLog({ speaker: "ai", text: replyText });
      setMessages((prev) => [
        ...prev,
        {
          id: data.messageId || createMsgId(),
          role: "assistant",
          content: replyText,
          executedActions: data.executedActions || [],
          resolved: true,
        },
      ]);
      speakReplyAloud(replyText, () => {
        if (voiceActiveRef.current && !voiceMutedRef.current) {
          startBrowserVoiceListeningRef.current();
        } else if (voiceActiveRef.current) {
          setVoiceStatus("idle");
          setVoiceStatusText("Tap mic to speak");
        }
      });
    } catch {
      setVoiceStatus("error");
      setVoiceStatusText("Failed to execute action.");
    }
  };

  const toggleVoiceCapture = async () => {
    if (voiceStatus === "speaking") {
      // Natural barge-in: interrupt AI speech and immediately start listening
      cancelSpeechOutput();
      startBrowserVoiceListening();
      return;
    }
    if (voiceStatus === "live" || voiceStatus === "listening" || voiceStatus === "connecting") {
      stopVoiceSession();
      setVoiceStatusText("Paused — tap mic to talk");
      return;
    }

    stopDictation();
    setVoiceStatus("connecting");
    setVoiceStatusText("Connecting voice...");

    try {
      const tokenRes = await fetch("/api/ai/live-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: activeWorkspaceIdRef.current }),
      });

      if (!tokenRes.ok) {
        startBrowserVoiceListening();
        return;
      }

      const tokenData = await tokenRes.json();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const { GoogleGenAI, Modality } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: tokenData.token,
        httpOptions: { apiVersion: "v1alpha" },
      });

      const session = await ai.live.connect({
        model: tokenData.model || "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: {
            parts: [{ text: tokenData.systemInstruction }],
          },
          tools: [{ functionDeclarations: tokenData.tools }],
        },
        callbacks: {
          onopen: () => {
            setVoiceStatus("live");
            setVoiceStatusText("Listening live...");
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onmessage: async (msg: any) => {
            const content = msg?.serverContent;
            if (content?.interrupted) {
              nextPlayTimeRef.current = playbackCtxRef.current?.currentTime || 0;
            }
            if (content?.inputTranscription?.text) {
              appendVoiceLog({ speaker: "you", text: content.inputTranscription.text });
            }
            if (content?.outputTranscription?.text) {
              appendVoiceLog({ speaker: "ai", text: content.outputTranscription.text });
            }
            if (content?.modelTurn?.parts) {
              for (const part of content.modelTurn.parts) {
                if (part?.inlineData?.data) enqueuePcmAudio(part.inlineData.data);
              }
            }
            const fnCalls = msg?.toolCall?.functionCalls;
            if (Array.isArray(fnCalls) && fnCalls.length > 0) {
              const responses = [];
              for (const call of fnCalls) {
                const execRes = await fetch("/api/ai/tool-execute", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    toolName: call.name,
                    args: call.args || {},
                    workspaceId: activeWorkspaceIdRef.current,
                    permissionMode: permissionModeRef.current,
                  }),
                });
                const execData = await execRes.json();
                if (execData.status === "requires_approval") {
                  setVoicePendingApproval({
                    callId: call.id || call.name,
                    name: call.name,
                    args: call.args || {},
                    mutability: execData.call?.mutability || "write",
                    description: execData.call?.description || `Approve ${call.name}?`,
                  });
                  return;
                }
                appendVoiceLog({
                  speaker: "action",
                  text: formatToolLabel(call.name),
                  ok: Boolean(execData.ok),
                });
                if (execData.ok && execData.mutability !== "read") router.refresh();
                responses.push({
                  id: call.id,
                  name: call.name,
                  response: execData.ok ? execData.data : { error: execData.error },
                });
              }
              if (responses.length > 0) {
                liveSessionRef.current?.sendToolResponse?.({ functionResponses: responses });
              }
            }
          },
          onerror: () => {
            stopVoiceSession();
            startBrowserVoiceListening();
          },
          onclose: () => {
            stopVoiceSession();
          },
        },
      });

      liveSessionRef.current = session;
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      processor.onaudioprocess = (ev) => {
        if (!liveSessionRef.current) return;
        const pcmBase64 = float32ToBase64Pcm16(ev.inputBuffer.getChannelData(0));
        try {
          liveSessionRef.current.sendRealtimeInput({
            audio: { data: pcmBase64, mimeType: "audio/pcm;rate=16000" },
          });
        } catch {
          // ignore
        }
      };
      source.connect(processor);
      processor.connect(audioCtx.destination);
    } catch {
      stopVoiceSession();
      startBrowserVoiceListening();
    }
  };

  const handleVoiceToolApproval = async (approve: boolean) => {
    const pending = voicePendingApproval;
    if (!pending) return;
    setVoicePendingApproval(null);

    if (!approve) {
      liveSessionRef.current?.sendToolResponse?.({
        functionResponses: [
          {
            id: pending.callId,
            name: pending.name,
            response: { cancelled: true, reason: "Declined by user" },
          },
        ],
      });
      return;
    }

    const res = await fetch("/api/ai/tool-execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolName: pending.name,
        args: pending.args,
        workspaceId: activeWorkspaceIdRef.current,
        permissionMode: permissionModeRef.current,
        confirmed: true,
      }),
    });
    const data = await res.json();
    if (data.ok && data.mutability !== "read") router.refresh();
    liveSessionRef.current?.sendToolResponse?.({
      functionResponses: [
        {
          id: pending.callId,
          name: pending.name,
          response: data.ok ? data.data : { error: data.error },
        },
      ],
    });
  };

  const PermIcon = PERMISSION_META[permissionMode].icon;

  return (
    <>
      {/* Floating Launcher Button (hidden on tiny screens while drawer is open so composer stays unobstructed) */}
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            stopVoiceSession();
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
          <Sparkles className="w-4 h-4 shrink-0 stroke-[2.2]" />
        )}
        <span className="text-xs font-bold tracking-wide">{isOpen ? "Close" : "AI"}</span>
      </button>

      {isOpen && (
        <aside
          aria-label="Manageo AI Assistant"
          className="fixed inset-x-2 top-16 bottom-20 sm:inset-auto sm:top-auto sm:bottom-20 sm:right-6 z-50 w-auto sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:h-[min(620px,calc(100dvh-7rem))] rounded-2xl bg-surface-container border border-surface-container-high shadow-2xl flex flex-col overflow-hidden text-on-surface"
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
                    stopVoiceSession();
                    setVoiceActive(false);
                  } else {
                    stopDictation();
                    setHistoryOpen(false);
                    setVoiceActive(true);
                    voiceActiveRef.current = true;
                    void toggleVoiceCapture();
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
                  stopVoiceSession();
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

            {/* Proper Hands-Free Voice Mode (Voice Command -> Agent Action -> Voice Reply) */}
            {voiceActive ? (
              <div className="flex-1 min-h-0 flex flex-col justify-between p-4 overflow-hidden">
                {/* Top Controls: Language & Audio Mute */}
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="inline-flex rounded-lg bg-surface-container-low border border-surface-container-high p-0.5">
                    {(
                      [
                        { id: "en-US", label: "EN" },
                        { id: "bn-BD", label: "বাংলা" },
                      ] as const
                    ).map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setSpeechLang(l.id)}
                        className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                          speechLang === l.id
                            ? "bg-stitch-primary text-on-primary"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextMuted = !voiceMuted;
                      setVoiceMuted(nextMuted);
                      if (nextMuted) cancelSpeechOutput();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low border border-surface-container-high text-on-surface-variant hover:text-on-surface"
                  >
                    {voiceMuted ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-red-500" />
                        <span>Muted</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-stitch-primary" />
                        <span>Voice On</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Live Voice Transcript & Actions Log */}
                <div className="flex-1 min-h-0 my-3 overflow-y-auto overflow-x-hidden rounded-2xl bg-surface-container-low border border-surface-container-high p-3 space-y-2">
                  {voiceLogs.length === 0 && !voiceInterimText ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-3 text-xs text-on-surface-variant space-y-1">
                      <p className="font-medium text-on-surface">Hands-Free Voice Assistant</p>
                      <p className="text-[11px]">
                        Speak naturally to manage tasks, notes, ideas, or expenses — the agent will execute your request and speak the result aloud.
                      </p>
                    </div>
                  ) : (
                    <>
                      {voiceLogs.map((entry) => (
                        <div
                          key={entry.id}
                          className={`text-xs leading-relaxed break-words [overflow-wrap:anywhere] ${
                            entry.speaker === "you"
                              ? "text-on-surface-variant"
                              : entry.speaker === "action"
                              ? "text-[11px] text-emerald-600 dark:text-emerald-400"
                              : "text-on-surface font-medium"
                          }`}
                        >
                          {entry.speaker === "you" && <span className="font-semibold text-stitch-primary mr-1">You:</span>}
                          {entry.speaker === "ai" && <span className="font-semibold text-stitch-primary mr-1">AI:</span>}
                          {entry.speaker === "action" && (
                            <span className="mr-1">{entry.ok ? "✓" : "✕"}</span>
                          )}
                          <span>{entry.text}</span>
                        </div>
                      ))}
                      {voiceInterimText && (
                        <div className="text-xs italic text-on-surface-variant break-words [overflow-wrap:anywhere]">
                          <span className="font-semibold text-stitch-primary not-italic mr-1">You:</span>
                          {voiceInterimText}
                        </div>
                      )}
                      <div ref={voiceLogsEndRef} />
                    </>
                  )}
                </div>

                {/* Approval Cards in Voice Mode */}
                {(voicePendingApproval || voiceChatPending) && (
                  <div className="mb-3 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-3 text-left space-y-2">
                    <div className="text-xs font-semibold text-on-surface">
                      Confirm{" "}
                      {voicePendingApproval
                        ? formatToolLabel(voicePendingApproval.name)
                        : voiceChatPending?.pendingCalls.map((c) => formatToolLabel(c.name)).join(", ")}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          voicePendingApproval
                            ? void handleVoiceToolApproval(true)
                            : void handleVoiceChatApproval("approve")
                        }
                        className="flex-1 py-1.5 rounded-lg bg-stitch-primary text-on-primary text-xs font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          voicePendingApproval
                            ? void handleVoiceToolApproval(false)
                            : void handleVoiceChatApproval("reject")
                        }
                        className="px-3 py-1.5 rounded-lg border border-surface-container-high text-xs text-on-surface-variant"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Voice Control Orb */}
                <div className="flex flex-col items-center space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => void toggleVoiceCapture()}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      voiceStatus === "live" || voiceStatus === "listening"
                        ? "bg-red-500 text-white animate-pulse"
                        : voiceStatus === "speaking"
                        ? "bg-emerald-500 text-white ring-4 ring-emerald-500/25"
                        : voiceStatus === "thinking" || voiceStatus === "connecting"
                        ? "bg-surface-container-high text-stitch-primary"
                        : "bg-stitch-primary text-on-primary hover:scale-105"
                    }`}
                  >
                    {voiceStatus === "connecting" || voiceStatus === "thinking" ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : voiceStatus === "speaking" ? (
                      <Square className="w-5 h-5 fill-current" />
                    ) : voiceStatus === "live" || voiceStatus === "listening" ? (
                      <MicOff className="w-6 h-6" />
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </button>

                  <div className="text-center space-y-0.5">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                      {voiceStatus === "live" && (
                        <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                      )}
                      <span>{voiceStatusText}</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      {voiceStatus === "speaking"
                        ? "Tap orb to interrupt and speak"
                        : voiceStatus === "listening" || voiceStatus === "live"
                        ? "Speak now • tap orb to pause"
                        : "Tap orb to talk"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      stopVoiceSession();
                      setVoiceActive(false);
                    }}
                    className="text-xs text-on-surface-variant hover:text-on-surface"
                  >
                    Return to text chat
                  </button>
                </div>
              </div>
            ) : (
              /* Clean Conversation Stream */
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3.5 sm:px-4 py-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-2 space-y-4">
                    <div className="w-9 h-9 rounded-xl bg-stitch-primary/12 text-stitch-primary flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
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
                          voiceActiveRef.current = true;
                          void toggleVoiceCapture();
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
