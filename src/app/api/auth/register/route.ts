import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { name, email, password, timezone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      preferences: {
        timezone: timezone || "UTC",
      },
    });

    try {
      // Provision personal workspace
      const { default: Workspace } = await import("@/models/Workspace");
      const { default: WorkspaceMembership } = await import("@/models/WorkspaceMembership");

      const personalWorkspace = await Workspace.create({
        name: "Personal Workspace",
        type: "personal",
        ownerId: newUser._id,
      });

      await WorkspaceMembership.create({
        workspaceId: personalWorkspace._id,
        userId: newUser._id,
        role: "owner",
      });
    } catch (wsError) {
      console.error("[REGISTER_WORKSPACE_ERROR]", wsError);
      // Rollback user creation if workspace initialization fails
      await User.findByIdAndDelete(newUser._id);
      return NextResponse.json({ message: "Unable to create your account right now. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ message: "User registered" }, { status: 201 });
  } catch (error) {
    // Only log the error category/message if it's an Error instance, avoid leaking full object structure
    const safeError = error instanceof Error ? error.message : "Unknown error";
    console.error("[REGISTER_ERROR] Failed to register user:", safeError);
    return NextResponse.json({ message: "Unable to create your account right now. Please try again." }, { status: 500 });
  }
}
