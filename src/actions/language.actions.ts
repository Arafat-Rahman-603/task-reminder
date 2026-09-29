"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export async function updateUserLanguage(language: string) {
  try {
    const session = await getServerSession(authOptions);
    
    // Always set cookie for both guests and authenticated users
    const cookieStore = await cookies();
    cookieStore.set("NEXT_LOCALE", language, { path: "/", maxAge: 31536000 });

    if (session && session.user) {
      await dbConnect();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = (session.user as any).id;
      await User.findByIdAndUpdate(userId, { "preferences.language": language });
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
