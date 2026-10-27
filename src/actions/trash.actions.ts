"use server";

import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import TrashItem, { ITrashItem, TrashEntityType } from "@/models/TrashItem";
import Task from "@/models/Task";
import Note from "@/models/Note";
import NoteGroup from "@/models/NoteGroup";
import Routine from "@/models/Routine";
import Idea from "@/models/Idea";
import Document from "@/models/Document";
import CustomSection from "@/models/custom/CustomSection";
import CustomRecord from "@/models/custom/CustomRecord";
import DashboardBlock from "@/models/custom/DashboardBlock";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import Debt from "@/models/Debt";
import Investment from "@/models/Investment";
import FinancialReminder from "@/models/FinancialReminder";
import VaultItem from "@/models/VaultItem";
import CalendarEvent from "@/models/CalendarEvent";
import Project from "@/models/Project";
import Habit from "@/models/Habit";
import Invoice from "@/models/Invoice";
import TaskComment from "@/models/TaskComment";
import SupportTicket from "@/models/SupportTicket";
import { calculateNewBalance } from "@/lib/finance";
import { executeInTransaction } from "@/lib/db-transaction";
export { executeInTransaction };
import { deleteAttachments } from "./cloudinary.actions";
import { systemDeleteAttachments } from "@/lib/cloudinary-internal";

export interface TrashItemRecord {
  _id: string;
  entityId: string;
  title: string;
  module: string;
  entityType: string;
  deletedAt: string;
  purgeAt: string;
  daysRemaining: number;
  hoursRemaining: number;
  expiresLabel: string;
  attachments?: unknown[];
  userId?: string;
  workspaceId?: string;
  status?: string;
  deletionBatchId?: string;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getModelForEntityType(entityType: TrashEntityType): mongoose.Model<any> {
  switch (entityType) {
    case "Task": return Task;
    case "Project": return Project;
    case "Routine": return Routine;
    case "Habit": return Habit;
    case "Note": return Note;
    case "NoteGroup": return NoteGroup;
    case "Idea": return Idea;
    case "Document": return Document;
    case "CustomSection": return CustomSection;
    case "CustomRecord": return CustomRecord;
    case "DashboardBlock": return DashboardBlock;
    case "Transaction": return Transaction;
    case "Account": return Account;
    case "Debt": return Debt;
    case "Investment": return Investment;
    case "FinancialReminder": return FinancialReminder;
    case "Invoice": return Invoice;
    case "VaultItem": return VaultItem;
    case "CalendarEvent": return CalendarEvent;
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }
}



/**
 * Check whether a Cloudinary asset (by publicId) is actively referenced
 * by any other model across all 9 asset-bearing collections:
 * Document, Task, TaskComment, Note, Idea, Transaction, VaultItem, SupportTicket, CustomRecord.
 */
export async function isAssetReferencedAcrossModels(
  publicId: string,
  excludeEntityId?: mongoose.Types.ObjectId | string
): Promise<boolean> {
  if (!publicId) return false;

  const excludeId = excludeEntityId ? new mongoose.Types.ObjectId(excludeEntityId.toString()) : undefined;
  const excludeFilter = excludeId ? { _id: { $ne: excludeId } } : {};
  const notDeleted = { isDeleted: { $ne: true } };

  // 1. Document
  const docRef = await Document.exists({
    ...excludeFilter,
    ...notDeleted,
    publicId,
  });
  if (docRef) return true;

  // 2. Task
  const taskRef = await Task.exists({
    ...excludeFilter,
    ...notDeleted,
    $or: [{ "attachments.publicId": publicId }, { imageId: publicId }],
  });
  if (taskRef) return true;

  // 3. TaskComment (embedded in Task or standalone comments)
  const commentRef = await TaskComment.exists({
    ...excludeFilter,
    "attachments.publicId": publicId,
  });
  if (commentRef) return true;

  // 4. Note
  const noteRef = await Note.exists({
    ...excludeFilter,
    ...notDeleted,
    $or: [{ "attachments.publicId": publicId }, { imageId: publicId }],
  });
  if (noteRef) return true;

  // 5. Idea
  const ideaRef = await Idea.exists({
    ...excludeFilter,
    ...notDeleted,
    $or: [{ "attachments.publicId": publicId }, { imageId: publicId }],
  });
  if (ideaRef) return true;

  // 6. Transaction
  const txRef = await Transaction.exists({
    ...excludeFilter,
    ...notDeleted,
    $or: [
      { "attachments.publicId": publicId },
      { receiptPublicId: publicId },
      { imageId: publicId },
    ],
  });
  if (txRef) return true;

  // 7. VaultItem
  const vaultRef = await VaultItem.exists({
    ...excludeFilter,
    ...notDeleted,
    $or: [{ "attachments.publicId": publicId }, { imageId: publicId }],
  });
  if (vaultRef) return true;

  // 8. SupportTicket
  const ticketRef = await SupportTicket.exists({
    ...excludeFilter,
    "messages.attachments.publicId": publicId,
  });
  if (ticketRef) return true;

  // 9. CustomRecord
  const customRecords = await CustomRecord.find({
    ...excludeFilter,
    ...notDeleted,
  })
    .select("data")
    .lean();

  for (const cr of customRecords) {
    if (!cr.data) continue;
    const values = cr.data instanceof Map ? Array.from(cr.data.values()) : Object.values(cr.data);
    for (const val of values) {
      if (Array.isArray(val)) {
        if (val.some((v: unknown) => { const item = v as { publicId?: string; imageId?: string } | null; return item && (item.publicId === publicId || item.imageId === publicId); })) {
          return true;
        }
      } else if (val && typeof val === "object") {
        if ((val as { publicId?: string }).publicId === publicId) {
          return true;
        }
      }
    }
  }

  return false;
}

function getModuleForEntityType(entityType: TrashEntityType): string {
  switch (entityType) {
    case "Task":
    case "Project":
      return "Tasks & Projects";
    case "Note":
    case "NoteGroup":
      return "Notes";
    case "Routine":
    case "Habit":
      return "Routines";
    case "Idea":
      return "Ideas";
    case "Document":
      return "Documents";
    case "CustomSection":
    case "CustomRecord":
      return "Custom Databases";
    case "DashboardBlock":
      return "Dashboard";
    case "Transaction":
    case "Account":
    case "Debt":
    case "Investment":
    case "FinancialReminder":
    case "Invoice":
      return "Finance";
    case "VaultItem":
      return "Vault";
    case "CalendarEvent":
      return "Calendar";
    default:
      return "General";
  }
}

/**
 * Move any supported record to the 7-Day Trash.
 */
export async function moveToTrash(
  entityType: TrashEntityType,
  entityId: string,
  options: {
    deletionBatchId?: string;
    parentId?: string;
    parentType?: string;
    customTitle?: string;
  } = {}
): Promise<{ success: boolean; trashItem?: unknown; error?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = new mongoose.Types.ObjectId(session.user.id);

    const Model = getModelForEntityType(entityType);
    const item = await Model.findOne({ _id: entityId }).setOptions({ includeDeleted: true });
    if (!item) {
      return { success: false, error: `${entityType} not found` };
    }

    // Tenancy & ownership check
    if (item.userId && item.userId.toString() !== userId.toString()) {
      // Check if user has workspace access
      if (item.workspaceId) {
        const { verifyWorkspaceAccess } = await import("@/lib/workspace");
        await verifyWorkspaceAccess(item.workspaceId.toString(), "member");
      } else {
        return { success: false, error: "Item not found" };
      }
    }

    const now = new Date();
    const purgeAt = new Date(now.getTime() + SEVEN_DAYS_MS);
    const batchId = options.deletionBatchId || new mongoose.Types.ObjectId().toString();

    let title = options.customTitle || item.title || item.name || item.description || item.assetName || `${entityType} Item`;
    interface TrashAttachmentItem { publicId: string; url?: string; resourceType?: string; originalFilename?: string; cleanupStatus?: string; }
    let attachments: TrashAttachmentItem[] = [];
    const metadata: Record<string, unknown> = {};

    // Entity-specific handling
    if (entityType === "Document") {
      if (item.publicId) attachments.push({ publicId: item.publicId, url: item.fileUrl });
    } else if (item.attachments && Array.isArray(item.attachments)) {
      attachments.push(...item.attachments);
    }
    if (item.imageId) attachments.push({ publicId: item.imageId });
    if (item.receiptPublicId) attachments.push({ publicId: item.receiptPublicId });

    // Initialize all attachments with cleanupStatus: 'pending'
    attachments = attachments.map((a) => ({
      publicId: a.publicId,
      url: a.url,
      resourceType: a.resourceType,
      originalFilename: a.originalFilename,
      cleanupStatus: "pending",
    }));

    // Financial Transaction consistency: reverse the account balance while keeping record recoverable
    if (entityType === "Transaction") {
      metadata.amount = item.amount?.toString();
      metadata.type = item.type;
      metadata.accountId = item.accountId?.toString();

      await executeInTransaction(async (dbSession) => {
        if (item.type === "transfer") {
          let linkedTx = null;
          if (item.transferId) {
            linkedTx = await Transaction.findOne({ _id: item.transferId }).setOptions({ includeDeleted: true }).session(dbSession);
          } else {
            linkedTx = await Transaction.findOne({ transferId: item._id }).setOptions({ includeDeleted: true }).session(dbSession);
          }

          const txAmount = parseFloat(item.amount.toString());
          if (linkedTx) {
            const isCurrentTxSender = !item.description?.startsWith("Transfer from:");
            const senderTx = isCurrentTxSender ? item : linkedTx;
            const receiverTx = isCurrentTxSender ? linkedTx : item;

            const senderAccount = await Account.findOne({ _id: senderTx.accountId, userId }).session(dbSession);
            const receiverAccount = await Account.findOne({ _id: receiverTx.accountId, userId }).session(dbSession);

            if (senderAccount) {
              const curBal = parseFloat(senderAccount.balance.toString());
              senderAccount.balance = mongoose.Types.Decimal128.fromString(calculateNewBalance(curBal, txAmount, "income").toString());
              await senderAccount.save({ session: dbSession ?? undefined });
            }
            if (receiverAccount) {
              const curBal = parseFloat(receiverAccount.balance.toString());
              receiverAccount.balance = mongoose.Types.Decimal128.fromString(calculateNewBalance(curBal, txAmount, "expense").toString());
              await receiverAccount.save({ session: dbSession ?? undefined });
            }

            // Also soft delete linked leg
            await Transaction.updateOne(
              { _id: linkedTx._id },
              {
                $set: {
                  isDeleted: true,
                  deletedAt: now,
                  purgeAt,
                  deletedBy: userId,
                  deletionBatchId: batchId,
                }
              },
              { session: dbSession ?? undefined }
            );
          }
        } else {
          const account = await Account.findOne({ _id: item.accountId, userId }).session(dbSession);
          if (account) {
            const currentBalance = parseFloat(account.balance.toString());
            const txAmount = parseFloat(item.amount.toString());
            const reverseType = item.type === "income" ? "expense" : "income";
            account.balance = mongoose.Types.Decimal128.fromString(calculateNewBalance(currentBalance, txAmount, reverseType).toString());
            await account.save({ session: dbSession ?? undefined });
          }
        }
      });
    }

    // Vault Item: ensure we never store decrypted data or passwords in Trash
    if (entityType === "VaultItem") {
      title = item.title || "Encrypted Vault Item";
      metadata.category = item.category;
    }

    // Cascade for NoteGroup: soft-delete all notes in group
    if (entityType === "NoteGroup") {
      const childNotes = await Note.find({ groupId: item._id }).setOptions({ includeDeleted: true });
      for (const note of childNotes) {
        await Note.updateOne(
          { _id: note._id },
          {
            $set: {
              isDeleted: true,
              deletedAt: now,
              purgeAt,
              deletedBy: userId,
              deletionBatchId: batchId,
            }
          }
        );
      }
      metadata.childCount = childNotes.length;
    }

    // Cascade for CustomSection: soft-delete all records
    if (entityType === "CustomSection") {
      const records = await CustomRecord.find({ sectionId: item._id }).setOptions({ includeDeleted: true });
      for (const rec of records) {
        await CustomRecord.updateOne(
          { _id: rec._id },
          {
            $set: {
              isDeleted: true,
              deletedAt: now,
              purgeAt,
              deletedBy: userId,
              deletionBatchId: batchId,
            }
          }
        );
      }
      metadata.recordCount = records.length;
    }

    // Mark the record itself as soft-deleted
    await Model.updateOne(
      { _id: entityId },
      {
        $set: {
          isDeleted: true,
          deletedAt: now,
          purgeAt,
          deletedBy: userId,
          deletionBatchId: batchId,
          originalState: metadata,
        }
      }
    );

    // Create central TrashItem entry
    const trashItem = await TrashItem.create({
      userId,
      workspaceId: item.workspaceId,
      entityType,
      entityId: new mongoose.Types.ObjectId(entityId),
      title,
      module: getModuleForEntityType(entityType),
      deletedAt: now,
      purgeAt,
      deletedBy: userId,
      deletionBatchId: batchId,
      parentId: options.parentId ? new mongoose.Types.ObjectId(options.parentId) : undefined,
      parentType: options.parentType,
      status: "active",
      attachments,
      metadata,
    });

    // Revalidate relevant pages
    revalidatePath("/dashboard/trash");
    revalidatePath("/dashboard");

    return { success: true, trashItem: JSON.parse(JSON.stringify(trashItem)) };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("moveToTrash error:", error);
    return { success: false, error: err.message || "Failed to move item to trash" };
  }
}

/**
 * Get items currently in Trash for the authenticated user / workspace.
 */
export async function getTrashItems(options: {
  module?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ success: boolean; items: TrashItemRecord[]; total: number; error?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, items: [], total: 0, error: "Unauthorized" };
    }
    const userId = session.user.id;

    const { getActiveWorkspaceInfo } = await import("@/actions/workspace.actions");
    const workspaceInfo = await getActiveWorkspaceInfo().catch(() => null);
    const activeWorkspace = workspaceInfo?.activeWorkspace;

    const query: Record<string, unknown> = {
      status: "active",
      purgeAt: { $gt: new Date() },
    };

    if (activeWorkspace && activeWorkspace.type === "team") {
      query.$or = [{ workspaceId: activeWorkspace._id }, { userId }];
    } else {
      query.userId = userId;
    }

    if (options.module && options.module !== "All") {
      query.module = options.module;
    }

    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      TrashItem.find(query)
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TrashItem.countDocuments(query),
    ]);

    const formatted: TrashItemRecord[] = items.map((rawDoc) => {
      const i = rawDoc as unknown as ITrashItem;
      const now = Date.now();
      const purgeTime = new Date(i.purgeAt).getTime();
      const msRemaining = Math.max(0, purgeTime - now);
      const daysRemaining = Math.floor(msRemaining / (24 * 60 * 60 * 1000));
      const hoursRemaining = Math.floor((msRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

      return {
        _id: i._id.toString(),
        entityId: i.entityId.toString(),
        title: i.title || "Untitled",
        module: i.module || "General",
        entityType: i.entityType,
        deletedAt: new Date(i.deletedAt).toISOString(),
        purgeAt: new Date(i.purgeAt).toISOString(),
        daysRemaining,
        hoursRemaining,
        expiresLabel: daysRemaining > 0 ? `${daysRemaining}d ${hoursRemaining}h left` : `${hoursRemaining}h left`,
        attachments: i.attachments || [],
        userId: i.userId.toString(),
        workspaceId: i.workspaceId ? i.workspaceId.toString() : undefined,
        status: i.status,
      };
    });

    return { success: true, items: formatted, total };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("getTrashItems error:", error);
    return { success: false, items: [], total: 0, error: err.message };
  }
}

/**
 * Restore an item from Trash before 7-day expiration.
 */
export async function restoreFromTrash(trashItemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = session.user.id;

    const trashItem = await TrashItem.findById(trashItemId);
    if (!trashItem) {
      return { success: false, error: "Trash item not found or already purged" };
    }

    // Check expiry: strictly reject once 7-day retention has lapsed
    const now = new Date();
    if (new Date(trashItem.purgeAt) <= now) {
      return { success: false, error: "This item has exceeded the 7-day retention period and cannot be restored." };
    }

    // Purging and purged items can NEVER be restored
    if (trashItem.status === "purging" || trashItem.status === "purged") {
      return { success: false, error: "Trash item not found or already purged" };
    }

    // If an item entered failed purge, check if any asset was already deleted
    if (trashItem.status === "failed") {
      const anyAssetDeleted = trashItem.attachments?.some((a: { cleanupStatus?: string }) => a.cleanupStatus === "deleted");
      if (anyAssetDeleted) {
        return {
          success: false,
          error: "This item cannot be restored because its associated assets were already permanently cleaned up.",
        };
      }
      return {
        success: false,
        error: "This item entered purge processing and cannot be restored.",
      };
    }

    if (trashItem.status !== "active") {
      return { success: false, error: `Item in status '${trashItem.status}' cannot be restored` };
    }

    // Ownership or workspace check
    if (trashItem.userId.toString() !== userId.toString()) {
      if (trashItem.workspaceId) {
        const { verifyWorkspaceAccess } = await import("@/lib/workspace");
        await verifyWorkspaceAccess(trashItem.workspaceId.toString(), "member");
      } else {
        return { success: false, error: "Access denied" };
      }
    }

    // Atomically claim the item for restoration from active state
    const claimed = await TrashItem.findOneAndUpdate(
      { _id: trashItemId, status: "active" },
      { $set: { status: "restored" } },
      { returnDocument: "after" }
    );
    if (!claimed) {
      return { success: false, error: "Trash item not found or already locked for purge" };
    }

    const Model = getModelForEntityType(trashItem.entityType);
    const item = await Model.findOne({ _id: trashItem.entityId }).setOptions({ includeDeleted: true });
    if (!item) {
      return { success: false, error: "Original document could not be found or was permanently purged" };
    }

    // If Note: ensure parent NoteGroup exists
    if (trashItem.entityType === "Note" && item.groupId) {
      const parentGroup = await NoteGroup.findOne({ _id: item.groupId }).setOptions({ includeDeleted: true });
      if (!parentGroup) {
        return { success: false, error: "Parent note group was permanently removed. Cannot restore note." };
      }
      if (parentGroup.isDeleted) {
        // Automatically restore parent group as well
        await NoteGroup.updateOne(
          { _id: item.groupId },
          { $set: { isDeleted: false, deletedAt: null, purgeAt: null, deletedBy: null } }
        );
        await TrashItem.updateMany(
          { entityId: item.groupId, entityType: "NoteGroup" },
          { $set: { status: "restored" } }
        );
      }
    }

    // If CustomRecord: ensure parent CustomSection exists
    if (trashItem.entityType === "CustomRecord" && item.sectionId) {
      const parentSection = await CustomSection.findOne({ _id: item.sectionId }).setOptions({ includeDeleted: true });
      if (!parentSection) {
        return { success: false, error: "Parent database section was permanently removed. Cannot restore record." };
      }
      if (parentSection.isDeleted) {
        await CustomSection.updateOne(
          { _id: item.sectionId },
          { $set: { isDeleted: false, deletedAt: null, purgeAt: null, deletedBy: null } }
        );
        await TrashItem.updateMany(
          { entityId: item.sectionId, entityType: "CustomSection" },
          { $set: { status: "restored" } }
        );
      }
    }

    // Financial Transaction consistency: re-apply transaction to account balance
    if (trashItem.entityType === "Transaction") {
      await executeInTransaction(async (dbSession) => {
        const txAmount = parseFloat(item.amount.toString());
        if (item.type === "transfer") {
          let linkedTx = null;
          if (item.transferId) {
            linkedTx = await Transaction.findOne({ _id: item.transferId }).setOptions({ includeDeleted: true }).session(dbSession);
          } else {
            linkedTx = await Transaction.findOne({ transferId: item._id }).setOptions({ includeDeleted: true }).session(dbSession);
          }

          if (linkedTx) {
            const isCurrentTxSender = !item.description?.startsWith("Transfer from:");
            const senderTx = isCurrentTxSender ? item : linkedTx;
            const receiverTx = isCurrentTxSender ? linkedTx : item;

            const senderAccount = await Account.findOne({ _id: senderTx.accountId }).session(dbSession);
            const receiverAccount = await Account.findOne({ _id: receiverTx.accountId }).session(dbSession);

            if (senderAccount) {
              const curBal = parseFloat(senderAccount.balance.toString());
              senderAccount.balance = mongoose.Types.Decimal128.fromString(calculateNewBalance(curBal, txAmount, "expense").toString());
              await senderAccount.save({ session: dbSession ?? undefined });
            }
            if (receiverAccount) {
              const curBal = parseFloat(receiverAccount.balance.toString());
              receiverAccount.balance = mongoose.Types.Decimal128.fromString(calculateNewBalance(curBal, txAmount, "income").toString());
              await receiverAccount.save({ session: dbSession ?? undefined });
            }

            // Restore linked transaction
            await Transaction.updateOne(
              { _id: linkedTx._id },
              { $set: { isDeleted: false, deletedAt: null, purgeAt: null, deletedBy: null } },
              { session: dbSession ?? undefined, includeDeleted: true } as { session?: mongoose.ClientSession; includeDeleted?: boolean }
            );
          }
        } else {
          const account = await Account.findOne({ _id: item.accountId }).session(dbSession);
          if (account) {
            const curBal = parseFloat(account.balance.toString());
            account.balance = mongoose.Types.Decimal128.fromString(calculateNewBalance(curBal, txAmount, item.type).toString());
            await account.save({ session: dbSession ?? undefined });
          }
        }
      });
    }

    // Cascade restore if NoteGroup was deleted with batch
    if (trashItem.entityType === "NoteGroup" && trashItem.deletionBatchId) {
      await Note.updateMany(
        { deletionBatchId: trashItem.deletionBatchId },
        { $set: { isDeleted: false, deletedAt: null, purgeAt: null, deletedBy: null } },
        { includeDeleted: true } as { session?: mongoose.ClientSession; includeDeleted?: boolean }
      );
      await TrashItem.updateMany(
        { deletionBatchId: trashItem.deletionBatchId },
        { $set: { status: "restored" } }
      );
    }

    // Cascade restore if CustomSection was deleted with batch
    if (trashItem.entityType === "CustomSection" && trashItem.deletionBatchId) {
      await CustomRecord.updateMany(
        { deletionBatchId: trashItem.deletionBatchId },
        { $set: { isDeleted: false, deletedAt: null, purgeAt: null, deletedBy: null } },
        { includeDeleted: true } as { session?: mongoose.ClientSession; includeDeleted?: boolean }
      );
      await TrashItem.updateMany(
        { deletionBatchId: trashItem.deletionBatchId },
        { $set: { status: "restored" } }
      );
    }

    // Restore the underlying document
    await Model.updateOne(
      { _id: trashItem.entityId },
      { $set: { isDeleted: false, deletedAt: null, purgeAt: null, deletedBy: null, deletionBatchId: null } },
      { includeDeleted: true } as { session?: mongoose.ClientSession; includeDeleted?: boolean }
    );

    // Delete or mark restored the TrashItem
    await TrashItem.deleteOne({ _id: trashItemId });

    revalidatePath("/dashboard/trash");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("restoreFromTrash error:", error);
    return { success: false, error: err.message || "Failed to restore item" };
  }
}

/**
 * Permanently delete a single item from Trash immediately.
 */
export async function permanentlyDeleteTrashItem(trashItemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = session.user.id;

    const trashItem = await TrashItem.findById(trashItemId);
    if (!trashItem) return { success: true };

    if (trashItem.userId.toString() !== userId.toString()) {
      if (trashItem.workspaceId) {
        const { verifyWorkspaceAccess } = await import("@/lib/workspace");
        await verifyWorkspaceAccess(trashItem.workspaceId.toString(), "member");
      } else {
        return { success: false, error: "Access denied" };
      }
    }

    // Delete associated Cloudinary assets with cross-model reference checking
    if (trashItem.attachments && trashItem.attachments.length > 0) {
      const safeToDelete: Array<{ publicId: string; resourceType?: "image" | "raw" | "auto" | "video" }> = [];
      for (const att of trashItem.attachments) {
        if (!att.publicId) continue;
        const isShared = await isAssetReferencedAcrossModels(att.publicId, trashItem.entityId);
        if (!isShared) {
          safeToDelete.push({ publicId: att.publicId, resourceType: (att.resourceType as "image" | "raw" | "auto" | "video") || "image" });
        }
      }
      if (safeToDelete.length > 0) {
        await deleteAttachments(safeToDelete).catch(console.error);
      }
    }

    // Delete underlying document permanently
    const Model = getModelForEntityType(trashItem.entityType);
    await Model.deleteOne({ _id: trashItem.entityId });

    // Delete TrashItem entry
    await TrashItem.deleteOne({ _id: trashItemId });

    revalidatePath("/dashboard/trash");
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("permanentlyDeleteTrashItem error:", error);
    return { success: false, error: err.message || "Failed to permanently delete item" };
  }
}

/**
 * Background purge process: permanently purges all records whose 7-day retention period has expired.
 * Concurrency-safe, idempotent, cleans up Cloudinary assets.
 */
export async function purgeExpiredTrash(batchSize: number = 100, systemAuthToken?: string): Promise<{
  success: boolean;
  purgedCount: number;
  errors: string[];
}> {
  await dbConnect();
  const now = new Date();
  const errors: string[] = [];
  let purgedCount = 0;

  try {
    // Find expired trash items eligible for purge (active or previously failed retries)
    const expiredItems = await TrashItem.find({
      status: { $in: ["active", "failed"] },
      purgeAt: { $lte: now },
    }).limit(batchSize);

    for (const trashItem of expiredItems) {
      try {
        // Atomic state transition to 'purging' prevents concurrent workers from duplicate execution
        const locked = await TrashItem.findOneAndUpdate(
          { _id: trashItem._id, status: { $in: ["active", "failed"] } },
          { $set: { status: "purging" } },
          { returnDocument: "after" }
        );

        if (!locked) continue; // Concurrently claimed by another worker or restored

        let hasAssetFailure = false;
        let lastErrorMessage = "Partial or complete Cloudinary asset purge failure";

        // 1. External Cloudinary asset cleanup with per-asset tracking and cross-model reference checking
        if (locked.attachments && locked.attachments.length > 0) {
          for (const att of locked.attachments) {
            if (!att.publicId) continue;
            // Idempotency: skip assets that have already been deleted or retained as shared
            if (att.cleanupStatus === "deleted" || att.cleanupStatus === "retained_shared") {
              continue;
            }

            // Check if another active model references this exact publicId
            const isShared = await isAssetReferencedAcrossModels(att.publicId, locked.entityId);
            if (isShared) {
              att.cleanupStatus = "retained_shared";
              continue;
            }

            try {
              await systemDeleteAttachments([att], systemAuthToken || process.env.CRON_SECRET);
              att.cleanupStatus = "deleted";
              att.error = undefined;
            } catch (attErr: unknown) {
              const aErr = attErr as Error;
              att.cleanupStatus = "failed";
              att.error = aErr.message || "Failed Cloudinary asset purge";
              lastErrorMessage = aErr.message || lastErrorMessage;
              hasAssetFailure = true;
            }
          }

          // Persist the updated attachment states to the database
          await TrashItem.updateOne(
            { _id: locked._id },
            { $set: { attachments: locked.attachments } }
          );

          if (hasAssetFailure) {
            await TrashItem.updateOne(
              { _id: locked._id },
              {
                $set: {
                  status: "failed",
                  lastPurgeError: lastErrorMessage,
                },
                $inc: { purgeAttempts: 1 },
              }
            );
            errors.push(`Failed asset purge for item ${locked._id}: ${lastErrorMessage}`);
            // DO NOT delete the underlying document! Keep it for safe retry.
            continue;
          }
        }

        // 2. Permanently delete underlying document from DB
        try {
          const Model = getModelForEntityType(locked.entityType);
          await Model.deleteOne({ _id: locked.entityId });
        } catch (dbErr: unknown) {
          console.error(`DB hard-delete failed for ${locked.entityType} ${locked.entityId}:`, dbErr);
        }

        // 3. Mark TrashItem document as 'purged' or remove it
        await TrashItem.deleteOne({ _id: locked._id });
        purgedCount++;
      } catch (itemErr: unknown) {
        const iErr = itemErr as Error;
        errors.push(`Failed to purge item ${trashItem._id}: ${iErr.message}`);
      }
    }

    return { success: true, purgedCount, errors };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("purgeExpiredTrash top-level error:", err);
    return { success: false, purgedCount, errors: [error.message] };
  }
}
