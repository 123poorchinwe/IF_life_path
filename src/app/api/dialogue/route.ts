import { NextResponse } from "next/server";
import { z } from "zod";
import { npcById } from "@/data/npcs";
import { missionById } from "@/data/missions";
import { parseDialogueIntent } from "@/engine/dialogue-intent-parser";
import { decideNPC } from "@/engine/npc-decision-engine";
import {
  applyRelationship,
  applyTransition,
  transitionMission,
} from "@/engine/mission-state-machine";
import {
  generateNPCDialogue,
  getDialogueProviderConfig,
  getDialogueProviderHealth,
} from "@/ai/npc-dialogue-generator";
import { MissionRuntimeState, NPCRelationshipState } from "@/types/narrative";
const requestSchema = z.object({
  npcId: z.string(),
  missionId: z.string(),
  message: z.string().min(1).max(1000),
  missionState: z.custom<MissionRuntimeState>(),
  relationship: z.custom<NPCRelationshipState>(),
  history: z
    .array(
      z.object({
        speaker: z.enum(["player", "npc"]),
        text: z.string().max(1000),
      }),
    )
    .max(30)
    .default([]),
  memorySummary: z.string().max(1000).default(""),
});
const defaultOrigins = [
  "https://123poorchinwe.github.io",
  "https://game-d7g6sf32s7b58cbcd-1464556999.tcloudbaseapp.com",
];
function corsHeaders(req?: Request) {
  const origin = req?.headers.get("origin") || "";
  const configured = (process.env.CORS_ALLOWED_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowed = new Set([...defaultOrigins, ...configured]);
  const accepted =
    allowed.has(origin) ||
    /^https:\/\/[a-z0-9-]+\.tcloudbaseapp\.com$/i.test(origin);
  return {
    "Access-Control-Allow-Origin": accepted
      ? origin
      : defaultOrigins[0],
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(req: Request) {
  const now = Date.now();
  const windowMs = 60_000;
  const limit = Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 20);
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const current = rateBuckets.get(ip);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: Request) {
  const provider = getDialogueProviderConfig();
  return NextResponse.json(
    {
      configured: Boolean(provider.token),
      mock:
        (process.env.AI_MOCK_MODE1 || process.env.AI_MOCK_MODE) === "true",
      provider: provider.provider,
      model: provider.model,
      ...getDialogueProviderHealth(),
    },
    { headers: corsHeaders(req) },
  );
}
export async function POST(req: Request) {
  const headers = corsHeaders(req);
  try {
    if (isRateLimited(req))
      return NextResponse.json(
        { error: "rate_limit_exceeded" },
        { status: 429, headers },
      );
    const body = requestSchema.parse(await req.json()),
      npc = npcById[body.npcId],
      mission = missionById[body.missionId];
    if (!npc || !mission || !mission.npcIds.includes(npc.id))
      return NextResponse.json(
        { error: "invalid_narrative_binding" },
        { status: 400, headers },
      );
    if (
      body.missionState.missionId !== mission.id ||
      body.relationship.npcId !== npc.id
    )
      return NextResponse.json(
        { error: "state_identity_mismatch" },
        { status: 400, headers },
      );
    const intent = parseDialogueIntent(body.message),
      decision = decideNPC(
        npc,
        mission,
        body.missionState,
        body.relationship,
        intent,
      ),
      transition = transitionMission(
        mission,
        body.missionState,
        body.relationship,
        intent,
        decision,
      ),
      generated = await generateNPCDialogue({
        npc,
        mission,
        state: body.missionState,
        relationship: body.relationship,
        intent,
        decision,
        history: body.history,
        memorySummary: body.memorySummary,
      });
    return NextResponse.json(
      {
        intent,
        decision,
        dialogue: generated.response,
        transition,
        nextMissionState: applyTransition(
          body.missionState,
          transition,
          intent,
        ),
        nextRelationship: applyRelationship(
          body.relationship,
          transition.relationshipDelta,
        ),
        validationFailures: generated.validationFailures,
      },
      { headers },
    );
  } catch (error) {
    console.error(
      "Narrative pipeline failed",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      { error: "narrative_pipeline_failed" },
      { status: 500, headers },
    );
  }
}
