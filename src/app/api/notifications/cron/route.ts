export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { processDueReminders, processDailySummaries } from "@/lib/notifications/reminder-processor";

export async function GET(req: Request) {
  try {
    // Optional: protect cron endpoint with a secret
    const url = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
      url.searchParams.get("key") !== process.env.CRON_SECRET
    ) {
      return NextResponse.json({ error: "Unauthorized cron" }, { status: 401 });
    }

    const forceType = url.searchParams.get("forceType") as any;
    const testUserId = url.searchParams.get("userId") || undefined;
    if (forceType) {
      const summaryResult = await processDailySummaries({ userId: testUserId, forceType });
      return NextResponse.json({ success: true, summaryResult });
    }

    const result = await processDueReminders({ limit: 50 });

    return NextResponse.json({
      success: result.success,
      sentCount: result.sentCount,
      processedCount: result.processedCount,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
