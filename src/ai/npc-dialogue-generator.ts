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
  line: z
    .string()
    .min(8)
    .max(320)
    .refine((value) => !/^[a-z_]+:\d+$/i.test(value.trim()), "placeholder_line"),
  memorySummary: z.string().min(8).max(180),
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
const groundedFactClaims: Record<string, string> = {
  gis_delivery_work: "GIS企业岗位的实际工作可能以数据治理和客户交付为主，算法研究只占一部分。",
  team_workflow: "她只了解自己所在团队的工作流程，不能代表整个行业。",
  own_career_path: "她可以分享自己的职业经历，但个人经验不是正式岗位规则。",
  product_workflow: "数据产品工作需要连接用户问题、指标和数据能力。",
  urban_metrics: "城市数据岗位会使用业务指标解释具体城市问题。",
  portfolio_expectations: "作品集需要展示问题、过程、证据和结果，而不只是工具名称。",
  field_work: "国企项目岗位可能包含现场工作，但不同单位和岗位差异很大。",
  project_acceptance: "项目交付通常需要经过正式验收，具体流程必须向目标单位核验。",
  own_recruitment: "他只能说明自己的招聘经历，不能代表当前招聘政策。",
  scope_original: "最初确认的任务只有数据清洗。",
  deadline_fixed: "新增工作出现后，截止时间没有同步调整。",
  funding_pressure: "项目负责人当前承受交付和经费压力。",
  course_price: "课程价格已经明确，但超出玩家当前月度预算。",
  contract_terms: "合同没有写明内部推荐的具体标准。",
  sales_quota: "顾问当前存在促成签约的业绩压力。",
};
let providerHealth: {
  status: "unknown" | "online" | "offline";
  checkedAt: number;
  error?: string;
} = { status: "unknown", checkedAt: 0 };
export const getDialogueProviderHealth = () => providerHealth;
export const getDialogueProviderConfig = () => {
  const provider = (
    process.env.AI_PROVIDER1 ||
    process.env.AI_PROVIDER ||
    "modelscope"
  ).toLowerCase();
  const siliconFlow = provider === "siliconflow";
  const ollama = provider === "ollama";
  const token = siliconFlow
    ? process.env.SILICONFLOW_API_KEY1 || process.env.SILICONFLOW_API_KEY
    : ollama
      ? undefined
      : process.env.MODELSCOPE_ACCESS_TOKEN;
  return {
    provider,
    token,
    enabled: ollama || Boolean(token),
    baseUrl:
      process.env.AI_BASE_URL1 ||
      process.env.AI_BASE_URL ||
      (ollama
        ? "http://127.0.0.1:11434/v1"
        : siliconFlow
        ? "https://api.siliconflow.cn/v1"
        : "https://api-inference.modelscope.cn/v1"),
    model:
      process.env.AI_MODEL1 ||
      process.env.AI_MODEL ||
      (ollama
        ? "qwen3:4b"
        : siliconFlow
          ? "Qwen/Qwen2.5-7B-Instruct"
          : "Qwen/Qwen3-4B"),
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
    line =
      ctx.intent.type === "confirm_credit"
        ? "目前没有书面材料能确认最终署名，我不能现在替你保证。要继续谈，就先把成果归属写清楚。"
        : choices[(ctx.state.turn + ctx.npc.id.length) % choices.length];
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
function normalizeModelOutput(raw: unknown, ctx: Context) {
  const root = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const nested = [root.dialogue, root.response, root.result].find(
    (value) => value && typeof value === "object",
  ) as Record<string, unknown> | undefined;
  const value = nested || root;
  return {
    line:
      value.line ||
      value.text ||
      value.content ||
      value.npcMessage ||
      value.npc_message ||
      value.npc_line ||
      value.dialogue_line ||
      value.reply ||
      value["台词"] ||
      value["NPC台词"],
    memorySummary:
      value.memorySummary ||
      value.memory_summary ||
      value["记忆摘要"] ||
      `玩家以${ctx.intent.type}方式回应；${ctx.npc.name}采取${ctx.decision.responseStrategy}策略。`,
    revealedFactIds: Array.isArray(value.revealedFactIds)
      ? value.revealedFactIds
      : Array.isArray(value.revealed_fact_ids)
        ? value.revealed_fact_ids
        : [],
    reactionTags: Array.isArray(value.reactionTags)
      ? value.reactionTags
      : Array.isArray(value.reaction_tags)
        ? value.reaction_tags
        : ctx.decision.reactionTags,
  };
}
export async function generateNPCDialogue(
  ctx: Context,
): Promise<{ response: DialogueResponse; validationFailures: string[] }> {
  const provider = getDialogueProviderConfig(),
    token = provider.token;
  const mockMode = process.env.AI_MOCK_MODE1 || process.env.AI_MOCK_MODE;
  if (!provider.enabled || mockMode === "true")
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
    let providerRequestSucceeded = false;
    try {
      const controller = new AbortController(),
        timer = setTimeout(
          () => controller.abort(),
          provider.provider === "ollama" ? 30_000 : 12_000,
        );
      const allowedClaims = ctx.npc.knownFacts
        .map((factId) => groundedFactClaims[factId])
        .filter(Boolean);
      const requiredStance =
        ctx.intent.type === "confirm_credit"
          ? "署名和成果归属尚未书面确认。你必须明确保留这一不确定性，不得声称任何规则、报告或负责人已经确定署名。"
          : ctx.intent.type === "refuse_request"
            ? "玩家正在拒绝新增工作。你可以施压、追问或提出继续协商，但不得宣布玩家已经接受，也不得擅自宣布范围已经改变。"
            : "只回应当前问题，不宣布任何任务结果。";
      const system = `你在一款现实题材像素游戏中即兴扮演NPC，但不决定任务结果。
角色底色=${JSON.stringify(ctx.npc)}。
说话习惯=${JSON.stringify(style)}。
固定前提=${ctx.mission.immutablePremise}。
本轮事实包=${JSON.stringify(allowedClaims)}。
本轮策略包=${JSON.stringify(ctx.decision)}。
本轮必须表达的立场=${requiredStance}
禁止改写=${JSON.stringify(ctx.mission.forbiddenChanges)}。

表演要求：直接回应玩家刚说的话；只用第一人称对话，不写角色名、不写旁白和括号动作；避免“作为某某”“根据有关规定”“综上所述”等客服腔；每次1到3句，可以回避、迟疑、反问或追问一个具体问题；语气和信息披露必须符合策略包与关系状态，不要复述整段任务背景。
事实边界：陈述和提问都只能自然改写事实包；不能用问句暗示玩家做过事实包中不存在的工作；材料没有答案时坦率说不知道或只说自己能确认的部分；隐藏事实只有disclosureLevel>=2时才能披露；不得补全公司、客户、部门、项目、文件、审核、金额、日期、数量或业绩；不得改变阵营、突然悔悟、承诺奖励或宣布结局。
只输出JSON：line,memorySummary,revealedFactIds,reactionTags。`;
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
      const ollama = provider.provider === "ollama";
      const endpoint = ollama
        ? `${base.replace(/\/v1$/, "")}/api/chat`
        : `${base}/chat/completions`;
      const res = await fetch(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(
          ollama
            ? {
                model: provider.model,
                messages: [
                  { role: "system", content: system },
                  { role: "user", content: user },
                ],
                stream: false,
                think: false,
                format: "json",
                options: { temperature: 0.72, num_predict: 500 },
              }
            : {
                model: provider.model,
                messages: [
                  { role: "system", content: system },
                  { role: "user", content: user },
                ],
                temperature: 0.72,
                max_tokens: 500,
                response_format: { type: "json_object" },
              },
        ),
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
      providerRequestSucceeded = true;
      const raw = await res.json(),
        parsed = outputSchema.parse(
          normalizeModelOutput(
            extractJson(
              ollama
                ? raw.message?.content || ""
                : raw.choices?.[0]?.message?.content || "",
            ),
            ctx,
          ),
        );
      if (parsed.line.trim() === ctx.intent.rawText.trim()) {
        throw new Error("echoed_player_input");
      }
      const allowedSource = JSON.stringify({
        npc: ctx.npc,
        missionPremise: ctx.mission.immutablePremise,
        history: ctx.history,
        playerInput: ctx.intent.rawText,
        allowedClaims,
      }).toLowerCase();
      const unsupportedToken = parsed.line
        .match(/[a-z][a-z0-9._-]{2,}|\d+[a-z]+/gi)
        ?.find((token) => !allowedSource.includes(token.toLowerCase()));
      if (unsupportedToken) {
        throw new Error(`unsupported_specificity:${unsupportedToken}`);
      }
      const unsupportedQuantity = parsed.line
        .match(/[一二三四五六七八九十两\d]+\s*(?:个|项|次|份|家|名|个月|年|天|条|章|款)/g)
        ?.find((value) => !allowedSource.includes(value.toLowerCase()));
      if (unsupportedQuantity) {
        throw new Error(`unsupported_quantity:${unsupportedQuantity}`);
      }
      const unsupportedDocumentReference = parsed.line
        .match(/(?:项目)?(?:章程|合同|协议|制度|办法|细则|通知|文件)(?:第?[一二三四五六七八九十百\d]+(?:条|章|款))?/g)
        ?.find((value) => !allowedSource.includes(value.toLowerCase()));
      const safelyNegatesCreditDocument =
        ctx.intent.type === "confirm_credit" &&
        /(?:没有|尚未|还没有|还没|未曾|并未).{0,12}(?:合同|协议|书面|文件)|(?:合同|协议|书面|文件).{0,12}(?:没有|尚未|还没有|还没|未曾|并未)/.test(
          parsed.line,
        );
      if (unsupportedDocumentReference && !safelyNegatesCreditDocument) {
        throw new Error(`unsupported_document_reference:${unsupportedDocumentReference}`);
      }
      const unsupportedTimeReference = parsed.line
        .match(/(?:上|下|本)周(?:[一二三四五六日天])?|(?:今|明|昨|前|后)天|(?:上|下|本)个月|最近|此前/g)
        ?.find((value) => !allowedSource.includes(value.toLowerCase()));
      if (unsupportedTimeReference) {
        throw new Error(`unsupported_time_reference:${unsupportedTimeReference}`);
      }
      const unsupportedOperationalClaim = parsed.line
        .match(/(?:进度记录|会议记录|清洗报告|验收报告|署名规则|数据异常|异常波动|经费审批|预算审批|领导要求|已经过目|我已过目|正式审核|项目组|写得清清楚楚)/g)
        ?.find((value) => !allowedSource.includes(value.toLowerCase()));
      if (unsupportedOperationalClaim) {
        throw new Error(`unsupported_operational_claim:${unsupportedOperationalClaim}`);
      }
      const unauthorizedOutcome = parsed.line.match(
        /(?:模型分析|新增(?:任务|工作)|任务范围|成果归属|署名|截止时间).{0,16}(?:不纳入|取消|撤回|延长|归你|给你|已经确定|已经确认|无需|不用)|(?:同意|批准|答应|保证|承诺|决定).{0,16}(?:范围|署名|成果|截止时间|新增(?:任务|工作)|模型分析)/,
      );
      if (unauthorizedOutcome) {
        throw new Error(`unauthorized_outcome:${unauthorizedOutcome[0]}`);
      }
      const contradictedCompletedWork = parsed.line.match(
        /(?:先|继续|尽快|需要).{0,6}(?:完成|做完)数据清洗/,
      );
      if (
        contradictedCompletedWork &&
        ctx.mission.immutablePremise.includes("数据清洗") &&
        ctx.mission.immutablePremise.includes("后来增加")
      ) {
        throw new Error(`contradicted_completed_work:${contradictedCompletedWork[0]}`);
      }
      if (ctx.intent.type === "confirm_credit") {
        const acknowledgesUncertainty =
          /(?:不能确认|无法确认|尚未|还没有|还没|并未|未曾|没有明确|没有书面|需要书面确认|先书面确认|还不确定|不知道|不清楚|未.{0,6}(?:确认|明确|确定))/.test(
            parsed.line,
          );
        if (!acknowledgesUncertainty) {
          throw new Error("credit_answer_must_preserve_uncertainty");
        }
      }
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
      // A schema/grounding rejection means the model answered but its content was
      // unsafe to show. Do not trip the provider circuit breaker for that case.
      providerHealth = providerRequestSucceeded
        ? { status: "online", checkedAt: Date.now(), error: reason }
        : { status: "offline", checkedAt: Date.now(), error: reason };
    }
  }
  return { response: fallback(ctx, "fallback"), validationFailures: failures };
}
