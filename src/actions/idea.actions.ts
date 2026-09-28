"use server";

import dbConnect from "@/lib/db";
import Idea from "@/models/Idea";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

    await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const idea = await Idea.create({
      ...data,
      userId,
    });

    revalidatePath("/dashboard/ideas");
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
