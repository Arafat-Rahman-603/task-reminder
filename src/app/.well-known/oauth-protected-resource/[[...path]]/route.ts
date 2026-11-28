import { NextRequest, NextResponse } from "next/server";
import {
  buildProtectedResourceMetadata,
  oauthCorsHeaders,
  resolvePublicOrigin,
} from "@/lib/oauth-mcp";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: oauthCorsHeaders("GET, OPTIONS"),
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  await context.params;
  const origin = resolvePublicOrigin(req);
  return NextResponse.json(buildProtectedResourceMetadata(origin), {
    status: 200,
    headers: oauthCorsHeaders("GET, OPTIONS"),
  });
}
