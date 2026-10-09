"use server";

import dbConnect from "@/lib/db";
import NoteGroup from "@/models/NoteGroup";
import Note from "@/models/Note";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { deleteAttachments } from "./cloudinary.actions";

// --- Groups ---

export async function getNoteGroups() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { groups: [] };

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return { groups: [] };

    const groups = await NoteGroup.find({ workspaceId: activeWorkspace._id }).sort({ createdAt: -1 }).lean();
    
    // Get note counts
    const counts = await Note.aggregate([
      { $match: { userId: new (require('mongoose').Types.ObjectId)(userId) } },
      { $group: { _id: "$groupId", count: { $sum: 1 } } }
    ]);
    
    const countMap = new Map(counts.map(c => [c._id.toString(), c.count]));
    
    const groupsWithCounts = groups.map(g => ({
      ...g,
      noteCount: countMap.get(g._id.toString()) || 0
    }));

    return { groups: JSON.parse(JSON.stringify(groupsWithCounts)) };
  } catch (error) {
    return { groups: [] };
  }
}

export async function getNoteGroup(slug: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { group: null };

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return { group: null };

    const group = await NoteGroup.findOne({ workspaceId: activeWorkspace._id, slug }).lean();
    return { group: JSON.parse(JSON.stringify(group)) };
  } catch (error) {
    return { group: null };
  }
}

export async function createNoteGroup(data: { name: string; description?: string; icon?: string }) {
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

    let baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled';
    let slug = baseSlug;
    let counter = 1;
    while (await NoteGroup.findOne({ workspaceId: activeWorkspace._id, slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const group = await NoteGroup.create({ ...data, slug, userId, workspaceId: activeWorkspace._id });
    revalidatePath("/dashboard/notes");
    return { success: true, group: JSON.parse(JSON.stringify(group)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateNoteGroup(groupId: string, data: { name?: string; description?: string; icon?: string }) {
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

    const group = await NoteGroup.findOneAndUpdate(
      { _id: groupId, workspaceId: activeWorkspace._id },
      { $set: data },
      { returnDocument: 'after' }
    );
    if (!group) throw new Error("Not found");
    revalidatePath("/dashboard/notes");
    return { success: true, group: JSON.parse(JSON.stringify(group)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteNoteGroup(groupId: string) {
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

    const group = await NoteGroup.findOneAndDelete({ _id: groupId, workspaceId: activeWorkspace._id });
    if (!group) throw new Error("Not found");

    await Note.deleteMany({ groupId, workspaceId: activeWorkspace._id });

    revalidatePath("/dashboard/notes");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Notes ---

export async function getNotes(groupId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { notes: [] };

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return { notes: [] };

    const notes = await Note.find({ groupId, workspaceId: activeWorkspace._id }).sort({ createdAt: -1 }).lean();
    return { notes: JSON.parse(JSON.stringify(notes)) };
  } catch (error) {
    return { notes: [] };
  }
}

export async function getNote(groupId: string, slug: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { note: null };

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return { note: null };

    const note = await Note.findOne({ groupId, slug, workspaceId: activeWorkspace._id }).lean();
    return { note: JSON.parse(JSON.stringify(note)) };
  } catch (error) {
    return { note: null };
  }
}

export async function createNote(groupId: string, data: { title: string; date?: string; content?: string; customFields?: any[]; attachments?: { url: string; publicId: string; resourceType?: string; originalFilename?: string; }[] }) {
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

    const group = await NoteGroup.findOne({ _id: groupId, workspaceId: activeWorkspace._id });
    if (!group) throw new Error("Unauthorized or Group not found");

    let baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled';
    let slug = baseSlug;
    let counter = 1;
    while (await Note.findOne({ groupId, workspaceId: activeWorkspace._id, slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const note = await Note.create({
      ...data,
      slug,
      groupId,
      userId,
      workspaceId: activeWorkspace._id
    });

    revalidatePath(`/dashboard/notes/${group.slug}`);
    return { success: true, note: JSON.parse(JSON.stringify(note)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateNote(noteId: string, data: { title?: string; date?: string; content?: string; customFields?: any[]; attachments?: { url: string; publicId: string; resourceType?: string; originalFilename?: string; }[] }) {
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

    const oldNote = await Note.findOne({ _id: noteId, workspaceId: activeWorkspace._id });

    const note = await Note.findOneAndUpdate(
      { _id: noteId, workspaceId: activeWorkspace._id },
      { $set: data },
      { returnDocument: 'after' }
    ).populate('groupId');

    if (!note) throw new Error("Record not found or unauthorized");

    if (oldNote && note && oldNote.attachments) {
      const newAttIds = new Set(note.attachments?.map((a: any) => a.publicId) || []);
      const removedAtts = oldNote.attachments.filter((a: any) => !newAttIds.has(a.publicId));
      if (removedAtts.length > 0) deleteAttachments(removedAtts).catch(console.error);
    }

    revalidatePath(`/dashboard/notes`);
    return { success: true, note: JSON.parse(JSON.stringify(note)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteNote(noteId: string) {
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

    const note = await Note.findOneAndDelete({ _id: noteId, workspaceId: activeWorkspace._id });
    if (!note) throw new Error("Record not found or unauthorized");

    if (note.attachments?.length > 0) {
      deleteAttachments(note.attachments).catch(console.error);
    }

    revalidatePath(`/dashboard/notes`);
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


