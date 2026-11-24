import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import {
  executeManageoTool,
  findManageoTool,
  PermissionMode,
  shouldRequireApproval,
} from "@/lib/ai/tools";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";

export const dynamic = "force-dynamic";

const ToolExecuteSchema = z.object({
  toolName: z.string().min(1),
  args: z.record(z.string(), z.unknown()).default({}),
  workspaceId: z.string().optional(),
  permissionMode: z.enum(["review", "default_approved", "turbo"]).optional(),
  confirmed: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = ToolExecuteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid tool execution request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const toolDef = findManageoTool(parsed.data.toolName);
    if (!toolDef) {
      return NextResponse.json(
        { error: `Unknown tool: ${parsed.data.toolName}` },
        { status: 404 }
      );
    }

    await dbConnect();
    let effectiveMode: PermissionMode = parsed.data.permissionMode || "default_approved";
    if (!parsed.data.permissionMode) {
      const user = await User.findById(session.user.id)
        .select("preferences.aiSettings.permissionMode")
        .lean();
      const storedMode = (user?.preferences as { aiSettings?: { permissionMode?: PermissionMode } } | undefined)
        ?.aiSettings?.permissionMode;
      if (storedMode) effectiveMode = storedMode;
    }

    if (shouldRequireApproval(toolDef.mutability, effectiveMode) && !parsed.data.confirmed) {
      return NextResponse.json({
        status: "requires_approval",
        permissionMode: effectiveMode,
        call: {
          name: toolDef.name,
          args: parsed.data.args,
          mutability: toolDef.mutability,
          description: toolDef.description,
        },
      });
    }

    let workspaceId = parsed.data.workspaceId;
    if (!workspaceId) {
      const wsInfo = await getActiveWorkspaceInfo();
      workspaceId = wsInfo?.activeWorkspace?._id;
    }
    if (!workspaceId) {
      return NextResponse.json({ error: "No active workspace found" }, { status: 400 });
    }

    const res = await executeManageoTool(toolDef.name, parsed.data.args, {
      userId: session.user.id,
      workspaceId,
      source: "assistant",
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          status: "executed",
          ok: false,
          error: res.error,
          mutability: toolDef.mutability,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: "executed",
      ok: true,
      data: res.data,
      mutability: toolDef.mutability,
    });
  } catch (err: unknown) {
    console.error("[AI Tool Execute Route] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to execute tool";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
