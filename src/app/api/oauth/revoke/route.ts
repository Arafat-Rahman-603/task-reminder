import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { hashMcpToken } from "@/lib/server-crypto";
import { oauthCorsHeaders } from "@/lib/oauth-mcp";
import { OAuthAccessToken } from "@/models/OAuthAccessToken";

async function parseTokenParam(req: NextRequest): Promise<string | null> {
  const contentType = req.headers.get("content-type")?.toLowerCase() || "";
  if (contentType.includes("application/json")) {
    try {
      const json = (await req.json()) as { token?: unknown };
      return typeof json.token === "string" ? json.token : null;
    } catch {
      return null;
    }
  }

  try {
    const params = new URLSearchParams(await req.text());
    return params.get("token");
  } catch {
    return null;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: oauthCorsHeaders("POST, OPTIONS"),
  });
}

export async function POST(req: NextRequest) {
  const headers = oauthCorsHeaders("POST, OPTIONS");
  const rawToken = await parseTokenParam(req);

  if (rawToken) {
    const hashed = hashMcpToken(rawToken);
    await dbConnect();
    await OAuthAccessToken.updateMany(
      {
        $or: [{ tokenHash: hashed }, { refreshTokenHash: hashed }],
      },
      {
        $set: { revokedAt: new Date() },
        $unset: { refreshTokenHash: 1 },
      }
    );
  }

  return NextResponse.json({}, { status: 200, headers });
}
