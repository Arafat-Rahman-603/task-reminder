import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from '@/models/User';

import Task from '@/models/Task';
import Note from '@/models/Note';
import Idea from '@/models/Idea';
import CustomRecord from '@/models/custom/CustomRecord';
import VaultItem from '@/models/VaultItem';
import Transaction from '@/models/Transaction';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "1234567890",
  api_secret: process.env.CLOUDINARY_API_SECRET || "dummy_secret",
});

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return false;
  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await User.findById((session.user as any).id).lean();
  return user?.isPlatformAdmin === true;
}

async function getAllPublicIds() {
  const models = [
    { name: 'Task', model: Task },
    { name: 'Note', model: Note },
    { name: 'Idea', model: Idea },
    { name: 'CustomRecord', model: CustomRecord },
    { name: 'VaultItem', model: VaultItem },
    { name: 'Transaction', model: Transaction },
    { name: 'User', model: User },
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
          { imageId: { $exists: true } }
        ]
      });
    }

    for (const record of records) {
      if (record.attachments) {
        for (const att of record.attachments) {
          if (att.publicId) publicIds.add(att.publicId);
        }
      }
      if (record.receiptPublicId) publicIds.add(record.receiptPublicId);
      if (record.avatarPublicId) publicIds.add(record.avatarPublicId);
      if (record.imageId) publicIds.add(record.imageId);
      
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

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const results: any[] = [];
    let totalMigrated = 0;
    let totalFailed = 0;

    const publicIds = await getAllPublicIds();
    
    if (publicIds.length > 0) {
      results.push(`Found ${publicIds.length} total DB attachments.`);

            const isTestEnv = process.env.NODE_ENV === 'test';
            for (const publicId of publicIds) {
              try {
                if (isTestEnv) {
                  results.push(`[DRY RUN] Would migrate: ${publicId}`);
                  continue;
                }
                let details = null;
                for (const type of ['image', 'video', 'raw']) {
                  details = await cloudinary.api.resource(publicId, { resource_type: type }).catch(() => null);
                  if (details) break;
                }

                if (details) {
                  if (details.type === "upload") {
                    results.push(`[DRY RUN] Would migrate: ${publicId} (type: ${details.resource_type})`);
                  } else {
                    results.push(`Already secured: ${publicId} (type: ${details.type}, resource_type: ${details.resource_type})`);
                  }
                } else {
                  let authDetails = null;
                  for (const type of ['image', 'video', 'raw']) {
                    authDetails = await cloudinary.api.resource(publicId, { type: "authenticated", resource_type: type }).catch(() => null);
                    if (authDetails) break;
                  }

                  if (authDetails) {
                    results.push(`Already secured: ${publicId} (type: authenticated, resource_type: ${authDetails.resource_type})`);
                  } else {
                    results.push(`Not found on Cloudinary: ${publicId}`);
                    totalFailed++;
                  }
                }
              } catch (e: any) {
                results.push(`Error on ${publicId}: ${e.message}`);
                totalFailed++;
              }
            }
              for (const type of ['image', 'video', 'raw']) {
                authDetails = await cloudinary.api.resource(publicId, { type: "authenticated", resource_type: type }).catch(() => null);
                if (authDetails) break;
              }
              
              if (authDetails) {
                results.push(`Already secured: ${publicId} (type: authenticated, resource_type: ${authDetails.resource_type})`);
              } else {
                results.push(`Not found on Cloudinary: ${publicId}`);
                totalFailed++;
              }
            }
        } catch (e: any) {
          results.push(`Error on ${publicId}: ${e.message}`);
          totalFailed++;
        }
      }
    }

    return NextResponse.json({ success: true, dryRun: true, totalMigrated, totalFailed, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { publicIds: sampleIds, migrateAll, forceStagingOverride } = body;
    
    if (!migrateAll && (!Array.isArray(sampleIds) || sampleIds.length === 0)) {
      return NextResponse.json({ error: "Provide an array of publicIds for sample migration or migrateAll: true for full migration." }, { status: 400 });
    }

    const mongoUri = process.env.MONGODB_URI || "";
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
    const isStagingEnv = mongoUri.includes("staging") && cloudName.includes("staging");
    
    if (!isStagingEnv && !forceStagingOverride) {
      return NextResponse.json({ error: "Environment validation failed. The DB or Cloudinary credentials do not appear to be 'staging'." }, { status: 403 });
    }

    await dbConnect();
    const results: any[] = [];
    let totalMigrated = 0;
    let totalFailed = 0;

    const allDbPublicIds = new Set(await getAllPublicIds());
    const validSampleIds = (sampleIds || []).filter((id: string) => allDbPublicIds.has(id));
    
    if (!migrateAll && validSampleIds.length !== sampleIds.length) {
      const invalid = sampleIds.filter((id: string) => !allDbPublicIds.has(id));
      return NextResponse.json({ error: "Some sample IDs do not exist in the database.", invalid }, { status: 400 });
    }

    const idsToMigrate = migrateAll ? Array.from(allDbPublicIds) : validSampleIds;

    if (idsToMigrate.length > 0) {
      results.push(`Attempting to migrate ${idsToMigrate.length} attachments.`);
      for (const publicId of idsToMigrate) {
        try {
            let details = null;
            for (const type of ['image', 'video', 'raw']) {
              details = await cloudinary.api.resource(publicId as string, { resource_type: type }).catch(() => null);
              if (details) break;
            }

            if (details) {
              if (details.type === "upload") {
                await cloudinary.uploader.rename(publicId as string, publicId as string, { 
                  to_type: "authenticated",
                  resource_type: details.resource_type,
                  invalidate: true
                });
                results.push(`Migrated: ${publicId} (type: ${details.resource_type})`);
                totalMigrated++;
              } else {
                results.push(`Already secured: ${publicId} (type: ${details.type}, resource_type: ${details.resource_type})`);
              }
            } else {
              let authDetails = null;
              for (const type of ['image', 'video', 'raw']) {
                authDetails = await cloudinary.api.resource(publicId as string, { type: "authenticated", resource_type: type }).catch(() => null);
                if (authDetails) break;
              }

              if (authDetails) {
                results.push(`Already secured: ${publicId} (type: authenticated, resource_type: ${authDetails.resource_type})`);
              } else {
                results.push(`Not found on Cloudinary: ${publicId}`);
                totalFailed++;
              }
            }
        } catch (e: any) {
          results.push(`Error migrating ${publicId}: ${e.message}`);
          totalFailed++;
        }
      }
    }

    return NextResponse.json({ success: true, dryRun: false, totalMigrated, totalFailed, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

