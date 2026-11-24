import crypto from "crypto";
import mongoose from "mongoose";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { calculateNewBalance } from "@/lib/finance";
import { executeInTransaction } from "@/lib/db-transaction";
import "@/models/Workspace";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import Task from "@/models/Task";
import Idea from "@/models/Idea";
import NoteGroup from "@/models/NoteGroup";
import Note from "@/models/Note";
import Routine from "@/models/Routine";
import Account from "@/models/Account";
import Category from "@/models/Category";
import Transaction from "@/models/Transaction";
import FinancialReminder from "@/models/FinancialReminder";
import CustomSection from "@/models/custom/CustomSection";
import CustomRecord from "@/models/custom/CustomRecord";
import DocumentModel from "@/models/Document";
import TrashItem from "@/models/TrashItem";
import type { IMcpKeyScopes } from "@/models/McpApiKey";
import { invalidateKnowledgeCache, retrieveHybridContext } from "@/lib/ai/rag";

export type PermissionMode = "review" | "default_approved" | "turbo";
export type ToolMutability = "read" | "write" | "delete";

export interface ToolExecutionContext {
  userId: string;
  workspaceId: string;
  source: "assistant" | "mcp";
  allowedScopes?: Partial<IMcpKeyScopes>;
}

export interface ManageoToolDefinition {
  name: string;
  description: string;
  mutability: ToolMutability;
  isFinance?: boolean;
  parameters: Record<string, unknown>;
  schema: z.ZodTypeAny;
  execute: (args: Record<string, unknown>, ctx: ToolExecutionContext) => Promise<unknown>;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const ROLE_WEIGHT: Record<string, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

/**
 * Determines whether a tool call requires explicit user confirmation
 * under the active Manageo permission policy.
 */
export function shouldRequireApproval(
  mutability: ToolMutability,
  mode: PermissionMode
): boolean {
  if (mode === "turbo") return false;
  if (mode === "review") return mutability === "write" || mutability === "delete";
  // default_approved: auto-approve reads & writes, ask approval before deletes
  return mutability === "delete";
}

export function getToolScopeRequirement(tool: ManageoToolDefinition): keyof IMcpKeyScopes {
  if (tool.mutability === "delete") return "delete";
  if (tool.mutability === "write") return "write";
  return "read";
}

function makeSlug(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base || "item"}-${suffix}`;
}

async function resolveWorkspaceContext(
  ctx: ToolExecutionContext,
  requestedWorkspaceId?: string,
  minRole: "viewer" | "member" | "admin" | "owner" = "viewer"
): Promise<{ workspaceId: mongoose.Types.ObjectId; role: string; name: string; type: string }> {
  const targetId = requestedWorkspaceId?.trim() || ctx.workspaceId;
  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    throw new Error("Invalid workspaceId");
  }

  const membership = await WorkspaceMembership.findOne({
    userId: new mongoose.Types.ObjectId(ctx.userId),
    workspaceId: new mongoose.Types.ObjectId(targetId),
    status: { $ne: "suspended" },
  })
    .populate("workspaceId")
    .lean();

  if (!membership || !membership.workspaceId) {
    throw new Error("Workspace access denied or workspace not found");
  }

  const ws = membership.workspaceId as unknown as {
    _id: mongoose.Types.ObjectId;
    name: string;
    type: string;
    isArchived?: boolean;
  };
  if (ws.isArchived) {
    throw new Error("Workspace is archived");
  }

  const role = String(membership.role || "viewer");
  if ((ROLE_WEIGHT[role] ?? 0) < ROLE_WEIGHT[minRole]) {
    throw new Error(`Insufficient workspace role (${role}); requires ${minRole}`);
  }

  return {
    workspaceId: ws._id,
    role,
    name: ws.name,
    type: ws.type,
  };
}

function normalizeId(val: unknown): string {
  if (!val) return "";
  return typeof val === "string" ? val : String(val);
}

function decimalToNumber(val: unknown): number {
  if (val == null) return 0;
  const num = parseFloat(val.toString());
  return Number.isFinite(num) ? num : 0;
}

function isObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

async function softDeleteEntity(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: mongoose.Model<any>;
  entityType: string;
  moduleName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  userId: string;
  workspaceId?: string;
  customTitle?: string;
}) {
  const now = new Date();
  const purgeAt = new Date(now.getTime() + SEVEN_DAYS_MS);
  const batchId = new mongoose.Types.ObjectId().toString();
  const userObjId = new mongoose.Types.ObjectId(params.userId);
  const wsObjId = params.workspaceId
    ? new mongoose.Types.ObjectId(params.workspaceId)
    : params.item.workspaceId || new mongoose.Types.ObjectId(params.userId);

  const title =
    params.customTitle ||
    params.item.title ||
    params.item.name ||
    params.item.description ||
    `${params.entityType} Item`;

  await params.model.updateOne(
    { _id: params.item._id },
    {
      $set: {
        isDeleted: true,
        deletedAt: now,
        purgeAt,
        deletedBy: userObjId,
        deletionBatchId: batchId,
      },
    }
  );

  await TrashItem.create({
    userId: userObjId,
    workspaceId: wsObjId,
    entityType: params.entityType,
    entityId: params.item._id,
    title,
    module: params.moduleName,
    deletedAt: now,
    purgeAt,
    deletedBy: userObjId,
    deletionBatchId: batchId,
    status: "active",
    attachments: [],
    metadata: {},
  });

  return { deletedId: normalizeId(params.item._id), title, purgeAt: purgeAt.toISOString() };
}

export const MANAGEO_TOOLS: ManageoToolDefinition[] = [
  // =========================================================================
  // 1. OVERVIEW & WORKSPACES
  // =========================================================================
  {
    name: "get_workspace_overview",
    description:
      "Get a summary of the user's active Manageo workspace including pending tasks, active routines, ideas count, notes count, custom sections, and personal account balances.",
    mutability: "read",
    parameters: {
      type: "object",
      properties: {
        workspaceId: {
          type: "string",
          description: "Optional workspace ID to inspect instead of the active default.",
        },
      },
    },
    schema: z.object({
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "viewer");
      const userObjId = new mongoose.Types.ObjectId(ctx.userId);
      const includeFinance = ctx.allowedScopes?.finance !== false;

      const [
        totalTasks,
        pendingTasks,
        completedTasks,
        ideasCount,
        notesCount,
        routinesCount,
        customSectionsCount,
        documentsCount,
        accounts,
        upcomingReminders,
      ] = await Promise.all([
        Task.countDocuments({ workspaceId: ws.workspaceId }),
        Task.countDocuments({
          workspaceId: ws.workspaceId,
          status: { $nin: ["Completed", "Done", "Cancelled"] },
        }),
        Task.countDocuments({
          workspaceId: ws.workspaceId,
          status: { $in: ["Completed", "Done"] },
        }),
        Idea.countDocuments({ workspaceId: ws.workspaceId }),
        Note.countDocuments({ workspaceId: ws.workspaceId }),
        Routine.countDocuments({ workspaceId: ws.workspaceId }),
        CustomSection.countDocuments({ workspaceId: ws.workspaceId }),
        DocumentModel.countDocuments({ workspaceId: ws.workspaceId }),
        includeFinance ? Account.find({ userId: userObjId }).lean() : Promise.resolve([]),
        includeFinance
          ? FinancialReminder.countDocuments({ userId: userObjId, status: "active" })
          : Promise.resolve(0),
      ]);

      return {
        workspace: {
          id: normalizeId(ws.workspaceId),
          name: ws.name,
          type: ws.type,
          role: ws.role,
        },
        counts: {
          totalTasks,
          pendingTasks,
          completedTasks,
          ideasCount,
          notesCount,
          routinesCount,
          customSectionsCount,
          documentsCount,
          activeFinancialReminders: upcomingReminders,
        },
        ...(includeFinance
          ? {
              accounts: accounts.map((a) => ({
                id: normalizeId(a._id),
                name: a.name,
                type: a.type,
                currency: a.currency,
                balance: decimalToNumber(a.balance),
              })),
            }
          : {}),
      };
    },
  },
  {
    name: "list_workspaces",
    description: "List all workspaces (personal and team) that the authenticated user belongs to.",
    mutability: "read",
    parameters: { type: "object", properties: {} },
    schema: z.object({}),
    execute: async (_args, ctx) => {
      const memberships = await WorkspaceMembership.find({
        userId: new mongoose.Types.ObjectId(ctx.userId),
        status: { $ne: "suspended" },
      })
        .populate("workspaceId")
        .lean();

      const items = memberships
        .filter((m) => m.workspaceId && !(m.workspaceId as unknown as { isArchived?: boolean }).isArchived)
        .map((m) => {
          const w = m.workspaceId as unknown as {
            _id: mongoose.Types.ObjectId;
            name: string;
            type: string;
          };
          return {
            id: normalizeId(w._id),
            name: w.name,
            type: w.type,
            role: m.role,
            isActiveDefault: normalizeId(w._id) === ctx.workspaceId,
          };
        });
      return { workspaces: items };
    },
  },

  // =========================================================================
  // 2. TASKS
  // =========================================================================
  {
    name: "list_tasks",
    description:
      "List tasks in the workspace. Can filter by status, priority, or search query string.",
    mutability: "read",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        status: { type: "string", description: "Filter by exact status, e.g. 'To Do', 'In Progress', 'Completed', 'Inbox'." },
        priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"] },
        search: { type: "string", description: "Substring search on task title or description." },
        limit: { type: "number", description: "Max tasks to return (default 30, max 100)." },
      },
    },
    schema: z.object({
      workspaceId: z.string().optional(),
      status: z.string().optional(),
      priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
      search: z.string().optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "viewer");
      const query: Record<string, unknown> = { workspaceId: ws.workspaceId };
      if (args.status) query.status = args.status;
      if (args.priority) query.priority = args.priority;
      if (args.search) {
        const rx = new RegExp(String(args.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$or = [{ title: rx }, { description: rx }, { tags: rx }];
      }
      const limit = Number(args.limit) || 30;
      const tasks = await Task.find(query).sort({ createdAt: -1 }).limit(limit).lean();
      return {
        tasks: tasks.map((t) => ({
          id: normalizeId(t._id),
          slug: t.slug,
          title: t.title,
          description: t.description || "",
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
          dueTime: t.dueTime || null,
          tags: t.tags || [],
          createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : null,
        })),
      };
    },
  },
  {
    name: "create_task",
    description: "Create a new task in the Manageo workspace.",
    mutability: "write",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title (required)." },
        description: { type: "string" },
        notes: { type: "string" },
        status: {
          type: "string",
          enum: [
            "Inbox",
            "Planned",
            "In Progress",
            "Completed",
            "Cancelled",
            "Backlog",
            "To Do",
            "In Review",
            "Done",
            "Blocked",
            "Problem/Error",
          ],
        },
        priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"] },
        dueDate: { type: "string", description: "ISO 8601 date string, e.g. '2026-12-01'." },
        dueTime: { type: "string", description: "Optional HH:mm time string." },
        tags: { type: "array", items: { type: "string" } },
        workspaceId: { type: "string" },
      },
      required: ["title"],
    },
    schema: z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().max(4000).optional(),
      notes: z.string().max(10000).optional(),
      status: z
        .enum([
          "Inbox",
          "Planned",
          "In Progress",
          "Completed",
          "Cancelled",
          "Backlog",
          "To Do",
          "In Review",
          "Done",
          "Blocked",
          "Problem/Error",
        ])
        .optional(),
      priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
      dueDate: z.string().optional(),
      dueTime: z.string().optional(),
      tags: z.array(z.string()).optional(),
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "member");
      const status = (args.status as string) || "To Do";
      const completedAt = status === "Completed" || status === "Done" ? new Date() : null;
      const task = await Task.create({
        userId: new mongoose.Types.ObjectId(ctx.userId),
        workspaceId: ws.workspaceId,
        slug: makeSlug(String(args.title)),
        title: String(args.title).trim(),
        description: args.description ? String(args.description) : undefined,
        notes: args.notes ? String(args.notes) : undefined,
        status,
        priority: (args.priority as string) || "Medium",
        dueDate: args.dueDate ? new Date(String(args.dueDate)) : undefined,
        dueTime: args.dueTime ? String(args.dueTime) : undefined,
        tags: Array.isArray(args.tags) ? args.tags : [],
        completedAt,
      });

      return {
        task: {
          id: normalizeId(task._id),
          slug: task.slug,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        },
      };
    },
  },
  {
    name: "update_task",
    description: "Update an existing task's title, description, status, priority, dueDate, or tags by task ID or slug.",
    mutability: "write",
    parameters: {
      type: "object",
      properties: {
        taskId: { type: "string", description: "MongoDB task ID or slug." },
        title: { type: "string" },
        description: { type: "string" },
        notes: { type: "string" },
        status: {
          type: "string",
          enum: [
            "Inbox",
            "Planned",
            "In Progress",
            "Completed",
            "Cancelled",
            "Backlog",
            "To Do",
            "In Review",
            "Done",
            "Blocked",
            "Problem/Error",
          ],
        },
        priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"] },
        dueDate: { type: "string", description: "ISO 8601 date string or empty string to clear." },
        dueTime: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        workspaceId: { type: "string" },
      },
      required: ["taskId"],
    },
    schema: z.object({
      taskId: z.string().min(1),
      title: z.string().trim().min(1).max(200).optional(),
      description: z.string().max(4000).optional(),
      notes: z.string().max(10000).optional(),
      status: z
        .enum([
          "Inbox",
          "Planned",
          "In Progress",
          "Completed",
          "Cancelled",
          "Backlog",
          "To Do",
          "In Review",
          "Done",
          "Blocked",
          "Problem/Error",
        ])
        .optional(),
      priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
      dueDate: z.string().optional(),
      dueTime: z.string().optional(),
      tags: z.array(z.string()).optional(),
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "member");
      const key = String(args.taskId).trim();
      const filter = isObjectId(key)
        ? { _id: key, workspaceId: ws.workspaceId }
        : { slug: key, workspaceId: ws.workspaceId };

      const updates: Record<string, unknown> = {};
      if (args.title !== undefined) updates.title = String(args.title).trim();
      if (args.description !== undefined) updates.description = String(args.description);
      if (args.notes !== undefined) updates.notes = String(args.notes);
      if (args.status !== undefined) {
        updates.status = args.status;
        updates.completedAt =
          args.status === "Completed" || args.status === "Done" ? new Date() : null;
      }
      if (args.priority !== undefined) updates.priority = args.priority;
      if (args.dueDate !== undefined) {
        updates.dueDate = args.dueDate ? new Date(String(args.dueDate)) : null;
      }
      if (args.dueTime !== undefined) updates.dueTime = String(args.dueTime);
      if (args.tags !== undefined) updates.tags = args.tags;

      const updated = await Task.findOneAndUpdate(filter, { $set: updates }, { new: true }).lean();
      if (!updated) throw new Error("Task not found in active workspace");

      return {
        task: {
          id: normalizeId(updated._id),
          slug: updated.slug,
          title: updated.title,
          status: updated.status,
          priority: updated.priority,
          dueDate: updated.dueDate ? new Date(updated.dueDate).toISOString() : null,
        },
      };
    },
  },
  {
    name: "delete_task",
    description: "Soft-delete a task (moves it to the 7-day Trash) by task ID or slug.",
    mutability: "delete",
    parameters: {
      type: "object",
      properties: {
        taskId: { type: "string", description: "MongoDB task ID or slug." },
        workspaceId: { type: "string" },
      },
      required: ["taskId"],
    },
    schema: z.object({
      taskId: z.string().min(1),
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "member");
      const key = String(args.taskId).trim();
      const filter = isObjectId(key)
        ? { _id: key, workspaceId: ws.workspaceId }
        : { slug: key, workspaceId: ws.workspaceId };
      const task = await Task.findOne(filter).lean();
      if (!task) throw new Error("Task not found in active workspace");
      return softDeleteEntity({
        model: Task,
        entityType: "Task",
        moduleName: "Tasks & Projects",
        item: task,
        userId: ctx.userId,
        workspaceId: normalizeId(ws.workspaceId),
      });
    },
  },

  // =========================================================================
  // 3. IDEAS
  // =========================================================================
  {
    name: "list_ideas",
    description: "List ideas in the active workspace with optional status or search filtering.",
    mutability: "read",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        status: { type: "string" },
        search: { type: "string" },
        limit: { type: "number" },
      },
    },
    schema: z.object({
      workspaceId: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "viewer");
      const query: Record<string, unknown> = { workspaceId: ws.workspaceId };
      if (args.status) query.status = args.status;
      if (args.search) {
        const rx = new RegExp(String(args.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$or = [{ title: rx }, { description: rx }, { content: rx }];
      }
      const ideas = await Idea.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(args.limit) || 30)
        .lean();
      return {
        ideas: ideas.map((i) => ({
          id: normalizeId(i._id),
          slug: i.slug,
          title: i.title,
          description: i.description || "",
          status: i.status,
          priority: i.priority,
          tags: i.tags || [],
        })),
      };
    },
  },
  {
    name: "create_idea",
    description: "Create a new idea in the Manageo workspace.",
    mutability: "write",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        content: { type: "string", description: "Rich markdown details of the idea." },
        status: {
          type: "string",
          enum: ["Inbox", "Exploring", "Planned", "In Progress", "On Hold", "Completed", "Archived"],
        },
        priority: { type: "string", enum: ["Low", "Medium", "High"] },
        tags: { type: "array", items: { type: "string" } },
        workspaceId: { type: "string" },
      },
      required: ["title"],
    },
    schema: z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().max(4000).optional(),
      content: z.string().max(20000).optional(),
      status: z
        .enum(["Inbox", "Exploring", "Planned", "In Progress", "On Hold", "Completed", "Archived"])
        .optional(),
      priority: z.enum(["Low", "Medium", "High"]).optional(),
      tags: z.array(z.string()).optional(),
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "member");
      const idea = await Idea.create({
        userId: new mongoose.Types.ObjectId(ctx.userId),
        workspaceId: ws.workspaceId,
        slug: makeSlug(String(args.title)),
        title: String(args.title).trim(),
        description: args.description ? String(args.description) : undefined,
        content: args.content ? String(args.content) : "",
        status: (args.status as string) || "Inbox",
        priority: (args.priority as string) || "Medium",
        tags: Array.isArray(args.tags) ? args.tags : [],
      });
      return {
        idea: {
          id: normalizeId(idea._id),
          slug: idea.slug,
          title: idea.title,
          status: idea.status,
          priority: idea.priority,
        },
      };
    },
  },
  {
    name: "update_idea",
    description: "Update an existing idea by ID or slug.",
    mutability: "write",
    parameters: {
      type: "object",
      properties: {
        ideaId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        content: { type: "string" },
        status: {
          type: "string",
          enum: ["Inbox", "Exploring", "Planned", "In Progress", "On Hold", "Completed", "Archived"],
        },
        priority: { type: "string", enum: ["Low", "Medium", "High"] },
        tags: { type: "array", items: { type: "string" } },
        workspaceId: { type: "string" },
      },
      required: ["ideaId"],
    },
    schema: z.object({
      ideaId: z.string().min(1),
      title: z.string().trim().min(1).max(200).optional(),
      description: z.string().max(4000).optional(),
      content: z.string().max(20000).optional(),
      status: z
        .enum(["Inbox", "Exploring", "Planned", "In Progress", "On Hold", "Completed", "Archived"])
        .optional(),
      priority: z.enum(["Low", "Medium", "High"]).optional(),
      tags: z.array(z.string()).optional(),
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "member");
      const key = String(args.ideaId).trim();
      const filter = isObjectId(key)
        ? { _id: key, workspaceId: ws.workspaceId }
        : { slug: key, workspaceId: ws.workspaceId };
      const updates: Record<string, unknown> = {};
      if (args.title !== undefined) updates.title = String(args.title).trim();
      if (args.description !== undefined) updates.description = String(args.description);
      if (args.content !== undefined) updates.content = String(args.content);
      if (args.status !== undefined) updates.status = args.status;
      if (args.priority !== undefined) updates.priority = args.priority;
      if (args.tags !== undefined) updates.tags = args.tags;

      const updated = await Idea.findOneAndUpdate(filter, { $set: updates }, { new: true }).lean();
      if (!updated) throw new Error("Idea not found");
      return {
        idea: {
          id: normalizeId(updated._id),
          slug: updated.slug,
          title: updated.title,
          status: updated.status,
          priority: updated.priority,
        },
      };
    },
  },
  {
    name: "delete_idea",
    description: "Soft-delete an idea (moves to 7-day Trash) by ID or slug.",
    mutability: "delete",
    parameters: {
      type: "object",
      properties: {
        ideaId: { type: "string" },
        workspaceId: { type: "string" },
      },
      required: ["ideaId"],
    },
    schema: z.object({
      ideaId: z.string().min(1),
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "member");
      const key = String(args.ideaId).trim();
      const filter = isObjectId(key)
        ? { _id: key, workspaceId: ws.workspaceId }
        : { slug: key, workspaceId: ws.workspaceId };
      const idea = await Idea.findOne(filter).lean();
      if (!idea) throw new Error("Idea not found");
      return softDeleteEntity({
        model: Idea,
        entityType: "Idea",
        moduleName: "Ideas",
        item: idea,
        userId: ctx.userId,
        workspaceId: normalizeId(ws.workspaceId),
      });
    },
  },

  // =========================================================================
  // 4. NOTE GROUPS & NOTES
  // =========================================================================
  {
    name: "list_notes",
    description: "List note groups (notebooks) and notes in the workspace.",
    mutability: "read",
    parameters: {
      type: "object",
      properties: {
        groupId: { type: "string", description: "Optional NoteGroup ID filter." },
        search: { type: "string" },
        workspaceId: { type: "string" },
        limit: { type: "number" },
      },
    },
    schema: z.object({
      groupId: z.string().optional(),
      search: z.string().optional(),
      workspaceId: z.string().optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "viewer");
      const groups = await NoteGroup.find({ workspaceId: ws.workspaceId }).lean();
      const query: Record<string, unknown> = { workspaceId: ws.workspaceId };
      if (args.groupId && isObjectId(String(args.groupId))) {
        query.groupId = new mongoose.Types.ObjectId(String(args.groupId));
      }
      if (args.search) {
        const rx = new RegExp(String(args.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$or = [{ title: rx }, { content: rx }];
      }
      const notes = await Note.find(query)
        .sort({ updatedAt: -1 })
        .limit(Number(args.limit) || 30)
        .lean();

      return {
        groups: groups.map((g) => ({
          id: normalizeId(g._id),
          name: g.name,
          slug: g.slug,
        })),
        notes: notes.map((n) => ({
          id: normalizeId(n._id),
          groupId: normalizeId(n.groupId),
          title: n.title,
          slug: n.slug,
          date: n.date ? new Date(n.date).toISOString() : null,
          content: n.content || "",
        })),
      };
    },
  },
  {
    name: "create_note",
    description:
      "Create a new note in the Manageo workspace. Automatically creates or picks a notebook (NoteGroup) if groupId/groupName is provided or omitted.",
    mutability: "write",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        content: { type: "string" },
        groupId: { type: "string" },
        groupName: { type: "string", description: "Optional notebook name if groupId is unknown; creates one if missing." },
        workspaceId: { type: "string" },
      },
      required: ["title"],
    },
    schema: z.object({
      title: z.string().trim().min(1).max(200),
      content: z.string().max(50000).optional(),
      groupId: z.string().optional(),
      groupName: z.string().trim().max(100).optional(),
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "member");
      const userObjId = new mongoose.Types.ObjectId(ctx.userId);
      let group = null;

      if (args.groupId && isObjectId(String(args.groupId))) {
        group = await NoteGroup.findOne({ _id: args.groupId, workspaceId: ws.workspaceId });
      }
      if (!group && args.groupName) {
        group = await NoteGroup.findOne({
          workspaceId: ws.workspaceId,
          name: { $regex: new RegExp(`^${String(args.groupName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        });
        if (!group) {
          group = await NoteGroup.create({
            userId: userObjId,
            workspaceId: ws.workspaceId,
            name: String(args.groupName).trim(),
            slug: makeSlug(String(args.groupName)),
          });
        }
      }
      if (!group) {
        group = await NoteGroup.findOne({ workspaceId: ws.workspaceId }).sort({ createdAt: 1 });
      }
      if (!group) {
        group = await NoteGroup.create({
          userId: userObjId,
          workspaceId: ws.workspaceId,
          name: "General",
          slug: makeSlug("general"),
        });
      }

      const note = await Note.create({
        userId: userObjId,
        workspaceId: ws.workspaceId,
        groupId: group._id,
        title: String(args.title).trim(),
        slug: makeSlug(String(args.title)),
        date: new Date(),
        content: args.content ? String(args.content) : "",
      });

      return {
        note: {
          id: normalizeId(note._id),
          groupId: normalizeId(group._id),
          groupName: group.name,
          title: note.title,
          slug: note.slug,
        },
      };
    },
  },
  {
    name: "update_note",
    description: "Update an existing note's title or content by ID or slug.",
    mutability: "write",
    parameters: {
      type: "object",
      properties: {
        noteId: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        workspaceId: { type: "string" },
      },
      required: ["noteId"],
    },
    schema: z.object({
      noteId: z.string().min(1),
      title: z.string().trim().min(1).max(200).optional(),
      content: z.string().max(50000).optional(),
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "member");
      const key = String(args.noteId).trim();
      const filter = isObjectId(key)
        ? { _id: key, workspaceId: ws.workspaceId }
        : { slug: key, workspaceId: ws.workspaceId };
      const updates: Record<string, unknown> = {};
      if (args.title !== undefined) updates.title = String(args.title).trim();
      if (args.content !== undefined) updates.content = String(args.content);
      const updated = await Note.findOneAndUpdate(filter, { $set: updates }, { new: true }).lean();
      if (!updated) throw new Error("Note not found");
      return {
        note: {
          id: normalizeId(updated._id),
          title: updated.title,
          slug: updated.slug,
        },
      };
    },
  },
  {
    name: "delete_note",
    description: "Soft-delete a note (moves to 7-day Trash) by ID or slug.",
    mutability: "delete",
    parameters: {
      type: "object",
      properties: {
        noteId: { type: "string" },
        workspaceId: { type: "string" },
      },
      required: ["noteId"],
    },
    schema: z.object({
      noteId: z.string().min(1),
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "member");
      const key = String(args.noteId).trim();
      const filter = isObjectId(key)
        ? { _id: key, workspaceId: ws.workspaceId }
        : { slug: key, workspaceId: ws.workspaceId };
      const note = await Note.findOne(filter).lean();
      if (!note) throw new Error("Note not found");
      return softDeleteEntity({
        model: Note,
        entityType: "Note",
        moduleName: "Notes",
        item: note,
        userId: ctx.userId,
        workspaceId: normalizeId(ws.workspaceId),
      });
    },
  },

  // =========================================================================
  // 5. ROUTINES
  // =========================================================================
  {
    name: "list_routines",
    description: "List daily/weekly routines in the active workspace.",
    mutability: "read",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
    },
    schema: z.object({
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "viewer");
      const routines = await Routine.find({ workspaceId: ws.workspaceId })
        .sort({ createdAt: -1 })
        .lean();
      return {
        routines: routines.map((r) => ({
          id: normalizeId(r._id),
          name: r.name,
          description: r.description || "",
          schedule: r.schedule || [],
          startTime: r.startTime || null,
          endTime: r.endTime || null,
          recurrence: r.recurrence || "daily",
          isActive: Boolean(r.isActive),
          items: r.items || [],
        })),
      };
    },
  },
  {
    name: "create_routine",
    description: "Create a new routine with optional schedule days and checklist steps.",
    mutability: "write",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        startTime: { type: "string", description: "HH:mm" },
        endTime: { type: "string", description: "HH:mm" },
        recurrence: { type: "string", description: "'daily', 'weekly', 'custom'" },
        schedule: { type: "array", items: { type: "string" } },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              durationMinutes: { type: "number" },
            },
          },
        },
        workspaceId: { type: "string" },
      },
      required: ["name"],
    },
    schema: z.object({
      name: z.string().trim().min(1).max(200),
      description: z.string().max(2000).optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      recurrence: z.string().optional(),
      schedule: z.array(z.string()).optional(),
      items: z
        .array(
          z.object({
            title: z.string().min(1),
            durationMinutes: z.number().optional(),
          })
        )
        .optional(),
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "member");
      const routine = await Routine.create({
        userId: new mongoose.Types.ObjectId(ctx.userId),
        workspaceId: ws.workspaceId,
        name: String(args.name).trim(),
        description: args.description ? String(args.description) : undefined,
        startTime: args.startTime ? String(args.startTime) : undefined,
        endTime: args.endTime ? String(args.endTime) : undefined,
        recurrence: (args.recurrence as string) || "daily",
        schedule: Array.isArray(args.schedule) ? args.schedule : ["Daily"],
        items: Array.isArray(args.items) ? args.items : [],
        isActive: true,
      });
      return {
        routine: {
          id: normalizeId(routine._id),
          name: routine.name,
          recurrence: routine.recurrence,
          isActive: routine.isActive,
        },
      };
    },
  },
  {
    name: "delete_routine",
    description: "Soft-delete a routine (moves to 7-day Trash) by ID.",
    mutability: "delete",
    parameters: {
      type: "object",
      properties: {
        routineId: { type: "string" },
        workspaceId: { type: "string" },
      },
      required: ["routineId"],
    },
    schema: z.object({
      routineId: z.string().min(1),
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "member");
      if (!isObjectId(String(args.routineId))) throw new Error("Invalid routineId");
      const routine = await Routine.findOne({
        _id: args.routineId,
        workspaceId: ws.workspaceId,
      }).lean();
      if (!routine) throw new Error("Routine not found");
      return softDeleteEntity({
        model: Routine,
        entityType: "Routine",
        moduleName: "Routines",
        item: routine,
        userId: ctx.userId,
        workspaceId: normalizeId(ws.workspaceId),
      });
    },
  },

  // =========================================================================
  // 6. FINANCE (PERSONAL USER-SCOPED ONLY)
  // =========================================================================
  {
    name: "list_finance_summary",
    description:
      "List the user's financial accounts, categories, recent transactions, and active financial reminders.",
    mutability: "read",
    isFinance: true,
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max recent transactions (default 20, max 100)." },
      },
    },
    schema: z.object({
      limit: z.number().int().min(1).max(100).optional(),
    }),
    execute: async (args, ctx) => {
      const userObjId = new mongoose.Types.ObjectId(ctx.userId);
      const [accounts, categories, transactions, reminders] = await Promise.all([
        Account.find({ userId: userObjId }).sort({ createdAt: 1 }).lean(),
        Category.find({ userId: userObjId }).lean(),
        Transaction.find({ userId: userObjId })
          .sort({ date: -1, createdAt: -1 })
          .limit(Number(args.limit) || 20)
          .lean(),
        FinancialReminder.find({ userId: userObjId, status: "active" })
          .sort({ dueDate: 1 })
          .limit(20)
          .lean(),
      ]);

      return {
        accounts: accounts.map((a) => ({
          id: normalizeId(a._id),
          name: a.name,
          type: a.type,
          currency: a.currency,
          balance: decimalToNumber(a.balance),
        })),
        categories: categories.map((c) => ({
          id: normalizeId(c._id),
          name: c.name,
          type: c.type,
        })),
        recentTransactions: transactions.map((tx) => ({
          id: normalizeId(tx._id),
          type: tx.type,
          amount: decimalToNumber(tx.amount),
          currency: tx.currency,
          description: tx.description,
          accountId: normalizeId(tx.accountId),
          date: tx.date ? new Date(tx.date).toISOString() : null,
        })),
        reminders: reminders.map((r) => ({
          id: normalizeId(r._id),
          title: r.title,
          category: r.category,
          amount: decimalToNumber(r.amount),
          currency: r.currency,
          dueDate: r.dueDate ? new Date(r.dueDate).toISOString() : null,
        })),
      };
    },
  },
  {
    name: "create_transaction",
    description:
      "Record a personal income or expense transaction and atomically update the target account balance using Manageo's balance ledger engine.",
    mutability: "write",
    isFinance: true,
    parameters: {
      type: "object",
      properties: {
        accountId: { type: "string", description: "Target Account ID." },
        type: { type: "string", enum: ["income", "expense"] },
        amount: { type: "number", description: "Positive numeric amount." },
        description: { type: "string" },
        categoryId: { type: "string" },
        categoryName: { type: "string", description: "Optional category name (auto-matched or created)." },
        date: { type: "string", description: "Optional ISO date string." },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["accountId", "type", "amount", "description"],
    },
    schema: z.object({
      accountId: z.string().min(1),
      type: z.enum(["income", "expense"]),
      amount: z.number().positive(),
      description: z.string().trim().min(1).max(500),
      categoryId: z.string().optional(),
      categoryName: z.string().optional(),
      date: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
    execute: async (args, ctx) => {
      const userObjId = new mongoose.Types.ObjectId(ctx.userId);
      if (!isObjectId(String(args.accountId))) throw new Error("Invalid accountId");

      const amountNum = Number(args.amount);
      const txType = args.type as "income" | "expense";

      let resolvedCategoryId: mongoose.Types.ObjectId | undefined;
      if (args.categoryId && isObjectId(String(args.categoryId))) {
        const cat = await Category.findOne({ _id: args.categoryId, userId: userObjId });
        if (cat) resolvedCategoryId = cat._id;
      } else if (args.categoryName) {
        let cat = await Category.findOne({
          userId: userObjId,
          type: txType,
          name: { $regex: new RegExp(`^${String(args.categoryName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        });
        if (!cat) {
          cat = await Category.create({
            userId: userObjId,
            name: String(args.categoryName).trim(),
            type: txType,
          });
        }
        resolvedCategoryId = cat._id;
      }
      if (!resolvedCategoryId) {
        let fallbackCat = await Category.findOne({ userId: userObjId, type: txType });
        if (!fallbackCat) {
          fallbackCat = await Category.create({
            userId: userObjId,
            name: txType === "income" ? "General Income" : "General Expense",
            type: txType,
          });
        }
        resolvedCategoryId = fallbackCat._id;
      }

      const result = await executeInTransaction(async (dbSession) => {
        const account = await Account.findOne({ _id: args.accountId, userId: userObjId }).session(
          dbSession
        );
        if (!account) throw new Error("Account not found");

        const currentBalance = decimalToNumber(account.balance);
        const newBalance = calculateNewBalance(currentBalance, amountNum, txType);

        account.balance = mongoose.Types.Decimal128.fromString(newBalance.toString());
        await account.save({ session: dbSession ?? undefined });

        const [tx] = await Transaction.create(
          [
            {
              userId: userObjId,
              amount: mongoose.Types.Decimal128.fromString(amountNum.toString()),
              currency: account.currency,
              date: args.date ? new Date(String(args.date)) : new Date(),
              accountId: account._id,
              categoryId: resolvedCategoryId,
              description: String(args.description).trim(),
              type: txType,
              tags: Array.isArray(args.tags) ? args.tags : [],
            },
          ],
          { session: dbSession ?? undefined }
        );

        return {
          transaction: {
            id: normalizeId(tx._id),
            type: tx.type,
            amount: amountNum,
            currency: account.currency,
            description: tx.description,
            date: tx.date.toISOString(),
          },
          account: {
            id: normalizeId(account._id),
            name: account.name,
            previousBalance: currentBalance,
            newBalance,
          },
        };
      });

      return result;
    },
  },
  {
    name: "delete_transaction",
    description:
      "Soft-delete a financial transaction (moves to 7-day Trash) and reverse its effect on the account balance.",
    mutability: "delete",
    isFinance: true,
    parameters: {
      type: "object",
      properties: {
        transactionId: { type: "string" },
      },
      required: ["transactionId"],
    },
    schema: z.object({
      transactionId: z.string().min(1),
    }),
    execute: async (args, ctx) => {
      const userObjId = new mongoose.Types.ObjectId(ctx.userId);
      if (!isObjectId(String(args.transactionId))) throw new Error("Invalid transactionId");
      const tx = await Transaction.findOne({ _id: args.transactionId, userId: userObjId });
      if (!tx) throw new Error("Transaction not found");
      if (tx.type === "transfer") {
        throw new Error("Delete transfer transactions directly in Money UI to handle paired accounts");
      }

      const txAmount = decimalToNumber(tx.amount);
      const reverseType: "income" | "expense" = tx.type === "income" ? "expense" : "income";

      return executeInTransaction(async (dbSession) => {
        const account = await Account.findOne({ _id: tx.accountId, userId: userObjId }).session(
          dbSession
        );
        let newBalance = null;
        if (account) {
          const currentBalance = decimalToNumber(account.balance);
          newBalance = calculateNewBalance(currentBalance, txAmount, reverseType);
          account.balance = mongoose.Types.Decimal128.fromString(newBalance.toString());
          await account.save({ session: dbSession ?? undefined });
        }

        const now = new Date();
        const purgeAt = new Date(now.getTime() + SEVEN_DAYS_MS);
        const batchId = new mongoose.Types.ObjectId().toString();
        await Transaction.updateOne(
          { _id: tx._id },
          {
            $set: {
              isDeleted: true,
              deletedAt: now,
              purgeAt,
              deletedBy: userObjId,
              deletionBatchId: batchId,
            },
          },
          { session: dbSession ?? undefined }
        );

        await TrashItem.create(
          [
            {
              userId: userObjId,
              workspaceId: new mongoose.Types.ObjectId(ctx.workspaceId),
              entityType: "Transaction",
              entityId: tx._id,
              title: tx.description || "Transaction",
              module: "Finance",
              deletedAt: now,
              purgeAt,
              deletedBy: userObjId,
              deletionBatchId: batchId,
              status: "active",
              attachments: [],
              metadata: {
                amount: txAmount.toString(),
                type: tx.type,
                accountId: normalizeId(tx.accountId),
              },
            },
          ],
          { session: dbSession ?? undefined }
        );

        return {
          deletedId: normalizeId(tx._id),
          reversedAmount: txAmount,
          newAccountBalance: newBalance,
        };
      });
    },
  },
  {
    name: "create_financial_reminder",
    description: "Create a bill, subscription, or financial reminder for the authenticated user.",
    mutability: "write",
    isFinance: true,
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        category: {
          type: "string",
          enum: ["subscription", "utility", "loan", "credit_card", "rent", "insurance", "other"],
        },
        amount: { type: "number" },
        currency: { type: "string" },
        dueDate: { type: "string", description: "ISO 8601 date string." },
        recurrence: { type: "string", enum: ["none", "weekly", "monthly", "yearly"] },
        notes: { type: "string" },
      },
      required: ["title", "amount", "dueDate"],
    },
    schema: z.object({
      title: z.string().trim().min(1).max(200),
      category: z
        .enum(["subscription", "utility", "loan", "credit_card", "rent", "insurance", "other"])
        .optional(),
      amount: z.number().nonnegative(),
      currency: z.string().optional(),
      dueDate: z.string().min(1),
      recurrence: z.enum(["none", "weekly", "monthly", "yearly"]).optional(),
      notes: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const due = new Date(String(args.dueDate));
      const reminder = await FinancialReminder.create({
        userId: new mongoose.Types.ObjectId(ctx.userId),
        title: String(args.title).trim(),
        category: (args.category as string) || "other",
        amount: Number(args.amount),
        currency: (args.currency as string) || "USD",
        dueDate: due,
        nextDueDate: due,
        recurrence: (args.recurrence as string) || "none",
        notes: args.notes ? String(args.notes) : undefined,
        status: "active",
      });
      return {
        reminder: {
          id: normalizeId(reminder._id),
          title: reminder.title,
          amount: decimalToNumber(reminder.amount),
          currency: reminder.currency,
          dueDate: reminder.dueDate.toISOString(),
        },
      };
    },
  },

  // =========================================================================
  // 7. CUSTOM SECTIONS & RECORDS
  // =========================================================================
  {
    name: "list_custom_sections",
    description: "List user-defined custom databases (CustomSections) and optionally records inside a section.",
    mutability: "read",
    parameters: {
      type: "object",
      properties: {
        sectionId: { type: "string", description: "Optional CustomSection ID to include its records." },
        workspaceId: { type: "string" },
      },
    },
    schema: z.object({
      sectionId: z.string().optional(),
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "viewer");
      const sections = await CustomSection.find({ workspaceId: ws.workspaceId }).lean();
      let records: unknown[] = [];
      if (args.sectionId && isObjectId(String(args.sectionId))) {
        const docs = await CustomRecord.find({
          workspaceId: ws.workspaceId,
          sectionId: new mongoose.Types.ObjectId(String(args.sectionId)),
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        records = docs.map((r) => ({
          id: normalizeId(r._id),
          title: r.title,
          slug: r.slug,
          data: r.data instanceof Map ? Object.fromEntries(r.data.entries()) : r.data || {},
        }));
      }
      return {
        sections: sections.map((s) => ({
          id: normalizeId(s._id),
          name: s.name,
          slug: s.slug,
          layout: s.layout,
        })),
        records,
      };
    },
  },
  {
    name: "create_custom_record",
    description: "Create a new record inside an existing CustomSection.",
    mutability: "write",
    parameters: {
      type: "object",
      properties: {
        sectionId: { type: "string" },
        title: { type: "string" },
        data: { type: "object", additionalProperties: true },
        workspaceId: { type: "string" },
      },
      required: ["sectionId", "title"],
    },
    schema: z.object({
      sectionId: z.string().min(1),
      title: z.string().trim().min(1).max(200),
      data: z.record(z.string(), z.unknown()).optional(),
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "member");
      if (!isObjectId(String(args.sectionId))) throw new Error("Invalid sectionId");
      const section = await CustomSection.findOne({
        _id: args.sectionId,
        workspaceId: ws.workspaceId,
      }).lean();
      if (!section) throw new Error("CustomSection not found");

      const rec = await CustomRecord.create({
        sectionId: section._id,
        userId: new mongoose.Types.ObjectId(ctx.userId),
        workspaceId: ws.workspaceId,
        title: String(args.title).trim(),
        slug: makeSlug(String(args.title)),
        date: new Date(),
        data: args.data || {},
      });
      return {
        record: {
          id: normalizeId(rec._id),
          title: rec.title,
          slug: rec.slug,
          sectionId: normalizeId(section._id),
        },
      };
    },
  },

  // =========================================================================
  // 8. DOCUMENTS & TRASH
  // =========================================================================
  {
    name: "list_documents",
    description: "List metadata for uploaded Documents in the active workspace.",
    mutability: "read",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        limit: { type: "number" },
      },
    },
    schema: z.object({
      workspaceId: z.string().optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "viewer");
      const docs = await DocumentModel.find({ workspaceId: ws.workspaceId })
        .sort({ createdAt: -1 })
        .limit(Number(args.limit) || 30)
        .lean();
      return {
        documents: docs.map((d) => ({
          id: normalizeId(d._id),
          title: d.title,
          fileType: d.fileType,
          fileSize: d.fileSize,
          publicId: d.publicId,
          assetUrl: d.publicId ? `/api/assets/${d.publicId}` : d.fileUrl,
          createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
        })),
      };
    },
  },
  {
    name: "list_trash_items",
    description: "List soft-deleted items currently in the 7-day Trash bin.",
    mutability: "read",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
    },
    schema: z.object({
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "viewer");
      const items = await TrashItem.find({
        workspaceId: ws.workspaceId,
        status: "active",
      })
        .sort({ deletedAt: -1 })
        .limit(40)
        .lean();
      return {
        trashItems: items.map((i) => ({
          id: normalizeId(i._id),
          entityId: normalizeId(i.entityId),
          entityType: i.entityType,
          module: i.module,
          title: i.title,
          deletedAt: i.deletedAt ? new Date(i.deletedAt).toISOString() : null,
          purgeAt: i.purgeAt ? new Date(i.purgeAt).toISOString() : null,
        })),
      };
    },
  },
  {
    name: "search_workspace_knowledge",
    description:
      "Semantically search across tasks, notes, ideas, routines, custom records, and personal finance (excluding Vault) using Manageo's hybrid vector + BM25 RAG index.",
    mutability: "read",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language search query." },
        topK: { type: "number", description: "Max results (default 8, max 20)." },
        workspaceId: { type: "string" },
      },
      required: ["query"],
    },
    schema: z.object({
      query: z.string().trim().min(1).max(400),
      topK: z.number().int().min(1).max(20).optional(),
      workspaceId: z.string().optional(),
    }),
    execute: async (args, ctx) => {
      const ws = await resolveWorkspaceContext(ctx, args.workspaceId as string | undefined, "viewer");
      const includeFinance = ctx.allowedScopes?.finance !== false;
      const hits = await retrieveHybridContext({
        userId: ctx.userId,
        workspaceId: normalizeId(ws.workspaceId),
        query: String(args.query),
        topK: Number(args.topK) || 8,
        includeFinance,
      });
      return { hits };
    },
  },
];

export function findManageoTool(name: string): ManageoToolDefinition | undefined {
  return MANAGEO_TOOLS.find((t) => t.name === name);
}

export function getAllowedToolsForScopes(scopes?: Partial<IMcpKeyScopes>): ManageoToolDefinition[] {
  if (!scopes) return MANAGEO_TOOLS;
  return MANAGEO_TOOLS.filter((tool) => {
    const reqScope = getToolScopeRequirement(tool);
    if (scopes[reqScope] === false) return false;
    if (tool.isFinance && scopes.finance === false) return false;
    return true;
  });
}

export function toOpenAiFunctionTools(tools: ManageoToolDefinition[] = MANAGEO_TOOLS) {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: `${t.description} [Mutability: ${t.mutability}]`,
      parameters: t.parameters,
    },
  }));
}

export function toGeminiFunctionTools(tools: ManageoToolDefinition[] = MANAGEO_TOOLS) {
  return tools.map((t) => ({
    type: "function" as const,
    name: t.name,
    description: `${t.description} [Mutability: ${t.mutability}]`,
    parameters: t.parameters,
  }));
}

export function toLiveFunctionDeclarations(tools: ManageoToolDefinition[] = MANAGEO_TOOLS) {
  return tools.map((t) => ({
    name: t.name,
    description: `${t.description} [Mutability: ${t.mutability}]`,
    parametersJsonSchema: t.parameters,
  }));
}

export function toMcpToolsList(scopes?: Partial<IMcpKeyScopes>) {
  return getAllowedToolsForScopes(scopes).map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.parameters,
    annotations: {
      readOnlyHint: t.mutability === "read",
      destructiveHint: t.mutability === "delete",
      idempotentHint: t.mutability === "read",
    },
  }));
}

export async function executeManageoTool(
  toolName: string,
  rawArgs: unknown,
  ctx: ToolExecutionContext
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const tool = findManageoTool(toolName);
  if (!tool) {
    return { ok: false, error: `Unknown tool: ${toolName}` };
  }

  if (ctx.allowedScopes) {
    const reqScope = getToolScopeRequirement(tool);
    if (ctx.allowedScopes[reqScope] === false) {
      return { ok: false, error: `API key lacks '${reqScope}' scope required for ${toolName}` };
    }
    if (tool.isFinance && ctx.allowedScopes.finance === false) {
      return { ok: false, error: `API key lacks 'finance' scope required for ${toolName}` };
    }
  }

  const parsed = tool.schema.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      error: `Invalid arguments for ${toolName}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    };
  }

  try {
    await dbConnect();
    const data = await tool.execute(parsed.data as Record<string, unknown>, ctx);
    if (tool.mutability !== "read") {
      const targetWs =
        typeof (parsed.data as Record<string, unknown>)?.workspaceId === "string"
          ? String((parsed.data as Record<string, unknown>).workspaceId)
          : ctx.workspaceId;
      invalidateKnowledgeCache(ctx.userId, targetWs);
    }
    return { ok: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Tool execution failed";
    return { ok: false, error: message };
  }
}
