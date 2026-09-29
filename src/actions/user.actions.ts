"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateUserPreferences(preferences: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    // Use dot notation for nested fields to avoid overwriting the entire preferences object
    const updateQuery: Record<string, any> = {};
    for (const [key, value] of Object.entries(preferences)) {
      updateQuery[`preferences.${key}`] = value;
    }

    await User.findByIdAndUpdate(userId, { $set: updateQuery });

    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
