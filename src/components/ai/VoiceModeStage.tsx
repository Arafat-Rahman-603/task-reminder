"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  AudioLines,
  Captions,
  Loader2,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  PhoneOff,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  detectSpeechLang,
  mergeStreamingTranscript,
  playVoiceCue,
  selectBestSpeechVoice,
  splitTextForSpeech,
  stripMarkdownForSpeech,
} from "@/lib/ai/voice-utils";
import type { PermissionMode, ToolMutability } from "@/lib/ai/tools";

export interface VoiceExecutedActionItem {
  callId?: string;
  name: string;
  mutability: ToolMutability;
  args?: Record<string, unknown>;
  ok: boolean;
  summary?: string;
  error?: string;
}

export interface VoicePendingCallItem {
  callId: string;
  name: string;
  args: Record<string, unknown>;
  mutability: ToolMutability;
  description: string;
}

export interface VoiceConversationSyncPayload {
  conversationId?: string;
  conversationTitle?: string;
  userMessage?: string;
  assistantMessage?: {
    id: string;
    content: string;
    executedActions?: VoiceExecutedActionItem[];
    pendingCalls?: VoicePendingCallItem[];
    resolved?: boolean;
  };
  mutated?: boolean;
}

interface VoiceModeStageProps {
  activeWorkspaceId?: string;
  permissionMode: PermissionMode;
  speechLang: "en-US" | "bn-BD";
  onSpeechLangChange: (lang: "en-US" | "bn-BD") => void;
  activeConversationId: string | null;
  onConversationSync: (payload: VoiceConversationSyncPayload) => void;
  onExit: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

type VoiceStageStatus =
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "muted"
  | "error";

type VoiceEngineKind = "gemini-live" | "smart-voice";

type GeminiLiveVoice = "Aoede" | "Puck" | "Charon" | "Kore" | "Fenrir";

const GEMINI_LIVE_VOICES: readonly GeminiLiveVoice[] = [
  "Aoede",
  "Puck",
  "Charon",
  "Kore",
  "Fenrir",
];

interface VoiceLivePendingCall {
  callId: string;
  name: string;
  args: Record<string, unknown>;
  mutability: ToolMutability;
  description: string;
}

interface VoiceChatPendingApproval {
  msgId: string;
  pendingCalls: VoicePendingCallItem[];
}

function createVoiceMsgId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatToolLabel(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

function computeAnalyserLevel(analyser: AnalyserNode | null, buf: Uint8Array<ArrayBuffer> | null): number {
  if (!analyser || !buf) return 0;
  analyser.getByteTimeDomainData(buf);
  let sumSq = 0;
  for (let i = 0; i < buf.length; i++) {
    const norm = (buf[i] - 128) / 128;
    sumSq += norm * norm;
  }
  const rms = Math.sqrt(sumSq / buf.length);
  return Math.min(1, rms * 3.8);
}

export function VoiceModeStage({
  activeWorkspaceId,
  permissionMode,
  speechLang,
  onSpeechLangChange,
  activeConversationId,
  onConversationSync,
  onExit,
  expanded,
  onToggleExpand,
}: VoiceModeStageProps) {
  const [engine, setEngine] = useState<VoiceEngineKind>("smart-voice");
  const [status, setStatus] = useState<VoiceStageStatus>("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [captionsOpen, setCaptionsOpen] = useState(true);
  const [liveUserCaption, setLiveUserCaption] = useState("");
  const [liveAiCaption, setLiveAiCaption] = useState("");
  const [settledCaption, setSettledCaption] = useState("");
  const [actionChips, setActionChips] = useState<Array<{ id: string; text: string; ok: boolean }>>([]);
  const [liveVoice, setLiveVoice] = useState<GeminiLiveVoice>("Aoede");
  const [livePendingApproval, setLivePendingApproval] =
    useState<VoiceLivePendingCall | null>(null);
  const [chatPendingApproval, setChatPendingApproval] =
    useState<VoiceChatPendingApproval | null>(null);

  // Synced mutable refs to avoid stale closures inside audio/recognition callbacks
  const mountedRef = useRef(true);
  const sessionGenRef = useRef(0);
  const engineRef = useRef<VoiceEngineKind>("smart-voice");
  const statusRef = useRef<VoiceStageStatus>("connecting");
  const micMutedRef = useRef(false);
  const speakerMutedRef = useRef(false);
  const speechLangRef = useRef<"en-US" | "bn-BD">(speechLang);
  const permissionModeRef = useRef<PermissionMode>(permissionMode);
  const workspaceIdRef = useRef<string | undefined>(activeWorkspaceId);
  const conversationIdRef = useRef<string | null>(activeConversationId);
  const liveVoiceRef = useRef<GeminiLiveVoice>("Aoede");
  const onConversationSyncRef = useRef(onConversationSync);

  // Audio / Speech runtime refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liveSessionRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micAnalyserBufRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const playbackCtxRef = useRef<AudioContext | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserBufRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextPlayTimeRef = useRef<number>(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRecRef = useRef<any>(null);
  const sessionTranscriptRef = useRef("");
  const committingRef = useRef(false);
  const emptyRestartCountRef = useRef(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TTS tracking refs
  const ttsRunIdRef = useRef(0);
  const ttsKeepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ttsWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gemini Live streaming turn accumulators
  const liveUserTurnRef = useRef("");
  const liveAiTurnRef = useRef("");
  const liveUserSyncedRef = useRef(false);

  // Visual orb DOM refs (updated directly in rAF for 60fps smoothness without React re-renders)
  const orbOuterRef = useRef<HTMLDivElement | null>(null);
  const orbHaloRef = useRef<HTMLDivElement | null>(null);
  const orbCoreRef = useRef<HTMLButtonElement | null>(null);
  const orbLevelRef = useRef(0);

  useEffect(() => {
    speechLangRef.current = speechLang;
  }, [speechLang]);

  useEffect(() => {
    permissionModeRef.current = permissionMode;
  }, [permissionMode]);

  useEffect(() => {
    workspaceIdRef.current = activeWorkspaceId;
  }, [activeWorkspaceId]);

  useEffect(() => {
    conversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    onConversationSyncRef.current = onConversationSync;
  }, [onConversationSync]);

  const setStageStatus = useCallback((next: VoiceStageStatus) => {
    statusRef.current = next;
    if (mountedRef.current) setStatus(next);
  }, []);

  const pushActionChip = useCallback((name: string, ok: boolean) => {
    if (!mountedRef.current) return;
    setActionChips((prev) => [
      ...prev.slice(-2),
      { id: createVoiceMsgId(), text: formatToolLabel(name), ok },
    ]);
  }, []);

  const clearSmartTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const stopPcmPlayback = useCallback(() => {
    for (const src of activeSourcesRef.current) {
      try {
        src.onended = null;
        src.stop();
        src.disconnect();
      } catch {
        // ignore
      }
    }
    activeSourcesRef.current.clear();
    if (playbackCtxRef.current) {
      nextPlayTimeRef.current = playbackCtxRef.current.currentTime;
    } else {
      nextPlayTimeRef.current = 0;
    }
  }, []);

  const cancelSpeechOutput = useCallback(() => {
    ttsRunIdRef.current += 1;
    if (ttsKeepAliveRef.current) {
      clearInterval(ttsKeepAliveRef.current);
      ttsKeepAliveRef.current = null;
    }
    if (ttsWatchdogRef.current) {
      clearTimeout(ttsWatchdogRef.current);
      ttsWatchdogRef.current = null;
    }
    stopPcmPlayback();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }, [stopPcmPlayback]);

  const stopRecognitionOnly = useCallback(() => {
    clearSmartTimers();
    if (speechRecRef.current) {
      const rec = speechRecRef.current;
      speechRecRef.current = null;
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.stop();
      } catch {
        // ignore
      }
    }
  }, [clearSmartTimers]);

  const teardownAllAudioAndSessions = useCallback(() => {
    sessionGenRef.current += 1;
    cancelSpeechOutput();
    stopRecognitionOnly();

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // ignore
      }
      processorRef.current = null;
    }
    micAnalyserRef.current = null;
    micAnalyserBufRef.current = null;
    if (captureCtxRef.current) {
      void captureCtxRef.current.close().catch(() => {});
      captureCtxRef.current = null;
    }
    outputAnalyserRef.current = null;
    outputAnalyserBufRef.current = null;
    outputGainRef.current = null;
    if (playbackCtxRef.current) {
      void playbackCtxRef.current.close().catch(() => {});
      playbackCtxRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (liveSessionRef.current) {
      const sess = liveSessionRef.current;
      liveSessionRef.current = null;
      try {
        sess.close?.();
      } catch {
        // ignore
      }
    }
    liveUserTurnRef.current = "";
    liveAiTurnRef.current = "";
    liveUserSyncedRef.current = false;
    sessionTranscriptRef.current = "";
    committingRef.current = false;
  }, [cancelSpeechOutput, stopRecognitionOnly]);

  const ensureMicAnalyser = useCallback(async () => {
    if (micStreamRef.current && micAnalyserRef.current) return micStreamRef.current;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return null;
    try {
      const stream =
        micStreamRef.current ||
        (await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        }));
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return null;
      }
      micStreamRef.current = stream;

      if (!captureCtxRef.current) {
        captureCtxRef.current = new AudioContext({ sampleRate: 16000 });
      }
      if (captureCtxRef.current.state === "suspended") {
        void captureCtxRef.current.resume().catch(() => {});
      }
      if (!micAnalyserRef.current) {
        const analyser = captureCtxRef.current.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        const src = captureCtxRef.current.createMediaStreamSource(stream);
        src.connect(analyser);
        micAnalyserRef.current = analyser;
        micAnalyserBufRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      }
      return stream;
    } catch {
      return null;
    }
  }, []);

  const enqueuePcmAudio = useCallback(
    (base64Pcm: string, onDrain?: () => void) => {
      if (speakerMutedRef.current || !mountedRef.current) return;
      try {
        if (!playbackCtxRef.current) {
          const ctx = new AudioContext({ sampleRate: 24000 });
          const gain = ctx.createGain();
          gain.gain.value = speakerMutedRef.current ? 0 : 1;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.75;

          gain.connect(analyser);
          analyser.connect(ctx.destination);

          playbackCtxRef.current = ctx;
          outputGainRef.current = gain;
          outputAnalyserRef.current = analyser;
          outputAnalyserBufRef.current = new Uint8Array(
            new ArrayBuffer(analyser.frequencyBinCount)
          );
          nextPlayTimeRef.current = ctx.currentTime;
        }

        const ctx = playbackCtxRef.current;
        if (ctx.state === "suspended") {
          void ctx.resume().catch(() => {});
        }
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
        source.connect(outputGainRef.current || ctx.destination);

        activeSourcesRef.current.add(source);
        source.onended = () => {
          activeSourcesRef.current.delete(source);
          if (activeSourcesRef.current.size === 0) {
            onDrain?.();
          }
        };

        const startAt = Math.max(ctx.currentTime + 0.015, nextPlayTimeRef.current);
        source.start(startAt);
        nextPlayTimeRef.current = startAt + audioBuffer.duration;
        setStageStatus("speaking");
      } catch {
        // ignore malformed PCM chunks
      }
    },
    [setStageStatus]
  );

  // Refs to resolve circular calls between startSmartListening -> runSmartTurn -> speakSmartReply -> startSmartListening
  const startSmartListeningRef = useRef<() => void>(() => {});

  const speakSmartReply = useCallback(
    (rawText: string, onDone?: () => void) => {
      cancelSpeechOutput();
      const spoken = stripMarkdownForSpeech(rawText);
      if (mountedRef.current) {
        setLiveAiCaption(spoken || rawText);
        setSettledCaption(spoken || rawText);
      }

      if (
        !spoken ||
        speakerMutedRef.current ||
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
      const gen = sessionGenRef.current;
      const targetLang = detectSpeechLang(spoken, speechLangRef.current);
      const voices = window.speechSynthesis.getVoices?.() || [];
      const matchingVoice = selectBestSpeechVoice(voices, targetLang);

      setStageStatus("speaking");

      // Prevent Chromium from freezing mid-utterance on long spoken answers
      ttsKeepAliveRef.current = setInterval(() => {
        if (ttsRunIdRef.current !== runId || !mountedRef.current) return;
        try {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        } catch {
          // ignore
        }
      }, 7500);

      let idx = 0;
      const finishAll = () => {
        if (ttsKeepAliveRef.current) {
          clearInterval(ttsKeepAliveRef.current);
          ttsKeepAliveRef.current = null;
        }
        if (ttsWatchdogRef.current) {
          clearTimeout(ttsWatchdogRef.current);
          ttsWatchdogRef.current = null;
        }
        if (mountedRef.current && gen === sessionGenRef.current && ttsRunIdRef.current === runId) {
          onDone?.();
        }
      };

      const speakNext = () => {
        if (!mountedRef.current || gen !== sessionGenRef.current || ttsRunIdRef.current !== runId) {
          return;
        }
        if (ttsWatchdogRef.current) {
          clearTimeout(ttsWatchdogRef.current);
          ttsWatchdogRef.current = null;
        }
        if (idx >= chunks.length) {
          finishAll();
          return;
        }

        const chunk = chunks[idx];
        idx += 1;
        const utter = new SpeechSynthesisUtterance(chunk);
        utter.lang = targetLang;
        if (matchingVoice) utter.voice = matchingVoice;
        utter.rate = 1.03;

        let settled = false;
        const advance = () => {
          if (settled) return;
          settled = true;
          speakNext();
        };

        utter.onend = advance;
        utter.onerror = advance;

        // Per-chunk watchdog if browser speech engine drops completion callback
        ttsWatchdogRef.current = setTimeout(
          advance,
          Math.max(8000, chunk.length * 145)
        );

        try {
          window.speechSynthesis.speak(utter);
        } catch {
          finishAll();
        }
      };

      speakNext();
    },
    [cancelSpeechOutput, setStageStatus]
  );

  const runSmartTurn = useCallback(
    async (spokenText: string) => {
      const cleaned = spokenText.trim();
      const gen = sessionGenRef.current;
      if (!cleaned || !mountedRef.current) {
        committingRef.current = false;
        if (!micMutedRef.current) startSmartListeningRef.current();
        return;
      }

      playVoiceCue("capture", speakerMutedRef.current);
      setLiveUserCaption(cleaned);
      setSettledCaption(`You: ${cleaned}`);
      setLiveAiCaption("");
      setErrorMessage(null);
      setStageStatus("thinking");

      onConversationSyncRef.current({ userMessage: cleaned });

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversationIdRef.current || undefined,
            message: cleaned,
            workspaceId: workspaceIdRef.current,
            permissionMode: permissionModeRef.current,
            voiceMode: true,
          }),
        });

        if (!mountedRef.current || gen !== sessionGenRef.current) return;
        const data = await res.json();

        if (!res.ok) {
          const errText =
            data.code === "MISSING_API_KEY"
              ? "AI is not configured yet. Please set a provider in Settings."
              : data.error || "Unable to complete your request.";
          setErrorMessage(errText);
          speakSmartReply(errText, () => {
            if (!mountedRef.current || gen !== sessionGenRef.current) return;
            setStageStatus(micMutedRef.current ? "muted" : "error");
          });
          return;
        }

        if (Array.isArray(data.executedActions)) {
          for (const act of data.executedActions as VoiceExecutedActionItem[]) {
            pushActionChip(act.name, act.ok);
          }
        }

        const msgId = data.messageId || createVoiceMsgId();
        const requiresApproval =
          data.status === "requires_approval" &&
          Array.isArray(data.pendingCalls) &&
          data.pendingCalls.length > 0;

        onConversationSyncRef.current({
          conversationId: data.conversationId,
          conversationTitle: data.conversationTitle,
          mutated: Boolean(data.mutated),
          assistantMessage: {
            id: msgId,
            content: data.reply || "",
            executedActions: data.executedActions || [],
            pendingCalls: data.pendingCalls || [],
            resolved: !requiresApproval,
          },
        });

        if (requiresApproval) {
          setChatPendingApproval({ msgId, pendingCalls: data.pendingCalls });
          const promptText =
            data.reply || "Please approve or cancel this action to continue.";
          speakSmartReply(promptText, () => {
            if (!mountedRef.current || gen !== sessionGenRef.current) return;
            setStageStatus(micMutedRef.current ? "muted" : "listening");
          });
          return;
        }

        const replyText = data.reply || "Done.";
        speakSmartReply(replyText, () => {
          if (!mountedRef.current || gen !== sessionGenRef.current) return;
          if (!micMutedRef.current) {
            startSmartListeningRef.current();
          } else {
            setStageStatus("muted");
          }
        });
      } catch {
        if (!mountedRef.current || gen !== sessionGenRef.current) return;
        const errText = "Connection interrupted. Tap Retry or speak again.";
        setErrorMessage(errText);
        setStageStatus("error");
      } finally {
        committingRef.current = false;
      }
    },
    [pushActionChip, setStageStatus, speakSmartReply]
  );

  const commitSmartUtterance = useCallback(() => {
    const text = sessionTranscriptRef.current.trim();
    sessionTranscriptRef.current = "";
    committingRef.current = Boolean(text);
    stopRecognitionOnly();
    if (text) {
      void runSmartTurn(text);
    } else if (!micMutedRef.current && mountedRef.current) {
      startSmartListeningRef.current();
    }
  }, [runSmartTurn, stopRecognitionOnly]);

  const startSmartListening = useCallback(() => {
    const gen = sessionGenRef.current;
    if (!mountedRef.current || micMutedRef.current) {
      setStageStatus("muted");
      return;
    }

    engineRef.current = "smart-voice";
    setEngine("smart-voice");
    cancelSpeechOutput();
    stopRecognitionOnly();
    committingRef.current = false;
    sessionTranscriptRef.current = "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = typeof window !== "undefined" ? (window as any) : {};
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setErrorMessage(
        "Voice capture requires Speech Recognition (Chrome, Edge, or Gemini Live API)."
      );
      setStageStatus("error");
      return;
    }

    // Best-effort mic stream so orb still reacts smoothly to voice amplitude
    void ensureMicAnalyser();

    const rec = new SpeechRec();
    rec.lang = speechLangRef.current;
    rec.interimResults = true;
    rec.continuous = true;
    speechRecRef.current = rec;

    setErrorMessage(null);
    setLiveUserCaption("");
    setStageStatus("listening");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (ev: any) => {
      if (!mountedRef.current || gen !== sessionGenRef.current) return;
      let finalBuf = "";
      let interimBuf = "";
      for (let i = 0; i < ev.results.length; i++) {
        const res = ev.results[i];
        const seg = res[0]?.transcript || "";
        if (res.isFinal) finalBuf += seg;
        else interimBuf += seg;
      }
      const combined = `${finalBuf}${interimBuf}`.trim();
      sessionTranscriptRef.current = combined;
      setLiveUserCaption(combined);

      if (combined) {
        emptyRestartCountRef.current = 0;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (
            mountedRef.current &&
            gen === sessionGenRef.current &&
            statusRef.current === "listening" &&
            !committingRef.current &&
            sessionTranscriptRef.current.trim()
          ) {
            commitSmartUtterance();
          }
        }, 1350);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (ev: any) => {
      if (!mountedRef.current || gen !== sessionGenRef.current) return;
      const errCode = ev?.error;
      if (errCode === "not-allowed" || errCode === "service-not-allowed") {
        stopRecognitionOnly();
        setErrorMessage(
          "Microphone permission is blocked. Allow mic access in your browser and tap Retry."
        );
        setStageStatus("error");
      } else if (errCode === "audio-capture") {
        stopRecognitionOnly();
        setErrorMessage("No working microphone was detected on this device.");
        setStageStatus("error");
      }
      // "no-speech" and "aborted" fall through to onend auto-recovery
    };

    rec.onend = () => {
      if (speechRecRef.current === rec) speechRecRef.current = null;
      if (!mountedRef.current || gen !== sessionGenRef.current) return;
      if (committingRef.current) return;

      const leftover = sessionTranscriptRef.current.trim();
      if (leftover && !micMutedRef.current) {
        commitSmartUtterance();
        return;
      }

      if (!micMutedRef.current && statusRef.current === "listening") {
        if (emptyRestartCountRef.current < 15) {
          emptyRestartCountRef.current += 1;
          restartTimerRef.current = setTimeout(() => {
            if (
              mountedRef.current &&
              gen === sessionGenRef.current &&
              !micMutedRef.current &&
              statusRef.current === "listening"
            ) {
              startSmartListeningRef.current();
            }
          }, 260);
        } else {
          setErrorMessage("Voice listening paused after silence. Tap orb to continue.");
          setStageStatus("error");
        }
      }
    };

    try {
      rec.start();
    } catch {
      setStageStatus("error");
      setErrorMessage("Could not start microphone listening. Tap Retry.");
    }
  }, [
    cancelSpeechOutput,
    commitSmartUtterance,
    ensureMicAnalyser,
    setStageStatus,
    stopRecognitionOnly,
  ]);

  useEffect(() => {
    startSmartListeningRef.current = startSmartListening;
  }, [startSmartListening]);

  const startVoicePipeline = useCallback(
    async (requestedVoice?: GeminiLiveVoice) => {
      teardownAllAudioAndSessions();
      const gen = sessionGenRef.current;
      const voiceToUse = requestedVoice || liveVoiceRef.current;

      setErrorMessage(null);
      setLiveUserCaption("");
      setLiveAiCaption("");
      setStageStatus("connecting");
      playVoiceCue("open", speakerMutedRef.current);

      // Warm browser SpeechSynthesis voices early for seamless Smart Voice fallback
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.getVoices();
        } catch {
          // ignore
        }
      }

      try {
        const tokenRes = await fetch("/api/ai/live-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: workspaceIdRef.current,
            voiceName: voiceToUse,
            language: speechLangRef.current,
          }),
        });

        if (!mountedRef.current || gen !== sessionGenRef.current) return;

        if (!tokenRes.ok) {
          startSmartListening();
          return;
        }

        const tokenData = await tokenRes.json();
        const stream = await ensureMicAnalyser();
        if (!mountedRef.current || gen !== sessionGenRef.current) return;
        if (!stream) {
          startSmartListening();
          return;
        }

        const { GoogleGenAI, Modality } = await import("@google/genai");
        if (!mountedRef.current || gen !== sessionGenRef.current) return;

        const ai = new GoogleGenAI({
          apiKey: tokenData.token,
          httpOptions: { apiVersion: tokenData.apiVersion || "v1beta" },
        });

        const session = await ai.live.connect({
          model: tokenData.model || "gemini-3.8-live",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: tokenData.voiceName || voiceToUse,
                },
              },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            contextWindowCompression: { slidingWindow: {} },
            sessionResumption: {},
            systemInstruction: {
              parts: [{ text: tokenData.systemInstruction }],
            },
            tools: [{ functionDeclarations: tokenData.tools }],
          },
          callbacks: {
            onopen: () => {
              if (!mountedRef.current || gen !== sessionGenRef.current) return;
              engineRef.current = "gemini-live";
              setEngine("gemini-live");
              setStageStatus(micMutedRef.current ? "muted" : "listening");
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onmessage: async (msg: any) => {
              if (!mountedRef.current || gen !== sessionGenRef.current) return;
              const content = msg?.serverContent;

              if (content?.interrupted) {
                stopPcmPlayback();
                if (liveAiTurnRef.current.trim()) {
                  onConversationSyncRef.current({
                    assistantMessage: {
                      id: createVoiceMsgId(),
                      content: liveAiTurnRef.current.trim(),
                      resolved: true,
                    },
                  });
                }
                liveAiTurnRef.current = "";
                setStageStatus(micMutedRef.current ? "muted" : "listening");
              }

              if (content?.inputTranscription?.text) {
                const mergedUser = mergeStreamingTranscript(
                  liveUserTurnRef.current,
                  content.inputTranscription.text
                );
                liveUserTurnRef.current = mergedUser;
                liveUserSyncedRef.current = false;
                setLiveUserCaption(mergedUser);
              }

              if (content?.outputTranscription?.text) {
                if (liveUserTurnRef.current.trim() && !liveUserSyncedRef.current) {
                  liveUserSyncedRef.current = true;
                  onConversationSyncRef.current({
                    userMessage: liveUserTurnRef.current.trim(),
                  });
                  liveUserTurnRef.current = "";
                }
                const mergedAi = mergeStreamingTranscript(
                  liveAiTurnRef.current,
                  content.outputTranscription.text
                );
                liveAiTurnRef.current = mergedAi;
                setLiveAiCaption(mergedAi);
              }

              if (content?.modelTurn?.parts) {
                if (liveUserTurnRef.current.trim() && !liveUserSyncedRef.current) {
                  liveUserSyncedRef.current = true;
                  onConversationSyncRef.current({
                    userMessage: liveUserTurnRef.current.trim(),
                  });
                  liveUserTurnRef.current = "";
                }
                for (const part of content.modelTurn.parts) {
                  if (part?.inlineData?.data) {
                    enqueuePcmAudio(part.inlineData.data, () => {
                      if (
                        mountedRef.current &&
                        gen === sessionGenRef.current &&
                        engineRef.current === "gemini-live" &&
                        statusRef.current === "speaking"
                      ) {
                        setStageStatus(micMutedRef.current ? "muted" : "listening");
                      }
                    });
                  }
                }
              }

              if (content?.turnComplete) {
                if (liveUserTurnRef.current.trim() && !liveUserSyncedRef.current) {
                  liveUserSyncedRef.current = true;
                  onConversationSyncRef.current({
                    userMessage: liveUserTurnRef.current.trim(),
                  });
                  liveUserTurnRef.current = "";
                }
                if (liveAiTurnRef.current.trim()) {
                  const finished = liveAiTurnRef.current.trim();
                  setSettledCaption(finished);
                  onConversationSyncRef.current({
                    assistantMessage: {
                      id: createVoiceMsgId(),
                      content: finished,
                      resolved: true,
                    },
                  });
                  liveAiTurnRef.current = "";
                }
                if (activeSourcesRef.current.size === 0) {
                  setStageStatus(micMutedRef.current ? "muted" : "listening");
                }
              }

              const fnCalls = msg?.toolCall?.functionCalls;
              if (Array.isArray(fnCalls) && fnCalls.length > 0) {
                setStageStatus("thinking");
                const responses = [];
                for (const call of fnCalls) {
                  const execRes = await fetch("/api/ai/tool-execute", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      toolName: call.name,
                      args: call.args || {},
                      workspaceId: workspaceIdRef.current,
                      permissionMode: permissionModeRef.current,
                    }),
                  });
                  if (!mountedRef.current || gen !== sessionGenRef.current) return;
                  const execData = await execRes.json();

                  if (execData.status === "requires_approval") {
                    setLivePendingApproval({
                      callId: call.id || call.name,
                      name: call.name,
                      args: call.args || {},
                      mutability: execData.call?.mutability || "write",
                      description: execData.call?.description || `Approve ${call.name}?`,
                    });
                    return;
                  }

                  pushActionChip(call.name, Boolean(execData.ok));
                  if (execData.ok && execData.mutability !== "read") {
                    onConversationSyncRef.current({ mutated: true });
                  }
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: execData.ok ? execData.data : { error: execData.error },
                  });
                }

                if (responses.length > 0 && liveSessionRef.current) {
                  liveSessionRef.current.sendToolResponse?.({
                    functionResponses: responses,
                  });
                }
              }
            },
            onerror: () => {
              if (!mountedRef.current || gen !== sessionGenRef.current) return;
              // Seamless fallback to Smart Voice when Gemini Live session errors
              teardownAllAudioAndSessions();
              startSmartListening();
            },
            onclose: () => {
              if (!mountedRef.current || gen !== sessionGenRef.current) return;
              if (engineRef.current === "gemini-live") {
                teardownAllAudioAndSessions();
                startSmartListening();
              }
            },
          },
        });

        if (!mountedRef.current || gen !== sessionGenRef.current) {
          session.close?.();
          return;
        }

        liveSessionRef.current = session;

        // Wire PCM16 capture stream -> Gemini Live WebSocket
        const ctx = captureCtxRef.current || new AudioContext({ sampleRate: 16000 });
        captureCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        processor.onaudioprocess = (ev) => {
          if (!liveSessionRef.current || micMutedRef.current) return;
          const pcmBase64 = float32ToBase64Pcm16(ev.inputBuffer.getChannelData(0));
          try {
            liveSessionRef.current.sendRealtimeInput({
              audio: { data: pcmBase64, mimeType: "audio/pcm;rate=16000" },
            });
          } catch {
            // ignore transient closed frame
          }
        };
        source.connect(processor);
        processor.connect(ctx.destination);
      } catch {
        if (!mountedRef.current || gen !== sessionGenRef.current) return;
        startSmartListening();
      }
    },
    [
      enqueuePcmAudio,
      ensureMicAnalyser,
      pushActionChip,
      setStageStatus,
      startSmartListening,
      stopPcmPlayback,
      teardownAllAudioAndSessions,
    ]
  );

  // Boot voice pipeline on mount and guarantee complete cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    const timer = setTimeout(() => {
      if (mountedRef.current) void startVoicePipeline();
    }, 0);

    return () => {
      clearTimeout(timer);
      mountedRef.current = false;
      teardownAllAudioAndSessions();
    };
  }, [startVoicePipeline, teardownAllAudioAndSessions]);

  // 60fps audio-reactive visual orb animation (zero React re-renders per frame)
  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    let rafId = 0;
    const startTs = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - startTs) / 1000;
      const curStatus = statusRef.current;

      let targetLevel = 0;
      if (curStatus === "listening") {
        const micLvl = computeAnalyserLevel(micAnalyserRef.current, micAnalyserBufRef.current);
        // Gentle baseline pulse + real voice spike
        targetLevel = Math.max(micLvl, 0.08 + 0.04 * Math.sin(elapsed * 3.1));
      } else if (curStatus === "speaking") {
        const outLvl = computeAnalyserLevel(
          outputAnalyserRef.current,
          outputAnalyserBufRef.current
        );
        // When browser speechSynthesis is speaking (no AnalyserNode output), synthesize organic cadence
        targetLevel =
          outLvl > 0.02
            ? outLvl
            : 0.34 + 0.22 * Math.abs(Math.sin(elapsed * 7.2)) * (0.7 + 0.3 * Math.cos(elapsed * 2.9));
      } else if (curStatus === "thinking" || curStatus === "connecting") {
        targetLevel = 0.22 + 0.1 * Math.sin(elapsed * 4.5);
      } else {
        targetLevel = 0.02;
      }

      orbLevelRef.current += (targetLevel - orbLevelRef.current) * 0.24;
      const lvl = orbLevelRef.current;

      if (orbCoreRef.current) {
        const s = 1 + lvl * 0.14;
        orbCoreRef.current.style.transform = `scale(${s.toFixed(4)})`;
      }
      if (orbOuterRef.current) {
        const s = 1 + lvl * 0.34;
        orbOuterRef.current.style.transform = `scale(${s.toFixed(4)})`;
        orbOuterRef.current.style.opacity = Math.min(0.85, 0.18 + lvl * 0.65).toFixed(3);
      }
      if (orbHaloRef.current) {
        const s = 1.05 + lvl * 0.5;
        orbHaloRef.current.style.transform = `scale(${s.toFixed(4)})`;
        orbHaloRef.current.style.opacity = Math.min(0.6, 0.08 + lvl * 0.5).toFixed(3);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleInterrupt = useCallback(() => {
    cancelSpeechOutput();
    if (engineRef.current === "gemini-live") {
      setStageStatus(micMutedRef.current ? "muted" : "listening");
    } else if (!micMutedRef.current) {
      startSmartListening();
    } else {
      setStageStatus("muted");
    }
  }, [cancelSpeechOutput, setStageStatus, startSmartListening]);

  const handleToggleMicMute = useCallback(() => {
    const nextMuted = !micMutedRef.current;
    micMutedRef.current = nextMuted;
    setMicMuted(nextMuted);

    if (engineRef.current === "gemini-live") {
      if (nextMuted) {
        try {
          liveSessionRef.current?.sendRealtimeInput?.({ audioStreamEnd: true });
        } catch {
          // ignore
        }
        setStageStatus("muted");
      } else {
        setStageStatus(activeSourcesRef.current.size > 0 ? "speaking" : "listening");
      }
      return;
    }

    // Smart Voice mode
    if (nextMuted) {
      stopRecognitionOnly();
      sessionTranscriptRef.current = "";
      setLiveUserCaption("");
      if (statusRef.current !== "speaking" && statusRef.current !== "thinking") {
        setStageStatus("muted");
      }
    } else {
      emptyRestartCountRef.current = 0;
      if (statusRef.current !== "speaking" && statusRef.current !== "thinking") {
        startSmartListening();
      }
    }
  }, [setStageStatus, startSmartListening, stopRecognitionOnly]);

  const handleToggleSpeakerMute = useCallback(() => {
    const nextMuted = !speakerMutedRef.current;
    speakerMutedRef.current = nextMuted;
    setSpeakerMuted(nextMuted);
    if (outputGainRef.current && playbackCtxRef.current) {
      outputGainRef.current.gain.setValueAtTime(
        nextMuted ? 0 : 1,
        playbackCtxRef.current.currentTime
      );
    }
    if (nextMuted) {
      cancelSpeechOutput();
      if (statusRef.current === "speaking") {
        if (engineRef.current === "smart-voice" && !micMutedRef.current) {
          startSmartListening();
        } else {
          setStageStatus(micMutedRef.current ? "muted" : "listening");
        }
      }
    }
  }, [cancelSpeechOutput, setStageStatus, startSmartListening]);

  const handleEndCall = useCallback(() => {
    playVoiceCue("close", speakerMutedRef.current);
    teardownAllAudioAndSessions();
    onExit();
  }, [onExit, teardownAllAudioAndSessions]);

  const handleOrbPress = useCallback(() => {
    if (statusRef.current === "speaking") {
      handleInterrupt();
      return;
    }
    if (statusRef.current === "error") {
      emptyRestartCountRef.current = 0;
      void startVoicePipeline();
      return;
    }
    if (statusRef.current === "muted" || micMutedRef.current) {
      handleToggleMicMute();
      return;
    }
    if (
      engineRef.current === "smart-voice" &&
      statusRef.current === "listening" &&
      sessionTranscriptRef.current.trim()
    ) {
      commitSmartUtterance();
    }
  }, [commitSmartUtterance, handleInterrupt, handleToggleMicMute, startVoicePipeline]);

  // Keyboard shortcuts: Space (interrupt/commit) and Escape (end call)
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        handleEndCall();
        return;
      }
      if (ev.code === "Space") {
        const tag = (ev.target as HTMLElement | null)?.tagName;
        if (tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA") return;
        ev.preventDefault();
        handleOrbPress();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleEndCall, handleOrbPress]);

  const handleLiveToolApproval = async (approve: boolean) => {
    const pending = livePendingApproval;
    if (!pending) return;
    setLivePendingApproval(null);

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
      setStageStatus(micMutedRef.current ? "muted" : "listening");
      return;
    }

    setStageStatus("thinking");
    const res = await fetch("/api/ai/tool-execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolName: pending.name,
        args: pending.args,
        workspaceId: workspaceIdRef.current,
        permissionMode: permissionModeRef.current,
        confirmed: true,
      }),
    });
    const data = await res.json();
    pushActionChip(pending.name, Boolean(data.ok));
    if (data.ok && data.mutability !== "read") {
      onConversationSyncRef.current({ mutated: true });
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

  const handleSmartApproval = async (decision: "approve" | "reject") => {
    const pending = chatPendingApproval;
    if (!pending) return;
    const gen = sessionGenRef.current;
    setChatPendingApproval(null);
    setStageStatus("thinking");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationIdRef.current || undefined,
          workspaceId: workspaceIdRef.current,
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
      if (!mountedRef.current || gen !== sessionGenRef.current) return;
      const data = await res.json();

      if (Array.isArray(data.executedActions)) {
        for (const act of data.executedActions as VoiceExecutedActionItem[]) {
          pushActionChip(act.name, act.ok);
        }
      }
      const replyText = data.reply || (decision === "approve" ? "Done." : "Cancelled.");
      onConversationSyncRef.current({
        mutated: Boolean(data.mutated),
        assistantMessage: {
          id: data.messageId || createVoiceMsgId(),
          content: replyText,
          executedActions: data.executedActions || [],
          resolved: true,
        },
      });
      speakSmartReply(replyText, () => {
        if (!mountedRef.current || gen !== sessionGenRef.current) return;
        if (!micMutedRef.current) startSmartListening();
        else setStageStatus("muted");
      });
    } catch {
      if (!mountedRef.current) return;
      setErrorMessage("Could not complete approval.");
      setStageStatus("error");
    }
  };

  const cycleLiveVoice = () => {
    const idx = GEMINI_LIVE_VOICES.indexOf(liveVoice);
    const nextVoice = GEMINI_LIVE_VOICES[(idx + 1) % GEMINI_LIVE_VOICES.length];
    liveVoiceRef.current = nextVoice;
    setLiveVoice(nextVoice);
    if (engineRef.current === "gemini-live") {
      void startVoicePipeline(nextVoice);
    }
  };

  const statusHeadline =
    status === "connecting"
      ? "Connecting voice..."
      : status === "listening"
      ? liveUserCaption
        ? "Hearing you..."
        : "Listening..."
      : status === "thinking"
      ? "Thinking..."
      : status === "speaking"
      ? "Speaking..."
      : status === "muted"
      ? "Microphone muted"
      : "Voice paused";

  const statusHint =
    status === "speaking"
      ? "Tap orb or press Space to interrupt"
      : status === "listening" && liveUserCaption
      ? "Pause briefly to send — or tap orb"
      : status === "listening"
      ? "Speak naturally • hands-free"
      : status === "muted"
      ? "Tap mic button to resume"
      : status === "error"
      ? "Tap Retry to reconnect"
      : "Preparing audio stream";

  const orbCorePalette =
    status === "speaking"
      ? "bg-gradient-to-tr from-emerald-500 via-teal-400 to-sky-400 text-slate-950 shadow-[0_0_45px_rgba(16,185,129,0.45)]"
      : status === "thinking"
      ? "bg-gradient-to-tr from-indigo-500 via-violet-500 to-sky-400 text-white shadow-[0_0_40px_rgba(99,102,241,0.42)]"
      : status === "muted"
      ? "bg-surface-container-highest text-on-surface-variant border border-outline-variant shadow-inner"
      : status === "error"
      ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40"
      : "bg-gradient-to-tr from-sky-500 via-cyan-400 to-indigo-400 text-slate-950 shadow-[0_0_45px_rgba(56,189,248,0.45)]";

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between p-4 overflow-hidden select-none bg-gradient-to-b from-surface-container via-surface-container to-surface-container-low">
      {/* Top Bar: Engine Pill, Language Switcher, Captions / Audio / Expand */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low border border-surface-container-high text-[11px] font-semibold text-on-surface">
            <span
              className={`w-2 h-2 rounded-full ${
                engine === "gemini-live"
                  ? "bg-emerald-500"
                  : status === "error"
                  ? "bg-amber-500"
                  : "bg-sky-500"
              }`}
            />
            <span>{engine === "gemini-live" ? "Gemini Live" : "Voice Mode"}</span>
          </span>

          <div
            role="group"
            aria-label="Voice language"
            className="inline-flex rounded-lg bg-surface-container-low border border-surface-container-high p-0.5 text-[11px]"
          >
            {(
              [
                { id: "en-US", label: "EN" },
                { id: "bn-BD", label: "বাংলা" },
              ] as const
            ).map((langOpt) => (
              <button
                key={langOpt.id}
                type="button"
                aria-pressed={speechLang === langOpt.id}
                onClick={() => {
                  onSpeechLangChange(langOpt.id);
                  speechLangRef.current = langOpt.id;
                  if (engineRef.current === "smart-voice" && statusRef.current === "listening" && !micMutedRef.current) {
                    startSmartListening();
                  }
                }}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  speechLang === langOpt.id
                    ? "bg-stitch-primary text-on-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {langOpt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setCaptionsOpen((v) => !v)}
            aria-pressed={captionsOpen}
            aria-label={captionsOpen ? "Hide live captions" : "Show live captions"}
            title={captionsOpen ? "Hide captions" : "Show captions"}
            className={`min-w-8 min-h-8 p-1.5 rounded-lg flex items-center justify-center transition-colors ${
              captionsOpen
                ? "bg-surface-container-high text-on-surface"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
            }`}
          >
            <Captions className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleToggleSpeakerMute}
            aria-pressed={speakerMuted}
            aria-label={speakerMuted ? "Unmute AI voice output" : "Mute AI voice output"}
            title={speakerMuted ? "Unmute speaker" : "Mute speaker"}
            className={`min-w-8 min-h-8 p-1.5 rounded-lg flex items-center justify-center transition-colors ${
              speakerMuted
                ? "bg-red-500/15 text-red-500"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
            }`}
          >
            {speakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleExpand}
            aria-pressed={expanded}
            aria-label={expanded ? "Exit expanded voice view" : "Expand voice view"}
            title={expanded ? "Collapse view" : "Expand view"}
            className="min-w-8 min-h-8 p-1.5 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center Stage: Reactive Fluid Orb, Live Captions & Action Chips */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center gap-5 px-2 overflow-y-auto">
        <div
          className={`relative flex items-center justify-center ${
            expanded ? "w-56 h-56" : "w-44 h-44"
          } shrink-0`}
        >
          {/* Ambient Outermost Halo */}
          <div
            ref={orbHaloRef}
            aria-hidden="true"
            className={`absolute inset-2 rounded-full pointer-events-none transition-colors duration-300 ${
              status === "speaking"
                ? "bg-emerald-400/25 blur-xl"
                : status === "thinking"
                ? "bg-indigo-400/25 blur-xl"
                : status === "muted" || status === "error"
                ? "bg-surface-container-high/30 blur-md"
                : "bg-sky-400/25 blur-xl"
            } ${status === "listening" || status === "speaking" ? "voice-orb-ripple" : ""}`}
          />

          {/* Audio-Reactive Pulse Ring */}
          <div
            ref={orbOuterRef}
            aria-hidden="true"
            className={`absolute inset-4 rounded-full pointer-events-none border-2 transition-colors duration-300 ${
              status === "speaking"
                ? "border-emerald-400/60"
                : status === "thinking"
                ? "border-indigo-400/60 border-dashed voice-orb-spin"
                : status === "muted" || status === "error"
                ? "border-outline-variant/40"
                : "border-sky-400/60"
            }`}
          />

          {/* Central Tactile Glowing Orb Button */}
          <button
            ref={orbCoreRef}
            type="button"
            onClick={handleOrbPress}
            aria-label={`${statusHeadline}. ${statusHint}`}
            className={`relative z-10 rounded-full flex items-center justify-center transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stitch-primary ${
              expanded ? "w-40 h-40" : "w-32 h-32"
            } ${orbCorePalette} ${
              status === "listening" || status === "speaking" ? "voice-orb-breathe" : ""
            }`}
          >
            {/* Subtle specular gloss overlay */}
            <span
              aria-hidden="true"
              className="absolute inset-2 rounded-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none"
            />
            <span className="relative z-10 flex flex-col items-center gap-1">
              {status === "connecting" || status === "thinking" ? (
                <Loader2 className="w-9 h-9 animate-spin" />
              ) : status === "speaking" ? (
                <AudioLines className="w-9 h-9" />
              ) : status === "muted" ? (
                <MicOff className="w-8 h-8" />
              ) : status === "error" ? (
                <RotateCcw className="w-8 h-8" />
              ) : (
                <Sparkles className="w-9 h-9" />
              )}
            </span>
          </button>
        </div>

        {/* Status Title + Micro-Guidance */}
        <div className="space-y-1 max-w-sm">
          <p className="text-sm font-semibold text-on-surface tracking-tight">{statusHeadline}</p>
          <p className="text-xs text-on-surface-variant">{statusHint}</p>
        </div>

        {/* Compact Action Execution Chips */}
        {actionChips.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-full">
            {actionChips.map((chip) => (
              <span
                key={chip.id}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                  chip.ok
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                    : "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/25"
                }`}
              >
                <span>{chip.ok ? "✓" : "✕"}</span>
                <span>{chip.text}</span>
              </span>
            ))}
          </div>
        )}

        {/* Live Captions Card (Polite announcement of settled replies / live visual preview) */}
        {captionsOpen && (liveUserCaption || liveAiCaption || settledCaption) && !errorMessage && (
          <div className="w-full max-w-md rounded-2xl bg-surface-container-low/90 border border-surface-container-high px-3.5 py-2.5 text-left space-y-1.5">
            {liveUserCaption && (
              <p className="text-xs text-on-surface-variant break-words [overflow-wrap:anywhere]">
                <span className="font-semibold text-stitch-primary mr-1">You:</span>
                {liveUserCaption}
              </p>
            )}
            {(liveAiCaption || (!liveUserCaption && settledCaption)) && (
              <p
                aria-live="polite"
                className="text-xs font-medium text-on-surface break-words [overflow-wrap:anywhere] line-clamp-4"
              >
                <span className="font-semibold text-stitch-primary mr-1">AI:</span>
                {liveAiCaption || settledCaption}
              </p>
            )}
          </div>
        )}

        {/* Inline Error Guidance + Retry */}
        {errorMessage && (
          <div
            role="alert"
            className="w-full max-w-md rounded-2xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-3"
          >
            <span className="text-left leading-relaxed">{errorMessage}</span>
            <button
              type="button"
              onClick={() => {
                emptyRestartCountRef.current = 0;
                void startVoicePipeline();
              }}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-stitch-primary text-on-primary text-[11px] font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Approval Prompt in Voice Mode */}
        {(livePendingApproval || chatPendingApproval) && (
          <div className="w-full max-w-md rounded-2xl border border-surface-container-high bg-surface-container-low p-3 text-left space-y-2 shadow-lg">
            <div className="text-xs font-semibold text-on-surface">
              Confirm{" "}
              {livePendingApproval
                ? formatToolLabel(livePendingApproval.name)
                : chatPendingApproval?.pendingCalls.map((c) => formatToolLabel(c.name)).join(", ")}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  livePendingApproval
                    ? void handleLiveToolApproval(true)
                    : void handleSmartApproval("approve")
                }
                className="flex-1 py-1.5 rounded-lg bg-stitch-primary text-on-primary text-xs font-semibold"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() =>
                  livePendingApproval
                    ? void handleLiveToolApproval(false)
                    : void handleSmartApproval("reject")
                }
                className="px-3 py-1.5 rounded-lg border border-surface-container-high text-xs text-on-surface-variant hover:text-on-surface"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Call Dock */}
      <div className="shrink-0 pt-3 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={handleToggleMicMute}
          aria-pressed={micMuted}
          aria-label={micMuted ? "Unmute microphone" : "Mute microphone"}
          title={micMuted ? "Unmute mic" : "Mute mic"}
          className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stitch-primary ${
            micMuted
              ? "bg-surface-container-highest text-red-500 border-red-500/40"
              : "bg-surface-container-low text-on-surface border-surface-container-high hover:bg-surface-container-high"
          }`}
        >
          {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {status === "speaking" ? (
          <button
            type="button"
            onClick={handleInterrupt}
            aria-label="Interrupt AI and listen"
            title="Interrupt speaking"
            className="w-12 h-12 rounded-full flex items-center justify-center bg-surface-container-low border border-surface-container-high text-on-surface hover:bg-surface-container-high transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stitch-primary"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        ) : status === "listening" && liveUserCaption.trim() && engine === "smart-voice" ? (
          <button
            type="button"
            onClick={commitSmartUtterance}
            aria-label="Send spoken message now"
            title="Send now"
            className="w-12 h-12 rounded-full flex items-center justify-center bg-stitch-primary text-on-primary shadow-md hover:brightness-105 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stitch-primary"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.25]" />
          </button>
        ) : status === "error" ? (
          <button
            type="button"
            onClick={() => {
              emptyRestartCountRef.current = 0;
              void startVoicePipeline();
            }}
            aria-label="Retry voice connection"
            title="Retry voice"
            className="w-12 h-12 rounded-full flex items-center justify-center bg-stitch-primary text-on-primary shadow-md hover:brightness-105 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stitch-primary"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        ) : engine === "gemini-live" ? (
          <button
            type="button"
            onClick={cycleLiveVoice}
            aria-label={`Switch live voice persona (current ${liveVoice})`}
            title={`Voice: ${liveVoice} (click to switch)`}
            className="min-w-12 h-12 px-3 rounded-full flex items-center justify-center gap-1.5 bg-surface-container-low border border-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stitch-primary"
          >
            <AudioLines className="w-4 h-4 text-stitch-primary" />
            <span>{liveVoice}</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleEndCall}
          aria-label="End voice mode and return to text chat"
          title="End voice mode (Esc)"
          className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500 text-white shadow-lg hover:bg-red-600 active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
