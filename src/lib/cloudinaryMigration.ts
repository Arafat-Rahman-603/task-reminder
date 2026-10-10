import dbConnect from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';
import Task from '@/models/Task';
import Note from '@/models/Note';
import Idea from '@/models/Idea';
import CustomRecord from '@/models/custom/CustomRecord';
import VaultItem from '@/models/VaultItem';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import Invoice from '@/models/Invoice';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "1234567890",
  api_secret: process.env.CLOUDINARY_API_SECRET || "dummy_secret",
});

export const MAX_SAMPLE_SIZE = 50;

export type CloudinaryErrorCategory = 'NOT_FOUND' | 'AUTH_ERROR' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'API_ERROR';

export interface CategorizedError {
  category: CloudinaryErrorCategory;
  message: string;
  statusCode?: number;
}

interface CloudinaryErrorLike {
  http_code?: number;
  status?: number;
  statusCode?: number;
  message?: string;
  code?: string;
  name?: string;
  error?: {
    http_code?: number;
    message?: string;
  };
}

export function categorizeCloudinaryError(error: unknown): CategorizedError {
  if (!error) {
    return { category: 'API_ERROR', message: 'Unknown error' };
  }

  const err = error as CloudinaryErrorLike;
  const statusCode = err.http_code || err.error?.http_code || err.status || err.statusCode;
  const rawMessage = err.message || err.error?.message || (typeof error === 'string' ? error : 'Cloudinary API error');
  const message = String(rawMessage);
  const lowerMsg = message.toLowerCase();

  // 1. Genuinely Missing (404)
  if (statusCode === 404 || lowerMsg.includes('not found') || lowerMsg.includes('does not exist')) {
    return { category: 'NOT_FOUND', message, statusCode: 404 };
  }

  // 2. Authentication Failure (401 / 403)
  if (
    statusCode === 401 ||
    statusCode === 403 ||
    lowerMsg.includes('invalid api_key') ||
    lowerMsg.includes('invalid api key') ||
    lowerMsg.includes('must supply api_key') ||
    lowerMsg.includes('unauthorized') ||
    lowerMsg.includes('not authorized')
  ) {
    return { category: 'AUTH_ERROR', message, statusCode: statusCode || 401 };
  }

  // 3. Rate Limit Exceeded (420 / 429)
  if (
    statusCode === 420 ||
    statusCode === 429 ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('limit exceeded') ||
    lowerMsg.includes('quota exceeded')
  ) {
    return { category: 'RATE_LIMIT', message, statusCode: statusCode || 429 };
  }

  // 4. Network / Connectivity Error
  if (
    err.code === 'ENOTFOUND' ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'ECONNRESET' ||
    err.code === 'ECONNREFUSED' ||
    err.name === 'FetchError' ||
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('econnrefused') ||
    lowerMsg.includes('network error')
  ) {
    return { category: 'NETWORK_ERROR', message };
  }

  // 5. Other Cloudinary API / Server Error
  return { category: 'API_ERROR', message, statusCode };
}

export function verifyStagingEnvironment(): { valid: boolean; error?: string } {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const explicitApprovedStaging = (
    process.env.APPROVED_STAGING_CLOUD_NAME ||
    process.env.STAGING_CLOUDINARY_CLOUD_NAME ||
    ""
  ).trim();
  const approvedStagingName = (explicitApprovedStaging || "manageo-staging").trim();

  if (!cloudName) {
    return { valid: false, error: "Environment validation failed: CLOUDINARY_CLOUD_NAME is not configured." };
  }

  const lowerCloudName = cloudName.toLowerCase();
  if (
    lowerCloudName === "demo" ||
    lowerCloudName.includes("prod") ||
    lowerCloudName === "manageo-production" ||
    lowerCloudName === "exgn3nrd"
  ) {
    return {
      valid: false,
      error: `Environment validation failed: Cloudinary environment "${cloudName}" is classified as production/live and is strictly prohibited for staging migration. Migration can only target the approved staging environment.`
    };
  }

  // If explicit approval variable is set, it MUST match strictly.
  // Otherwise, default fallback requires the configured name to be 'manageo-staging' or contain 'staging'.
  const isApproved = explicitApprovedStaging
    ? lowerCloudName === explicitApprovedStaging.toLowerCase()
    : (lowerCloudName === "manageo-staging" || lowerCloudName.includes("staging"));

  if (!isApproved) {
    return {
      valid: false,
      error: `Environment validation failed: Configured Cloudinary environment "${cloudName}" does not match approved staging target ("${approvedStagingName}").`
    };
  }

  return { valid: true };
}

export async function getAllPublicIds(): Promise<string[]> {
  await dbConnect();
  const models = [
    { name: 'Task', model: Task },
    { name: 'Note', model: Note },
    { name: 'Idea', model: Idea },
    { name: 'CustomRecord', model: CustomRecord },
    { name: 'VaultItem', model: VaultItem },
    { name: 'Transaction', model: Transaction },
    { name: 'User', model: User },
    { name: 'Invoice', model: Invoice },
  ];

  const publicIds = new Set<string>();
  for (const { name, model } of models) {
    let records = [];
    if (name === 'CustomRecord') {
      records = await model.find({});
    } else {
      records = await model.find({
        $or: [
          { "attachments.0": { $exists: true } },
          { receiptPublicId: { $exists: true } },
          { avatarPublicId: { $exists: true } },
          { imageId: { $exists: true } },
          { pdfPublicId: { $exists: true } }
        ]
      });
    }

    for (const record of records) {
      if (record.attachments) {
        for (const att of record.attachments) {
          if (att?.publicId) publicIds.add(att.publicId);
        }
      }
      if (record.receiptPublicId) publicIds.add(record.receiptPublicId);
      if (record.avatarPublicId) publicIds.add(record.avatarPublicId);
      if (record.imageId) publicIds.add(record.imageId);
      if (record.pdfPublicId) publicIds.add(record.pdfPublicId);
      
      if (name === 'CustomRecord' && record.data) {
        const entries = record.data instanceof Map ? Array.from(record.data.values()) : Object.values(record.data);
        for (const value of entries) {
          if (Array.isArray(value)) {
            for (const att of value) {
              if (att && att.publicId) publicIds.add(att.publicId);
            }
          }
        }
      }
    }
  }
  return Array.from(publicIds);
}

export type AssetStatusResult =
  | { state: 'already_secured'; details: Record<string, unknown>; resourceType: 'image' | 'video' | 'raw' }
  | { state: 'needs_migration'; details: Record<string, unknown>; resourceType: 'image' | 'video' | 'raw' }
  | { state: 'not_found'; publicId: string }
  | { state: 'error'; error: CategorizedError; publicId: string };

export async function inspectCloudinaryAsset(publicId: string): Promise<AssetStatusResult> {
  const resourceTypes: Array<'image' | 'video' | 'raw'> = ['image', 'video', 'raw'];

  // 1. Check if already secured under type: "authenticated"
  let authenticatedNotFoundCount = 0;
  for (const rt of resourceTypes) {
    try {
      const details = (await cloudinary.api.resource(publicId, {
        type: 'authenticated',
        resource_type: rt
      })) as Record<string, unknown>;

      if (details) {
        if (details.type === 'authenticated') {
          return { state: 'already_secured', details, resourceType: rt };
        }
      }
    } catch (err: unknown) {
      const categorized = categorizeCloudinaryError(err);
      if (categorized.category === 'NOT_FOUND') {
        authenticatedNotFoundCount++;
      } else {
        return { state: 'error', error: categorized, publicId };
      }
    }
  }

  // 2. Check if present under type: "upload" (public)
  let uploadNotFoundCount = 0;
  for (const rt of resourceTypes) {
    try {
      const details = (await cloudinary.api.resource(publicId, {
        type: 'upload',
        resource_type: rt
      })) as Record<string, unknown>;

      if (details) {
        if (details.type === 'authenticated') {
          return { state: 'already_secured', details, resourceType: rt };
        }

        // Needs migration to 'authenticated' so the proxy can serve it securely
        return { state: 'needs_migration', details, resourceType: rt };
      }
    } catch (err: unknown) {
      const categorized = categorizeCloudinaryError(err);
      if (categorized.category === 'NOT_FOUND') {
        uploadNotFoundCount++;
      } else {
        return { state: 'error', error: categorized, publicId };
      }
    }
  }

  // 3. Only when both authenticated and upload returned 404 for ALL resource types:
  if (authenticatedNotFoundCount === resourceTypes.length && uploadNotFoundCount === resourceTypes.length) {
    return { state: 'not_found', publicId };
  }

  return {
    state: 'error',
    error: { category: 'API_ERROR', message: `Inconclusive inspection for asset ${publicId}` },
    publicId
  };
}
