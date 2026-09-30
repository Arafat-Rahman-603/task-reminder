"use server";

import dbConnect from "@/lib/db";
import Idea from "@/models/Idea";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createIdeaSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional(),
  status: z.enum(["Inbox", "Exploring", "Planned", "In Progress", "Archived"]).optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
});

export async function createIdea(data: {
  title: string;
  description?: string;
  content?: string;
  priority?: "Low" | "Medium" | "High";
  status?: string;
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

    const idea = await Idea.create({
      ...validated,
      userId,
      status: validated.status || "Inbox",
    });

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { userId };
    
    if (filters?.status) {
      query.status = filters.status;
    }

    const ideas = await Idea.find(query).sort({ createdAt: -1 }).lean();

    return { ideas: JSON.parse(JSON.stringify(ideas)) };
  } catch (error) {
    return { ideas: [] };
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
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const idea = await Idea.findOneAndUpdate(
      { _id: ideaId, userId },
      data,
      { returnDocument: 'after' }
    );

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

    revalidatePath("/dashboard/ideas");
    revalidatePath("/dashboard");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
