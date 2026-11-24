"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  X,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  Settings,
  Trash2,
  KeyRound,
  Volume2,
  Radio,
  Wrench,
} from "lucide-react";
import { updateAiSettings, getAiAndMcpSettings } from "@/actions/mcp.actions";
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
  resumeInteractionSteps?: Array<Record<string, unknown>>;
  resolved?: boolean;
}

interface VoicePendingCall {
  callId: string;
  name: string;
  args: Record<string, unknown>;
  mutability: ToolMutability;
  description: string;
}

const PERMISSION_MODES: Array<{
  id: PermissionMode;
  label: string;
  shortDesc: string;
  icon: typeof ShieldCheck;
}> = [
  {
    id: "review",
    label: "Review",
    shortDesc: "Ask before write & delete",
    icon: ShieldAlert,
  },
  {
    id: "default_approved",
    label: "Approved",
    shortDesc: "Auto write, ask on delete",
    icon: ShieldCheck,
  },
  {
    id: "turbo",
    label: "Turbo",
    shortDesc: "Auto execute everything",
    icon: Zap,
  },
];

const SUGGESTIONS = [
  "Summarize my active workspace",
  "List my pending tasks",
  "Create a high-priority task for tomorrow",
  "Show my recent expenses & balances",
];

function createMsgId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.04;
    window.speechSynthesis.speak(utter);
  } catch {
    // ignore speech synthesis restrictions
  }
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

export function AiAssistantWidget({
  activeWorkspaceId,
  activeWorkspaceName,
  initialAiSettings,
  hasServerEnvKey = false,
}: AiAssistantWidgetProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");

  const [permissionMode, setPermissionMode] = useState<PermissionMode>(
    initialAiSettings?.permissionMode || "default_approved"
  );
  const [preferredModel, setPreferredModel] = useState<string>(
    initialAiSettings?.preferredModel || "gemini-4-hydrogen"
  );
  const [voiceAutoSpeak, setVoiceAutoSpeak] = useState<boolean>(
    initialAiSettings?.voiceAutoSpeak !== false
  );
  const [hasKey, setHasKey] = useState<boolean>(
    Boolean(initialAiSettings?.hasCustomApiKey || hasServerEnvKey)
  );
  const [showKeyCard, setShowKeyCard] = useState<boolean>(false);
  const [keyInput, setKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  // Text Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [approvalSelection, setApprovalSelection] = useState<
    Record<string, "approve" | "reject">
  >({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Voice Mode state
  const [voiceStatus, setVoiceStatus] = useState<
    "idle" | "connecting" | "live" | "listening_fallback" | "error"
  >("idle");
  const [voiceEngine, setVoiceEngine] = useState<"gemini-live" | "browser-speech">(
    "gemini-live"
  );
  const [voiceStatusText, setVoiceStatusText] = useState<string>(
    "Tap the microphone to start talking to Manageo AI."
  );
  const [voiceTranscripts, setVoiceTranscripts] = useState<
    Array<{ id: string; speaker: "you" | "ai" | "tool"; text: string }>
  >([]);
  const [voicePendingApproval, setVoicePendingApproval] =
    useState<VoicePendingCall | null>(null);

  // Refs for voice cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liveSessionRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRecRef = useRef<any>(null);
  const permissionModeRef = useRef<PermissionMode>(permissionMode);
  const activeWorkspaceIdRef = useRef<string | undefined>(activeWorkspaceId);

  useEffect(() => {
    permissionModeRef.current = permissionMode;
  }, [permissionMode]);

  useEffect(() => {
    activeWorkspaceIdRef.current = activeWorkspaceId;
  }, [activeWorkspaceId]);

  const stopVoiceSession = useCallback(() => {
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
    setVoiceStatus("idle");
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
          hasCustomApiKey?: boolean;
          preferredModel?: string;
          permissionMode?: PermissionMode;
          voiceAutoSpeak?: boolean;
        };
        if (ai.permissionMode) setPermissionMode(ai.permissionMode);
        if (ai.preferredModel) setPreferredModel(ai.preferredModel);
        setVoiceAutoSpeak(ai.voiceAutoSpeak !== false);
        setHasKey(Boolean(ai.hasCustomApiKey || res.hasServerEnvKey));
      });
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("manageo:open-ai-assistant", onOpenEvent);
    window.addEventListener("manageo:ai-settings-updated", onSettingsUpdated);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("manageo:open-ai-assistant", onOpenEvent);
      window.removeEventListener("manageo:ai-settings-updated", onSettingsUpdated);
      stopVoiceSession();
    };
  }, [stopVoiceSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handlePermissionChange = async (next: PermissionMode) => {
    setPermissionMode(next);
    await updateAiSettings({ permissionMode: next });
  };

  const handleSaveInlineKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setSavingKey(true);
    const res = await updateAiSettings({ geminiApiKey: keyInput.trim() });
    setSavingKey(false);
    if (!res.success) {
      setErrorBanner(res.error || "Failed to save API key");
      return;
    }
    setHasKey(true);
    setShowKeyCard(false);
    setKeyInput("");
    setErrorBanner(null);
    window.dispatchEvent(new CustomEvent("manageo:ai-settings-updated"));
  };

  const sendTextMessage = async (textOverride?: string) => {
    const trimmed = (textOverride ?? input).trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = {
      id: createMsgId(),
      role: "user",
      content: trimmed,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!textOverride) setInput("");
    setErrorBanner(null);
    setSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          workspaceId: activeWorkspaceId,
          permissionMode,
          model: preferredModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "MISSING_API_KEY") {
          setShowKeyCard(true);
          setHasKey(false);
        }
        setErrorBanner(data.error || "Assistant request failed");
        setSending(false);
        return;
      }

      const assistantMsg: ChatMessage = {
        id: createMsgId(),
        role: "assistant",
        content: data.reply || "",
        executedActions: data.executedActions,
        pendingCalls: data.pendingCalls,
        resumeInteractionSteps: data.resumeInteractionSteps,
        resolved: data.status !== "requires_approval",
      };

      if (Array.isArray(data.pendingCalls)) {
        const initSel: Record<string, "approve" | "reject"> = {};
        for (const pc of data.pendingCalls) {
          initSel[pc.callId] = "approve";
        }
        setApprovalSelection(initSel);
      }

      setMessages((prev) => [...prev, assistantMsg]);
      if (data.mutated) {
        router.refresh();
      }
      if (mode === "voice" && voiceAutoSpeak && data.reply) {
        speakText(data.reply);
      }
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : "Network error");
    } finally {
      setSending(false);
    }
  };

  const handleResolvePendingCalls = async (
    msgId: string,
    pendingCalls: PendingCallItem[],
    resumeSteps: Array<Record<string, unknown>>,
    overrideDecision?: "approve" | "reject"
  ) => {
    if (sending) return;
    setSending(true);
    setErrorBanner(null);

    const pendingApprovals = pendingCalls.map((pc) => ({
      callId: pc.callId,
      name: pc.name,
      args: pc.args,
      decision: overrideDecision || approvalSelection[pc.callId] || "approve",
    }));

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, resolved: true } : m))
    );

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          workspaceId: activeWorkspaceId,
          permissionMode,
          model: preferredModel,
          pendingApprovals,
          resumeInteractionSteps: resumeSteps,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorBanner(data.error || "Failed to execute approved action");
        setSending(false);
        return;
      }

      const followUp: ChatMessage = {
        id: createMsgId(),
        role: "assistant",
        content: data.reply || "",
        executedActions: data.executedActions,
        pendingCalls: data.pendingCalls,
        resumeInteractionSteps: data.resumeInteractionSteps,
        resolved: data.status !== "requires_approval",
      };
      setMessages((prev) => [...prev, followUp]);
      if (data.mutated) {
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : "Network error");
    } finally {
      setSending(false);
    }
  };

  const enqueuePcmAudio = useCallback((base64Pcm: string) => {
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
      // ignore malformed audio frame
    }
  }, []);

  const appendVoiceTranscript = (speaker: "you" | "ai" | "tool", text: string) => {
    if (!text.trim()) return;
    setVoiceTranscripts((prev) => [...prev.slice(-24), { id: createMsgId(), speaker, text }]);
  };

  const handleVoiceToolApproval = async (approve: boolean) => {
    const pending = voicePendingApproval;
    if (!pending) return;
    setVoicePendingApproval(null);

    if (!approve) {
      appendVoiceTranscript("tool", `Declined ${pending.name}`);
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
    appendVoiceTranscript(
      "tool",
      data.ok ? `Executed ${pending.name}` : `Error (${pending.name}): ${data.error}`
    );
    if (data.ok && data.mutability !== "read") {
      router.refresh();
    }
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

  const startBrowserSpeechFallback = useCallback(() => {
    stopVoiceSession();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceStatus("error");
      setVoiceStatusText(
        "Microphone speech recognition is not supported in this browser. Switch to Text mode or use Chrome/Edge."
      );
      return;
    }

    const rec = new SpeechRec();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    speechRecRef.current = rec;
    setVoiceStatus("listening_fallback");
    setVoiceStatusText("Listening via browser speech... speak your Manageo command.");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = async (event: any) => {
      const spoken = event?.results?.[0]?.[0]?.transcript || "";
      if (!spoken) {
        setVoiceStatus("idle");
        return;
      }
      appendVoiceTranscript("you", spoken);
      setVoiceStatus("idle");
      setVoiceStatusText(`Processing "${spoken}"...`);
      setMode("text");
      await sendTextMessage(spoken);
    };
    rec.onerror = () => {
      setVoiceStatus("idle");
      setVoiceStatusText("Voice capture ended. Tap microphone to speak again.");
    };
    rec.onend = () => {
      setVoiceStatus((prev) => (prev === "listening_fallback" ? "idle" : prev));
    };
    rec.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopVoiceSession]);

  const startGeminiLiveVoice = async () => {
    if (voiceStatus === "live" || voiceStatus === "connecting") {
      stopVoiceSession();
      setVoiceStatusText("Voice session stopped.");
      return;
    }
    if (voiceEngine === "browser-speech") {
      startBrowserSpeechFallback();
      return;
    }

    setVoiceStatus("connecting");
    setVoiceStatusText("Connecting to Gemini 3.8 Live voice...");
    setErrorBanner(null);

    try {
      const tokenRes = await fetch("/api/ai/live-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: activeWorkspaceId }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        if (tokenData.code === "MISSING_API_KEY") {
          setShowKeyCard(true);
          setHasKey(false);
        }
        throw new Error(tokenData.error || "Unable to mint live voice token");
      }

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
            setVoiceStatusText("Gemini 3.8 Live active — speak naturally.");
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onmessage: async (msg: any) => {
            const content = msg?.serverContent;
            if (content?.interrupted) {
              nextPlayTimeRef.current = playbackCtxRef.current?.currentTime || 0;
            }
            if (content?.modelTurn?.parts) {
              for (const part of content.modelTurn.parts) {
                if (part?.inlineData?.data) {
                  enqueuePcmAudio(part.inlineData.data);
                }
              }
            }
            if (content?.inputTranscription?.text) {
              appendVoiceTranscript("you", content.inputTranscription.text);
            }
            if (content?.outputTranscription?.text) {
              appendVoiceTranscript("ai", content.outputTranscription.text);
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
                appendVoiceTranscript(
                  "tool",
                  execData.ok ? `Executed ${call.name}` : `Error (${call.name}): ${execData.error}`
                );
                if (execData.ok && execData.mutability !== "read") {
                  router.refresh();
                }
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
            setVoiceStatusText("Live voice encountered a connection issue; you can use Browser Speech fallback.");
            stopVoiceSession();
          },
          onclose: () => {
            stopVoiceSession();
            setVoiceStatusText("Voice session closed.");
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
          // ignore send errors after socket close
        }
      };
      source.connect(processor);
      processor.connect(audioCtx.destination);
    } catch (err: unknown) {
      stopVoiceSession();
      setVoiceStatus("error");
      setVoiceStatusText(
        err instanceof Error
          ? `${err.message} — switching or try Browser Speech below.`
          : "Live connection failed."
      );
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Toggle Manageo AI Assistant"
        title="Manageo AI Assistant (Ctrl + J)"
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center gap-2 rounded-full bg-stitch-primary text-stitch-on-primary px-4 py-3 shadow-xl hover:opacity-95 active:scale-95 transition-all ring-1 ring-surface-container-high/40"
      >
        <Sparkles className="w-4 h-4 shrink-0" />
        <span className="text-xs font-bold tracking-wide">AI</span>
      </button>

      {/* Expandable Assistant Drawer */}
      {isOpen && (
        <aside
          aria-label="Manageo AI Assistant Window"
          className="fixed bottom-20 md:bottom-20 right-3 md:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[420px] h-[min(650px,calc(100dvh-7rem))] rounded-3xl bg-surface-container border border-surface-container-high shadow-2xl flex flex-col overflow-hidden text-on-surface"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-surface-container-high bg-surface-container-low/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-stitch-primary/15 text-stitch-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">Manageo AI Assistant</div>
                <div className="text-[10px] text-on-surface-variant truncate">
                  {activeWorkspaceName ? `${activeWorkspaceName} • ` : ""}
                  {preferredModel}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowKeyCard((s) => !s)}
                title="Gemini API Key"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
              <Link
                href="/dashboard/settings?tab=ai-mcp"
                onClick={() => setIsOpen(false)}
                title="AI & MCP Settings"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setVoiceTranscripts([]);
                  setErrorBanner(null);
                }}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  stopVoiceSession();
                  setIsOpen(false);
                }}
                title="Close"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode + Permission Strip */}
          <div className="px-3.5 py-2 border-b border-surface-container-high bg-surface-container/60 flex flex-wrap items-center justify-between gap-2">
            {/* Voice / Text Mode Switcher */}
            <div className="inline-flex rounded-xl bg-surface-container-low p-0.5 border border-surface-container-high">
              <button
                type="button"
                onClick={() => {
                  stopVoiceSession();
                  setMode("text");
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  mode === "text"
                    ? "bg-stitch-primary text-stitch-on-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <MessageSquare className="w-3 h-3" /> Text
              </button>
              <button
                type="button"
                onClick={() => setMode("voice")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  mode === "voice"
                    ? "bg-stitch-primary text-stitch-on-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Mic className="w-3 h-3" /> Voice
              </button>
            </div>

            {/* Permission Policy Selector */}
            <div
              title="Execution permission policy"
              className="inline-flex rounded-xl bg-surface-container-low p-0.5 border border-surface-container-high"
            >
              {PERMISSION_MODES.map((pm) => {
                const Icon = pm.icon;
                const active = permissionMode === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => handlePermissionChange(pm.id)}
                    title={pm.shortDesc}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                      active
                        ? pm.id === "turbo"
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-300"
                          : pm.id === "review"
                          ? "bg-blue-500/20 text-blue-600 dark:text-blue-300"
                          : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inline Gemini Key Setup Banner */}
          {(showKeyCard || !hasKey) && (
            <form
              onSubmit={handleSaveInlineKey}
              className="p-3 border-b border-surface-container-high bg-amber-500/10 space-y-2"
            >
              <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                Add your Gemini API Key (stored encrypted with AES-256-GCM) to activate AI:
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="AIza..."
                  className="flex-1 min-w-0 rounded-xl bg-surface-container-low border border-surface-container-high px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-stitch-primary"
                />
                <button
                  type="submit"
                  disabled={savingKey || !keyInput.trim()}
                  className="px-3 py-1.5 rounded-xl bg-stitch-primary text-stitch-on-primary text-xs font-semibold disabled:opacity-50"
                >
                  {savingKey ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          )}

          {errorBanner && (
            <div className="px-3.5 py-2 bg-red-500/10 border-b border-red-500/30 text-[11px] text-red-600 dark:text-red-400">
              {errorBanner}
            </div>
          )}

          {/* TEXT MODE BODY */}
          {mode === "text" ? (
            <>
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                {messages.length === 0 ? (
                  <div className="py-6 space-y-4">
                    <div className="text-center space-y-1.5">
                      <p className="text-xs font-semibold text-on-surface">
                        Ask Manageo AI to manage anything
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        Policy:{" "}
                        <strong className="text-on-surface">
                          {PERMISSION_MODES.find((p) => p.id === permissionMode)?.label}
                        </strong>{" "}
                        ({PERMISSION_MODES.find((p) => p.id === permissionMode)?.shortDesc})
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => void sendTextMessage(s)}
                          className="text-left px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high hover:border-stitch-primary/50 text-xs text-on-surface transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        m.role === "user" ? "items-end" : "items-start"
                      } space-y-1.5`}
                    >
                      {m.content && (
                        <div
                          className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                            m.role === "user"
                              ? "bg-stitch-primary text-stitch-on-primary rounded-br-sm"
                              : "bg-surface-container-low border border-surface-container-high text-on-surface rounded-bl-sm"
                          }`}
                        >
                          {m.content}
                        </div>
                      )}

                      {/* Tool Execution Pills */}
                      {m.executedActions && m.executedActions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 max-w-[92%]">
                          {m.executedActions.map((act, idx) => (
                            <span
                              key={`${m.id}-act-${idx}`}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border ${
                                act.ok
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                              }`}
                            >
                              {act.ok ? (
                                <CheckCircle2 className="w-2.5 h-2.5" />
                              ) : (
                                <XCircle className="w-2.5 h-2.5" />
                              )}
                              <span>{act.name}</span>
                              <span className="opacity-70 uppercase">({act.mutability})</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Pending Approval Card */}
                      {m.pendingCalls && m.pendingCalls.length > 0 && !m.resolved && (
                        <div className="w-full rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            <Wrench className="w-3.5 h-3.5" />
                            Approval Required ({m.pendingCalls.length})
                          </div>
                          {m.pendingCalls.map((pc) => (
                            <div
                              key={pc.callId}
                              className="rounded-xl bg-surface-container-low border border-surface-container-high p-2.5 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-on-surface">
                                  {pc.name}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    pc.mutability === "delete"
                                      ? "bg-red-500/20 text-red-600 dark:text-red-400"
                                      : "bg-blue-500/20 text-blue-600 dark:text-blue-300"
                                  }`}
                                >
                                  {pc.mutability}
                                </span>
                              </div>
                              <pre className="text-[10px] text-on-surface-variant overflow-x-auto">
                                {JSON.stringify(pc.args, null, 2)}
                              </pre>
                            </div>
                          ))}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={sending}
                              onClick={() =>
                                handleResolvePendingCalls(
                                  m.id,
                                  m.pendingCalls!,
                                  m.resumeInteractionSteps || [],
                                  "approve"
                                )
                              }
                              className="flex-1 py-1.5 rounded-xl bg-stitch-primary text-stitch-on-primary text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                            >
                              Approve &amp; Run
                            </button>
                            <button
                              type="button"
                              disabled={sending}
                              onClick={() =>
                                handleResolvePendingCalls(
                                  m.id,
                                  m.pendingCalls!,
                                  m.resumeInteractionSteps || [],
                                  "reject"
                                )
                              }
                              className="px-3 py-1.5 rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {sending && (
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant px-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-stitch-primary" />
                    <span>Thinking &amp; running tools...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendTextMessage();
                }}
                className="p-3 border-t border-surface-container-high bg-surface-container-low/80 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Create a task, search notes, log an expense..."
                  className="flex-1 min-w-0 rounded-xl bg-surface-container border border-surface-container-high px-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-stitch-primary"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  aria-label="Send message"
                  className="p-2 rounded-xl bg-stitch-primary text-stitch-on-primary hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            /* VOICE MODE BODY */
            <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto space-y-4">
              {/* Engine Selector */}
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-on-surface-variant font-medium">Voice Engine:</span>
                <div className="inline-flex rounded-lg bg-surface-container-low p-0.5 border border-surface-container-high">
                  <button
                    type="button"
                    onClick={() => {
                      stopVoiceSession();
                      setVoiceEngine("gemini-live");
                    }}
                    className={`px-2 py-0.5 rounded-md font-semibold ${
                      voiceEngine === "gemini-live"
                        ? "bg-stitch-primary text-stitch-on-primary"
                        : "text-on-surface-variant"
                    }`}
                  >
                    Gemini 3.8 Live
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopVoiceSession();
                      setVoiceEngine("browser-speech");
                    }}
                    className={`px-2 py-0.5 rounded-md font-semibold ${
                      voiceEngine === "browser-speech"
                        ? "bg-stitch-primary text-stitch-on-primary"
                        : "text-on-surface-variant"
                    }`}
                  >
                    Browser Speech
                  </button>
                </div>
              </div>

              {/* Orb / Mic Control */}
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <button
                  type="button"
                  onClick={() => void startGeminiLiveVoice()}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    voiceStatus === "live" || voiceStatus === "listening_fallback"
                      ? "bg-red-500 text-white animate-pulse"
                      : voiceStatus === "connecting"
                      ? "bg-amber-500/20 text-amber-500 border border-amber-500/40"
                      : "bg-stitch-primary text-stitch-on-primary hover:scale-105"
                  }`}
                >
                  {voiceStatus === "connecting" ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : voiceStatus === "live" || voiceStatus === "listening_fallback" ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                    {voiceStatus === "live" ? (
                      <>
                        <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        Live Connected
                      </>
                    ) : voiceStatus === "listening_fallback" ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-stitch-primary" />
                        Listening...
                      </>
                    ) : (
                      "Tap Mic to Talk"
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant max-w-xs">
                    {voiceStatusText}
                  </p>
                </div>

                {voiceStatus === "error" && (
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceEngine("browser-speech");
                      startBrowserSpeechFallback();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-surface-container-low border border-surface-container-high text-[11px] font-semibold text-stitch-primary hover:bg-surface-container-high"
                  >
                    Use Browser Speech Fallback
                  </button>
                )}
              </div>

              {/* Voice Tool Approval Prompt */}
              {voicePendingApproval && (
                <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    Voice Action Approval: {voicePendingApproval.name} ({voicePendingApproval.mutability})
                  </div>
                  <pre className="text-[10px] text-on-surface-variant overflow-x-auto">
                    {JSON.stringify(voicePendingApproval.args, null, 2)}
                  </pre>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleVoiceToolApproval(true)}
                      className="flex-1 py-1.5 rounded-xl bg-stitch-primary text-stitch-on-primary text-xs font-semibold"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleVoiceToolApproval(false)}
                      className="px-3 py-1.5 rounded-xl border border-surface-container-high bg-surface-container-low text-xs font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Live Transcripts */}
              <div className="flex-1 min-h-[120px] max-h-[210px] overflow-y-auto rounded-2xl bg-surface-container-low border border-surface-container-high p-3 space-y-2">
                {voiceTranscripts.length === 0 ? (
                  <p className="text-[11px] text-on-surface-variant text-center py-6">
                    Live voice transcripts and executed Manageo actions will appear here.
                  </p>
                ) : (
                  voiceTranscripts.map((t) => (
                    <div key={t.id} className="text-[11px] leading-relaxed">
                      <span className="font-bold uppercase mr-1.5 text-stitch-primary">
                        {t.speaker}:
                      </span>
                      <span className="text-on-surface">{t.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>
      )}
    </>
  );
}
