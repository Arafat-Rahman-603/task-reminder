import { NextResponse } from "next/server";
import { updateCustomSection, deleteCustomSection } from "@/actions/customSection.actions";
import CustomSection from "@/models/custom/CustomSection";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "No session" });

    await dbConnect();
    const section = await CustomSection.findOne({});
    if (!section) return NextResponse.json({ error: "No section found to test" });

    const updateRes = await updateCustomSection(section._id.toString(), { name: section.name + " updated" });
    const deleteRes = await deleteCustomSection(section._id.toString());

    return NextResponse.json({
      updateRes,
      deleteRes
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack });
  }
}
