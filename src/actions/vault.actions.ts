"use server";

import dbConnect from "@/lib/db";
import VaultItem from "@/models/VaultItem";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { deleteAttachments } from "./cloudinary.actions";
import { deriveVaultKey } from "@/lib/vault-key";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getVaultItems(): Promise<{ success: boolean; items?: unknown[]; vaultSettings?: Record<string, unknown>; error?: string }> {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = session.user.id;

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
  customPasswordPlaintext?: string; // If provided, server will encrypt it
  notes?: string;
  website?: string;
  iconEmoji?: string;
  plaintextData?: string; // If provided, server will encrypt it
}) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = session.user.id;

    let customPasswordHash;
    if (data.isCustomPassword && data.customPasswordPlaintext) {
      const salt = await bcrypt.genSalt(10);
      customPasswordHash = await bcrypt.hash(data.customPasswordPlaintext, salt);
    }

    let finalEncryptedData = data.encryptedData;
    let finalIv = data.iv;
    let finalSalt = data.salt;

    // Server-side encryption if plaintext is provided (avoids needing password on client)
    if (data.plaintextData) {
      const crypto = require('crypto');
      const vaultKey = deriveVaultKey(userId);
      
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
    const { customPasswordPlaintext: _customPasswordPlaintext, plaintextData: _plaintextData, ...itemData } = data;

    const newItem = await VaultItem.create({
      ...itemData,
      title: itemData.title.trim(),
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
  customPasswordPlaintext?: string;
  plaintextData?: string;
  verificationPassword?: string;
  imageUrl?: string;
  imageId?: string;
  attachments?: { url: string; publicId: string; resourceType?: string; originalFilename?: string; }[];
  notes?: string;
  website?: string;
  iconEmoji?: string;
}) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = session.user.id;

    const oldItem = await VaultItem.findOne({ _id: id, userId });
    if (!oldItem) {
      return { success: false, error: "Item not found" };
    }

    if (!data.verificationPassword) {
      return { success: false, error: "Password verification is required to save changes" };
    }

    const user = await User.findById(userId);
    const vSettings = user?.preferences?.vaultSettings;
    const now = new Date();
    if (vSettings?.lockedUntil && new Date(vSettings.lockedUntil) > now) {
      const remainingSeconds = Math.ceil((new Date(vSettings.lockedUntil).getTime() - now.getTime()) / 1000);
      return { success: false, error: `Vault locked. Please wait ${remainingSeconds}s.` };
    }

    let isPasswordValid = false;
    if (oldItem.isCustomPassword && oldItem.customPasswordHash) {
      isPasswordValid = await bcrypt.compare(data.verificationPassword, oldItem.customPasswordHash);
    } else if (vSettings?.vaultPasswordHash) {
      isPasswordValid = await bcrypt.compare(data.verificationPassword, vSettings.vaultPasswordHash);
    } else if (user?.passwordHash) {
      isPasswordValid = await bcrypt.compare(data.verificationPassword, user.passwordHash);
    }

    if (!isPasswordValid) {
      if (user) {
        const currentFailed = (vSettings?.failedAttempts || 0) + 1;
        const maxAttempts = vSettings?.maxFailedAttempts || 3;
        const lockoutSeconds = vSettings?.lockoutDurationSeconds || 30;
        if (currentFailed >= maxAttempts) {
          const lockedUntil = new Date(Date.now() + lockoutSeconds * 1000);
          await User.updateOne(
            { _id: userId },
            {
              $set: {
                "preferences.vaultSettings.failedAttempts": 0,
                "preferences.vaultSettings.lockedUntil": lockedUntil,
              },
            }
          );
          return { success: false, error: `Too many failed attempts. Vault locked for ${lockoutSeconds} seconds.` };
        }
        await User.updateOne(
          { _id: userId },
          { $set: { "preferences.vaultSettings.failedAttempts": currentFailed } }
        );
        return {
          success: false,
          error: `${oldItem.isCustomPassword ? "Incorrect custom password" : "Incorrect vault password"}. ${maxAttempts - currentFailed} attempts remaining.`,
        };
      }
      return { success: false, error: "Incorrect password. Changes were not saved." };
    }

    if (user && (vSettings?.failedAttempts || vSettings?.lockedUntil)) {
      await User.updateOne(
        { _id: userId },
        {
          $set: {
            "preferences.vaultSettings.failedAttempts": 0,
            "preferences.vaultSettings.lockedUntil": null,
          },
        }
      );
    }

    let customPasswordHash = oldItem.customPasswordHash;
    if (data.isCustomPassword === false) {
      customPasswordHash = null;
    } else if (data.isCustomPassword && data.customPasswordPlaintext) {
      const salt = await bcrypt.genSalt(10);
      customPasswordHash = await bcrypt.hash(data.customPasswordPlaintext, salt);
    }

    let finalEncryptedData = data.encryptedData || oldItem.encryptedData;
    let finalIv = data.iv || oldItem.iv;
    let finalSalt = data.salt || oldItem.salt;

    // Server-side encryption if plaintext is provided (avoids needing password on client)
    if (data.plaintextData) {
      const crypto = require('crypto');
      const vaultKey = deriveVaultKey(userId);
      
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

    const updateFields: Record<string, unknown> = {
      title: data.title !== undefined ? data.title.trim() : oldItem.title,
      category: data.category ?? oldItem.category,
      encryptedData: finalEncryptedData,
      iv: finalIv,
      salt: finalSalt,
      isCustomPassword: data.isCustomPassword !== undefined ? data.isCustomPassword : oldItem.isCustomPassword,
      customPasswordHash,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : oldItem.imageUrl,
      imageId: data.imageId !== undefined ? data.imageId : oldItem.imageId,
      attachments: data.attachments !== undefined ? data.attachments : oldItem.attachments,
      notes: data.notes !== undefined ? data.notes : oldItem.notes,
      website: data.website !== undefined ? data.website : oldItem.website,
      iconEmoji: data.iconEmoji !== undefined ? data.iconEmoji : oldItem.iconEmoji,
    };

    const updateQuery: Record<string, unknown> = { $set: updateFields };
    if (data.isCustomPassword === false) {
      updateQuery.$unset = { customPasswordHash: 1 };
      delete updateFields.customPasswordHash;
    }

    const updatedItem = await VaultItem.findOneAndUpdate(
      { _id: id, userId },
      updateQuery,
      { returnDocument: "after" }
    ).lean();

    if (!updatedItem) {
      return { success: false, error: "Item not found" };
    }

    if (oldItem && updatedItem && oldItem.attachments) {
      interface AttachmentItem { publicId: string; url?: string; resourceType?: string; originalFilename?: string; }
      const newAttIds = new Set(((updatedItem.attachments as AttachmentItem[]) || []).map((a) => a.publicId));
      const removedAtts = ((oldItem.attachments as AttachmentItem[]) || []).filter((a) => !newAttIds.has(a.publicId));
      if (removedAtts.length > 0) deleteAttachments(removedAtts).catch(console.error);
    }

    revalidatePath("/dashboard/vault");
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
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = session.user.id;
    const item = await VaultItem.findOne({ _id: id, userId });
    if (!item) return { success: false, error: "Item not found" };
    const { moveToTrash } = await import("@/actions/trash.actions");
    const res = await moveToTrash("VaultItem", id);
    if (!res.success) return { success: false, error: res.error };
    

    return { success: true };
  } catch (error) {
    console.error("Failed to delete vault item:", error);
    return { success: false, error: "Failed to delete vault item" };
  }
}


