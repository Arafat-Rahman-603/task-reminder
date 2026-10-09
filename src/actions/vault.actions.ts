"use server";

import dbConnect from "@/lib/db";
import VaultItem from "@/models/VaultItem";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { deleteAttachments, deleteImage } from "./cloudinary.actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getVaultItems(): Promise<{ success: boolean; items?: any[]; vaultSettings?: any; error?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session || !(session.user as any)?.id) {
      return { success: false, error: "Unauthorized" };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const items = await VaultItem.find({ userId }).sort({ createdAt: -1 }).lean();
    const user = await User.findById(userId).select("preferences.vaultSettings").lean();

    return { 
      success: true, 
      items: JSON.parse(JSON.stringify(items)),
      vaultSettings: user?.preferences?.vaultSettings || { maxFailedAttempts: 3, lockoutDurationSeconds: 30 }
    };
  } catch (error) {
    console.error("Failed to fetch vault items:", error);
    return { success: false, error: "Failed to fetch vault items" };
  }
}

export async function createVaultItem(data: {
  title: string;
  category: string;
  encryptedData: string;
  iv: string;
  salt: string;
  isCustomPassword?: boolean;
  imageUrl?: string;
  imageId?: string;
  attachments?: { url: string; publicId: string; resourceType?: string; originalFilename?: string; }[];
  customPasswordPlaintext?: string;
  plaintextData?: string; // If provided, server will encrypt it
}) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session || !(session.user as any)?.id) {
      return { success: false, error: "Unauthorized" };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    let customPasswordHash;
    if (data.isCustomPassword && data.customPasswordPlaintext) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      customPasswordHash = await bcrypt.hash(data.customPasswordPlaintext, salt);
    }

    let finalEncryptedData = data.encryptedData;
    let finalIv = data.iv;
    let finalSalt = data.salt;

    // Server-side encryption if plaintext is provided (avoids needing password on client)
    if (data.plaintextData) {
      const crypto = require('crypto');
      const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-key-do-not-use-in-prod";
      const vaultKey = crypto.createHash('sha256').update(userId + secret).digest('hex');
      
      const saltBuffer = crypto.randomBytes(16);
      const ivBuffer = crypto.randomBytes(12);
      
      // PBKDF2 to derive AES key exactly like client WebCrypto does
      const keyBuffer = crypto.pbkdf2Sync(vaultKey, saltBuffer, 100000, 32, 'sha256');
      
      const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, ivBuffer);
      const encryptedBuffer = Buffer.concat([cipher.update(data.plaintextData, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();
      
      // WebCrypto appends the auth tag to the end of the ciphertext
      const finalCiphertext = Buffer.concat([encryptedBuffer, authTag]);
      
      finalEncryptedData = finalCiphertext.toString('base64');
      finalIv = ivBuffer.toString('base64');
      finalSalt = saltBuffer.toString('base64');
    }
    
    // Create copy without plaintext/passwords
    const { customPasswordPlaintext, plaintextData, ...itemData } = data;

    const newItem = await VaultItem.create({
      ...itemData,
      encryptedData: finalEncryptedData,
      iv: finalIv,
      salt: finalSalt,
      customPasswordHash,
      imageUrl: itemData.imageUrl,
      imageId: itemData.imageId,
      attachments: itemData.attachments,
      userId
    });

    return { success: true, item: JSON.parse(JSON.stringify(newItem)) };
  } catch (error) {
    console.error("Failed to create vault item:", error);
    return { success: false, error: "Failed to create vault item" };
  }
}

export async function updateVaultItem(id: string, data: {
  title?: string;
  category?: string;
  encryptedData?: string;
  iv?: string;
  salt?: string;
  isCustomPassword?: boolean;
  imageUrl?: string;
  imageId?: string;
  attachments?: { url: string; publicId: string; resourceType?: string; originalFilename?: string; }[];
}) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session || !(session.user as any)?.id) {
      return { success: false, error: "Unauthorized" };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const oldItem = await VaultItem.findOne({ _id: id, userId });

    const updatedItem = await VaultItem.findOneAndUpdate(
      { _id: id, userId },
      data,
      { returnDocument: "after" }
    ).lean();

    if (!updatedItem) {
      return { success: false, error: "Item not found" };
    }

    if (oldItem && updatedItem && oldItem.attachments) {
      const newAttIds = new Set(updatedItem.attachments?.map((a: any) => a.publicId) || []);
      const removedAtts = oldItem.attachments.filter((a: any) => !newAttIds.has(a.publicId));
      if (removedAtts.length > 0) deleteAttachments(removedAtts).catch(console.error);
    }

    return { success: true, item: JSON.parse(JSON.stringify(updatedItem)) };
  } catch (error) {
    console.error("Failed to update vault item:", error);
    return { success: false, error: "Failed to update vault item" };
  }
}

export async function deleteVaultItem(id: string) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session || !(session.user as any)?.id) {
      return { success: false, error: "Unauthorized" };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const deletedItem = await VaultItem.findOneAndDelete({ _id: id, userId });

    if (!deletedItem) {
      return { success: false, error: "Item not found" };
    }

    if (deletedItem.attachments?.length > 0) deleteAttachments(deletedItem.attachments).catch(console.error);
    if (deletedItem.imageId) deleteImage(deletedItem.imageId).catch(console.error);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete vault item:", error);
    return { success: false, error: "Failed to delete vault item" };
  }
}


