"use server";

import dbConnect from "@/lib/db";
import Document from "@/models/Document";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PLAN_LIMITS, PlanType } from "@/config/plans";
import mongoose from "mongoose";
import { formatBytes } from "@/lib/formatBytes";

const createDocumentSchema = z.object({
  title: z.string().min(1, "Document title is required").max(300),
  category: z.enum(['General', 'Finance', 'Legal', 'Work', 'Personal', 'Medical', 'Other']).default('General'),
  fileUrl: z.string().min(1, "File URL is required"),
  publicId: z.string().optional(),
  resourceType: z.string().optional(),
  originalFilename: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().nonnegative().default(0),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().max(3000).optional(),
  tags: z.array(z.string()).default([]),
});

export interface StorageUsageResult {
  success: boolean;
  usedBytes: number;
  maxBytes: number;
  usedFormatted: string;
  maxFormatted: string;
  percentUsed: number;
  planName: string;
  planType: PlanType;
  totalDocuments: number;
  error?: string;
}

/**
 * Returns storage usage and limits based on user's active subscription tier (Free: 100MB, Pro: 5GB, Enterprise: 50GB)
 */
export async function getStorageUsage(): Promise<StorageUsageResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return {
        success: false,
        usedBytes: 0,
        maxBytes: PLAN_LIMITS.free.maxStorageBytes,
        usedFormatted: "0 B",
        maxFormatted: formatBytes(PLAN_LIMITS.free.maxStorageBytes),
        percentUsed: 0,
        planName: "Starter",
        planType: "free",
        totalDocuments: 0,
        error: "Unauthorized",
      };
    }

    await dbConnect();
    const userId = session.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const user = await User.findById(userId).select("subscription").lean();
    const planType: PlanType = (user?.subscription?.plan as PlanType) || "free";
    const plan = PLAN_LIMITS[planType] || PLAN_LIMITS.free;
    const maxBytes = plan.maxStorageBytes;

    const [aggResult, count] = await Promise.all([
      Document.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, totalSize: { $sum: "$sizeBytes" } } },
      ]),
      Document.countDocuments({ userId: userObjectId }),
    ]);

    const usedBytes = aggResult[0]?.totalSize || 0;
    const percentUsed = maxBytes > 0 ? Math.min(100, Math.round((usedBytes / maxBytes) * 1000) / 10) : 0;

    return {
      success: true,
      usedBytes,
      maxBytes,
      usedFormatted: formatBytes(usedBytes),
      maxFormatted: formatBytes(maxBytes),
      percentUsed,
      planName: plan.name,
      planType,
      totalDocuments: count,
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error calculating storage usage:", error);
    return {
      success: false,
      usedBytes: 0,
      maxBytes: PLAN_LIMITS.free.maxStorageBytes,
      usedFormatted: "0 B",
      maxFormatted: formatBytes(PLAN_LIMITS.free.maxStorageBytes),
      percentUsed: 0,
      planName: "Starter",
      planType: "free",
      totalDocuments: 0,
      error: err.message || "Failed to calculate storage",
    };
  }
}

/**
 * Fetch documents for the authenticated user with optional category & search filter
 */
export async function getDocuments(filter?: { category?: string; search?: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized", documents: [] };
    }

    await dbConnect();
    const userId = session.user.id;

    const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };

    if (filter?.category && filter.category !== "All") {
      query.category = filter.category;
    }

    if (filter?.search && filter.search.trim()) {
      const s = filter.search.trim();
      const regex = new RegExp(s, "i");
      query.$or = [
        { title: regex },
        { originalFilename: regex },
        { notes: regex },
        { tags: regex },
      ];
    }

    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .lean();

    interface LeanDoc {
      _id: { toString(): string };
      userId: { toString(): string };
      workspaceId?: { toString(): string } | null;
      title: string;
      category: "General" | "Finance" | "Legal" | "Work" | "Personal" | "Medical" | "Other";
      fileUrl: string;
      publicId?: string;
      resourceType?: string;
      originalFilename?: string;
      mimeType?: string;
      notes?: string;
      tags?: string[];
      createdAt?: Date;
      updatedAt?: Date;
      expiryDate?: Date | null;
      sizeBytes: number;
    }
    const serialized = (documents as unknown as LeanDoc[]).map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
      userId: doc.userId.toString(),
      workspaceId: doc.workspaceId?.toString() || null,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
      expiryDate: doc.expiryDate ? doc.expiryDate.toISOString() : null,
      sizeFormatted: formatBytes(doc.sizeBytes),
    }));

    return { success: true, documents: serialized };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error fetching documents:", error);
    return { success: false, error: err.message || "Failed to fetch documents", documents: [] };
  }
}

/**
 * Create a new Document record with storage quota check
 */
export async function createDocument(data: z.infer<typeof createDocumentSchema>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    const userId = session.user.id;

    const validated = createDocumentSchema.parse(data);

    // Verify storage limit before saving
    const usage = await getStorageUsage();
    if (usage.success && (usage.usedBytes + validated.sizeBytes > usage.maxBytes)) {
      return {
        success: false,
        error: `Cloud storage limit reached (${usage.maxFormatted}). Upgrade to Professional for 5 GB storage.`,
        limitExceeded: true,
      };
    }

    const newDoc = await Document.create({
      userId: new mongoose.Types.ObjectId(userId),
      title: validated.title,
      category: validated.category,
      fileUrl: validated.fileUrl,
      publicId: validated.publicId,
      resourceType: validated.resourceType || "auto",
      originalFilename: validated.originalFilename || validated.title,
      mimeType: validated.mimeType || "application/octet-stream",
      sizeBytes: validated.sizeBytes,
      expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : undefined,
      notes: validated.notes,
      tags: validated.tags || [],
    });

    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard");

    return {
      success: true,
      document: {
        ...newDoc.toObject(),
        _id: newDoc._id.toString(),
        userId: newDoc.userId.toString(),
        sizeFormatted: formatBytes(newDoc.sizeBytes),
      },
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error creating document:", error);
    return { success: false, error: err.message || "Failed to create document" };
  }
}

/**
 * Delete a document and purge file from Cloudinary
 */
export async function deleteDocument(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    const userId = session.user.id;

    const doc = await Document.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    const { moveToTrash } = await import("@/actions/trash.actions");
    await moveToTrash("Document", id);

    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error deleting document:", error);
    return { success: false, error: err.message || "Failed to delete document" };
  }
}

/**
 * Update document details (title, category, expiryDate, notes, tags)
 */
export async function updateDocument(
  id: string,
  updates: {
    title?: string;
    category?: 'General' | 'Finance' | 'Legal' | 'Work' | 'Personal' | 'Medical' | 'Other';
    expiryDate?: string | null;
    notes?: string;
    tags?: string[];
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    const userId = session.user.id;

    const doc = await Document.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    if (updates.title) doc.title = updates.title;
    if (updates.category) doc.category = updates.category;
    if (updates.notes !== undefined) doc.notes = updates.notes;
    if (updates.tags !== undefined) doc.tags = updates.tags;
    if (updates.expiryDate !== undefined) {
      doc.expiryDate = updates.expiryDate ? new Date(updates.expiryDate) : undefined;
    }

    await doc.save();

    revalidatePath("/dashboard/documents");

    return {
      success: true,
      document: {
        ...doc.toObject(),
        _id: doc._id.toString(),
        userId: doc.userId.toString(),
      },
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error updating document:", error);
    return { success: false, error: err.message || "Failed to update document" };
  }
}
