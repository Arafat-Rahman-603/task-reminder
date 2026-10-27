import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import CustomSection from "@/models/custom/CustomSection";
import CustomField from "@/models/custom/CustomField";
import NavigationGroup from "@/models/NavigationGroup";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const { getActiveWorkspaceInfo } = await import('@/actions/workspace.actions');
    const workspaceInfo = await getActiveWorkspaceInfo();
    const activeWorkspace = workspaceInfo?.activeWorkspace;
    if (!activeWorkspace) {
      return NextResponse.json({ error: "No active workspace found" }, { status: 400 });
    }

    // Check plan limits (Free plan allows max 3 custom sections)
    const { PLAN_LIMITS } = await import("@/config/plans");
    const User = (await import("@/models/User")).default;
    const userDoc = await User.findById(userId).select("subscription").lean();

    const wsPlan = (activeWorkspace as { subscription?: { plan?: string } })?.subscription?.plan;
    const effectivePlan = (wsPlan && wsPlan !== "free")
      ? wsPlan
      : (userDoc?.subscription?.plan || "free");

    const limit = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS]?.maxCustomSections ?? 3;
    const currentSections = await CustomSection.countDocuments({
      $or: [
        { workspaceId: activeWorkspace._id },
        { userId, workspaceId: { $exists: false } }
      ]
    });

    if (currentSections >= limit) {
      return NextResponse.json({
        error: `Custom section limit reached for your plan (${currentSections}/${limit} sections used). Free plan allows up to 3 sections. Please upgrade to Pro for more.`
      }, { status: 403 });
    }

    // Create a slug from the name
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Map defaultView from old format to layout
    const layoutMap: Record<string, string> = {
      'Simple List': 'list',
      'Table': 'table',
      'Kanban': 'kanban',
      'Gallery': 'gallery'
    };
    
    const layout = layoutMap[data.defaultView] || 'list';

    const newSection = new CustomSection({
      userId: new mongoose.Types.ObjectId(userId),
      workspaceId: activeWorkspace._id,
      name: data.name,
      slug: data.slug || slug,
      description: data.description || "",
      group: data.group || "My Sections",
      layout: layout || data.layout || 'list',
    });

    await newSection.save();

    // Now save fields
    if (data.fields && Array.isArray(data.fields)) {
      const typeMap: Record<string, string> = {
        // Capitalized variants (old form)
        'Text': 'text',
        'Long Text': 'longText',
        'Number': 'number',
        'Date': 'date',
        'Select': 'select',
        'Checkbox': 'checkbox',
        // Lowercase variants (new form)
        'text': 'text',
        'textarea': 'longText',
        'number': 'number',
        'date': 'date',
        'url': 'url',
        'email': 'email',
        'select': 'select',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fieldDocs = data.fields.map((f: any, index: number) => ({
        sectionId: newSection._id,
        name: f.name,
        type: typeMap[f.type] || 'text',
        isRequired: f.required,
        sortOrder: index
      }));

      await CustomField.insertMany(fieldDocs);
    }

    // Add to NavigationGroup if groups exist
    const groupName = newSection.group || "My Sections";
    let navGroup = await NavigationGroup.findOne({ userId, name: groupName });
    const groupCount = await NavigationGroup.countDocuments({ userId });
    
    if (!navGroup && groupCount > 0) {
      navGroup = new NavigationGroup({
        userId,
        name: groupName,
        sortOrder: groupCount,
        items: []
      });
    }
    
    if (navGroup) {
      navGroup.items.push({
        id: newSection.slug,
        type: 'custom',
        label: newSection.name,
        href: `/dashboard/custom/${newSection.slug}`,
        sortOrder: navGroup.items.length,
        isHidden: false
      });
      await navGroup.save();
    }

    return NextResponse.json({ message: "Section created", section: newSection });
  } catch (err: unknown) {
    const error = err as { code?: number };
    console.error("Custom Section Creation Error:", error);
    if (error.code === 11000) {
       return NextResponse.json({ error: "A section with this name already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
