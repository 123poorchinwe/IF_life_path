import { NextResponse } from "next/server";
import { parseProfileRequest } from "@/server/profile-parse-service";

export const runtime = "nodejs";
export const maxDuration = 60;

const defaultOrigins = [
  "https://123poorchinwe.github.io",
  "https://game-d7g6sf32s7b58cbcd-1464556999.tcloudbaseapp.com",
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const configured = (process.env.CORS_ALLOWED_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowed = new Set([...defaultOrigins, ...configured]);
  const accepted =
    allowed.has(origin) ||
    /^https:\/\/[a-z0-9-]+\.tcloudbaseapp\.com$/i.test(origin);
  return {
    "Access-Control-Allow-Origin": accepted ? origin : defaultOrigins[0],
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  const result = await parseProfileRequest(req);
  return NextResponse.json(result.payload, {
    status: result.status,
    headers: corsHeaders(req),
  });
}
