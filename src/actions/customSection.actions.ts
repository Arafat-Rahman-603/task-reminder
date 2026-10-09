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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const query: any = { userId };
    if (!includeArchived) {
      query.isActive = true;
    }

    const sections = await CustomSection.find(query)
      .sort({ sortOrder: 1 })
      .lean();

    return { sections: JSON.parse(JSON.stringify(sections)) };
  } catch (error) {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const section = await CustomSection.create({ ...data, userId });
    
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    // Verify ownership of the CustomSection first to prevent tenancy leakage
    const section = await CustomSection.findOne({ _id: sectionId, userId });
    if (!section) {
      return { fields: [] };
    }

    const fields = await CustomField.find({ sectionId }).sort({ sortOrder: 1 }).lean();
    return { fields: JSON.parse(JSON.stringify(fields)) };
  } catch (error) {
    return { fields: [] };
  }
}

// 3. Records
export async function getCustomRecords(sectionId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { records: [] };

    await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const records = await CustomRecord.find({ sectionId, userId })
      .sort({ createdAt: -1 })
      .lean();

    const recordIds = records.map((r: any) => r._id);
    const reminders = await Reminder.find({ entityType: 'CustomRecord', entityId: { $in: recordIds }, status: 'pending' }).lean();
    const reminderMap = new Map();
    reminders.forEach((r: any) => reminderMap.set(r.entityId.toString(), r));
    records.forEach((r: any) => {
      r.reminder = reminderMap.get(r._id.toString()) || null;
    });

    return { records: JSON.parse(JSON.stringify(records)) };
  } catch (error) {
    return { records: [] };
  }
}

export async function getCustomRecordBySlug(sectionId: string, slug: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { record: null };

    await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const record = await CustomRecord.findOne({ sectionId, userId, slug }).lean();
    if (!record) return { record: null };

    const reminder = await Reminder.findOne({ entityType: 'CustomRecord', entityId: record._id.toString(), status: 'pending' }).lean();
    (record as any).reminder = reminder || null;

    return { record: JSON.parse(JSON.stringify(record)) };
  } catch (error) {
    return { record: null };
  }
}

export async function createCustomRecord(sectionId: string, title: string, date: Date | undefined, data: Record<string, unknown>, reminderTime?: string | null) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    // Verify ownership of the CustomSection to prevent tenancy leakage
    const section = await CustomSection.findOne({ _id: sectionId, userId });
    if (!section) {
      throw new Error("Unauthorized or Section not found");
    }

    // Convert keys to string for the Map
    const dataMap = new Map(Object.entries(data));

    const baseSlug = (title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled';
    let slug = baseSlug;
    let counter = 1;
    while (await CustomRecord.findOne({ sectionId, userId, slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const record = await CustomRecord.create({
      sectionId,
      userId,
      title,
      slug,
      date,
      data: dataMap
    });

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const dataMap = new Map(Object.entries(data));

    const oldRecord = await CustomRecord.findOne({ _id: recordId, userId });

    const record = await CustomRecord.findOneAndUpdate(
      { _id: recordId, userId },
      { $set: { title, date, data: dataMap } },
      { returnDocument: 'after' }
    );

    if (oldRecord && record) {
      // Find all old attachments
      const oldAtts: any[] = [];
      const oldImages: string[] = [];
      Array.from(oldRecord.data.values()).forEach((val: any) => {
        if (Array.isArray(val)) {
          oldAtts.push(...val.filter(v => v && v.publicId));
        } else if (typeof val === 'string' && val.includes('cloudinary.com')) {
          // It's hard to extract publicId reliably from raw URL without full logic, but let's skip strings for now since AttachmentUpload handles it.
        }
      });
      const newAttIds = new Set<string>();
      Array.from(record.data.values()).forEach((val: any) => {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const record = await CustomRecord.findOneAndDelete({ _id: recordId, userId });
    
    if (!record) throw new Error("Record not found or unauthorized");

    const attsToDelete: any[] = [];
    Array.from(record.data.values()).forEach((val: any) => {
      if (Array.isArray(val)) {
        attsToDelete.push(...val.filter(v => v && v.publicId));
      }
    });
    if (attsToDelete.length > 0) {
      deleteAttachments(attsToDelete).catch(console.error);
    }

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const section = await CustomSection.findOneAndUpdate(
      { _id: sectionId, userId },
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const section = await CustomSection.findOneAndUpdate(
      { _id: sectionId, userId },
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const section = await CustomSection.findOneAndUpdate(
      { _id: sectionId, userId },
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const section = await CustomSection.findOneAndDelete({ _id: sectionId, userId });
    if (!section) throw new Error("Not found");

    // Clean up related data
    await CustomField.deleteMany({ sectionId });
    const records = await CustomRecord.find({ sectionId, userId });
    for (const record of records) {
      await deleteRemindersByEntity('CustomRecord', record._id.toString());
    }
    await CustomRecord.deleteMany({ sectionId, userId });
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

