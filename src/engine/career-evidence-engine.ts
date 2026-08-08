import type { ProfileCard } from "@/types/profile";
import type { Status } from "@/data/mock";

export type CareerEvidenceResult = {
  status: Status;
  matchedCards: ProfileCard[];
  limitingCards: ProfileCard[];
  gaps: string[];
  explanation: string;
};

const careerRules: Record<string, { evidence: string[]; gaps: string[]; hard?: string[] }> = {
  "gis-dev": { evidence: ["GIS", "Python", "空间", "开发", "WebGIS"], gaps: ["一份可运行的工程作品"] },
  remote: { evidence: ["遥感", "栅格", "影像", "空间"], gaps: ["一份遥感专题成果"] },
  spatial: { evidence: ["空间", "数据", "Python", "工程"], gaps: ["可复用的数据处理流程"] },
  survey: { evidence: ["测绘", "空间", "项目", "工程"], gaps: ["目标单位的正式岗位要求"] },
  natural: { evidence: ["自然资源", "GIS", "空间", "规划"], gaps: ["逐岗核验专业目录"] },
  planning: { evidence: ["规划", "空间", "分析", "项目"], gaps: ["规划类案例"] },
  civil: { evidence: ["应届", "专业", "学历", "资格"], gaps: ["公告中的专业目录资格"], hard: ["专业不符", "非应届"] },
  institute: { evidence: ["科研", "论文", "项目", "研究"], gaps: ["研究成果或正式推荐"] },
  phd: { evidence: ["科研", "论文", "研究", "英语"], gaps: ["导师方向与申请窗口"] },
  climate: { evidence: ["空间", "风险", "遥感", "数据"], gaps: ["气候指标与行业案例"] },
  urban: { evidence: ["城市", "空间", "数据", "Python"], gaps: ["城市业务问题案例"] },
  supply: { evidence: ["网络", "选址", "空间", "物流"], gaps: ["物流指标与企业数据案例"] },
  "data-product": { evidence: ["产品", "数据", "用户", "项目"], gaps: ["需求分析与产品案例"] },
  ba: { evidence: ["SQL", "数据", "统计", "分析"], gaps: ["SQL与商业指标案例"] },
  "game-map": { evidence: ["地图", "空间", "游戏", "设计"], gaps: ["关卡或世界构建作品"] },
};

function cardText(card: ProfileCard) {
  return `${card.title} ${card.detail} ${card.evidence}`.toLowerCase();
}

export function evaluateCareerEvidence(
  career: { id: string; title: string; sector: unknown; gaps: string[] },
  cards: ProfileCard[],
): CareerEvidenceResult {
  const confirmed = cards.filter((card) => card.confirmed);
  const positive = confirmed.filter((card) => card.type !== "限制");
  const limitingCards = confirmed.filter((card) => card.type === "限制");
  const rule = careerRules[career.id] || {
    evidence: [career.title, String(career.sector), "数据", "项目"],
    gaps: career.gaps.slice(0, 2),
  };
  const matchedCards = positive.filter((card) =>
    rule.evidence.some((term) => cardText(card).includes(term.toLowerCase())),
  );
  const hardBlocked = limitingCards.some((card) =>
    (rule.hard || []).some((term) => cardText(card).includes(term.toLowerCase())),
  );
  const coverage = Math.min(rule.evidence.length, new Set(
    rule.evidence.filter((term) => matchedCards.some((card) => cardText(card).includes(term.toLowerCase()))),
  ).size);
  const gaps = rule.gaps.filter(
    (gap) => !positive.some((card) => cardText(card).includes(gap.toLowerCase())),
  );

  let status: Status;
  if (hardBlocked) status = "硬性受限";
  else if (!confirmed.length) status = "需要调查";
  else if (coverage >= Math.min(3, rule.evidence.length) && gaps.length === 0) status = "已开放";
  else if (coverage >= 2) status = "接近开放";
  else if (coverage === 1) status = "需要调查";
  else status = "新发现";

  return {
    status,
    matchedCards,
    limitingCards,
    gaps,
    explanation: matchedCards.length
      ? `由 ${matchedCards.slice(0, 3).map((card) => `“${card.title}”`).join("、")} 提供证据。`
      : "这是迁移关系发现的方向，目前还没有足够的个人证据。",
  };
}
