import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import McpApiKey, { IMcpKeyScopes } from "@/models/McpApiKey";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import { hashMcpToken } from "@/lib/server-crypto";
import { executeManageoTool, toMcpToolsList } from "@/lib/ai/tools";
import Task from "@/models/Task";
import Idea from "@/models/Idea";
import Note from "@/models/Note";

export const dynamic = "force-dynamic";

const MCP_PROTOCOL_VERSION = "2025-03-26";
const SERVER_INFO = {
  name: "manageo-mcp-server",
  version: "1.0.0",
};

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-mcp-api-key, Mcp-Session-Id",
  };
}

function jsonRpcError(id: string | number | null | undefined, code: number, message: string) {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message },
  };
}

function extractBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }
  const alt = req.headers.get("x-mcp-api-key")?.trim();
  return alt || null;
}

async function authenticateMcpRequest(req: NextRequest): Promise<{
  userId: string;
  workspaceId: string;
  scopes: IMcpKeyScopes;
  keyId: string;
} | null> {
  const rawToken = extractBearerToken(req);
  if (!rawToken || !rawToken.startsWith("mgo_live_")) {
    return null;
  }

  await dbConnect();
  const keyHash = hashMcpToken(rawToken);
  const keyDoc = await McpApiKey.findOne({ keyHash, isActive: true });
  if (!keyDoc) return null;

  if (keyDoc.expiresAt && new Date(keyDoc.expiresAt).getTime() < Date.now()) {
    return null;
  }

  const membership = await WorkspaceMembership.findOne({
    userId: keyDoc.userId,
    workspaceId: keyDoc.workspaceId,
    status: { $ne: "suspended" },
  }).lean();
  if (!membership) return null;

  // Update lastUsedAt non-blockingly
  void McpApiKey.updateOne({ _id: keyDoc._id }, { $set: { lastUsedAt: new Date() } }).catch(() => {});

  return {
    userId: keyDoc.userId.toString(),
    workspaceId: keyDoc.workspaceId.toString(),
    scopes: {
      read: keyDoc.scopes?.read !== false,
      write: keyDoc.scopes?.write !== false,
      delete: Boolean(keyDoc.scopes?.delete),
      finance: keyDoc.scopes?.finance !== false,
    },
    keyId: keyDoc._id.toString(),
  };
}

async function handleSingleRpc(
  rpc: JsonRpcRequest,
  auth: { userId: string; workspaceId: string; scopes: IMcpKeyScopes }
): Promise<Record<string, unknown> | null> {
  if (!rpc || rpc.jsonrpc !== "2.0" || typeof rpc.method !== "string") {
    return jsonRpcError(rpc?.id, -32600, "Invalid JSON-RPC 2.0 request");
  }

  const { method, params, id } = rpc;

  // Notifications without an id do not expect a response
  if (method.startsWith("notifications/")) {
    if (id === undefined) return null;
    return { jsonrpc: "2.0", id, result: {} };
  }

  if (method === "ping") {
    return { jsonrpc: "2.0", id: id ?? null, result: {} };
  }

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: id ?? null,
      result: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
          prompts: { listChanged: false },
        },
        serverInfo: SERVER_INFO,
      },
    };
  }

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id: id ?? null,
      result: {
        tools: toMcpToolsList(auth.scopes),
      },
    };
  }

  if (method === "tools/call") {
    const toolName = typeof params?.name === "string" ? params.name : "";
    const toolArgs = (params?.arguments && typeof params.arguments === "object" ? params.arguments : {}) as Record<
      string,
      unknown
    >;
    if (!toolName) {
      return jsonRpcError(id, -32602, "Missing tool name");
    }

    const res = await executeManageoTool(toolName, toolArgs, {
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      source: "mcp",
      allowedScopes: auth.scopes,
    });

    if (!res.ok) {
      return {
        jsonrpc: "2.0",
        id: id ?? null,
        result: {
          isError: true,
          content: [{ type: "text", text: res.error }],
        },
      };
    }

    return {
      jsonrpc: "2.0",
      id: id ?? null,
      result: {
        isError: false,
        content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }],
        structuredContent: res.data,
      },
    };
  }

  if (method === "resources/list") {
    return {
      jsonrpc: "2.0",
      id: id ?? null,
      result: {
        resources: [
          {
            uri: "manageo://workspace/overview",
            name: "Manageo Workspace Overview",
            description: "Summary of tasks, notes, ideas, routines, and personal accounts.",
            mimeType: "application/json",
          },
          {
            uri: "manageo://workspace/tasks",
            name: "Workspace Tasks",
            description: "Active tasks in the scoped workspace.",
            mimeType: "application/json",
          },
          {
            uri: "manageo://workspace/notes",
            name: "Workspace Notes",
            description: "Notes in the scoped workspace.",
            mimeType: "application/json",
          },
          {
            uri: "manageo://workspace/ideas",
            name: "Workspace Ideas",
            description: "Ideas in the scoped workspace.",
            mimeType: "application/json",
          },
        ],
      },
    };
  }

  if (method === "resources/read") {
    const uri = typeof params?.uri === "string" ? params.uri : "";
    if (!auth.scopes.read) {
      return jsonRpcError(id, -32003, "API key lacks 'read' scope");
    }

    const wsObjId = new mongoose.Types.ObjectId(auth.workspaceId);
    let payload: unknown = null;
    if (uri === "manageo://workspace/overview") {
      const ov = await executeManageoTool("get_workspace_overview", {}, {
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        source: "mcp",
        allowedScopes: auth.scopes,
      });
      payload = ov.ok ? ov.data : { error: ov.error };
    } else if (uri === "manageo://workspace/tasks") {
      payload = await Task.find({ workspaceId: wsObjId }).sort({ createdAt: -1 }).limit(50).lean();
    } else if (uri === "manageo://workspace/notes") {
      payload = await Note.find({ workspaceId: wsObjId }).sort({ updatedAt: -1 }).limit(50).lean();
    } else if (uri === "manageo://workspace/ideas") {
      payload = await Idea.find({ workspaceId: wsObjId }).sort({ createdAt: -1 }).limit(50).lean();
    } else {
      return jsonRpcError(id, -32602, `Unknown resource URI: ${uri}`);
    }

    return {
      jsonrpc: "2.0",
      id: id ?? null,
      result: {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(payload, null, 2),
          },
        ],
      },
    };
  }

  if (method === "prompts/list") {
    return {
      jsonrpc: "2.0",
      id: id ?? null,
      result: {
        prompts: [
          {
            name: "daily_briefing",
            description: "Generate a concise daily action plan from pending Manageo tasks, routines, and due bills.",
          },
          {
            name: "triage_inbox",
            description: "Review Inbox tasks and unorganized ideas and propose priorities or schedules.",
          },
        ],
      },
    };
  }

  if (method === "prompts/get") {
    const name = typeof params?.name === "string" ? params.name : "";
    if (name === "daily_briefing") {
      return {
        jsonrpc: "2.0",
        id: id ?? null,
        result: {
          description: "Daily Manageo Briefing",
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: "Call get_workspace_overview, list_tasks, and list_routines to summarize my priorities today, due bills, and recommended next 3 actions.",
              },
            },
          ],
        },
      };
    }
    if (name === "triage_inbox") {
      return {
        jsonrpc: "2.0",
        id: id ?? null,
        result: {
          description: "Inbox Triage",
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: "Call list_tasks with status='Inbox' and list_ideas, then suggest concrete priority and status updates.",
              },
            },
          ],
        },
      };
    }
    return jsonRpcError(id, -32602, `Unknown prompt: ${name}`);
  }

  return jsonRpcError(id, -32601, `Method not found: ${method}`);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  const auth = await authenticateMcpRequest(req);
  if (!auth) {
    return NextResponse.json(
      {
        error: "Unauthorized. Provide Authorization: Bearer mgo_live_... or x-mcp-api-key header.",
        server: SERVER_INFO,
        protocolVersion: MCP_PROTOCOL_VERSION,
        transport: "streamable-http",
      },
      { status: 401, headers: corsHeaders() }
    );
  }

  return NextResponse.json(
    {
      status: "ready",
      server: SERVER_INFO,
      protocolVersion: MCP_PROTOCOL_VERSION,
      transport: "streamable-http",
      workspaceId: auth.workspaceId,
      scopes: auth.scopes,
      toolCount: toMcpToolsList(auth.scopes).length,
    },
    { status: 200, headers: corsHeaders() }
  );
}

export async function POST(req: NextRequest) {
  const auth = await authenticateMcpRequest(req);
  if (!auth) {
    return NextResponse.json(
      jsonRpcError(null, -32001, "Unauthorized: invalid or expired MCP API key"),
      { status: 401, headers: corsHeaders() }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(jsonRpcError(null, -32700, "Parse error: invalid JSON"), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  if (Array.isArray(body)) {
    const responses = (
      await Promise.all(body.map((item) => handleSingleRpc(item as JsonRpcRequest, auth)))
    ).filter((r): r is Record<string, unknown> => r !== null);

    if (responses.length === 0) {
      return new NextResponse(null, { status: 202, headers: corsHeaders() });
    }
    return NextResponse.json(responses, { status: 200, headers: corsHeaders() });
  }

  const single = await handleSingleRpc(body as JsonRpcRequest, auth);
  if (single === null) {
    return new NextResponse(null, { status: 202, headers: corsHeaders() });
  }
  return NextResponse.json(single, { status: 200, headers: corsHeaders() });
}
