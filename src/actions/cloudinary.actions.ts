"use server";

import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "1234567890",
  api_secret: process.env.CLOUDINARY_API_SECRET || "dummy_secret",
});

export async function uploadVaultImage(base64Image: string): Promise<{ success: boolean; url?: string; publicId?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Attempt upload
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: "manageo/vault",
    });

    return { success: true, url: result.secure_url, publicId: result.public_id };
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return { success: false, error: error.message || "Failed to upload image" };
  }
}

export async function deleteVaultImage(publicId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error: any) {
    console.error("Cloudinary delete error:", error);
    return { success: false, error: error.message || "Failed to delete image" };
  }
}
