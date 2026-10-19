import { NextResponse } from "next/server";
import { getSignedUrl } from "@/actions/cloudinary.actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Task from "@/models/Task";
import Note from "@/models/Note";
import Idea from "@/models/Idea";
import Transaction from "@/models/Transaction";
import VaultItem from "@/models/VaultItem";
import Invoice from "@/models/Invoice";
import Document from "@/models/Document";
import CustomRecord from "@/models/custom/CustomRecord";
import WorkspaceMembership from "@/models/WorkspaceMembership";
import { verifyWorkspaceAccess } from "@/lib/workspace";
import mongoose from "mongoose";

export async function GET(request: Request, context: { params: Promise<{ publicId: string[] }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const resourceType = searchParams.get('resourceType') || 'image';
  const resolvedParams = await context.params;
  const publicId = resolvedParams.publicId.join("/");

  if (!publicId) {
    return new NextResponse("Missing publicId", { status: 400 });
  }

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;
  let isAuthorized = false;

  // 1. Avatars (Readable by any authenticated user)
  if (await User.exists({ avatarPublicId: publicId })) isAuthorized = true;

  // 2. Personal Vault, Finance & Cloud Documents
  if (!isAuthorized && await VaultItem.exists({ $or: [{ imageId: publicId }, { "attachments.publicId": publicId }], userId })) isAuthorized = true;
  if (!isAuthorized && await Transaction.exists({ $or: [{ receiptPublicId: publicId }, { "attachments.publicId": publicId }], userId })) isAuthorized = true;
  if (!isAuthorized && await Invoice.exists({ pdfPublicId: publicId, userId })) isAuthorized = true;
  if (!isAuthorized && await Document.exists({ publicId, userId })) isAuthorized = true;

  // 3. Workspace-scoped Models (Tasks, Notes, Ideas)
  if (!isAuthorized) {
    for (const model of [Task, Note, Idea]) {
      const record = await model.findOne({ "attachments.publicId": publicId }).select("workspaceId userId").lean();
      if (record) {
        if (record.userId && record.userId.toString() === userId.toString()) {
          isAuthorized = true;
          break;
        }
        if (record.workspaceId) {
          try {
            await verifyWorkspaceAccess(record.workspaceId.toString(), "viewer");
            isAuthorized = true;
            break;
          } catch { /* ignore */ }
        }
      }
    }
  }

  // 4. Custom Records (Check if publicId is within the user's accessible CustomRecords)
  if (!isAuthorized) {
    const memberships = await WorkspaceMembership.find({ userId }).select("workspaceId").lean();
    const workspaceIds = memberships.map((m: any) => m.workspaceId);
    const customRecords = await CustomRecord.find({ workspaceId: { $in: workspaceIds } }).select("data").lean();
    for (const cr of customRecords) {
      if (JSON.stringify(cr.data).includes(publicId)) {
        isAuthorized = true;
        break;
      }
    }
  }

  // 5. Authenticated access for active drafts / uploads in notes, tasks, ideas, or general folders
  if (!isAuthorized) {
    const allowedDraftFolders = [
      "manageo/notes",
      "manageo/tasks",
      "manageo/ideas",
      "manageo/general",
      "manageo/avatars",
      "manageo/documents"
    ];
    if (allowedDraftFolders.some(folder => publicId.startsWith(folder))) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return new NextResponse("Forbidden: You do not have permission to access this asset.", { status: 403 });
  }

  const result = await getSignedUrl(publicId, resourceType);
  if (!result.success || !result.url) {
    return new NextResponse(result.error || "Failed to generate signed URL", { status: 500 });
  }

  return NextResponse.redirect(result.url);
}
