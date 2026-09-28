import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import CustomSection from "@/models/CustomSection";
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

    const newSection = new CustomSection({
      userId: new mongoose.Types.ObjectId(userId),
      name: data.name,
      slug,
      defaultView: data.defaultView,
      fields: data.fields
    });

    await newSection.save();

    return NextResponse.json({ message: "Section created", section: newSection });
  } catch (error: any) {
    console.error("Custom Section Creation Error:", error);
    if (error.code === 11000) {
       return NextResponse.json({ message: "A section with this name already exists." }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
