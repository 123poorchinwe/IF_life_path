import {
  MissionDefinition,
  MissionRuntimeState,
  MissionTransitionResult,
  NPCDecision,
  NPCRelationshipState,
  PlayerDialogueIntent,
} from "@/types/narrative";
const beatIntent: Record<string, string[]> = {
  scope_change: ["ask_information", "negotiate_scope"],
  deadline_check: ["verify_claim", "negotiate_scope"],
  credit_question: ["confirm_credit", "document_evidence"],
  commitment: [
    "accept_condition",
    "refuse_request",
    "exit_relationship",
    "negotiate_scope",
  ],
  offer: ["ask_information", "delay_decision"],
  guarantee: ["verify_claim", "expose_inconsistency"],
  contract: ["verify_claim", "document_evidence"],
  payment: [
    "accept_condition",
    "refuse_request",
    "delay_decision",
    "exit_relationship",
  ],
  assumption: ["ask_information", "seek_empathy"],
  daily_work: ["ask_information", "verify_claim"],
  cross_check: ["verify_claim", "seek_alliance"],
  experiment: ["accept_condition", "delay_decision"],
};
export function transitionMission(
  def: MissionDefinition,
  state: MissionRuntimeState,
  rel: NPCRelationshipState,
  intent: PlayerDialogueIntent,
  decision: NPCDecision,
): MissionTransitionResult {
  const beat = def.requiredStoryBeats[state.currentMissionStage];
  const allowed = Boolean(
    beat && (!beatIntent[beat.id] || beatIntent[beat.id].includes(intent.type)),
  );
  const newlyCompletedBeats = allowed && beat ? [beat.id] : [];
  const nextStage = state.currentMissionStage + newlyCompletedBeats.length;
  const newEvidence: string[] = [];
  if (intent.type === "document_evidence" || intent.type === "verify_claim") {
    const available = def.evidenceItems.find(
      (e) => !state.playerEvidence.includes(e.id),
    );
    if (available) newEvidence.push(available.id);
  }
  const newlyDiscoveredFacts: string[] = [];
  if (decision.disclosureLevel >= 2) {
    const fact = Object.keys(def.hiddenInformation).find(
      (x) => !state.discoveredFacts.includes(x),
    );
    if (fact) newlyDiscoveredFacts.push(fact);
  }
  const evidence = [...state.playerEvidence, ...newEvidence];
  const ending =
    nextStage >= def.requiredStoryBeats.length
      ? def.allowedEndings.find((e) => {
          const intentMatches =
            !e.requirements.intent || e.requirements.intent === intent.type;
          const evidenceMatches =
            !e.requirements.evidence ||
            e.requirements.evidence.every((x) => evidence.includes(x));
          return intentMatches && evidenceMatches;
        })
      : undefined;
  return {
    previousStage: state.currentMissionStage,
    nextStage,
    newlyCompletedBeats,
    newlyDiscoveredFacts,
    newEvidence,
    relationshipDelta: {
      trust:
        intent.type === "threaten"
          ? -8
          : intent.type === "seek_empathy" && rel.trust > 30
            ? 3
            : 0,
      respect: [
        "verify_claim",
        "document_evidence",
        "negotiate_scope",
      ].includes(intent.type)
        ? 3
        : 0,
      caution: ["threaten", "expose_inconsistency"].includes(intent.type)
        ? 6
        : 0,
      resentment:
        intent.type === "threaten"
          ? 7
          : intent.type === "refuse_request" && decision.pressureLevel > 0
            ? 3
            : 0,
      informationGap:
        newEvidence.length || newlyDiscoveredFacts.length ? -5 : 0,
    },
    resourceDelta: {
      time: -1,
      energy: intent.type === "threaten" ? -2 : -1,
      information: newEvidence.length + newlyDiscoveredFacts.length,
    },
    endingId: ending?.id,
    blockedReasons: allowed
      ? []
      : [`当前行动未完成必要节点：${beat?.title || "任务已结束"}`],
  };
}
export function applyTransition(
  state: MissionRuntimeState,
  result: MissionTransitionResult,
  intent: PlayerDialogueIntent,
): MissionRuntimeState {
  return {
    ...state,
    currentMissionStage: result.nextStage,
    completedBeats: [...state.completedBeats, ...result.newlyCompletedBeats],
    discoveredFacts: [...state.discoveredFacts, ...result.newlyDiscoveredFacts],
    playerEvidence: [...state.playerEvidence, ...result.newEvidence],
    pastChoices: [...state.pastChoices, intent.type],
    turn: state.turn + 1,
    endingId: result.endingId,
    status: result.endingId ? "completed" : state.status,
  };
}
export function applyRelationship(
  rel: NPCRelationshipState,
  d: MissionTransitionResult["relationshipDelta"],
): NPCRelationshipState {
  const n = (v: number, x = 0) => Math.max(0, Math.min(100, v + x));
  return {
    ...rel,
    trust: n(rel.trust, d.trust),
    respect: n(rel.respect, d.respect),
    caution: n(rel.caution, d.caution),
    resentment: n(rel.resentment, d.resentment),
    powerGap: n(rel.powerGap, d.powerGap),
    informationGap: n(rel.informationGap, d.informationGap),
  };
}
