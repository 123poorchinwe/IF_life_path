import { z } from "zod";
import { npcById } from "@/data/npcs";
import { missionById } from "@/data/missions";
import { parseDialogueIntent } from "@/engine/dialogue-intent-parser";
import { decideNPC } from "@/engine/npc-decision-engine";
import { applyRelationship, applyTransition, transitionMission } from "@/engine/mission-state-machine";
import { generateNPCDialogue, getDialogueProviderConfig, getDialogueProviderHealth } from "@/ai/npc-dialogue-generator";
import type { MissionRuntimeState, NPCRelationshipState } from "@/types/narrative";

const requestSchema = z.object({
  npcId: z.string(), missionId: z.string(), message: z.string().min(1).max(1000),
  missionState: z.custom<MissionRuntimeState>(), relationship: z.custom<NPCRelationshipState>(),
  history: z.array(z.object({ speaker: z.enum(["player", "npc"]), text: z.string().max(1000) })).max(30).default([]),
  memorySummary: z.string().max(1000).default(""),
});

export function dialogueHealth() {
  const provider = getDialogueProviderConfig();
  return { configured: provider.enabled, mock: (process.env.AI_MOCK_MODE1 || process.env.AI_MOCK_MODE) === "true", provider: provider.provider, model: provider.model, ...getDialogueProviderHealth() };
}

export async function processDialogueRequest(req: Request) {
  try {
    const body = requestSchema.parse(await req.json());
    const npc = npcById[body.npcId], mission = missionById[body.missionId];
    if (!npc || !mission || !mission.npcIds.includes(npc.id)) return { status: 400, payload: { error: "invalid_narrative_binding" } };
    if (body.missionState.missionId !== mission.id || body.relationship.npcId !== npc.id) return { status: 400, payload: { error: "state_identity_mismatch" } };
    const intent = parseDialogueIntent(body.message);
    const decision = decideNPC(npc, mission, body.missionState, body.relationship, intent);
    const transition = transitionMission(mission, body.missionState, body.relationship, intent, decision);
    const generated = await generateNPCDialogue({ npc, mission, state: body.missionState, relationship: body.relationship, intent, decision, history: body.history, memorySummary: body.memorySummary });
    return { status: 200, payload: { intent, decision, dialogue: generated.response, transition, nextMissionState: applyTransition(body.missionState, transition, intent), nextRelationship: applyRelationship(body.relationship, transition.relationshipDelta), validationFailures: generated.validationFailures } };
  } catch (error) {
    console.error("Narrative pipeline failed", error instanceof Error ? error.message : "unknown");
    return { status: 500, payload: { error: "narrative_pipeline_failed" } };
  }
}
