"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Workspace from "@/models/Workspace";
import WorkspaceMembership from "@/models/WorkspaceMembership";

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

export async function updateAccountType(newType: "individual" | "team_owner") {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (newType === "team_owner" && user.accountType !== "team_owner") {
      // Must ensure they have a team workspace
      const teamWorkspace = await Workspace.findOne({ ownerId: userId, type: "team" });
      if (!teamWorkspace) {
        const ws = await Workspace.create({
          name: `${user.name}'s Team`,
          type: "team",
          ownerId: userId,
        });
        await WorkspaceMembership.create({
          workspaceId: ws._id,
          userId: userId,
          role: "owner",
        });
      }
    }
    
    // We update account type in both cases
    user.accountType = newType;
    await user.save();
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
