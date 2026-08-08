"use client";
import { useEffect, useState } from "react";
import {
  Bot,
  ChevronRight,
  Database,
  Eye,
  FileText,
  Send,
  ShieldCheck,
  Terminal,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button, Tag } from "@/components/ui";
import {
  createMissionState,
  createRelationship,
  missionDefinitions,
} from "@/data/missions";
import { npcById } from "@/data/npcs";
import { useGameStore } from "@/store/game";
import { getDialogueEndpoint } from "@/ai/dialogue-endpoint";
import {
  DialogueResponse,
  MissionRuntimeState,
  NPCDecision,
  NPCRelationshipState,
  PlayerDialogueIntent,
} from "@/types/narrative";
type Message = { speaker: "player" | "npc"; text: string };
type ApiResult = {
  intent: PlayerDialogueIntent;
  decision: NPCDecision;
  dialogue: DialogueResponse;
  nextMissionState: MissionRuntimeState;
  nextRelationship: NPCRelationshipState;
  transition: {
    blockedReasons: string[];
    newEvidence: string[];
    newlyDiscoveredFacts: string[];
    endingId?: string;
  };
  validationFailures: string[];
};

function withWorldEvidence(
  state: MissionRuntimeState,
  missionId: string,
  worldEvidence: string[],
) {
  const definition = missionDefinitions.find((item) => item.id === missionId);
  const allowed = new Set(
    definition?.evidenceItems.map((item) => item.id) || [],
  );
  return {
    ...state,
    playerEvidence: [
      ...new Set([
        ...state.playerEvidence,
        ...worldEvidence.filter((id) => allowed.has(id)),
      ]),
    ],
  };
}
type ProviderStatus = {
  configured: boolean;
  mock: boolean;
  provider?: string;
  model: string;
  status:
    | "checking"
    | "unknown"
    | "ready"
    | "online"
    | "degraded"
    | "offline";
};
const openingLine = (npcId: string, missionId: string) =>
  missionId === "scope_and_credit"
    ? "我把数据看过了。既然清洗已经完成，模型分析和汇报材料最好也由你接着做，截止时间还是周五。"
    : missionId === "training_contract"
      ? "你来得正好，今晚还有一个内部推荐名额。我可以先替你保留，但需要现在确认。"
      : npcId === "alumna_lin"
        ? "坐吧。你可以不问那些标准答案，直接告诉我你对这份工作最拿不准的地方。"
        : "你想核验岗位的哪一部分？最好说一个具体场景。";
export default function MissionSimulation({
  next,
  backToMap,
}: {
  next: () => void;
  backToMap: () => void;
}) {
  const activeMissionId = useGameStore((s) => s.activeMissionId);
  const collectWorldEvidence = useGameStore((s) => s.collectEvidence);
  const completeWorldMission = useGameStore((s) => s.completeMission);
  const worldEvidence = useGameStore((s) => s.worldEvidence);
  const [missionId, setMissionId] = useState(
    activeMissionId || missionDefinitions[0].id,
  );
  const mission = missionDefinitions.find((m) => m.id === missionId)!;
  const [npcId, setNpcId] = useState(
    missionDefinitions.find(
      (m) => m.id === (activeMissionId || missionDefinitions[0].id),
    )!.npcIds[0],
  );
  const npc = npcById[npcId];
  const [state, setState] = useState(() =>
    withWorldEvidence(createMissionState(missionId), missionId, worldEvidence),
  );
  const [relationship, setRelationship] = useState(() =>
    createRelationship(npcId),
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      speaker: "npc",
      text: openingLine(
        missionDefinitions[0].npcIds[0],
        missionDefinitions[0].id,
      ),
    },
  ]);
  const [memory, setMemory] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState<ApiResult | null>(null);
  const [debug, setDebug] = useState(false);
  const [provider, setProvider] = useState<ProviderStatus>({
    configured: false,
    mock: false,
    model: "",
    status: "checking",
  });
  const refreshProvider = async () => {
    const endpoint = getDialogueEndpoint();
    if (!endpoint) {
      setProvider((current) => ({ ...current, status: "offline" }));
      return;
    }
    setProvider((current) => ({ ...current, status: "checking" }));
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) throw new Error(`provider_health_${response.status}`);
        const data = (await response.json()) as ProviderStatus;
        setProvider({
          ...data,
          status:
            data.configured && data.status === "unknown"
              ? "ready"
              : data.status,
        });
        return;
      } catch {
        if (attempt < 2) {
          await new Promise((resolve) => window.setTimeout(resolve, 800 * (attempt + 1)));
        }
      }
    }
    setProvider((current) => ({ ...current, status: "offline" }));
  };
  useEffect(() => {
    void refreshProvider();
  }, []);
  useEffect(() => {
    const key = `if-narrative-${missionId}-${npcId}`;
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const v = JSON.parse(saved);
          setState(withWorldEvidence(v.state, missionId, worldEvidence));
          setRelationship(v.relationship);
          setMessages(
            v.messages?.length
              ? v.messages
              : [{ speaker: "npc", text: openingLine(npcId, missionId) }],
          );
          setMemory(v.memory || "");
        } catch {}
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [missionId, npcId, worldEvidence]);
  useEffect(() => {
    localStorage.setItem(
      `if-narrative-${missionId}-${npcId}`,
      JSON.stringify({
        state,
        relationship,
        messages: messages.slice(-30),
        memory,
      }),
    );
  }, [missionId, npcId, state, relationship, messages, memory]);
  const switchMission = (id: string) => {
    const m = missionDefinitions.find((x) => x.id === id)!;
    setMissionId(id);
    setNpcId(m.npcIds[0]);
    setState(withWorldEvidence(createMissionState(id), id, worldEvidence));
    setRelationship(createRelationship(m.npcIds[0]));
    setMessages([{ speaker: "npc", text: openingLine(m.npcIds[0], id) }]);
    setMemory("");
    setLast(null);
  };
  const switchNPC = (id: string) => {
    setNpcId(id);
    setRelationship(createRelationship(id));
    setMessages([{ speaker: "npc", text: openingLine(id, missionId) }]);
    setLast(null);
  };
  const send = async () => {
    const text = input.trim();
    if (!text || loading || state.status !== "active") return;
    const nextMessages = [...messages, { speaker: "player" as const, text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const endpoint = getDialogueEndpoint();
      if (!endpoint) throw new Error("dialogue_api_not_configured");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcId,
          missionId,
          message: text,
          missionState: state,
          relationship,
          history: nextMessages.slice(-20),
          memorySummary: memory,
        }),
      });
      if (!res.ok) throw new Error("request_failed");
      const data: ApiResult = await res.json();
      setLast(data);
      setState(data.nextMissionState);
      setRelationship(data.nextRelationship);
      setMemory(data.dialogue.memorySummary);
      setProvider((p) => ({
        ...p,
        status: data.dialogue.mode === "ai" ? "online" : "degraded",
      }));
      setMessages((v) => [...v, { speaker: "npc", text: data.dialogue.line }]);
    } catch {
      setMessages((v) => [
        ...v,
        {
          speaker: "npc",
          text: "我现在不想把话说满。你如果要继续，我们先回到已经确认的事实。",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  const beat = mission.requiredStoryBeats[state.currentMissionStage];
  const ending = mission.allowedEndings.find((e) => e.id === state.endingId);
  const promptHints = beat?.id.includes("credit")
    ? [
        "这部分成果最后会如何署名？",
        "我希望先书面确认个人贡献。",
        "如果署名不能确定，我不会继续新增工作。",
      ]
    : beat?.id.includes("contract") || beat?.id.includes("guarantee")
      ? [
          "请把内部推荐写进合同。",
          "这个承诺可以从哪里核验？",
          "我想先联系一名往届学员。",
        ]
      : [
          "你能说一个具体例子吗？",
          "我想先核验你刚才的说法。",
          "我暂时不作决定。",
        ];
  const investigate = (evidenceId: string) => {
    if (state.playerEvidence.includes(evidenceId) || state.status !== "active")
      return;
    setState((s) => ({
      ...s,
      playerEvidence: [...s.playerEvidence, evidenceId],
    }));
    collectWorldEvidence(evidenceId);
  };
  useEffect(() => {
    if (!ending) return;
    completeWorldMission({
      missionId: mission.id,
      endingId: ending.id,
      title: ending.title,
      completedAt: new Date().toISOString(),
      evidence: state.playerEvidence,
    });
  }, [ending, mission.id, state.playerEvidence, completeWorldMission]);
  return (
    <main className="mission-sim">
      <header className="mission-top">
        <div>
          <span>04 / 有边界生成式叙事</span>
          <h1>{mission.title}</h1>
          <p>{mission.immutablePremise}</p>
        </div>
        <div className="mission-picker">
          {missionDefinitions.map((m) => (
            <button
              className={m.id === missionId ? "active" : ""}
              onClick={() => switchMission(m.id)}
              key={m.id}
            >
              {m.title}
            </button>
          ))}
        </div>
      </header>
      <div className="mission-grid">
        <aside className="mission-brief">
          <Tag tone="review">
            <ShieldCheck />
            策划锁定前提
          </Tag>
          <h2>任务目标</h2>
          {mission.playerObjectives.map((x) => (
            <p key={x}>
              <ChevronRight />
              {x}
            </p>
          ))}
          <h2>必要剧情节点</h2>
          <ol>
            {mission.requiredStoryBeats.map((b, i) => (
              <li
                className={
                  state.completedBeats.includes(b.id)
                    ? "done"
                    : i === state.currentMissionStage
                      ? "current"
                      : ""
                }
                key={b.id}
              >
                <i>{i + 1}</i>
                <span>
                  <b>{b.title}</b>
                  <small>{b.description}</small>
                </span>
              </li>
            ))}
          </ol>
          <h2>可交谈人物</h2>
          {mission.npcIds.map((id) => (
            <button
              className={`npc-select ${id === npcId ? "active" : ""}`}
              onClick={() => switchNPC(id)}
              key={id}
            >
              <UserRound />
              <span>
                <b>{npcById[id].name}</b>
                <small>
                  {npcById[id].role} · {npcById[id].alignment}
                </small>
              </span>
            </button>
          ))}
        </aside>
        <section className="dialogue-stage">
          <div className="npc-stage-head">
            <div className="npc-large-avatar">{npc.name[0]}</div>
            <span>
              <b>{npc.name}</b>
              <small>{npc.role}</small>
            </span>
            <Tag
              tone={
                provider.status === "online" || provider.status === "ready"
                  ? "open"
                  : provider.status === "offline" ||
                      provider.status === "degraded"
                    ? "blocked"
                    : "review"
              }
            >
              {provider.status === "checking" ? (
                <Bot />
              ) : provider.status === "online" || provider.status === "ready" ? (
                <Wifi />
              ) : (
                <WifiOff />
              )}
              {provider.status === "checking"
                ? "正在检测模型…"
                : provider.status === "online"
                ? `AI在线 · ${provider.model}`
                : provider.status === "ready"
                  ? `AI已配置 · ${provider.provider || provider.model}`
                  : provider.status === "degraded"
                    ? "AI响应异常 · 本地接管"
                : provider.status === "offline"
                  ? "模型不可达 · 本地演出"
                  : provider.configured
                    ? "模型待连接"
                    : "未配置模型"}
            </Tag>
            <Tag
              tone={
                npc.alignment === "malicious"
                  ? "blocked"
                  : npc.alignment === "benevolent"
                    ? "open"
                    : "warning"
              }
            >
              {npc.publicPersona}
            </Tag>
          </div>
          <div className="evidence-drawer">
            <span>现场证据</span>
            {mission.evidenceItems.map((item) => (
              <button
                className={
                  state.playerEvidence.includes(item.id) ? "collected" : ""
                }
                onClick={() => investigate(item.id)}
                key={item.id}
              >
                <FileText />
                <i>
                  <b>{item.title}</b>
                  <small>
                    {item.source} · {item.proves}
                  </small>
                </i>
                <em>
                  {state.playerEvidence.includes(item.id) ? "已取得" : "调查"}
                </em>
              </button>
            ))}
          </div>
          <div className="dialogue-scroll">
            {messages.length === 0 && (
              <div className="conversation-empty">
                <Bot />
                <b>自由输入任何话</b>
                <p>
                  没有固定选项。系统会先解析行动意图，再由规则引擎裁决，最后让AI按照人物设定生成台词。
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div className={`chat-line ${m.speaker}`} key={i}>
                <small>{m.speaker === "player" ? "你" : npc.name}</small>
                <p>{m.text}</p>
              </div>
            ))}
            {loading && (
              <div className="chat-line npc">
                <small>{npc.name}</small>
                <p>……</p>
              </div>
            )}
          </div>
          {ending && (
            <div className={`mission-ending ${ending.type}`}>
              <b>{ending.title}</b>
              <span>{ending.description}</span>
              <div>
                <Button onClick={backToMap}>返回职业地图</Button>
                <Button variant="secondary" onClick={next}>
                  进入能力迁移
                </Button>
              </div>
            </div>
          )}
          {last && (
            <div className="turn-consequence">
              <span>
                <b>系统识别</b>
                {last.intent.type}
              </span>
              <span>
                <b>NPC策略</b>
                {last.decision.responseStrategy}
              </span>
              <span>
                <b>规则结果</b>
                {last.transition.blockedReasons[0] ||
                last.transition.newEvidence.length
                  ? `新增证据 ${last.transition.newEvidence.join("、") || "—"}`
                  : "任务状态已更新"}
              </span>
            </div>
          )}
          <div className="prompt-hints">
            <small>你可以这样表达，也可以完全自由输入</small>
            {promptHints.map((x) => (
              <button type="button" onClick={() => setInput(x)} key={x}>
                {x}
              </button>
            ))}
          </div>
          <form
            className="free-dialogue"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`对${npc.name}说任何话；可以追问、核验、谈判、拒绝、留证或离开……`}
              maxLength={1000}
            />
            <button
              disabled={!input.trim() || loading || state.status !== "active"}
            >
              <Send />
            </button>
          </form>
          <div className="dialogue-boundary">
            <ShieldCheck />
            AI只生成台词；任务节点、关系和结局由规则引擎决定。当前必要节点：
            {beat?.title || "已完成"}
          </div>
        </section>
        <aside className={`narrative-debug ${debug ? "" : "collapsed"}`}>
          <button className="debug-toggle" onClick={() => setDebug(!debug)}>
            <Terminal />
            {debug ? "隐藏" : "显示"}调试状态
          </button>
          {debug && (
            <>
              <section>
                <h3>
                  <Database />
                  MISSION RUNTIME
                </h3>
                <pre>
                  {JSON.stringify(
                    {
                      stage: state.currentMissionStage,
                      status: state.status,
                      completedBeats: state.completedBeats,
                      evidence: state.playerEvidence,
                      discoveredFacts: state.discoveredFacts,
                      ending: state.endingId,
                    },
                    null,
                    2,
                  )}
                </pre>
              </section>
              <section>
                <h3>
                  <Eye />
                  RELATIONSHIP
                </h3>
                <div className="debug-bars">
                  {(
                    [
                      "trust",
                      "respect",
                      "caution",
                      "resentment",
                      "powerGap",
                      "informationGap",
                    ] as const
                  ).map((k) => (
                    <label key={k}>
                      <span>{k}</span>
                      <i>
                        <b style={{ width: `${relationship[k]}%` }} />
                      </i>
                      <em>{relationship[k]}</em>
                    </label>
                  ))}
                </div>
              </section>
              <section>
                <h3>
                  <Bot />
                  LAST PIPELINE
                </h3>
                <pre>
                  {last
                    ? JSON.stringify(
                        {
                          intent: last.intent,
                          decision: last.decision,
                          transition: last.transition,
                          mode: last.dialogue.mode,
                          validationFailures: last.validationFailures,
                        },
                        null,
                        2,
                      )
                    : "等待玩家输入"}
                </pre>
              </section>
              <section>
                <h3>
                  <FileText />
                  LONG MEMORY
                </h3>
                <p>{memory || "暂无长期摘要"}</p>
              </section>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
