import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from '@/models/User';
import {
  MAX_SAMPLE_SIZE,
  categorizeCloudinaryError,
  verifyStagingEnvironment,
  getAllPublicIds,
  inspectCloudinaryAsset
} from '@/lib/cloudinaryMigration';

async function verifyAdmin(): Promise<{ authorized: boolean; status: number; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { authorized: false, status: 401, error: "Unauthorized: Active session required." };
  }
  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await User.findById((session.user as any).id).lean();
  if (!user || user.isPlatformAdmin !== true) {
    return { authorized: false, status: 403, error: "Forbidden: Platform Admin authorization required." };
  }
  return { authorized: true, status: 200 };
}

export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await dbConnect();
    const publicIds = await getAllPublicIds();

    return NextResponse.json({
      success: true,
      readOnly: true,
      dryRun: true,
      totalDbAssets: publicIds.length,
      publicIds,
      message: `Database inventory scan completed. Found ${publicIds.length} unique asset references across all models.`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authorization: Platform Admin only
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // 2. Environment Verification: Configured Cloudinary environment must match approved Staging target
    const envCheck = verifyStagingEnvironment();
    if (!envCheck.valid) {
      return NextResponse.json({ error: envCheck.error }, { status: 403 });
    }

    // 3. Request Body Validation
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const mode = body?.mode;
    const publicIds = body?.publicIds;
    const dryRun = body?.dryRun;
    const confirmMutation = body?.confirmMutation;
    const confirmAll = body?.confirmAll;

    // Mode validation: Never silently fall back to migrating all assets
    if (mode !== 'sample' && mode !== 'all') {
      return NextResponse.json({
        error: "Explicit mode required. Specify mode: 'sample' with a bounded allowlist of publicIds, or mode: 'all' with confirmAll: true. Migration will never silently fall back to migrating all assets."
      }, { status: 400 });
    }

    await dbConnect();
    const allDbPublicIds = await getAllPublicIds();
    const dbIdSet = new Set(allDbPublicIds);

    let idsToMigrate: string[] = [];

    if (mode === 'sample') {
      // Validate sample allowlist
      if (!Array.isArray(publicIds) || publicIds.length === 0) {
        return NextResponse.json({
          error: "Sample mode requires a non-empty array of publicIds."
        }, { status: 400 });
      }

      if (publicIds.length > MAX_SAMPLE_SIZE) {
        return NextResponse.json({
          error: `Sample size exceeds bounded limit of ${MAX_SAMPLE_SIZE} assets. Received ${publicIds.length}.`
        }, { status: 400 });
      }

      const hasInvalidTypes = publicIds.some((id: unknown) => typeof id !== 'string' || !id.trim());
      if (hasInvalidTypes) {
        return NextResponse.json({
          error: "All publicIds in sample allowlist must be non-empty strings."
        }, { status: 400 });
      }

      // Validate every selected ID against the actual Staging database inventory
      const sampleList = publicIds as string[];
      const invalidIds = sampleList.filter((id: string) => !dbIdSet.has(id));
      if (invalidIds.length > 0) {
        return NextResponse.json({
          error: "Some sample IDs do not exist in the database inventory.",
          invalidIds
        }, { status: 400 });
      }

      // Bounded unique allowlist
      idsToMigrate = Array.from(new Set(sampleList));
    } else {
      // mode === 'all'
      if (confirmAll !== true) {
        return NextResponse.json({
          error: "Full migration requires explicit confirmAll: true. Never silently migrating all assets."
        }, { status: 400 });
      }
      idsToMigrate = allDbPublicIds;
    }

    // 4. Mutation Intent vs Dry Run
    // Defaults to true (safe dry run) unless dryRun is explicitly false
    const isDryRun = dryRun !== false;

    if (!isDryRun && confirmMutation !== true) {
      return NextResponse.json({
        error: "Explicit mutation intent required. When dryRun: false, confirmMutation: true must be provided."
      }, { status: 400 });
    }

    // 5. Execution (Dry-Run or Mutation)
    const results: string[] = [];
    let totalMigrated = 0;
    let totalAlreadySecured = 0;
    let totalWouldMigrate = 0;
    let totalFailed = 0;

    results.push(`Processing ${idsToMigrate.length} asset(s) in mode: '${mode}' (dryRun: ${isDryRun}).`);

    for (const publicId of idsToMigrate) {
      try {
        const inspection = await inspectCloudinaryAsset(publicId);

        if (inspection.state === 'error') {
          results.push(`[${inspection.error.category}] Error on ${publicId}: ${inspection.error.message}`);
          totalFailed++;
        } else if (inspection.state === 'not_found') {
          results.push(`Not found on Cloudinary: ${publicId}`);
          totalFailed++;
        } else if (inspection.state === 'already_secured') {
          results.push(`Already secured: ${publicId} (type: ${String(inspection.details.type)}, resource_type: ${inspection.resourceType})`);
          totalAlreadySecured++;
        } else if (inspection.state === 'needs_migration') {
          if (isDryRun) {
            results.push(`[DRY RUN] Would migrate: ${publicId} (resource_type: ${inspection.resourceType})`);
            totalWouldMigrate++;
          } else {
            // Safe rename operation preserving exact publicId reference
            try {
              await cloudinary.uploader.rename(publicId, publicId, {
                resource_type: inspection.resourceType,
                type: 'upload',
                to_type: 'authenticated',
                invalidate: true,
                overwrite: true
              });
              results.push(`Migrated: ${publicId} (resource_type: ${inspection.resourceType})`);
              totalMigrated++;
            } catch (renameErr: unknown) {
              const parsed = categorizeCloudinaryError(renameErr);
              results.push(`[${parsed.category}] Migration failed for ${publicId}: ${parsed.message}`);
              totalFailed++;
            }
          }
        }
      } catch (err: unknown) {
        const parsed = categorizeCloudinaryError(err);
        results.push(`[${parsed.category}] Unexpected error on ${publicId}: ${parsed.message}`);
        totalFailed++;
      }
    }

    return NextResponse.json({
      success: totalFailed === 0,
      mode,
      dryRun: isDryRun,
      totalRequested: idsToMigrate.length,
      totalMigrated,
      totalAlreadySecured,
      totalWouldMigrate: isDryRun ? totalWouldMigrate : undefined,
      totalFailed,
      results
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
