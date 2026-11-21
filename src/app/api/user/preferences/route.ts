import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NotificationPreference } from "@/models/NotificationPreference";
import mongoose from "mongoose";
import { z } from "zod";
import { sanitizePreferencesForClient } from "@/lib/sanitize-preferences";

const preferencesUpdateSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  currency: z.string().trim().min(1).max(16).optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
  modules: z.record(z.string(), z.boolean()).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = session.user.id;
    const user = await User.findById(userId).select("preferences").lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const preferences = user.preferences as Record<string, unknown> | undefined;

    // If User timezone is not set, check NotificationPreference
    let finalTimezone = preferences?.timezone;
    if (!finalTimezone) {
      const notifPref = await NotificationPreference.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      finalTimezone = notifPref?.timezone || "UTC";
    }

    const sanitized = sanitizePreferencesForClient(preferences);
    return NextResponse.json({
      preferences: {
        ...sanitized,
        timezone: finalTimezone,
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

    const rawBody = await req.json();
    const parsed = preferencesUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid preferences payload", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;
    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (data.theme !== undefined) user.preferences.theme = data.theme;
    if (data.currency !== undefined) user.preferences.currency = data.currency;
    if (data.timezone !== undefined) user.preferences.timezone = data.timezone;

    // Merge modules into the Mongoose Map
    if (data.modules && typeof data.modules === "object") {
      for (const [key, value] of Object.entries(data.modules)) {
        user.preferences.modules.set(key, Boolean(value));
      }
    }

    await user.save();

    // Sync timezone to NotificationPreference if it was changed
    if (data.timezone) {
      await NotificationPreference.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $set: { timezone: data.timezone } },
        { upsert: true }
      );
    }

    const sanitized = sanitizePreferencesForClient(user.preferences);
    return NextResponse.json({
      message: "Preferences updated successfully",
      preferences: sanitized,
    });
  } catch (error) {
    console.error("Preferences POST Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
