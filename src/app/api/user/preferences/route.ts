import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const user = await User.findById(userId).select("preferences").lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Convert Mongoose Map to plain object for JSON serialization
    const preferences = user.preferences as any;
    const modulesObj = preferences?.modules instanceof Map
      ? Object.fromEntries(preferences.modules)
      : preferences?.modules || {};

    return NextResponse.json({
      preferences: {
        ...preferences,
        modules: modulesObj,
      }
    });
  } catch (error) {
    console.error("Preferences GET Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

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
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (data.theme !== undefined) user.preferences.theme = data.theme;
    if (data.currency !== undefined) user.preferences.currency = data.currency;

    // Merge modules into the Mongoose Map
    if (data.modules && typeof data.modules === "object") {
      for (const [key, value] of Object.entries(data.modules)) {
        user.preferences.modules.set(key, Boolean(value));
      }
    }

    await user.save();

    // Serialize Map to object for response
    const modulesObj = Object.fromEntries(user.preferences.modules);
    return NextResponse.json({
      message: "Preferences updated successfully",
      preferences: { ...user.preferences.toObject?.() ?? user.preferences, modules: modulesObj }
    });
  } catch (error) {
    console.error("Preferences POST Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
