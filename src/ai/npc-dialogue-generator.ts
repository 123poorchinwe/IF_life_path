import { z } from "zod";
import { dialogueStyles } from "@/data/dialogue-styles";
import { validateDialogue } from "@/engine/dialogue-validator";
import {
  DialogueResponse,
  MissionDefinition,
  MissionRuntimeState,
  NPCDecision,
  NPCDefinition,
  NPCRelationshipState,
  PlayerDialogueIntent,
} from "@/types/narrative";
const outputSchema = z.object({
  line: z.string().min(1).max(320),
  memorySummary: z.string().min(1).max(180),
  revealedFactIds: z.array(z.string()).max(3),
  reactionTags: z.array(z.string()).max(5),
});
type Context = {
  npc: NPCDefinition;
  mission: MissionDefinition;
  state: MissionRuntimeState;
  relationship: NPCRelationshipState;
  intent: PlayerDialogueIntent;
  decision: NPCDecision;
  history: { speaker: "player" | "npc"; text: string }[];
  memorySummary: string;
};
let providerHealth: {
  status: "unknown" | "online" | "offline";
  checkedAt: number;
  error?: string;
} = { status: "unknown", checkedAt: 0 };
export const getDialogueProviderHealth = () => providerHealth;
export const getDialogueProviderConfig = () => {
  const provider = (process.env.AI_PROVIDER || "modelscope").toLowerCase();
  const siliconFlow = provider === "siliconflow";
  return {
    provider,
    token: siliconFlow
      ? process.env.SILICONFLOW_API_KEY
      : process.env.MODELSCOPE_ACCESS_TOKEN,
    baseUrl:
      process.env.AI_BASE_URL ||
      (siliconFlow
        ? "https://api.siliconflow.cn/v1"
        : "https://api-inference.modelscope.cn/v1"),
    model:
      process.env.AI_MODEL ||
      (siliconFlow ? "Qwen/Qwen2.5-7B-Instruct" : "Qwen/Qwen3-4B"),
  };
};
const localLines: Record<NPCDecision["responseStrategy"], string[]> = {
  inform: [
    "我可以说我亲眼见过的部分，但别把它当成全部情况。",
    "先把你要核验的那件事说具体，我按事实回答。",
  ],
  deflect: [
    "你现在把问题说得太绝对了。先看眼前要不要推进，其他的以后再谈。",
    "这件事没必要现在下结论，大家通常都是边做边调整。",
  ],
  probe: [
    "你真正想确认的是条件，还是想知道自己愿不愿意承担代价？",
    "可以聊。不过你先说一个最想核验的具体问题。",
  ],
  pressure: [
    "这个窗口不会一直留着。继续比较当然可以，但机会成本也要算进去。",
    "我理解你谨慎，不过项目不会等所有信息都完全确定。",
  ],
  bargain: [
    "你把证据摆出来了，那我们就重新谈范围，但不可能所有条件都按你的来。",
    "可以让一步，不过我需要你也明确愿意承担哪一部分。",
  ],
  concede: [
    "这一点你说得成立，我愿意把它写清楚。",
    "现有记录对得上，我不再回避这部分。",
  ],
  withdraw: [
    "如果你决定停在这里，我尊重。之后需要公开信息可以再问。",
    "好，那我们先到这里。我不会替你做这个决定。",
  ],
  support: [
    "你不用现在证明自己已经想清楚了。先把最压着你的那件事说出来。",
    "我听见了。今天不一定非要得出职业结论。",
  ],
};
function fallback(ctx: Context, mode: "mock" | "fallback"): DialogueResponse {
  const choices = localLines[ctx.decision.responseStrategy],
    line = choices[(ctx.state.turn + ctx.npc.id.length) % choices.length];
  return {
    npcId: ctx.npc.id,
    line,
    strategy: ctx.decision.responseStrategy,
    reactionTags: ctx.decision.reactionTags,
    memorySummary: `玩家以${ctx.intent.type}方式回应；${ctx.npc.name}采取${ctx.decision.responseStrategy}策略。`,
    revealedFactIds: [],
    mode,
  };
}
function extractJson(s: string) {
  const t = s
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim(),
    a = t.indexOf("{"),
    b = t.lastIndexOf("}");
  if (a < 0 || b < a) throw new Error("invalid_json");
  return JSON.parse(t.slice(a, b + 1));
}
export async function generateNPCDialogue(
  ctx: Context,
): Promise<{ response: DialogueResponse; validationFailures: string[] }> {
  const provider = getDialogueProviderConfig(),
    token = provider.token;
  if (!token || process.env.AI_MOCK_MODE === "true")
    return { response: fallback(ctx, "mock"), validationFailures: [] };
  if (
    providerHealth.status === "offline" &&
    Date.now() - providerHealth.checkedAt < 60_000
  )
    return {
      response: fallback(ctx, "fallback"),
      validationFailures: [providerHealth.error || "provider_circuit_open"],
    };
  const style = dialogueStyles[ctx.npc.dialogueStyleId],
    failures: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController(),
        timer = setTimeout(() => controller.abort(), 7000);
      const system = `你只负责为策划定义的NPC写一句自然台词，不决定任务结果。角色定义=${JSON.stringify(ctx.npc)}。语言风格=${JSON.stringify(style)}。固定任务前提=${ctx.mission.immutablePremise}。禁止改写=${JSON.stringify(ctx.mission.forbiddenChanges)}。NPC决策器已决定=${JSON.stringify(ctx.decision)}。只能披露NPC已知事实，隐藏事实只有disclosureLevel>=2时才可披露。不得改变阵营、悔悟洗白、承诺不存在的奖励或宣布结局。输出JSON：line,memorySummary,revealedFactIds,reactionTags。`;
      const user = JSON.stringify({
        玩家输入: ctx.intent.rawText,
        解析意图: ctx.intent,
        关系: ctx.relationship,
        任务阶段: ctx.state.currentMissionStage,
        已发现事实: ctx.state.discoveredFacts,
        已有证据: ctx.state.playerEvidence,
        长期记忆: ctx.memorySummary,
        最近对话: ctx.history.slice(-10),
        上次失败原因: failures,
      });
      const base = provider.baseUrl.replace(/\/$/, "");
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0.72,
          max_tokens: 500,
          response_format: { type: "json_object" },
        }),
      });
      clearTimeout(timer);
      if (!res.ok) {
        const detail = (await res.text()).slice(0, 240);
        console.error("Dialogue provider rejected request", {
          provider: provider.provider,
          status: res.status,
          detail,
        });
        throw new Error(`provider_${res.status}`);
      }
      const raw = await res.json(),
        parsed = outputSchema.parse(
          extractJson(raw.choices?.[0]?.message?.content || ""),
        );
      const response: DialogueResponse = {
        npcId: ctx.npc.id,
        ...parsed,
        strategy: ctx.decision.responseStrategy,
        mode: "ai",
      };
      const validation = validateDialogue(
        parsed.line,
        response,
        ctx.npc,
        ctx.mission,
        ctx.state,
        ctx.decision,
      );
      if (validation.valid) {
        providerHealth = { status: "online", checkedAt: Date.now() };
        return { response, validationFailures: failures };
      }
      failures.push(...validation.violations);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "generation_failed";
      failures.push(reason);
      providerHealth = {
        status: "offline",
        checkedAt: Date.now(),
        error: reason,
      };
    }
  }
  return { response: fallback(ctx, "fallback"), validationFailures: failures };
}
