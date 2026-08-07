"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileText,
  HelpCircle,
  Info,
  Layers3,
  Network,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
  Volume2,
  WalletCards,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Button, Panel, Tag, TextArea } from "@/components/ui";
import { events, profileCards, transferItems } from "@/data/mock";
import type { ProductStep, ProfileMode, DecisionRecord } from "@/types/product";
import type { ParsedProfile, ProfileCard } from "@/types/profile";
import MissionSimulation from "@/components/scenario/MissionSimulation";

const CareerNetwork = dynamic(
  () => import("@/components/career-map/CareerNetwork"),
  {
    ssr: false,
    loading: () => (
      <div className="map-loading">
        <Network />
        <b>正在建立职业关系网络</b>
        <span>连接能力、限制与职业路径…</span>
      </div>
    ),
  },
);
const flow: ProductStep[] = [
  "home",
  "onboarding",
  "parsing",
  "review",
  "map",
  "simulation",
  "transfer",
  "result",
];
const labels: Record<ProductStep, string> = {
  home: "首页",
  onboarding: "建立档案",
  parsing: "AI解析",
  review: "确认档案",
  map: "职业地图",
  simulation: "情景模拟",
  transfer: "能力迁移",
  result: "调查报告",
};

function TopBar({
  step,
  go,
}: {
  step: ProductStep;
  go: (s: ProductStep) => void;
}) {
  const index = flow.indexOf(step);
  return (
    <header className="top-bar">
      <button className="logo" onClick={() => go("home")} aria-label="返回首页">
        <span>IF</span>
        <div>
          <b>IF人生线</b>
          <small>未开放区域</small>
        </div>
      </button>
      {step !== "home" && (
        <div className="flow-nav" aria-label="当前流程">
          {flow.slice(1).map((s, i) => (
            <button
              key={s}
              onClick={() => i < index && go(s)}
              disabled={i >= index}
              className={s === step ? "active" : i < index ? "done" : ""}
            >
              <i>{i < index ? <Check /> : i + 1}</i>
              <span>{labels[s]}</span>
            </button>
          ))}
        </div>
      )}
      <div className="top-tools">
        <span className="save-state">
          <i />
          已保存
        </span>
        <button aria-label="声音">
          <Volume2 />
        </button>
        <button aria-label="帮助">
          <HelpCircle />
        </button>
        <button aria-label="设置">
          <Settings />
        </button>
      </div>
    </header>
  );
}

function Home({ start, preset }: { start: () => void; preset: () => void }) {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <Tag tone="ai">
            <Sparkles />
            AI职业决策模拟
          </Tag>
          <h1>
            你看见的职业，
            <br />
            <em>只是当前能够识别的部分。</em>
          </h1>
          <p className="hero-lead">
            用真实专业、项目、经历与现实限制，生成一张属于你的职业路径图。
          </p>
          <div className="hero-rule">
            <i />
            <p>
              不预测唯一答案。
              <br />
              让你看见已经开放的路径、尚缺的条件，以及值得现实验证的方向。
            </p>
          </div>
          <div className="hero-actions">
            <Button onClick={start}>
              建立我的职业档案
              <ArrowRight />
            </Button>
            <Button variant="secondary" onClick={preset}>
              使用 GIS 硕士试玩
            </Button>
          </div>
          <small className="privacy-note">
            <ShieldCheck />
            无需注册即可完成试玩。结果不构成报考或录取保证。
          </small>
        </div>
        <NetworkPreview />
      </section>
      <section className="how-section">
        <div className="section-intro">
          <span>HOW IT WORKS</span>
          <h2>
            不是测出答案，
            <br />
            而是逐步建立证据。
          </h2>
        </div>
        {[
          [
            "01",
            FileText,
            "建立档案",
            "AI 从你的经历中提取事实、能力和需要确认的推断。",
          ],
          [
            "02",
            Network,
            "探索路径",
            "查看职业门槛、技能缺口、时间窗口和转型成本。",
          ],
          [
            "03",
            BrainCircuit,
            "模拟决策",
            "在情景事件中体验不同选择带来的实际代价。",
          ],
        ].map(([n, I, t, d]) => (
          <article className="how-item" key={n as string}>
            <span>{n as string}</span>
            <I />
            <h3>{t as string}</h3>
            <p>{d as string}</p>
          </article>
        ))}
      </section>
      <section className="case-section">
        <div>
          <span>CASE / GIS 硕士</span>
          <h2>
            专业名称之外，
            <br />
            经历仍在继续连接。
          </h2>
          <p>
            能力迁移不是把相似词拼在一起，而是寻找被项目实际证明、又能在新场景中复用的能力。
          </p>
        </div>
        <div className="case-paths">
          <PathRow from="道路网络分析" via="网络数据能力" to="物流网络分析" />
          <PathRow from="遥感项目" via="环境数据能力" to="气候风险分析" />
        </div>
      </section>
    </main>
  );
}
function PathRow({ from, via, to }: { from: string; via: string; to: string }) {
  return (
    <div className="path-row">
      <span>
        {from}
        <small>经历</small>
      </span>
      <i />
      <span>
        {via}
        <small>可迁移能力</small>
      </span>
      <i className="dashed" />
      <span>
        {to}
        <small>待核验职业</small>
      </span>
    </div>
  );
}
function NetworkPreview() {
  const nodes = [
    ["GIS 硕士", "center", 45, 46],
    ["遥感分析", "open", 12, 12],
    ["GIS 开发", "open", 70, 10],
    ["博士研究", "review", 72, 72],
    ["气候风险", "ai", 14, 72],
    ["数据分析", "near", 6, 40],
    ["城市科技", "near", 78, 40],
  ];
  return (
    <div className="network-preview" aria-label="GIS硕士职业路径示意图">
      <div className="preview-grid" />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M49 49L20 20M53 46L76 18M53 53L77 77M46 54L20 77M44 49L14 45M54 49L84 45" />
      </svg>
      {nodes.map(([t, c, x, y], i) => (
        <motion.div
          key={t as string}
          className={`preview-node ${c}`}
          style={{ left: `${x}%`, top: `${y}%` }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + i * 0.1 }}
        >
          <i />
          {t as string}
          {c === "ai" && <small>AI 发现</small>}
        </motion.div>
      ))}
      <div className="preview-note">
        <Sparkles />
        一条隐藏路径正在形成
      </div>
    </div>
  );
}

function Onboarding({
  submitProfile,
  preset,
}: {
  submitProfile: (input: { text?: string; file?: File }) => Promise<void>;
  preset: () => void;
}) {
  const [mode, setMode] = useState<ProfileMode>("text"),
    [text, setText] = useState(""),
    [structured, setStructured] = useState<Record<string, string>>({
      专业: "",
      学历: "",
      毕业时间: "",
      当前城市: "",
      技能: "",
      项目与实习: "",
      当前选择: "",
      现实限制: "",
    }),
    [file, setFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await submitProfile(
        mode === "upload"
          ? { file: file || undefined }
          : mode === "structured"
            ? { text: Object.entries(structured).map(([key, value]) => `${key}：${value || "未填写"}`).join("\n") }
            : { text },
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "简历解析失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="content-page onboarding">
      <PageHeader
        eyebrow="01 / 建立职业档案"
        title="先从真实经历开始"
        detail="只需提供你愿意分享的信息。AI 会区分事实与推断，并在下一步请你确认。"
      />
      <div className="mode-switch" role="tablist">
        {[
          ["text", FileText, "粘贴经历", "简历、自我介绍或当前困惑"],
          ["upload", Upload, "上传简历", "支持 PDF、DOCX、TXT，最大 5MB"],
          ["structured", PenLine, "结构化填写", "按专业、项目和限制逐项填写"],
          ["preset", Users, "预设试玩", "使用完整示例快速体验"],
        ].map(([id, I, t, d]) => (
          <button
            role="tab"
            aria-selected={mode === id}
            className={mode === id ? "active" : ""}
            onClick={() => setMode(id as ProfileMode)}
            key={id as string}
          >
            <I />
            <span>
              <b>{t as string}</b>
              <small>{d as string}</small>
            </span>
            <i>
              <Check />
            </i>
          </button>
        ))}
      </div>
      {mode === "text" && (
        <Panel className="input-panel">
          <div className="input-head">
            <div>
              <b>描述你的背景与当前选择</b>
              <span>不需要写得完整，事实越具体越有帮助。</span>
            </div>
            <button onClick={() => setText("")}>
              <Trash2 />
              清除
            </button>
          </div>
          <TextArea
            value={text}
            maxLength={4000}
            onChange={(e) => setText(e.target.value)}
            placeholder="例如：我是地图学与地理信息系统硕士，预计2027年毕业，会Python和ArcGIS，做过道路网络与遥感项目，但企业实习较少。我目前在读博、国央企、数据分析和考公之间犹豫。"
          />
          <div className="input-foot">
            <span>
              <ShieldCheck />
              请勿填写身份证号、手机号等敏感信息
            </span>
            <small>{text.length} / 4000</small>
          </div>
        </Panel>
      )}
      {mode === "upload" && (
        <Panel className="resume-upload-panel">
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => {
              setError("");
              setFile(event.target.files?.[0] || null);
            }}
          />
          <button type="button" className={file ? "has-file" : ""} onClick={() => fileInput.current?.click()}>
            {file ? <FileCheck2 /> : <Upload />}
            <span>
              <b>{file ? file.name : "选择一份简历"}</b>
              <small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · 点击可重新选择` : "PDF、DOCX 或 TXT · 不超过 5MB"}</small>
            </span>
          </button>
          <p><ShieldCheck />文件只用于提取职业档案；请先删除身份证号、手机号、住址等敏感信息。</p>
        </Panel>
      )}
      {mode === "structured" && <StructuredForm values={structured} onChange={(key, value) => setStructured((current) => ({ ...current, [key]: value }))} />}
      {mode === "preset" && (
        <div className="preset-list">
          {[
            ["GIS 硕士", "空间分析 · Python · 路网项目", "已完善"],
            ["计算机硕士", "算法 · 工程 · 产品探索", "示例"],
            ["人文社科硕士", "研究 · 写作 · 公共事务", "示例"],
          ].map((x, i) => (
            <button
              className={i === 0 ? "selected" : ""}
              onClick={i === 0 ? preset : undefined}
              key={x[0]}
            >
              <span>0{i + 1}</span>
              <div>
                <b>{x[0]}</b>
                <small>{x[1]}</small>
              </div>
              <Tag tone={i === 0 ? "open" : "neutral"}>{x[2]}</Tag>
            </button>
          ))}
        </div>
      )}
      <div className="page-action">
        <span>
          <Info />
          {error || "输入内容仅用于本次职业路径生成"}
        </span>
        <Button
          disabled={busy || (mode === "text" && text.length < 20) || (mode === "upload" && !file) || (mode === "structured" && !structured.专业 && !structured.项目与实习)}
          onClick={mode === "preset" ? preset : submit}
        >
          {mode === "preset" ? "使用选中档案" : busy ? "正在读取并解析…" : "开始解析经历"}
          <ArrowRight />
        </Button>
      </div>
    </main>
  );
}
function StructuredForm({ values, onChange }: { values: Record<string, string>; onChange: (key: string, value: string) => void }) {
  const fields = ["专业", "学历", "毕业时间", "当前城市", "技能", "项目与实习", "当前选择", "现实限制"];
  return (
    <Panel className="structured-form">
      {fields.map((field) => (
        <label key={field}>
          <span>{field}</span>
          <input value={values[field] || ""} onChange={(event) => onChange(field, event.target.value)} placeholder={`填写${field}`} />
        </label>
      ))}
    </Panel>
  );
}

function Parsing({ done }: { done: () => void }) {
  const [current, setCurrent] = useState(0);
  const stages = [
    [FileCheck2, "识别明确事实", "区分用户提供的信息与背景描述"],
    [Layers3, "提取项目能力", "从实际行动中寻找能力证据"],
    [ShieldCheck, "检查资格和时间条件", "标记需要正式渠道核验的门槛"],
    [Network, "建立职业关系", "连接直接、邻接与转型路径"],
    [Check, "生成待确认档案", "等待你确认 AI 推断"],
  ];
  useEffect(() => {
    const timer = setInterval(
      () =>
        setCurrent((c) => {
          if (c >= 5) {
            clearInterval(timer);
            return c;
          }
          return c + 1;
        }),
      650,
    );
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (current === 5) {
      const t = setTimeout(done, 700);
      return () => clearTimeout(t);
    }
  }, [current, done]);
  return (
    <main className="parsing-page">
      <div className="scan-visual">
        <div className="scan-line" />
        <div className="document-ghost">
          <span />
          <span />
          <span />
          <i />
        </div>
        <small>IF / PROFILE PARSER</small>
      </div>
      <section>
        <Tag tone="ai">
          <Sparkles />
          规则约束的 AI 解析
        </Tag>
        <h1>
          正在把经历，
          <br />
          整理成可以核验的职业条件。
        </h1>
        <p>AI 不会直接替你确认能力，也不会修改学历、专业和资格门槛。</p>
        <div className="parsing-stages">
          {stages.map(([I, t, d], i) => (
            <div
              className={i < current ? "done" : i === current ? "current" : ""}
              key={t as string}
            >
              <i>{i < current ? <Check /> : <I />}</i>
              <span>
                <b>{t as string}</b>
                <small>{d as string}</small>
              </span>
              {i === current && <em>处理中</em>}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Review({ next, cards, setCards }: { next: () => void; cards: ProfileCard[]; setCards: React.Dispatch<React.SetStateAction<ProfileCard[]>> }) {
  const groups: ProfileCard["type"][] = ["事实", "能力", "推断", "资格", "限制", "偏好"];
  return (
    <main className="content-page review-page">
      <PageHeader
        eyebrow="02 / 确认职业档案"
        title="推断不是事实，先由你确认"
        detail="地图只会使用已确认信息。你可以编辑、删除，或把任何内容改回待确认。"
        side={
          <div className="review-progress">
            <b>{cards.filter((c) => c.confirmed).length}</b>
            <span>
              /{cards.length}
              <small>已确认</small>
            </span>
          </div>
        }
      />
      <div className="review-layout">
        <div className="review-content">
          {groups.map((g) => (
            <section className="card-group" key={g}>
              <div className="group-title">
                <span>{g}</span>
                <i />
                {g === "推断" && (
                  <small>
                    <Sparkles />
                    根据项目描述推断，需要确认
                  </small>
                )}
              </div>
              <div className="review-grid">
                {cards
                  .filter((c) => c.type === g)
                  .map((c) => (
                    <article
                      className={`profile-card ${c.type === "推断" ? "inference" : ""} ${c.confirmed ? "confirmed" : ""}`}
                      key={c.id}
                    >
                      <div>
                        <Tag tone={c.type === "推断" ? "ai" : "neutral"}>
                          {c.type}
                        </Tag>
                        <span>证据：{c.evidence}</span>
                      </div>
                      <h3>{c.title}</h3>
                      <p>{c.detail}</p>
                      <footer>
                        <button
                          onClick={() =>
                            setCards((v) =>
                              v.map((x) =>
                                x.id === c.id
                                  ? { ...x, confirmed: !x.confirmed }
                                  : x,
                              ),
                            )
                          }
                        >
                          {c.confirmed ? (
                            <>
                              <Check />
                              已确认
                            </>
                          ) : (
                            <>
                              <Plus />
                              确认
                            </>
                          )}
                        </button>
                        <button>
                          <PenLine />
                          编辑
                        </button>
                        <button aria-label="删除" onClick={() => setCards((value) => value.filter((item) => item.id !== c.id))}>
                          <Trash2 />
                        </button>
                      </footer>
                    </article>
                  ))}
                <button className="add-profile">
                  <Plus />
                  添加{g}
                </button>
              </div>
            </section>
          ))}
        </div>
        <aside className="review-aside">
          <b>AI 处理边界</b>
          <p>以下内容不会由模型自动确认：</p>
          <ul>
            <li>专业目录与岗位资格</li>
            <li>应届身份的正式定义</li>
            <li>证书和工作年限</li>
            <li>具体岗位录取结果</li>
          </ul>
          <div>
            <CircleAlert />
            <span>
              <b>2 项仍需核验</b>毕业窗口、可接受异地时长
            </span>
          </div>
        </aside>
      </div>
      <StickyAction text="生成职业地图" onClick={next} />
    </main>
  );
}

function Simulation({
  next,
  records,
  setRecords,
}: {
  next: () => void;
  records: DecisionRecord[];
  setRecords: (r: DecisionRecord[]) => void;
}) {
  const turn = Math.min(records.length + 1, 6),
    event = events[(turn - 1) % 6];
  const [feedback, setFeedback] = useState<string[] | null>(null);
  const choose = (text: string, i: number) => {
    const tags =
      i === 0
        ? ["证据质量提升", "关系短期紧张"]
        : i === 1
          ? ["项目进展", "精力承压"]
          : ["信息来源增加", "时间窗口缩短"];
    setRecords([...records, { turn, choice: text, tags }]);
    setFeedback(tags);
  };
  const proceed = () => {
    setFeedback(null);
    if (turn >= 6) next();
  };
  return (
    <main className="simulation-page">
      <div className="resource-header">
        <div>
          <span>04 / 情景模拟</span>
          <h1>
            第 {turn} 回合 <small>/ 6</small>
          </h1>
        </div>
        <div className="resource-list">
          <Resource
            icon={Clock3}
            label="时间"
            value={`${7 - turn} 回合`}
            level="窗口仍开放"
          />
          <Resource
            icon={Zap}
            label="精力"
            value={turn < 4 ? "可用" : "紧张"}
            level="行动成本 +1"
          />
          <Resource
            icon={WalletCards}
            label="经济缓冲"
            value="很有限"
            level="不宜长期空档"
          />
          <Resource
            icon={Search}
            label="信息质量"
            value={records.length > 2 ? "多来源" : "单一来源"}
            level={`${2 + records.length} 条证据`}
          />
          <Resource
            icon={Users}
            label="支持网络"
            value="3 人"
            level="1 人可引荐"
          />
        </div>
      </div>
      <div className="turn-track">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <span
            className={i < turn ? "done" : i === turn ? "active" : ""}
            key={i}
          >
            <i>{i < turn ? <Check /> : i}</i>
            <small>
              {["调查", "接触", "投入", "冲突", "窗口", "决定"][i - 1]}
            </small>
          </span>
        ))}
      </div>
      <div className="scenario-layout">
        <section className="scenario-visual">
          <div className="editorial-scene">
            <div className="scene-window" />
            <div className="scene-table" />
            <div className="npc-silhouette">
              <span>{event.npc[0]}</span>
            </div>
            <small>{event.location} · 周三 18:40</small>
          </div>
          <div className="npc-summary">
            <div className="avatar">{event.npc[0]}</div>
            <span>
              <b>{event.npc}</b>
              <small>{event.role}</small>
            </span>
            <Tag tone="review">权力差距：较高</Tag>
          </div>
          <p>“{event.message}”</p>
          <div className="relationship-copy">
            已观察：任务导向明确 · 边界尊重尚不稳定 · 信息透明度一般
          </div>
        </section>
        <section className="scenario-case">
          <Tag tone="near">{event.type}</Tag>
          <h2>{event.title}</h2>
          <FactBlock title="已知事实" items={event.facts} />
          <div className="signal-block">
            <h3>可观察信号</h3>
            <div>
              {event.signals.map((s) => (
                <Tag tone="warning" key={s}>
                  <CircleAlert />
                  {s}
                </Tag>
              ))}
            </div>
          </div>
          <h3>你准备怎样回应？</h3>
          <div className="choice-list">
            {event.choices.slice(0, 4).map((c, i) => (
              <button onClick={() => choose(c.text, i)} key={c.text}>
                <i>{String.fromCharCode(65 + i)}</i>
                <span>
                  <b>{c.text}</b>
                  <small>{c.hint}</small>
                </span>
                <ChevronRight />
              </button>
            ))}
          </div>
          <small className="uncertainty">
            <Info />
            选择会改变资源、关系与后续事件；不存在唯一正确答案。
          </small>
        </section>
      </div>
      <AnimatePresence>
        {feedback && (
          <motion.div
            className="feedback-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div>
              <Tag tone="open">
                <Check />
                选择已记录
              </Tag>
              <h2>立即结果</h2>
              {feedback.map((x) => (
                <p key={x}>
                  <Check />
                  {x}
                </p>
              ))}
              <div className="delayed">
                <Clock3 />
                <span>
                  <b>延迟影响</b>这一选择可能影响后续资源分配与 NPC 信息透明度。
                </span>
              </div>
              <Button onClick={proceed}>
                {turn >= 6 ? "进入能力迁移" : "进入下一回合"}
                <ArrowRight />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
function Resource({
  icon: I,
  label,
  value,
  level,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  level: string;
}) {
  return (
    <div>
      <I />
      <span>
        <small>{label}</small>
        <b>{value}</b>
        <em>{level}</em>
      </span>
    </div>
  );
}
function FactBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="fact-block">
      <h3>{title}</h3>
      <ul>
        {items.map((x) => (
          <li key={x}>
            <i />
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Transfer({ next }: { next: () => void }) {
  const [selected, setSelected] = useState([0, 2]);
  return (
    <main className="content-page transfer-page">
      <PageHeader
        eyebrow="05 / 能力迁移工作台"
        title="让过去的经历，连接新的问题"
        detail="选择真实资产，系统只解释已有证据如何迁移，不会替你发明能力。"
      />
      <div className="transfer-board">
        <section className="asset-column">
          <h2>
            我的能力资产 <small>{selected.length} 项已选</small>
          </h2>
          <div className="asset-filter">
            <button className="active">全部</button>
            <button>项目</button>
            <button>技能</button>
            <button>经历</button>
            <button>资格</button>
          </div>
          {transferItems.map((x, i) => (
            <button
              className={`asset-item ${selected.includes(i) ? "selected" : ""}`}
              onClick={() =>
                setSelected((s) =>
                  s.includes(i) ? s.filter((v) => v !== i) : [...s, i],
                )
              }
              key={x.title}
            >
              <i>{selected.includes(i) ? <Check /> : <Plus />}</i>
              <span>
                <b>{x.title}</b>
                <small>{x.tags.join(" · ")}</small>
              </span>
            </button>
          ))}
        </section>
        <section className="combine-space">
          <span>组合工作区</span>
          <div className="combine-orbit">
            {selected.map((n, i) => (
              <motion.i
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key={n}
                style={{ transform: `rotate(${i * 120}deg) translateX(100px)` }}
              >
                {n + 1}
              </motion.i>
            ))}
            <div>
              <Network />
              <b>网络数据分析</b>
              <small>共同能力</small>
            </div>
          </div>
          <p>
            {selected.length < 2
              ? "至少选择两项资产"
              : "两项经历共同证明了复杂网络数据处理与可视化表达能力。"}
          </p>
        </section>
        <section className="transfer-output">
          <Tag tone="ai">
            <Sparkles />
            AI 迁移解释
          </Tag>
          <h2>可以连接的路径</h2>
          {[
            ["物流网络分析", "接近开放", "缺行业指标"],
            ["交通数据分析", "已开放", "证据较完整"],
            ["基础设施风险", "需要调查", "缺真实岗位证据"],
          ].map((x, i) => (
            <article key={x[0]}>
              <span>0{i + 1}</span>
              <div>
                <b>{x[0]}</b>
                <small>{x[2]}</small>
              </div>
              <Tag tone={i === 0 ? "near" : i === 1 ? "open" : "review"}>
                {x[1]}
              </Tag>
            </article>
          ))}
          <div className="transfer-explain">
            <h3>迁移逻辑</h3>
            <p>
              道路网络项目证明了图结构建模、数据清洗和空间可视化。它们可以迁移到物流节点与设施网络问题。
            </p>
            <h3>仍然缺少</h3>
            <p>行业指标、企业数据语境和一份面向业务决策的案例。</p>
          </div>
          <Button onClick={next}>
            生成调查报告
            <ArrowRight />
          </Button>
        </section>
      </div>
    </main>
  );
}

function Result({
  records,
  restart,
}: {
  records: DecisionRecord[];
  restart: () => void;
}) {
  return (
    <main className="result-page">
      <header className="report-head">
        <div>
          <Tag tone="open">
            <FileCheck2 />
            职业路径调查已完成
          </Tag>
          <h1>你的职业路径调查结果</h1>
          <p>这不是唯一答案，而是当前条件下值得进一步验证的路径。</p>
        </div>
        <div className="report-id">
          <span>IF CAREER BRIEF</span>
          <b>GIS-27 / 001</b>
          <small>基于 {records.length || 6} 次决策与 7 项能力证据</small>
        </div>
      </header>
      <section className="report-summary">
        <div>
          <span>最接近的路径</span>
          <h2>空间数据开发</h2>
          <p>
            核心条件基本满足。最需要的不是重新选择专业，而是补充工程化交付证据。
          </p>
        </div>
        <dl>
          <div>
            <dt>信息质量</dt>
            <dd>多来源</dd>
          </div>
          <div>
            <dt>当前开放</dt>
            <dd>6 条路径</dd>
          </div>
          <div>
            <dt>值得补足</dt>
            <dd>8 条路径</dd>
          </div>
          <div>
            <dt>需要核验</dt>
            <dd>5 条路径</dd>
          </div>
        </dl>
      </section>
      <section className="path-groups">
        <ResultGroup
          index="01"
          title="当前可尝试"
          tone="open"
          items={["GIS 开发", "空间数据工程", "遥感分析"]}
        />
        <ResultGroup
          index="02"
          title="值得补足"
          tone="near"
          items={["城市数据分析", "物流网络分析", "气候风险分析"]}
        />
        <ResultGroup
          index="03"
          title="高成本路径"
          tone="warning"
          items={["跨专业读博", "长期脱产备考"]}
        />
        <ResultGroup
          index="04"
          title="需要核验 / 当前受限"
          tone="blocked"
          items={["专业限定公职岗", "特定资格技术岗"]}
        />
      </section>
      <section className="behavior-section">
        <div>
          <span>DECISION PATTERN</span>
          <h2>你在模拟中如何作出选择</h2>
        </div>
        <blockquote>
          你多次选择先获取信息，再作出承诺。在任务边界模糊时，你更倾向于保留记录并确认规则，而不是立即接受或拒绝。
        </blockquote>
      </section>
      <section className="experiments">
        <div>
          <span>NEXT / 14 DAYS</span>
          <h2>三个现实验证行动</h2>
        </div>
        {[
          [
            "01",
            "改写一份项目案例",
            "把道路网络项目改写为物流选址问题。",
            "4—6 小时",
            "验证是否能把研究表达转换为业务表达",
          ],
          [
            "02",
            "完成两次从业者访谈",
            "分别联系 GIS 开发与城市数据从业者。",
            "2 小时",
            "验证岗位名称背后的真实工作",
          ],
          [
            "03",
            "核验一个正式门槛",
            "向招录单位确认专业目录和应届身份。",
            "30 分钟",
            "验证体制路径的实际开放程度",
          ],
        ].map((x) => (
          <article key={x[0]}>
            <b>{x[0]}</b>
            <div>
              <h3>{x[1]}</h3>
              <p>{x[2]}</p>
            </div>
            <dl>
              <dt>成本</dt>
              <dd>{x[3]}</dd>
              <dt>验证</dt>
              <dd>{x[4]}</dd>
            </dl>
          </article>
        ))}
      </section>
      <footer className="report-actions">
        <Button onClick={restart}>
          <RefreshCw />
          重新探索
        </Button>
        <Button variant="secondary">
          <Upload />
          保存调查简报
        </Button>
      </footer>
    </main>
  );
}
function ResultGroup({
  index,
  title,
  tone,
  items,
}: {
  index: string;
  title: string;
  tone: string;
  items: string[];
}) {
  return (
    <article className={`result-group ${tone}`}>
      <div>
        <span>{index}</span>
        <h3>{title}</h3>
      </div>
      {items.map((x, i) => (
        <p key={x}>
          <b>{x}</b>
          <small>
            {i === 0
              ? "核心条件基本满足"
              : i === 1
                ? "缺少 1 项可补条件"
                : "证据仍需交叉核验"}
          </small>
          <ChevronRight />
        </p>
      ))}
    </article>
  );
}

function PageHeader({
  eyebrow,
  title,
  detail,
  side,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  side?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{detail}</p>
      </div>
      {side}
    </header>
  );
}
function StickyAction({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  return (
    <div className="sticky-action">
      <span>
        <ShieldCheck />
        硬性资格不会由 AI 改写
      </span>
      <Button onClick={onClick}>
        {text}
        <ArrowRight />
      </Button>
    </div>
  );
}

export default function HomePage() {
  const [step, setStep] = useState<ProductStep>("home"),
    [records, setRecords] = useState<DecisionRecord[]>([]),
    [parsedProfile, setParsedProfile] = useState<ParsedProfile>({
      cards: profileCards as ProfileCard[],
      sourceText: "",
      sourceName: "GIS 硕士预设档案",
      usedAI: false,
    });
  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.slice(1) as ProductStep;
      if (flow.includes(hash)) {
        setStep(hash);
        localStorage.setItem("if-life-path-current-step", hash);
        return;
      }
      const savedStep = localStorage.getItem(
        "if-life-path-current-step",
      ) as ProductStep | null;
      if (savedStep && flow.includes(savedStep) && savedStep !== "home") {
        setStep(savedStep);
        window.history.replaceState(null, "", `#${savedStep}`);
      }
    };
    const savedRecords = localStorage.getItem("if-life-path-decisions-v1");
    if (savedRecords) {
      try {
        setRecords(JSON.parse(savedRecords));
      } catch {}
    }
    const savedProfile = localStorage.getItem("if-life-path-profile-v1");
    if (savedProfile) {
      try {
        setParsedProfile(JSON.parse(savedProfile));
      } catch {}
    }
    window.addEventListener("hashchange", syncHash);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);
  useEffect(() => {
    localStorage.setItem("if-life-path-decisions-v1", JSON.stringify(records));
  }, [records]);
  useEffect(() => {
    localStorage.setItem("if-life-path-profile-v1", JSON.stringify(parsedProfile));
  }, [parsedProfile]);
  const go = (s: ProductStep) => {
    setStep(s);
    localStorage.setItem("if-life-path-current-step", s);
    window.history.replaceState(
      null,
      "",
      s === "home" ? window.location.pathname : `#${s}`,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const preset = () => {
    setParsedProfile({ cards: profileCards as ProfileCard[], sourceText: "", sourceName: "GIS 硕士预设档案", usedAI: false });
    go("parsing");
  };
  const submitProfile = async ({ text, file }: { text?: string; file?: File }) => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    const configured = process.env.NEXT_PUBLIC_PROFILE_API_URL;
    const dialogue = process.env.NEXT_PUBLIC_DIALOGUE_API_URL;
    const endpoint = apiBase
      ? `${apiBase.replace(/\/$/, "")}/api/profile/parse`
      : configured || (dialogue
        ? dialogue.replace(/\/dialogue\/?$/, "/profile/parse")
        : process.env.NEXT_PUBLIC_STATIC_EXPORT === "true"
          ? "https://game-d7g6sf32s7b58cbcd-1464556999.ap-shanghai.app.tcloudbase.com/if-life-api/api/profile/parse"
          : "/api/profile/parse");
    const response = file
      ? await fetch(endpoint, { method: "POST", body: (() => { const form = new FormData(); form.append("file", file); return form; })() })
      : await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    const payload = await response.json();
    if (!response.ok) {
      const messages: Record<string, string> = {
        file_too_large: "文件超过 5MB，请压缩后重试",
        unsupported_file_type: "暂时只支持 PDF、DOCX 和 TXT",
        insufficient_text: "没有读取到足够文字，请换一份可复制文字的简历",
      };
      throw new Error(messages[payload.error] || "解析服务暂时不可用，请稍后重试");
    }
    setParsedProfile(payload as ParsedProfile);
    go("parsing");
  };
  return (
    <div className="product">
      <TopBar step={step} go={go} />
      <div className="screen" key={step}>
        {step === "home" && (
          <Home start={() => go("onboarding")} preset={preset} />
        )}{" "}
        {step === "onboarding" && (
          <Onboarding submitProfile={submitProfile} preset={preset} />
        )}{" "}
        {step === "parsing" && <Parsing done={() => go("review")} />}{" "}
        {step === "review" && <Review next={() => go("map")} cards={parsedProfile.cards} setCards={(cards) => setParsedProfile((profile) => ({ ...profile, cards: typeof cards === "function" ? cards(profile.cards) : cards }))} />}{" "}
        {step === "map" && <CareerNetwork onEnter={() => go("simulation")} />}{" "}
        {step === "simulation" && (
          <MissionSimulation
            next={() => go("transfer")}
            backToMap={() => go("map")}
          />
        )}{" "}
        {step === "transfer" && <Transfer next={() => go("result")} />}{" "}
        {step === "result" && (
          <Result
            records={records}
            restart={() => {
              setRecords([]);
              go("home");
            }}
          />
        )}
      </div>
    </div>
  );
}
