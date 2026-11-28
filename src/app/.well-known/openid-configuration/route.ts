import { NextRequest, NextResponse } from "next/server";
import {
  buildAuthorizationServerMetadata,
  oauthCorsHeaders,
  resolvePublicOrigin,
} from "@/lib/oauth-mcp";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: oauthCorsHeaders("GET, OPTIONS"),
  });
}

export async function GET(req: NextRequest) {
  const origin = resolvePublicOrigin(req);
  return NextResponse.json(buildAuthorizationServerMetadata(origin), {
    status: 200,
    headers: oauthCorsHeaders("GET, OPTIONS"),
  });
}
