import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import {
  createGeminiClient,
  MissingAiKeyError,
  resolveUserAiConfig,
} from "@/lib/ai/gemini-client";
import {
  executeManageoTool,
  findManageoTool,
  PermissionMode,
  shouldRequireApproval,
  toGeminiFunctionTools,
  ToolMutability,
} from "@/lib/ai/tools";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";

export const dynamic = "force-dynamic";

const PendingApprovalDecisionSchema = z.object({
  callId: z.string().min(1),
  name: z.string().min(1),
  args: z.record(z.string(), z.unknown()).default({}),
  decision: z.enum(["approve", "reject"]),
});

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .default([]),
  workspaceId: z.string().optional(),
  permissionMode: z.enum(["review", "default_approved", "turbo"]).optional(),
  model: z
    .enum(["gemini-4-hydrogen", "gemini-4-argon", "gemini-3.5-flash-lite"])
    .optional(),
  pendingApprovals: z.array(PendingApprovalDecisionSchema).optional(),
  resumeInteractionSteps: z.array(z.record(z.string(), z.unknown())).optional(),
});

interface ExecutedActionSummary {
  callId: string;
  name: string;
  mutability: ToolMutability;
  args: Record<string, unknown>;
  ok: boolean;
  summary?: string;
  error?: string;
}

interface PendingCallSummary {
  callId: string;
  name: string;
  args: Record<string, unknown>;
  mutability: ToolMutability;
  description: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildInitialSteps(messages: Array<{ role: "user" | "assistant"; content: string }>): any[] {
  return messages
    .filter((m) => m.content.trim().length > 0)
    .map((m) =>
      m.role === "user"
        ? {
            type: "user_input",
            content: [{ type: "text", text: m.content }],
          }
        : {
            type: "model_output",
            content: [{ type: "text", text: m.content }],
          }
    );
}

function buildSystemPrompt(userName: string, workspaceId: string, permissionMode: PermissionMode) {
  return [
    `You are Manageo AI Assistant helping ${userName} manage their Personal Operating System inside active workspace ID ${workspaceId}.`,
    `Active permission policy: ${permissionMode}.`,
    `You have function tools to read, create, update, and soft-delete Tasks, Ideas, NoteGroups & Notes, Routines, Personal Finance (Accounts, Transactions, Financial Reminders), Custom Sections & Records, Documents, and Trash items.`,
    `SECURITY RULE: Encrypted Vault secrets are strictly excluded for zero-knowledge privacy; explain clearly if the user asks to read Vault passwords.`,
    `Always use real tool calls rather than inventing data or IDs. For updates/deletes where you only know a title, call list_tasks/list_ideas/list_notes/list_routines/list_finance_summary first to resolve the exact ID.`,
    `Keep replies clear, accurate, and concise. Respond in the same language the user writes in (Bengali or English).`,
  ].join("\n");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractOutputText(steps: any[], fallbackText?: string): string {
  if (fallbackText && fallbackText.trim()) return fallbackText.trim();
  const texts: string[] = [];
  for (const step of steps) {
    if (step?.type === "model_output" && Array.isArray(step.content)) {
      for (const block of step.content) {
        if (block?.type === "text" && typeof block.text === "string" && block.text.trim()) {
          texts.push(block.text.trim());
        }
      }
    }
  }
  return texts.join("\n\n").trim();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid chat request payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    let resolvedConfig;
    try {
      resolvedConfig = await resolveUserAiConfig(userId);
    } catch (err) {
      if (err instanceof MissingAiKeyError) {
        return NextResponse.json(
          { error: err.message, code: "MISSING_API_KEY" },
          { status: 400 }
        );
      }
      throw err;
    }

    let workspaceId = parsed.data.workspaceId;
    if (!workspaceId) {
      const wsInfo = await getActiveWorkspaceInfo();
      workspaceId = wsInfo?.activeWorkspace?._id;
    }
    if (!workspaceId) {
      return NextResponse.json({ error: "No active workspace found" }, { status: 400 });
    }

    const effectiveMode: PermissionMode =
      parsed.data.permissionMode || resolvedConfig.permissionMode;
    const modelName = parsed.data.model || resolvedConfig.preferredModel;

    const ai = createGeminiClient(resolvedConfig.apiKey);
    const tools = toGeminiFunctionTools();
    const systemInstruction = buildSystemPrompt(
      resolvedConfig.userName,
      workspaceId,
      effectiveMode
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let steps: any[] =
      parsed.data.resumeInteractionSteps && parsed.data.resumeInteractionSteps.length > 0
        ? [...parsed.data.resumeInteractionSteps]
        : buildInitialSteps(parsed.data.messages);

    if (steps.length === 0) {
      return NextResponse.json({ error: "No conversation input provided" }, { status: 400 });
    }

    const executedActions: ExecutedActionSummary[] = [];

    // Execute user decisions on pending function calls before continuing the model loop
    if (parsed.data.pendingApprovals && parsed.data.pendingApprovals.length > 0) {
      for (const decision of parsed.data.pendingApprovals) {
        const toolDef = findManageoTool(decision.name);
        const mutability: ToolMutability = toolDef?.mutability || "write";

        if (decision.decision === "reject") {
          const resultPayload = {
            cancelled: true,
            reason: "User declined permission to run this action.",
          };
          executedActions.push({
            callId: decision.callId,
            name: decision.name,
            mutability,
            args: decision.args,
            ok: false,
            error: "Declined by user",
          });
          steps.push({
            type: "function_result",
            call_id: decision.callId,
            name: decision.name,
            is_error: true,
            result: JSON.stringify(resultPayload),
          });
        } else {
          const res = await executeManageoTool(decision.name, decision.args, {
            userId,
            workspaceId,
            source: "assistant",
          });
          executedActions.push({
            callId: decision.callId,
            name: decision.name,
            mutability,
            args: decision.args,
            ok: res.ok,
            summary: res.ok ? JSON.stringify(res.data).slice(0, 280) : undefined,
            error: !res.ok ? res.error : undefined,
          });
          steps.push({
            type: "function_result",
            call_id: decision.callId,
            name: decision.name,
            is_error: !res.ok,
            result: JSON.stringify(res.ok ? res.data : { error: res.error }),
          });
        }
      }
    }

    const MAX_HOPS = 6;
    let finalText = "";

    for (let hop = 0; hop < MAX_HOPS; hop++) {
      const prevCount = steps.length;
      const interaction = await ai.interactions.create({
        model: modelName,
        system_instruction: systemInstruction,
        tools,
        store: false,
        input: steps,
      });

      const returnedSteps = Array.isArray(interaction.steps) ? interaction.steps : [];
      // Stateless response contains new steps generated by this call; extract them safely
      const newSteps =
        returnedSteps.length > prevCount &&
        returnedSteps[0]?.type === steps[0]?.type
          ? returnedSteps.slice(prevCount)
          : returnedSteps;

      steps = [...steps, ...newSteps];

      const functionCalls = newSteps.filter(
        (s): s is { type: "function_call"; id: string; name: string; arguments: Record<string, unknown> } =>
          s?.type === "function_call" && typeof s.name === "string"
      );

      finalText = extractOutputText(newSteps, interaction.output_text);

      if (functionCalls.length === 0) {
        return NextResponse.json({
          status: "completed",
          reply: finalText || "Done.",
          executedActions,
          mutated: executedActions.some((a) => a.mutability !== "read" && a.ok),
          model: modelName,
          permissionMode: effectiveMode,
        });
      }

      const pendingCalls: PendingCallSummary[] = [];

      for (const call of functionCalls) {
        const toolDef = findManageoTool(call.name);
        const mutability: ToolMutability = toolDef?.mutability || "write";
        const args = (call.arguments && typeof call.arguments === "object" ? call.arguments : {}) as Record<
          string,
          unknown
        >;

        if (shouldRequireApproval(mutability, effectiveMode)) {
          pendingCalls.push({
            callId: call.id,
            name: call.name,
            args,
            mutability,
            description: toolDef?.description || `Run ${call.name}`,
          });
        } else {
          const res = await executeManageoTool(call.name, args, {
            userId,
            workspaceId,
            source: "assistant",
          });
          executedActions.push({
            callId: call.id,
            name: call.name,
            mutability,
            args,
            ok: res.ok,
            summary: res.ok ? JSON.stringify(res.data).slice(0, 280) : undefined,
            error: !res.ok ? res.error : undefined,
          });
          steps.push({
            type: "function_result",
            call_id: call.id,
            name: call.name,
            is_error: !res.ok,
            result: JSON.stringify(res.ok ? res.data : { error: res.error }),
          });
        }
      }

      if (pendingCalls.length > 0) {
        return NextResponse.json({
          status: "requires_approval",
          reply: finalText || "Please review and approve the requested action(s) before I proceed.",
          executedActions,
          pendingCalls,
          resumeInteractionSteps: steps,
          mutated: executedActions.some((a) => a.mutability !== "read" && a.ok),
          model: modelName,
          permissionMode: effectiveMode,
        });
      }
    }

    return NextResponse.json({
      status: "completed",
      reply: finalText || "Completed the requested actions.",
      executedActions,
      mutated: executedActions.some((a) => a.mutability !== "read" && a.ok),
      model: modelName,
      permissionMode: effectiveMode,
    });
  } catch (err: unknown) {
    console.error("[AI Chat Route] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to process AI chat request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
