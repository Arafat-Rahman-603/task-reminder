"use server";

import dbConnect from "@/lib/db";
import CustomSection from "@/models/custom/CustomSection";
import CustomField from "@/models/custom/CustomField";
import CustomRecord from "@/models/custom/CustomRecord";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import Reminder from "@/models/Reminder";
import { createReminder, updateReminderTime, deleteRemindersByEntity } from "./reminder.actions";
import { deleteAttachments } from "./cloudinary.actions";

// 1. Sections
export async function getCustomSections(includeArchived: boolean = false) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { sections: [] };

    await dbConnect();
  const _userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return { sections: [] };

    const query: Record<string, unknown> = { workspaceId: activeWorkspace._id };
    if (!includeArchived) {
      query.isActive = true;
    }

    const sections = await CustomSection.find(query)
      .sort({ sortOrder: 1 })
      .lean();

    return { sections: JSON.parse(JSON.stringify(sections)) };
  } catch {
    return { sections: [] };
  }
}

export async function createCustomSection(data: {
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  layout?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
  const userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    // Check plan limits
    const currentSections = await CustomSection.countDocuments({
      $or: [
        { workspaceId: activeWorkspace._id },
        { userId, workspaceId: { $exists: false } }
      ]
    });
    const { PLAN_LIMITS } = await import("@/config/plans");
    const User = (await import("@/models/User")).default;
    const userDoc = await User.findById(userId).select("subscription").lean();

    const wsPlan = (activeWorkspace as { subscription?: { plan?: string } })?.subscription?.plan;
    const effectivePlan = (wsPlan && wsPlan !== "free")
      ? wsPlan
      : (userDoc?.subscription?.plan || "free");

    const limit = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS]?.maxCustomSections ?? 3;
    if (currentSections >= limit) {
      throw new Error(`Custom section limit reached for your plan (${currentSections}/${limit} sections used). Free plan allows up to 3 sections. Please upgrade to Pro for more.`);
    }

    const section = await CustomSection.create({ ...data, userId, workspaceId: activeWorkspace._id });
    
    revalidatePath("/dashboard");
    return { success: true, section: JSON.parse(JSON.stringify(section)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Fields
export async function getCustomFields(sectionId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { fields: [] };

    await dbConnect();
  const _userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return { fields: [] };

    // Verify ownership of the CustomSection first to prevent tenancy leakage
    const section = await CustomSection.findOne({ _id: sectionId, workspaceId: activeWorkspace._id });
    if (!section) {
      return { fields: [] };
    }

    const fields = await CustomField.find({ sectionId }).sort({ sortOrder: 1 }).lean();
    return { fields: JSON.parse(JSON.stringify(fields)) };
  } catch {
    return { fields: [] };
  }
}

// 3. Records
export async function getCustomRecords(sectionId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { records: [] };

    await dbConnect();
  const _userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return { records: [] };

    const records = await CustomRecord.find({ sectionId, workspaceId: activeWorkspace._id })
      .sort({ createdAt: -1 })
      .lean();

    const recordIds = records.map((r) => r._id);
    const reminders = await Reminder.find({ entityType: 'CustomRecord', entityId: { $in: recordIds }, status: 'pending' }).lean();
    const reminderMap = new Map();
    reminders.forEach((r: { entityId: { toString(): string } }) => reminderMap.set(r.entityId.toString(), r));
    records.forEach((r: { _id: { toString(): string }; reminder?: unknown }) => {
      r.reminder = reminderMap.get(r._id.toString()) || null;
    });

    return { records: JSON.parse(JSON.stringify(records)) };
  } catch {
    return { records: [] };
  }
}

export async function getCustomRecordBySlug(sectionId: string, slug: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { record: null };

    await dbConnect();
  const _userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) return { record: null };

    const record = await CustomRecord.findOne({ sectionId, workspaceId: activeWorkspace._id, slug }).lean();
    if (!record) return { record: null };

    const reminder = await Reminder.findOne({ entityType: 'CustomRecord', entityId: record._id.toString(), status: 'pending' }).lean();
    (record as { reminder?: unknown }).reminder = reminder || null;

    return { record: JSON.parse(JSON.stringify(record)) };
  } catch {
    return { record: null };
  }
}

export async function createCustomRecord(sectionId: string, title: string, date: Date | undefined, data: Record<string, unknown>, reminderTime?: string | null) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
  const userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    // Verify ownership of the CustomSection to prevent tenancy leakage
    const section = await CustomSection.findOne({ _id: sectionId, workspaceId: activeWorkspace._id });
    if (!section) {
      throw new Error("Unauthorized or Section not found");
    }

    // Convert keys to string for the Map
    const dataMap = new Map(Object.entries(data));

    const baseSlug = (title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled';
    let slug = baseSlug;
    let counter = 1;
    while (await CustomRecord.findOne({ sectionId, workspaceId: activeWorkspace._id, slug })) {
      if (counter > 20) {
        slug = `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    let record;
    try {
      record = await CustomRecord.create({
        sectionId,
        userId,
        workspaceId: activeWorkspace._id,
        title,
        slug,
        date,
        data: dataMap
      });
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 11000) {
        slug = `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        record = await CustomRecord.create({
          sectionId,
          userId,
          workspaceId: activeWorkspace._id,
          title,
          slug,
          date,
          data: dataMap
        });
      } else {
        throw err;
      }
    }

    if (reminderTime) {
      await createReminder({
        entityType: 'CustomRecord',
        entityId: record._id.toString(),
        remindAt: reminderTime,
      });
    }
    const recordObj = record.toObject();
    const reminder = await Reminder.findOne({ entityType: 'CustomRecord', entityId: record._id.toString(), status: 'pending' }).lean();
    recordObj.reminder = reminder || null;

    revalidatePath(`/dashboard/custom`);
    return { success: true, record: JSON.parse(JSON.stringify(recordObj)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCustomRecord(recordId: string, title: string, date: Date | undefined, data: Record<string, unknown>, reminderTime?: string | null) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
  const _userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const dataMap = new Map(Object.entries(data));

    const oldRecord = await CustomRecord.findOne({ _id: recordId, workspaceId: activeWorkspace._id });

    const record = await CustomRecord.findOneAndUpdate(
      { _id: recordId, workspaceId: activeWorkspace._id },
      { $set: { title, date, data: dataMap } },
      { returnDocument: 'after' }
    );

    if (oldRecord && record) {
      // Find all old attachments
      interface AttVal { publicId: string; [key: string]: unknown; }
      const oldAtts: AttVal[] = [];
      
      Array.from(oldRecord.data.values()).forEach((val: unknown) => {
        if (Array.isArray(val)) {
          oldAtts.push(...val.filter(v => v && v.publicId));
        } else if (typeof val === 'string' && val.includes('cloudinary.com')) {
          // It's hard to extract publicId reliably from raw URL without full logic, but let's skip strings for now since AttachmentUpload handles it.
        }
      });
      const newAttIds = new Set<string>();
      Array.from(record.data.values()).forEach((val: unknown) => {
        if (Array.isArray(val)) val.forEach(v => { if (v && v.publicId) newAttIds.add(v.publicId); });
      });
      const removedAtts = oldAtts.filter(a => !newAttIds.has(a.publicId));
      if (removedAtts.length > 0) deleteAttachments(removedAtts).catch(console.error);
    }

    if (!record) throw new Error("Record not found or unauthorized");

    if (reminderTime !== undefined) {
      if (reminderTime === null || reminderTime === "") {
        await deleteRemindersByEntity('CustomRecord', recordId);
      } else {
        await updateReminderTime('CustomRecord', recordId, reminderTime);
      }
    }
    const recordObj = record.toObject();
    const reminder = await Reminder.findOne({ entityType: 'CustomRecord', entityId: record._id.toString(), status: 'pending' }).lean();
    recordObj.reminder = reminder || null;

    revalidatePath(`/dashboard/custom`);
    return { success: true, record: JSON.parse(JSON.stringify(recordObj)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCustomRecord(recordId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
  const _userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const { moveToTrash } = await import("@/actions/trash.actions");
    await moveToTrash("CustomRecord", recordId);

    await deleteRemindersByEntity('CustomRecord', recordId);

    revalidatePath(`/dashboard/custom`);
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCustomSection(sectionId: string, data: { name?: string; icon?: string; description?: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    const _userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const section = await CustomSection.findOneAndUpdate(
      { _id: sectionId, workspaceId: activeWorkspace._id },
      { $set: data },
      { returnDocument: 'after' }
    );
    if (!section) throw new Error("Not found");
    revalidatePath("/dashboard");
    return { success: true, section: JSON.parse(JSON.stringify(section)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCustomSectionAndFields(sectionId: string, data: {
  name: string;
  description: string;
  fields: { _id?: string; name: string; type: string; required: boolean }[];
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    const _userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const section = await CustomSection.findOneAndUpdate(
      { _id: sectionId, workspaceId: activeWorkspace._id },
      { $set: { name: data.name, description: data.description } },
      { returnDocument: 'after' }
    );
    if (!section) throw new Error("Not found");

    const currentFields = await CustomField.find({ sectionId });
    const currentFieldIds = currentFields.map(f => f._id.toString());
    const newFieldIds = data.fields.map(f => f._id).filter(id => id);
    
    const fieldsToDelete = currentFieldIds.filter(id => !newFieldIds.includes(id));
    if (fieldsToDelete.length > 0) {
      await CustomField.deleteMany({ _id: { $in: fieldsToDelete } });
    }

    const typeMap: Record<string, string> = {
      'text': 'text',
      'textarea': 'longText',
      'number': 'number',
      'date': 'date',
      'url': 'url',
      'email': 'email',
      'select': 'select',
      'longText': 'longText'
    };

    for (let i = 0; i < data.fields.length; i++) {
      const f = data.fields[i];
      if (f._id && currentFieldIds.includes(f._id)) {
        await CustomField.findByIdAndUpdate(f._id, {
          $set: {
            name: f.name,
            type: typeMap[f.type] || f.type,
            isRequired: f.required,
            sortOrder: i
          }
        });
      } else {
        await CustomField.create({
          sectionId,
          name: f.name,
          type: typeMap[f.type] || f.type,
          isRequired: f.required,
          sortOrder: i
        });
      }
    }

    revalidatePath("/dashboard");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setCustomSectionActiveStatus(sectionId: string, isActive: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    const _userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const section = await CustomSection.findOneAndUpdate(
      { _id: sectionId, workspaceId: activeWorkspace._id },
      { $set: { isActive } },
      { returnDocument: 'after' }
    );
    if (!section) throw new Error("Not found");
    revalidatePath("/dashboard");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCustomSection(sectionId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");
    await dbConnect();
    const userId = session.user.id;
    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) throw new Error("No active workspace");

    const section = await CustomSection.findOne({ _id: sectionId, workspaceId: activeWorkspace._id });
    if (!section) throw new Error("Custom section not found");

    const { moveToTrash } = await import("@/actions/trash.actions");
    await moveToTrash("CustomSection", sectionId);
    // Also delete dashboard blocks
    // Note: Assuming we have a DashboardBlock model, but we can do that later if needed.
    
    // Remove from NavGroup
    import("@/models/NavigationGroup").then(async ({ default: NavigationGroup }) => {
      await NavigationGroup.updateMany(
        { userId },
        { $pull: { items: { id: section.slug } } }
      );
    });

    revalidatePath("/dashboard");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}



