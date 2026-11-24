import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Idea from "@/models/Idea";
import Routine from "@/models/Routine";
import Account from "@/models/Account";
import FinancialReminder from "@/models/FinancialReminder";
import {
  executeManageoTool,
  findManageoTool,
  PermissionMode,
  shouldRequireApproval,
  ToolMutability,
} from "@/lib/ai/tools";
import { retrieveHybridContext } from "@/lib/ai/rag";
import {
  AgentMessageTurn,
  AiProviderId,
  generateAgentTurn,
  resolveEffectiveAiTargets,
} from "@/lib/ai/llm-providers";

export interface PendingCallSummary {
  callId: string;
  name: string;
  args: Record<string, unknown>;
  mutability: ToolMutability;
  description: string;
}

export interface ExecutedActionSummary {
  callId: string;
  name: string;
  mutability: ToolMutability;
  args: Record<string, unknown>;
  ok: boolean;
  summary?: string;
  error?: string;
}

export interface AgentGraphResult {
  status: "completed" | "requires_approval";
  reply: string;
  executedActions: ExecutedActionSummary[];
  pendingCalls?: PendingCallSummary[];
  historySnapshot?: AgentMessageTurn[];
  ragSources: Array<{ entityType: string; title: string }>;
  mutated: boolean;
  providerUsed: AiProviderId;
  modelUsed: string;
}

interface IntentClassification {
  includeTasks: boolean;
  includeFinance: boolean;
  includeRoutines: boolean;
  includeIdeas: boolean;
}

/**
 * Graph Node 1: Intent Router — determines which live workspace domains to hydrate before LLM turn 1.
 */
function routeIntent(latestUserText: string): IntentClassification {
  const q = latestUserText.toLowerCase();
  const isFinance =
    /\b(balance|account|money|expense|income|spend|spent|transaction|bill|reminder|budget|loan|taka|bdt|usd)\b/i.test(
      q
    );
  const isTask =
    /\b(task|todo|to-do|pending|due|overdue|deadline|work|assign|priority|progress|urgent|done|completed|kaj|কাজ)\b/i.test(
      q
    );
  const isRoutine = /\b(routine|habit|daily|schedule|morning|evening)\b/i.test(q);
  const isIdea = /\b(idea|brainstorm|concept|plan)\b/i.test(q);

  return {
    includeTasks: isTask || (!isFinance && !isRoutine && !isIdea),
    includeFinance: isFinance,
    includeRoutines: isRoutine,
    includeIdeas: isIdea,
  };
}

/**
 * Graph Node 2: Parallel Hybrid RAG + Live Snapshot Hydrator.
 * Hydrates exact current workspace state & top semantic RAG hits into a compact system context block
 * so factual questions (like "which tasks are pending?") resolve accurately in 1 fast LLM call.
 */
async function hydrateRagAndSnapshot(params: {
  userId: string;
  workspaceId: string;
  query: string;
  intent: IntentClassification;
}): Promise<{
  contextBlock: string;
  ragSources: Array<{ entityType: string; title: string }>;
}> {
  await dbConnect();
  const wsObjId = new mongoose.Types.ObjectId(params.workspaceId);
  const userObjId = new mongoose.Types.ObjectId(params.userId);

  const [ragHits, pendingTasks, activeRoutines, activeIdeas, accounts, upcomingBills] =
    await Promise.all([
      retrieveHybridContext({
        userId: params.userId,
        workspaceId: params.workspaceId,
        query: params.query || "workspace overview tasks",
        topK: 8,
        includeFinance: true,
      }),
      params.intent.includeTasks
        ? Task.find({
            workspaceId: wsObjId,
            status: { $nin: ["Completed", "Done", "Cancelled"] },
          })
            .select("title status priority dueDate dueTime tags")
            .sort({ dueDate: 1, createdAt: -1 })
            .limit(15)
            .lean()
        : Promise.resolve([]),
      params.intent.includeRoutines
        ? Routine.find({ workspaceId: wsObjId, isActive: true })
            .select("name recurrence startTime endTime")
            .limit(8)
            .lean()
        : Promise.resolve([]),
      params.intent.includeIdeas
        ? Idea.find({ workspaceId: wsObjId })
            .select("title status priority")
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()
        : Promise.resolve([]),
      params.intent.includeFinance
        ? Account.find({ userId: userObjId }).select("name type currency balance").lean()
        : Promise.resolve([]),
      params.intent.includeFinance
        ? FinancialReminder.find({ userId: userObjId, status: "active" })
            .select("title amount currency dueDate")
            .sort({ dueDate: 1 })
            .limit(6)
            .lean()
        : Promise.resolve([]),
    ]);

  const sections: string[] = [];

  if (pendingTasks.length > 0) {
    const lines = pendingTasks.map((t) => {
      const due = t.dueDate ? ` due=${new Date(t.dueDate).toISOString().slice(0, 10)}` : "";
      return `- [${t._id}] ${t.title} (${t.status}, ${t.priority}${due})`;
    });
    sections.push(`Live Pending Tasks (${pendingTasks.length}):\n${lines.join("\n")}`);
  } else if (params.intent.includeTasks) {
    sections.push("Live Pending Tasks: None (0 active pending tasks).");
  }

  if (activeRoutines.length > 0) {
    sections.push(
      `Active Routines:\n${activeRoutines
        .map((r) => `- ${r.name} (${r.recurrence || "daily"} ${r.startTime || ""})`)
        .join("\n")}`
    );
  }

  if (activeIdeas.length > 0) {
    sections.push(
      `Recent Ideas:\n${activeIdeas
        .map((i) => `- [${i._id}] ${i.title} (${i.status}, ${i.priority})`)
        .join("\n")}`
    );
  }

  if (accounts.length > 0) {
    sections.push(
      `Accounts:\n${accounts
        .map(
          (a) =>
            `- [${a._id}] ${a.name} (${a.type}): ${parseFloat(a.balance?.toString() || "0")} ${
              a.currency
            }`
        )
        .join("\n")}`
    );
  }

  if (upcomingBills.length > 0) {
    sections.push(
      `Active Bills/Reminders:\n${upcomingBills
        .map(
          (b) =>
            `- ${b.title}: ${parseFloat(b.amount?.toString() || "0")} ${b.currency} due ${new Date(
              b.dueDate
            )
              .toISOString()
              .slice(0, 10)}`
        )
        .join("\n")}`
    );
  }

  if (ragHits.length > 0) {
    sections.push(
      `Hybrid RAG Knowledge Matches:\n${ragHits
        .map((h) => `- [${h.entityType}:${h.entityId}] ${h.snippet.slice(0, 260)}`)
        .join("\n")}`
    );
  }

  return {
    contextBlock: sections.join("\n\n"),
    ragSources: ragHits.map((h) => ({ entityType: h.entityType, title: h.title })),
  };
}

function buildAgentSystemPrompt(params: {
  userName: string;
  workspaceId: string;
  permissionMode: PermissionMode;
  conversationSummary?: string;
  liveContextBlock: string;
}) {
  return [
    `You are Manageo AI Assistant helping ${params.userName} manage their Personal Operating System inside active workspace ${params.workspaceId}.`,
    `Today's UTC date: ${new Date().toISOString().slice(0, 10)}. Active permission policy: ${params.permissionMode}.`,
    `SECURITY RULE: Encrypted Vault secrets are strictly excluded for zero-knowledge privacy; explain clearly if asked for Vault secrets.`,
    `INSTRUCTIONS:`,
    `- When live snapshot context already lists the exact pending tasks/items requested, answer concisely and directly without redundant tool calls unless the user asks for fresh filtered queries or modifications.`,
    `- When creating, updating, or soft-deleting items, ALWAYS execute the real Manageo function tool rather than claiming you did it.`,
    `- For update/delete calls where you need an ID, use the ID shown in <manageo_live_context> or call list_tasks/list_ideas/list_notes/list_routines/list_finance_summary first.`,
    `- Match the user's language (English, Bengali, or Banglish) naturally and cleanly with markdown formatting.`,
    params.conversationSummary
      ? `<conversation_summary>\n${params.conversationSummary}\n</conversation_summary>`
      : "",
    params.liveContextBlock
      ? `<manageo_live_context>\n${params.liveContextBlock}\n</manageo_live_context>`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Graph Nodes 3 & 4: Stateful Multi-Provider LLM + Permission-Gated Tool Loop.
 */
export async function runManageoAgentGraph(params: {
  userId: string;
  workspaceId: string;
  history: AgentMessageTurn[];
  latestUserMessage: string;
  conversationSummary?: string;
  permissionModeOverride?: PermissionMode;
  pendingApprovals?: Array<{
    callId: string;
    name: string;
    args: Record<string, unknown>;
    decision: "approve" | "reject";
  }>;
}): Promise<AgentGraphResult> {
  const effective = await resolveEffectiveAiTargets(params.userId);
  const effectiveMode = params.permissionModeOverride || effective.permissionMode;

  const intent = routeIntent(params.latestUserMessage);
  const { contextBlock, ragSources } = await hydrateRagAndSnapshot({
    userId: params.userId,
    workspaceId: params.workspaceId,
    query: params.latestUserMessage,
    intent,
  });

  const systemPrompt = buildAgentSystemPrompt({
    userName: effective.userName,
    workspaceId: params.workspaceId,
    permissionMode: effectiveMode,
    conversationSummary: params.conversationSummary,
    liveContextBlock: contextBlock,
  });

  const workingHistory: AgentMessageTurn[] = [...params.history];
  const executedActions: ExecutedActionSummary[] = [];

  // Process any user approval/rejection decisions before calling LLM again
  if (params.pendingApprovals && params.pendingApprovals.length > 0) {
    const decisionResults = await Promise.all(
      params.pendingApprovals.map(async (decision) => {
        const toolDef = findManageoTool(decision.name);
        const mutability: ToolMutability = toolDef?.mutability || "write";
        if (decision.decision === "reject") {
          return {
            action: {
              callId: decision.callId,
              name: decision.name,
              mutability,
              args: decision.args,
              ok: false,
              error: "Declined by user",
            } satisfies ExecutedActionSummary,
            toolTurn: {
              role: "tool" as const,
              toolCallId: decision.callId,
              toolName: decision.name,
              content: JSON.stringify({ cancelled: true, reason: "Declined by user" }),
            },
          };
        }

        const res = await executeManageoTool(decision.name, decision.args, {
          userId: params.userId,
          workspaceId: params.workspaceId,
          source: "assistant",
        });
        return {
          action: {
            callId: decision.callId,
            name: decision.name,
            mutability,
            args: decision.args,
            ok: res.ok,
            summary: res.ok ? JSON.stringify(res.data).slice(0, 280) : undefined,
            error: !res.ok ? res.error : undefined,
          } satisfies ExecutedActionSummary,
          toolTurn: {
            role: "tool" as const,
            toolCallId: decision.callId,
            toolName: decision.name,
            content: JSON.stringify(res.ok ? res.data : { error: res.error }),
          },
        };
      })
    );

    for (const r of decisionResults) {
      executedActions.push(r.action);
      workingHistory.push(r.toolTurn);
    }
  }

  let lastProvider = effective.candidates[0].provider;
  let lastModel = effective.candidates[0].model;
  let finalReply = "";
  const MAX_HOPS = 5;

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const turn = await generateAgentTurn(effective.candidates, systemPrompt, workingHistory);
    lastProvider = turn.providerUsed;
    lastModel = turn.modelUsed;
    finalReply = turn.text;

    if (!turn.toolCalls || turn.toolCalls.length === 0) {
      return {
        status: "completed",
        reply: finalReply || "Done.",
        executedActions,
        ragSources,
        mutated: executedActions.some((a) => a.mutability !== "read" && a.ok),
        providerUsed: lastProvider,
        modelUsed: lastModel,
      };
    }

    workingHistory.push({
      role: "assistant",
      content: turn.text || "",
      toolCalls: turn.toolCalls,
    });

    const autoCalls: Array<{
      id: string;
      name: string;
      args: Record<string, unknown>;
      mutability: ToolMutability;
    }> = [];
    const pendingCalls: PendingCallSummary[] = [];

    for (const tc of turn.toolCalls) {
      const def = findManageoTool(tc.name);
      const mutability: ToolMutability = def?.mutability || "write";
      if (shouldRequireApproval(mutability, effectiveMode)) {
        pendingCalls.push({
          callId: tc.id,
          name: tc.name,
          args: tc.arguments,
          mutability,
          description: def?.description || `Run ${tc.name}`,
        });
      } else {
        autoCalls.push({
          id: tc.id,
          name: tc.name,
          args: tc.arguments,
          mutability,
        });
      }
    }

    if (autoCalls.length > 0) {
      const autoResults = await Promise.all(
        autoCalls.map(async (c) => {
          const res = await executeManageoTool(c.name, c.args, {
            userId: params.userId,
            workspaceId: params.workspaceId,
            source: "assistant",
          });
          return {
            action: {
              callId: c.id,
              name: c.name,
              mutability: c.mutability,
              args: c.args,
              ok: res.ok,
              summary: res.ok ? JSON.stringify(res.data).slice(0, 280) : undefined,
              error: !res.ok ? res.error : undefined,
            } satisfies ExecutedActionSummary,
            toolTurn: {
              role: "tool" as const,
              toolCallId: c.id,
              toolName: c.name,
              content: JSON.stringify(res.ok ? res.data : { error: res.error }),
            },
          };
        })
      );

      for (const ar of autoResults) {
        executedActions.push(ar.action);
        workingHistory.push(ar.toolTurn);
      }
    }

    if (pendingCalls.length > 0) {
      return {
        status: "requires_approval",
        reply:
          finalReply ||
          "Please confirm whether I should execute the following action(s).",
        executedActions,
        pendingCalls,
        historySnapshot: workingHistory,
        ragSources,
        mutated: executedActions.some((a) => a.mutability !== "read" && a.ok),
        providerUsed: lastProvider,
        modelUsed: lastModel,
      };
    }
  }

  return {
    status: "completed",
    reply: finalReply || "Completed.",
    executedActions,
    ragSources,
    mutated: executedActions.some((a) => a.mutability !== "read" && a.ok),
    providerUsed: lastProvider,
    modelUsed: lastModel,
  };
}
