export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { purgeExpiredTrash } from "@/actions/trash.actions";

export async function GET(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("[Trash Purge Cron] CRON_SECRET is not configured on server.");
      return NextResponse.json({ error: "Server misconfiguration: CRON_SECRET missing" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized: Invalid or missing bearer token" }, { status: 401 });
    }

    const result = await purgeExpiredTrash(100, cronSecret);

    return NextResponse.json({
      success: result.success,
      purgedCount: result.purgedCount,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Trash purge cron error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
