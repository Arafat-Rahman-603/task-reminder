"use server";

import dbConnect from "@/lib/db";
import Idea from "@/models/Idea";
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

    // Generate unique slug
    let baseSlug = validated.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = 'idea';
    let slug = baseSlug;
    let counter = 1;
    while (await Idea.findOne({ userId, slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const idea = await Idea.create({
      ...validated,
      userId,
      slug,
      status: validated.status || "Inbox",
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

    let query: any = { userId };
    
    // If filters are provided, translate them securely using the filterTranslator
    if (filters && Object.keys(filters).length > 0) {
      const { ideaFilterFromDashboardFilters } = await import('@/lib/filterTranslators');
      query = ideaFilterFromDashboardFilters(userId, filters);
    }

    const ideas = await Idea.find(query).sort({ createdAt: -1 }).lean();

    return { ideas: JSON.parse(JSON.stringify(ideas)) };
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

    const idea: any = await Idea.findOne({ userId, slug }).lean();
    if (!idea) return null;

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

    await Idea.findOneAndUpdate({ _id: ideaId, userId }, { status });
    
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
  attachments?: { url: string; publicId: string; resourceType?: string; originalFilename?: string; }[];
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const oldIdea = await Idea.findOne({ _id: ideaId, userId });

    const idea = await Idea.findOneAndUpdate(
      { _id: ideaId, userId },
      data,
      { returnDocument: 'after' }
    );

    if (oldIdea && idea && oldIdea.attachments) {
      const newAttIds = new Set(idea.attachments?.map((a: any) => a.publicId) || []);
      const removedAtts = oldIdea.attachments.filter((a: any) => !newAttIds.has(a.publicId));
      if (removedAtts.length > 0) deleteAttachments(removedAtts).catch(console.error);
    }

    if (!idea) throw new Error("Idea not found or access denied");

    revalidatePath("/dashboard/ideas");
    return { success: true, idea: JSON.parse(JSON.stringify(idea)) };
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

    const idea = await Idea.findOneAndDelete({ _id: ideaId, userId });
    if (!idea) throw new Error("Idea not found or access denied");

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
