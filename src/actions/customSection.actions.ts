"use server";

import dbConnect from "@/lib/db";
import CustomSection from "@/models/custom/CustomSection";
import CustomField from "@/models/custom/CustomField";
import CustomRecord from "@/models/custom/CustomRecord";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// 1. Sections
export async function getCustomSections() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { sections: [] };

    await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const sections = await CustomSection.find({ userId, isActive: true })
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

    return { records: JSON.parse(JSON.stringify(records)) };
  } catch (error) {
    return { records: [] };
  }
}

export async function createCustomRecord(sectionId: string, data: Record<string, unknown>) {
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

    const record = await CustomRecord.create({
      sectionId,
      userId,
      data: dataMap
    });

    revalidatePath(`/dashboard/custom`);
    return { success: true, record: JSON.parse(JSON.stringify(record)) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCustomRecord(recordId: string, data: Record<string, unknown>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const dataMap = new Map(Object.entries(data));

    const record = await CustomRecord.findOneAndUpdate(
      { _id: recordId, userId },
      { $set: { data: dataMap } },
      { new: true }
    );

    if (!record) throw new Error("Record not found or unauthorized");

    revalidatePath(`/dashboard/custom`);
    return { success: true, record: JSON.parse(JSON.stringify(record)) };
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
      { new: true }
    );
    if (!section) throw new Error("Not found");
    revalidatePath("/dashboard");
    return { success: true, section: JSON.parse(JSON.stringify(section)) };
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
      { new: true }
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

