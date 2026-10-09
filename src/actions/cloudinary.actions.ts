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

export async function uploadImage(base64Image: string, folder: string = "manageo/general"): Promise<{ success: boolean; url?: string; publicId?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await cloudinary.uploader.upload(base64Image, {
      folder,
    });

    return { success: true, url: result.secure_url, publicId: result.public_id };
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return { success: false, error: error.message || "Failed to upload image" };
  }
}

export async function deleteImage(publicId: string): Promise<{ success: boolean; error?: string }> {
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

export async function deleteAttachments(attachments: { publicId: string }[] | undefined): Promise<void> {
  if (!attachments || !attachments.length) return;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return;

    for (const att of attachments) {
      if (att.publicId) {
        await cloudinary.uploader.destroy(att.publicId).catch(err => {
          console.error(`Failed to delete attachment ${att.publicId}:`, err);
        });
      }
    }
  } catch (error) {
    console.error("Error during deleteAttachments:", error);
  }
}

export async function uploadFile(formData: FormData, folder: string = "manageo/general"): Promise<{ success: boolean; url?: string; publicId?: string; resourceType?: string; originalFilename?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder, 
          resource_type: "auto",
          use_filename: true,
          unique_filename: true
        },
        (error, result) => {
          if (error || !result) {
            console.error("Cloudinary upload error:", error);
            resolve({ success: false, error: error?.message || "Failed to upload file" });
          } else {
            resolve({ 
              success: true, 
              url: result.secure_url, 
              publicId: result.public_id,
              resourceType: result.resource_type,
              originalFilename: file.name
            });
          }
        }
      );
      
      uploadStream.end(buffer);
    });
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return { success: false, error: error.message || "Failed to upload file" };
  }
}
