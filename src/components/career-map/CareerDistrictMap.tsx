"use client";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock3,
  DoorOpen,
  LockKeyhole,
  MapPin,
  Route,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button, Tag } from "@/components/ui";
import PhaserCareerWorld, {
  WorldClue,
  WorldPlace,
} from "./PhaserCareerWorld";
import { useGameStore } from "@/store/game";

const districts = [
  {
    id: "spatial",
    missionId: "scope_and_credit",
    name: "空间技术区",
    x: 21,
    y: 19,
    level: 2,
    building: "空间数据实验室",
    path: "gis-dev",
    npc: "周老师",
    npcId: "mentor",
    role: "项目负责人",
    availableRounds: [1, 2, 4, 5],
    awayMessage: "周老师正在参加项目评审，傍晚后才会回复。",
  },
  {
    id: "market",
    missionId: "training_contract",
    name: "市场应用区",
    x: 70,
    y: 18,
    level: 1,
    building: "城市科技公司",
    path: "urban",
    npc: "高原",
    npcId: "interviewer",
    role: "空间技术负责人",
    availableRounds: [2, 3, 5, 6],
    awayMessage: "高原正在客户现场，开放日接待尚未开始。",
  },
  {
    id: "public",
    missionId: null,
    name: "公共事务区",
    x: 72,
    y: 56,
    level: 1,
    building: "资格档案馆",
    path: "natural",
    npc: "乔文",
    npcId: "engineer",
    role: "国企项目工程师",
    availableRounds: [1, 2, 3, 4, 5, 6],
    awayMessage: "档案馆今天暂停接待。",
  },
  {
    id: "research",
    missionId: "career_interview",
    name: "研究与交流区",
    x: 19,
    y: 53,
    level: 1,
    building: "从业者咖啡馆",
    path: "institute",
    npc: "林珊",
    npcId: "senior",
    role: "GIS 企业校友",
    availableRounds: [1, 3, 4, 6],
    awayMessage: "林珊正在远程会议中，暂时不能进行完整访谈。",
  },
  {
    id: "transition",
    missionId: null,
    name: "跨界探索区",
    x: 42,
    y: 78,
    level: 0,
    building: "能力迁移工坊",
    path: "supply",
    npc: "唐宁",
    npcId: "pm",
    role: "城市数据产品经理",
    availableRounds: [3, 4, 5, 6],
    awayMessage: "能力迁移工作坊尚未开放。",
  },
];
type District = (typeof districts)[number];

const missionPrompts: Record<string, string> = {
  scope_and_credit: "调查项目范围与成果归属",
  training_contract: "核验培训承诺、合同与付款风险",
  career_interview: "访谈从业者并核验岗位真实工作",
};

const mapClues = [
  {
    id: "original_message",
    title: "原始任务消息",
    description: "证明最初确认的工作只有数据清洗。",
    x: 30,
    y: 29,
  },
  {
    id: "contract_copy",
    title: "培训合同样本",
    description: "可以核验退款、服务范围与责任条款。",
    x: 62,
    y: 29,
  },
  {
    id: "task_sample",
    title: "岗位任务样本",
    description: "记录从业者最近一个月的真实交付内容。",
    x: 30,
    y: 61,
  },
];

function PixelPerson({ player = false }: { player?: boolean }) {
  return (
    <span className={`controlled-sprite ${player ? "player" : ""}`}>
      <i className="ps-shadow" />
      <i className="ps-legs" />
      <i className="ps-body" />
      <i className="ps-head" />
      <i className="ps-hair" />
      {player && <i className="ps-bag" />}
    </span>
  );
}

function Interior({
  district,
  close,
}: {
  district: District;
  close: () => void;
}) {
  const [input, setInput] = useState(""),
    [messages, setMessages] = useState<
      { who: "npc" | "player"; text: string }[]
    >([
      {
        who: "npc",
        text: `你来了。这里是${district.building}。比起问“这份职业好不好”，你今天更想核验哪一件具体的事？`,
      },
    ]),
    [loading, setLoading] = useState(false),
    [mode, setMode] = useState("角色开场");
  const send = async (text = input) => {
    if (!text.trim() || loading) return;
    setMessages((m) => [...m, { who: "player", text }]);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch("/api/dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcId: district.npcId,
          place: district.building,
          message: text,
          memory: messages.slice(-6).map((m) => `${m.who}:${m.text}`),
          profile: { major: "GIS", degree: "硕士", graduation: "2027" },
          worldState: { energy: 7, information_quality: 2, turn: 2 },
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error();
      setMessages((m) => [...m, { who: "npc", text: j.data.npc_message }]);
      setMode("AI 在线");
    } catch {
      setMessages((m) => [
        ...m,
        {
          who: "npc",
          text: "我只能先说我亲眼见过的部分。岗位名字经常比实际工作漂亮，你可以问我上个月真正交付了什么。",
        },
      ]);
      setMode("本地角色回退");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="interior-overlay">
      <section className={`interior-room room-${district.id}`}>
        <header>
          <button onClick={close}>
            <ArrowLeft />
            返回小镇
          </button>
          <div>
            <span>{district.name}</span>
            <b>{district.building}</b>
          </div>
          <Tag tone={mode === "AI 在线" ? "open" : "review"}>
            <i />
            {mode}
          </Tag>
        </header>
        <div className="room-scene">
          <div className="room-floor" />
          <div className="room-window" />
          <div className="room-desk">
            <i />
            <i />
          </div>
          <div className="room-shelf" />
          <div className="room-plant" />
          <div className="npc-in-room">
            <PixelPerson />
            <span>
              <b>{district.npc}</b>
              <small>{district.role}</small>
            </span>
          </div>
          <div className="player-in-room">
            <PixelPerson player />
          </div>
          <button className="inspect-object computer">
            <Sparkles />
            调查电脑上的岗位任务
          </button>
          <button className="inspect-object notice">
            <MapPin />
            查看本月公开活动
          </button>
        </div>
        <aside className="interior-dialogue">
          <div className="dialogue-person">
            <PixelPerson />
            <span>
              <b>{district.npc}</b>
              <small>{district.role} · 已观察：表达直接、资源有限</small>
            </span>
          </div>
          <div className="message-history">
            {messages.map((m, i) => (
              <p className={m.who} key={i}>
                <span>{m.text}</span>
              </p>
            ))}
            {loading && (
              <p className="npc">
                <span className="dotting">正在组织回答…</span>
              </p>
            )}
          </div>
          <div className="quick-asks">
            {[
              "你上个月实际在做什么？",
              "这条路径最大的误解是什么？",
              "新人最容易忽略什么风险？",
            ].map((q) => (
              <button onClick={() => send(q)} key={q}>
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`直接问${district.npc}任何具体问题…`}
            />
            <button disabled={loading || !input.trim()}>
              <Send />
            </button>
          </form>
          <small>
            <Sparkles />
            AI 只控制表达；资格、时间和资源仍由规则引擎计算。
          </small>
        </aside>
      </section>
    </div>
  );
}

export default function CareerDistrictMap({
  onSelect,
  onMissionStart,
}: {
  onSelect: (id: string) => void;
  onMissionStart: (missionId: string) => void;
}) {
  const outcomes = useGameStore((s) => s.missionOutcomes),
    worldEvidence = useGameStore((s) => s.worldEvidence),
    placeVisits = useGameStore((s) => s.placeVisits || {}),
    missionMemories = useGameStore((s) => s.missionMemories || {}),
    round = useGameStore((s) => s.round),
    startMission = useGameStore((s) => s.startMission),
    collectEvidence = useGameStore((s) => s.collectEvidence),
    visitPlace = useGameStore((s) => s.visitPlace);
  const [levels, setLevels] = useState<Record<string, number>>(
      Object.fromEntries(districts.map((d) => [d.id, d.level])),
    ),
    [selected, setSelected] = useState(districts[0]),
    [inside, setInside] = useState<District | null>(null),
    [discovery, setDiscovery] = useState<string | null>(null),
    [manualTip, setManualTip] = useState("WASD / 方向键移动 · 靠近地点互动");
  const upgrade = () =>
    setLevels((s) => ({
      ...s,
      [selected.id]: Math.min(3, s[selected.id] + 1),
    }));
  const effectiveLevels: Record<string, number> = useMemo(
    () => ({
      ...levels,
      spatial: outcomes.scope_and_credit ? 3 : levels.spatial,
      market: outcomes.training_contract ? 3 : levels.market,
      research: outcomes.career_interview ? 3 : levels.research,
    }),
    [levels, outcomes],
  );
  const worldRound = ((Math.max(1, round) - 1) % 6) + 1;
  const availableDistrictIds = useMemo(
    () =>
      new Set(
        districts
          .filter(
            (d) =>
              d.availableRounds.includes(worldRound) ||
              Boolean(d.missionId && outcomes[d.missionId]),
          )
          .map((d) => d.id),
      ),
    [outcomes, worldRound],
  );
  const isAvailable = (d: District) => availableDistrictIds.has(d.id);
  const worldPlaces: WorldPlace[] = useMemo(
    () =>
      districts.map((d) => ({
        ...d,
        locked:
          effectiveLevels[d.id] === 0 || !availableDistrictIds.has(d.id),
      })),
    [effectiveLevels, availableDistrictIds],
  );
  const worldClues: WorldClue[] = useMemo(
    () =>
      mapClues.map((clue) => ({
        ...clue,
        collected: worldEvidence.includes(clue.id),
      })),
    [worldEvidence],
  );
  const selectedOutcome = selected.missionId
    ? outcomes[selected.missionId]
    : undefined;
  const selectedMemory = selected.missionId
    ? missionMemories[selected.missionId]?.at(-1)
    : undefined;
  const dayPhase =
    worldRound <= 2 ? "上午" : worldRound <= 4 ? "下午" : "傍晚";
  const selectedAvailable = isAvailable(selected);
  const enterDistrict = (d: District) => {
    setSelected(d);
    onSelect(d.path);
    if (!isAvailable(d)) {
      setManualTip(d.awayMessage);
      return;
    }
    visitPlace(d.id);
    if (d.missionId) {
      startMission(d.missionId);
      onMissionStart(d.missionId);
      return;
    }
    setInside(d);
  };
  return (
    <div className="district-map alive-map game-engine-map">
      <PhaserCareerWorld
        places={worldPlaces}
        clues={worldClues}
        onHint={setManualTip}
        onFocus={(id) => {
          const d = districts.find((x) => x.id === id);
          if (d) {
            setSelected(d);
            onSelect(d.path);
          }
        }}
        onEnter={(id) => {
          const d = districts.find((x) => x.id === id);
          if (d) enterDistrict(d);
        }}
        onInspect={(id) => {
          const clue = mapClues.find((item) => item.id === id);
          if (!clue) return;
          collectEvidence(id);
          setDiscovery(`${clue.title}：${clue.description}`);
          setManualTip(`证据已归档：${clue.title}`);
        }}
      />
      {discovery && (
        <button className="map-discovery" onClick={() => setDiscovery(null)}>
          <Sparkles />
          <span>
            <b>发现新证据</b>
            <small>{discovery}</small>
          </span>
          <Check />
        </button>
      )}
      <div className="town-atmosphere" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div className={`map-walker walker-${i}`} key={i}>
          <span className="thought">
            {i === 1 ? "!" : i === 4 ? "?" : "···"}
          </span>
          <i className="person-shadow" />
          <i className="person-legs" />
          <i className="person-body" />
          <i className="person-head" />
        </div>
      ))}
      <div className="play-hint">
        <Zap />
        <b>{manualTip}</b>
        <small>
          <kbd>WASD</kbd>移动 <kbd>E</kbd>进入 <kbd>点击地点</kbd>自动前往
        </small>
      </div>
      <button
        className="live-event e1"
        onClick={() => enterDistrict(districts[3])}
        disabled={!isAvailable(districts[3])}
      >
        <Sparkles />
        <span>
          <b>
            {!isAvailable(districts[3])
              ? "校友正在远程会议"
              : outcomes.career_interview
              ? "校友发来了后续岗位线索"
              : "校友访谈正在进行"}
          </b>
          <small>
            {!isAvailable(districts[3])
              ? "下一时段再来，或先调查其他地点"
              : outcomes.career_interview
              ? "回到咖啡馆查看对方记住的谈话结果"
              : "前往咖啡馆了解城市数据岗位"}
          </small>
        </span>
      </button>
      <button
        className="live-event e2"
        onClick={() => enterDistrict(districts[1])}
        disabled={!isAvailable(districts[1])}
      >
        <Clock3 />
        <span>
          <b>
            {!isAvailable(districts[1])
              ? "企业接待尚未开始"
              : outcomes.training_contract
              ? "合同核验产生了新的风险记录"
              : "企业开放日 · 剩余 2 回合"}
          </b>
          <small>
            {!isAvailable(districts[1])
              ? "完成当前调查后，世界时间将向前推进"
              : outcomes.training_contract
              ? "查看已经写入档案的承诺与证据"
              : "进入公司获得一手工作信息"}
          </small>
        </span>
      </button>
      <aside className="district-upgrade">
        <Tag
          tone={
            effectiveLevels[selected.id] === 0 || !selectedAvailable
              ? "blocked"
              : "open"
          }
        >
          {effectiveLevels[selected.id] === 0 || !selectedAvailable ? (
            <LockKeyhole />
          ) : (
            <MapPin />
          )}
          {selected.name} · {selectedAvailable ? "NPC在场" : "NPC外出"}
        </Tag>
        <h3>{selected.building}</h3>
        <p>
          {selectedOutcome
            ? `任务已结束：${selectedOutcome.title}。新的证据已经进入职业档案。`
            : !selectedAvailable
              ? selected.awayMessage
              : effectiveLevels[selected.id] === 0
              ? "完成一次能力迁移，修复通往这一区域的路线。"
              : "进入场所与 NPC 互动，或投入真实行动升级，增加岗位证据与新事件。"}
        </p>
        <dl>
          <div>
            <dt>当前等级</dt>
            <dd>{effectiveLevels[selected.id]} / 3</dd>
          </div>
          <div>
            <dt>世界状态</dt>
            <dd>
              {selectedOutcome ? (
                <>
                  <Check />
                  任务结果已写入
                </>
              ) : (
                <>
                  <Clock3 />
                  等待调查
                </>
              )}
            </dd>
          </div>
          <div>
            <dt>下一步</dt>
            <dd>
              {!selectedAvailable
                ? `等待下一时段（当前第 ${worldRound} 回合）`
                : selected.missionId
                ? missionPrompts[selected.missionId]
                : "完成前置调查以解锁新的职业事件"}
            </dd>
          </div>
          <div>
            <dt>场所动态</dt>
            <dd>
              {dayPhase} · 已到访 {placeVisits[selected.id] || 0} 次
            </dd>
          </div>
        </dl>
        {selectedMemory && (
          <div className="place-memory">
            <Sparkles />
            <span>
              <b>NPC 记得上次结果</b>
              <small>{selectedMemory}</small>
            </span>
          </div>
        )}
        <div className="place-actions">
          <Button
            onClick={() => enterDistrict(selected)}
            disabled={
              effectiveLevels[selected.id] === 0 || !selectedAvailable
            }
          >
            <DoorOpen />
            {selected.missionId
              ? selectedOutcome
                ? "重新查看任务"
                : "开始调查任务"
              : "进入场所"}
          </Button>
          <Button
            variant="secondary"
            disabled={
              effectiveLevels[selected.id] === 0 ||
              effectiveLevels[selected.id] >= 3
            }
            onClick={upgrade}
          >
            {effectiveLevels[selected.id] >= 3 ? (
              <>
                <Check />
                已达上限
              </>
            ) : (
              <>
                升级 <Route />
              </>
            )}
          </Button>
        </div>
      </aside>
      {inside && <Interior district={inside} close={() => setInside(null)} />}
    </div>
  );
}
