import { NextResponse } from "next/server";
import { getPlatformPlans, getCustomizerConfig } from "@/actions/admin.actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [plans, customizerConfig] = await Promise.all([
      getPlatformPlans(),
      getCustomizerConfig(),
    ]);
    return NextResponse.json({ plans, customizerConfig });
  } catch (error) {
    console.error("Error fetching platform plans:", error);
    return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
  }
}
