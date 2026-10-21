"use server";

import dbConnect from "@/lib/db";
import Idea from "@/models/Idea";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import { canUserViewItem, canUserEditItem, canUserManageItemPermissions, buildVisibilityMongoFilter } from "@/lib/itemPermissions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { deleteAttachments } from "./cloudinary.actions";
import { z } from "zod";
import Reminder from "@/models/Reminder";

const createIdeaSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional(),
  status: z.enum(["Inbox", "Exploring", "Planned", "In Progress", "Archived"]).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  visibility: z.enum(["workspace", "private", "restricted"]).optional(),
  visibleToMembers: z.array(z.string()).optional(),
  editableBy: z.enum(["workspace", "creator_only", "restricted"]).optional(),
  editableByMembers: z.array(z.string()).optional(),
  attachments: z.array(z.object({
    url: z.string(),
    publicId: z.string(),
    resourceType: z.string().optional(),
    originalFilename: z.string().optional()
  })).optional(),
});

export async function createIdea(data: {
  title: string;
  description?: string;
  content?: string;
  priority?: "Low" | "Medium" | "High";
  status?: string;
  visibility?: "workspace" | "private" | "restricted";
  visibleToMembers?: string[];
  editableBy?: "workspace" | "creator_only" | "restricted";
  editableByMembers?: string[];
  attachments?: { url: string; publicId: string; resourceType?: string; originalFilename?: string; }[];
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    const validated = createIdeaSchema.parse(data);

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    // Get active workspace
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const membership = await WorkspaceMembership.findOne({
      workspaceId: activeWorkspace._id,
      userId,
      status: { $ne: "suspended" },
    });
    if (membership && membership.role === "viewer") {
      throw new Error("Viewers cannot create ideas");
    }

    // Generate unique slug scoped to workspace
    let baseSlug = validated.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = 'idea';
    let slug = baseSlug;
    let counter = 1;
    while (await Idea.findOne({ workspaceId: activeWorkspace._id, slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const idea = await Idea.create({
      ...validated,
      userId,
      workspaceId: activeWorkspace._id,
      slug,
      status: validated.status || "Inbox",
      visibility: validated.visibility || "workspace",
      visibleToMembers: validated.visibleToMembers || [],
      editableBy: validated.editableBy || "workspace",
      editableByMembers: validated.editableByMembers || [],
    });

    const today = new Date();
    const eod = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 50, 0);
    if (today.getTime() < eod.getTime()) {
      const existing = await Reminder.findOne({
        userId,
        entityType: 'Idea',
        'metadata.isDailySummary': true,
        remindAt: eod
      });
      if (!existing) {
        await Reminder.create({
          userId,
          entityType: 'Idea',
          entityId: idea._id,
          remindAt: eod,
          notificationType: 'push',
          metadata: { isDailySummary: true }
        });
      }
    }

    revalidatePath("/dashboard/ideas");
    revalidatePath("/dashboard");
    return { success: true, idea: JSON.parse(JSON.stringify(idea)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create idea" };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getIdeas(filters?: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { ideas: [] };

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return { ideas: [] };

    const membership = await WorkspaceMembership.findOne({
      workspaceId: activeWorkspace._id,
      userId,
      status: { $ne: "suspended" },
    });
    const userRole = activeWorkspace.role || membership?.role || "member";

    const visibilityFilter = buildVisibilityMongoFilter(userId, userRole);

    let query: any = { workspaceId: activeWorkspace._id, ...visibilityFilter };
    
    // If filters are provided, translate them securely using the filterTranslator
    if (filters && Object.keys(filters).length > 0) {
      const { ideaFilterFromDashboardFilters } = await import('@/lib/filterTranslators');
      query = { ...ideaFilterFromDashboardFilters(userId, filters), workspaceId: activeWorkspace._id, ...visibilityFilter };
      delete query.userId;
    }

    const ideas = await Idea.find(query).sort({ createdAt: -1 }).lean();

    const formatted = ideas.map((item: any) => ({
      ...item,
      canEdit: canUserEditItem({ item, userId, userRole }),
      canManagePermissions: canUserManageItemPermissions({ item, userId, userRole }),
    }));

    return { ideas: JSON.parse(JSON.stringify(formatted)) };
  } catch (error) {
    return { ideas: [] };
  }
}

export async function getIdeaBySlug(slug: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return null;

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return null;

    const membership = await WorkspaceMembership.findOne({
      workspaceId: activeWorkspace._id,
      userId,
      status: { $ne: "suspended" },
    });
    const userRole = activeWorkspace.role || membership?.role || "member";

    const idea: any = await Idea.findOne({ workspaceId: activeWorkspace._id, slug }).lean();
    if (!idea) return null;

    const canView = canUserViewItem({ item: idea, userId, userRole });
    if (!canView) return null;

    idea.canEdit = canUserEditItem({ item: idea, userId, userRole });
    idea.canManagePermissions = canUserManageItemPermissions({ item: idea, userId, userRole });

    return JSON.parse(JSON.stringify(idea));
  } catch (error) {
    return null;
  }
}

export async function updateIdeaStatus(ideaId: string, status: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const membership = await WorkspaceMembership.findOne({
      workspaceId: activeWorkspace._id,
      userId,
      status: { $ne: "suspended" },
    });
    const userRole = activeWorkspace.role || membership?.role || "member";

    const idea = await Idea.findOne({ _id: ideaId, workspaceId: activeWorkspace._id });
    if (!idea) throw new Error("Idea not found");

    if (!canUserEditItem({ item: idea, userId, userRole })) {
      throw new Error("Permission denied: You do not have permission to edit this idea");
    }

    idea.status = status;
    await idea.save();
    
    revalidatePath("/dashboard/ideas");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateIdea(ideaId: string, data: {
  title?: string;
  description?: string;
  status?: string;
  priority?: "Low" | "Medium" | "High";
  visibility?: 'workspace' | 'private' | 'restricted';
  visibleToMembers?: string[];
  editableBy?: 'workspace' | 'creator_only' | 'restricted';
  editableByMembers?: string[];
  attachments?: { url: string; publicId: string; resourceType?: string; originalFilename?: string; }[];
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const membership = await WorkspaceMembership.findOne({
      workspaceId: activeWorkspace._id,
      userId,
      status: { $ne: "suspended" },
    });
    const userRole = activeWorkspace.role || membership?.role || "member";

    const oldIdea = await Idea.findOne({ _id: ideaId, workspaceId: activeWorkspace._id });
    if (!oldIdea) throw new Error("Idea not found or access denied");

    if (!canUserEditItem({ item: oldIdea, userId, userRole })) {
      throw new Error("Permission denied: You do not have permission to edit this idea");
    }

    const canManagePermissions = canUserManageItemPermissions({ item: oldIdea, userId, userRole });
    const updateData: any = { ...data };
    if (!canManagePermissions) {
      delete updateData.visibility;
      delete updateData.visibleToMembers;
      delete updateData.editableBy;
      delete updateData.editableByMembers;
    }

    const idea = await Idea.findOneAndUpdate(
      { _id: ideaId, workspaceId: activeWorkspace._id },
      updateData,
      { returnDocument: 'after' }
    );

    if (oldIdea && idea && oldIdea.attachments) {
      const newAttIds = new Set(idea.attachments?.map((a: any) => a.publicId) || []);
      const removedAtts = oldIdea.attachments.filter((a: any) => !newAttIds.has(a.publicId));
      if (removedAtts.length > 0) deleteAttachments(removedAtts).catch(console.error);
    }

    if (!idea) throw new Error("Idea not found or access denied");

    revalidatePath("/dashboard/ideas");
    return {
      success: true,
      idea: JSON.parse(
        JSON.stringify({
          ...idea.toObject(),
          canEdit: true,
          canManagePermissions,
        })
      ),
    };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteIdea(ideaId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const membership = await WorkspaceMembership.findOne({
      workspaceId: activeWorkspace._id,
      userId,
      status: { $ne: "suspended" },
    });
    const userRole = activeWorkspace.role || membership?.role || "member";

    const idea = await Idea.findOne({ _id: ideaId, workspaceId: activeWorkspace._id });
    if (!idea) throw new Error("Idea not found or access denied");

    if (!canUserEditItem({ item: idea, userId, userRole })) {
      throw new Error("Permission denied: You do not have permission to delete this idea");
    }

    await Idea.deleteOne({ _id: ideaId, workspaceId: activeWorkspace._id });

    if (idea.attachments?.length > 0) {
      deleteAttachments(idea.attachments).catch(console.error);
    }

    revalidatePath("/dashboard/ideas");
    revalidatePath("/dashboard");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
