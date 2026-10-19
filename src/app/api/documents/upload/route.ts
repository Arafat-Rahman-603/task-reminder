import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Document from "@/models/Document";
import User from "@/models/User";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { PLAN_LIMITS, PlanType } from "@/config/plans";
import { formatBytes } from "@/lib/formatBytes";
import { getActiveWorkspaceInfo } from "@/actions/workspace.actions";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "1234567890",
  api_secret: process.env.CLOUDINARY_API_SECRET || "dummy_secret",
  secure: true,
  analytics: false,
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = (session.user as any).id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // 1. Quota & Limits Verification
    const user = await User.findById(userId).select("subscription").lean();
    const planType: PlanType = (user?.subscription?.plan as PlanType) || "free";
    const plan = PLAN_LIMITS[planType] || PLAN_LIMITS.free;
    const maxBytes = plan.maxStorageBytes;

    const aggResult = await Document.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, totalSize: { $sum: "$sizeBytes" } } },
    ]);
    const currentUsedBytes = aggResult[0]?.totalSize || 0;

    if (currentUsedBytes + file.size > maxBytes) {
      return NextResponse.json(
        {
          success: false,
          error: `Storage quota exceeded. You have ${formatBytes(
            Math.max(0, maxBytes - currentUsedBytes)
          )} remaining. Please upgrade for more storage.`,
        },
        { status: 403 }
      );
    }

    // 2. Stream Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<{
      url: string;
      publicId: string;
      resourceType: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "manageo/documents",
          resource_type: "auto",
          use_filename: true,
          unique_filename: true,
          type: "authenticated",
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Cloudinary upload failed"));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              resourceType: result.resource_type,
            });
          }
        }
      );
      uploadStream.end(buffer);
    });

    // 3. Extract Metadata
    const title = (formData.get("title") as string)?.trim() || file.name;
    const category = (formData.get("category") as string) || "General";
    const notes = (formData.get("notes") as string)?.trim() || undefined;
    const expiryDate = (formData.get("expiryDate") as string) || null;
    const tagsRaw = (formData.get("tags") as string) || "";
    const tags = tagsRaw
      ? tagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // Tenancy workspace info
    let workspaceId: string | null = null;
    try {
      const wsInfo = await getActiveWorkspaceInfo();
      if (wsInfo?.activeWorkspace?._id) {
        workspaceId = wsInfo.activeWorkspace._id.toString();
      }
    } catch {
      // fallback to personal null
    }

    // 4. Save to MongoDB
    const doc = await Document.create({
      userId: userObjectId,
      workspaceId: workspaceId ? new mongoose.Types.ObjectId(workspaceId) : null,
      title,
      category,
      fileUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      resourceType: uploadResult.resourceType,
      originalFilename: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      notes,
      tags,
    });

    const serializedDoc = {
      _id: doc._id.toString(),
      userId: doc.userId.toString(),
      workspaceId: doc.workspaceId ? doc.workspaceId.toString() : null,
      title: doc.title,
      category: doc.category,
      fileUrl: doc.fileUrl,
      publicId: doc.publicId,
      resourceType: doc.resourceType,
      originalFilename: doc.originalFilename,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      sizeFormatted: formatBytes(doc.sizeBytes),
      expiryDate: doc.expiryDate ? doc.expiryDate.toISOString() : null,
      notes: doc.notes,
      tags: doc.tags,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, document: serializedDoc });
  } catch (err: any) {
    console.error("Document upload API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to upload document" },
      { status: 500 }
    );
  }
}
