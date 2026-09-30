import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import CustomSection from "@/models/custom/CustomSection";
import CustomField from "@/models/custom/CustomField";
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
      name: data.name,
      slug: data.slug || slug,
      description: data.description || "",
      group: data.group || "My Sections",
      layout: layoutMap[data.defaultView] || data.layout || 'list',
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

    return NextResponse.json({ message: "Section created", section: newSection });
  } catch (err: unknown) {
    const error = err as any;
    console.error("Custom Section Creation Error:", error);
    if (error.code === 11000) {
       return NextResponse.json({ message: "A section with this name already exists." }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
