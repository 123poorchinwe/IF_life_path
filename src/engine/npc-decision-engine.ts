import {
  MissionDefinition,
  MissionRuntimeState,
  NPCDecision,
  NPCDefinition,
  NPCRelationshipState,
  PlayerDialogueIntent,
} from "@/types/narrative";
const clamp = (n: number, min = 0, max = 3) => Math.max(min, Math.min(max, n));
export function decideNPC(
  npc: NPCDefinition,
  mission: MissionDefinition,
  state: MissionRuntimeState,
  rel: NPCRelationshipState,
  intent: PlayerDialogueIntent,
): NPCDecision {
  const exposed = state.playerEvidence.length + state.discoveredFacts.length,
    challenge = [
      "verify_claim",
      "document_evidence",
      "expose_inconsistency",
      "threaten",
    ].includes(intent.type),
    boundary = [
      "negotiate_scope",
      "confirm_credit",
      "refuse_request",
      "exit_relationship",
    ].includes(intent.type);
  let responseStrategy: NPCDecision["responseStrategy"] = "probe";
  if (intent.type === "ask_information") responseStrategy = "inform";
  if (npc.alignment === "benevolent")
    responseStrategy =
      intent.type === "seek_empathy"
        ? "support"
        : challenge
          ? "inform"
          : "probe";
  if (npc.alignment === "malicious")
    responseStrategy = challenge
      ? exposed > 1
        ? "bargain"
        : "deflect"
      : "pressure";
  if (npc.alignment === "pragmatic" && boundary)
    responseStrategy = exposed > 0 ? "bargain" : "deflect";
  if (intent.type === "exit_relationship")
    responseStrategy =
      npc.retaliationPolicy === "never" ? "withdraw" : "pressure";
  const disclosureLevel = clamp(
      npc.alignment === "benevolent"
        ? 1 + (rel.trust > 55 ? 1 : 0)
        : responseStrategy === "bargain"
          ? 1
          : 0,
    ) as 0 | 1 | 2 | 3,
    deceptionMode: NPCDecision["deceptionMode"] = npc.usesDeception
      ? exposed > 1
        ? "omit"
        : "misdirect"
      : "none",
    pressureLevel = clamp(
      npc.usesPowerPressure
        ? 1 + (rel.powerGap > 65 ? 1 : 0) - (exposed > 1 ? 1 : 0)
        : 0,
    ) as 0 | 1 | 2 | 3,
    concessionLevel = clamp(
      exposed +
        (npc.alignment === "benevolent" ? 1 : 0) -
        (npc.alignment === "malicious" ? 1 : 0),
    ) as 0 | 1 | 2 | 3;
  return {
    responseStrategy,
    disclosureLevel,
    deceptionMode,
    pressureLevel,
    concessionLevel,
    emotionalTone:
      npc.alignment === "benevolent"
        ? intent.type === "seek_empathy"
          ? "warm"
          : "calm"
        : challenge
          ? exposed > 1
            ? "defensive"
            : "guarded"
          : pressureLevel > 1
            ? "pressuring"
            : "calm",
    nextTriggerSuggestion:
      state.currentMissionStage < mission.requiredStoryBeats.length
        ? mission.requiredStoryBeats[state.currentMissionStage].id
        : undefined,
    reactionTags: [
      `strategy_${responseStrategy}`,
      `alignment_${npc.alignment}`,
      challenge ? "claim_challenged" : "ordinary_exchange",
    ],
  };
}
