import {
  MissionDefinition,
  MissionRuntimeState,
  NPCRelationshipState,
} from "@/types/narrative";
export const missionDefinitions: MissionDefinition[] = [
  {
    id: "scope_and_credit",
    title: "扩大的项目范围",
    npcIds: ["director_zhou"],
    immutablePremise:
      "玩家原始任务只有数据清洗；负责人后来增加模型分析与汇报，截止时间未改变，成果归属未书面确认。",
    playerObjectives: [
      "确认真实任务范围",
      "保护个人贡献证据",
      "决定是否继续投入",
    ],
    requiredStoryBeats: [
      {
        id: "scope_change",
        title: "新增任务出现",
        description: "负责人提出模型与汇报要求",
        unlockWhen: { stageAtLeast: 0 },
      },
      {
        id: "deadline_check",
        title: "核验时间",
        description: "确认截止时间并未延后",
        unlockWhen: { stageAtLeast: 1 },
      },
      {
        id: "credit_question",
        title: "成果归属",
        description: "玩家必须触及署名或贡献记录",
        unlockWhen: { stageAtLeast: 2 },
      },
      {
        id: "commitment",
        title: "形成决定",
        description: "接受、谈判、拒绝或退出",
        unlockWhen: { stageAtLeast: 3 },
      },
    ],
    optionalStoryBeats: [
      {
        id: "replacement",
        title: "替代人选",
        description: "发现团队存在可替代资源",
        unlockWhen: { requiresEvidence: ["meeting_minutes"] },
      },
    ],
    triggerConditions: ["进入实验室", "收到新增任务"],
    hiddenInformation: {
      credit_not_reserved: "负责人尚未为玩家预留明确署名",
      replacement_available: "团队其实可以调整一名同学协助",
    },
    evidenceItems: [
      {
        id: "original_message",
        title: "原始任务消息",
        proves: "最初只有数据清洗",
        source: "聊天记录",
      },
      {
        id: "meeting_minutes",
        title: "会议纪要",
        proves: "新增任务和固定截止时间",
        source: "书面纪要",
      },
      {
        id: "draft_commit",
        title: "代码提交记录",
        proves: "玩家实际贡献",
        source: "版本记录",
      },
    ],
    allowedEndings: [
      {
        id: "written_agreement",
        title: "书面重订分工",
        type: "success",
        description: "范围、时间和署名形成书面约定",
        requirements: {
          stageAtLeast: 4,
          evidence: ["original_message", "meeting_minutes"],
          intent: "negotiate_scope",
        },
      },
      {
        id: "documented_acceptance",
        title: "记录后继续",
        type: "partial",
        description: "继续项目并保留证据，归属仍有风险",
        requirements: {
          stageAtLeast: 4,
          evidence: ["draft_commit"],
          intent: "accept_condition",
        },
      },
      {
        id: "clean_refusal",
        title: "明确拒绝新增工作",
        type: "exit",
        description: "退出新增范围并承担关系代价",
        requirements: { stageAtLeast: 4, intent: "refuse_request" },
      },
      {
        id: "silent_overload",
        title: "无记录地承担",
        type: "failure",
        description: "完成大量新增工作但缺少贡献证据",
        requirements: { stageAtLeast: 4, intent: "accept_condition" },
      },
    ],
    forbiddenChanges: [
      "原始任务不能被改写为包含模型分析",
      "截止时间不能凭空延长",
      "负责人不能仅因聊天放弃项目利益",
    ],
    successConditions: ["完成必要节点", "范围或贡献得到可核验证据"],
    failureConditions: ["精力耗尽", "无证据接受全部新增任务"],
  },
  {
    id: "training_contract",
    title: "今晚截止的内部名额",
    npcIds: ["advisor_xu"],
    immutablePremise:
      "培训费用超过玩家月度预算；所谓内部推荐没有写入合同，顾问本月有销售指标。",
    playerObjectives: ["核验就业承诺", "取得合同证据", "决定是否付款"],
    requiredStoryBeats: [
      {
        id: "offer",
        title: "限时名额",
        description: "顾问提出今晚付款",
        unlockWhen: { stageAtLeast: 0 },
      },
      {
        id: "guarantee",
        title: "追问保证",
        description: "核验推荐和就业承诺",
        unlockWhen: { stageAtLeast: 1 },
      },
      {
        id: "contract",
        title: "查看合同",
        description: "对照口头说法与书面条款",
        unlockWhen: { stageAtLeast: 2 },
      },
      {
        id: "payment",
        title: "付款决定",
        description: "购买、拒绝、延迟或举报",
        unlockWhen: { stageAtLeast: 3 },
      },
    ],
    optionalStoryBeats: [
      {
        id: "former_student",
        title: "联系往届学员",
        description: "获得第二来源",
        unlockWhen: { requiresEvidence: ["student_contact"] },
      },
    ],
    triggerConditions: ["进入共享办公室", "收到限时优惠"],
    hiddenInformation: {
      referral_not_guaranteed: "推荐只是投递渠道，不保证面试",
      refund_obstacles: "退款需要满足难以证明的出勤条件",
    },
    evidenceItems: [
      {
        id: "contract_copy",
        title: "合同副本",
        proves: "就业承诺未写入",
        source: "正式合同",
      },
      {
        id: "sales_recording",
        title: "顾问口头录音",
        proves: "口头与书面说法不一致",
        source: "对话记录",
      },
      {
        id: "student_contact",
        title: "往届学员反馈",
        proves: "推荐结果存在显著差异",
        source: "第二来源",
      },
    ],
    allowedEndings: [
      {
        id: "reject_with_evidence",
        title: "保留证据后拒绝",
        type: "success",
        description: "未付款并保留矛盾证据",
        requirements: {
          stageAtLeast: 4,
          evidence: ["contract_copy"],
          intent: "refuse_request",
        },
      },
      {
        id: "delay_verify",
        title: "延迟并核验",
        type: "partial",
        description: "暂不付款并联系第二来源",
        requirements: { stageAtLeast: 4, intent: "delay_decision" },
      },
      {
        id: "purchase",
        title: "承担风险购买",
        type: "failure",
        description: "在证据不足时付款",
        requirements: { stageAtLeast: 4, intent: "accept_condition" },
      },
      {
        id: "exit_contact",
        title: "终止联系",
        type: "exit",
        description: "直接离开但未形成更多证据",
        requirements: { stageAtLeast: 4, intent: "exit_relationship" },
      },
    ],
    forbiddenChanges: [
      "顾问不能被感化后主动揭露全部骗局",
      "内部推荐不能变成保证录用",
      "合同条款不能由AI修改",
    ],
    successConditions: ["核验书面条款", "避免在高压下无证据付款"],
    failureConditions: ["付款且经济资源不足"],
  },
  {
    id: "career_interview",
    title: "岗位名称背后的工作",
    npcIds: ["alumna_lin", "manager_tang", "engineer_qiao"],
    immutablePremise:
      "玩家对岗位的理解主要来自名称和宣传，三名从业者只能提供各自范围内的经验。",
    playerObjectives: [
      "获得多来源工作事实",
      "区分个人经验与正式要求",
      "设计一次低成本试做",
    ],
    requiredStoryBeats: [
      {
        id: "assumption",
        title: "说出原有想象",
        description: "明确玩家对岗位的假设",
        unlockWhen: { stageAtLeast: 0 },
      },
      {
        id: "daily_work",
        title: "询问真实任务",
        description: "获得一个具体工作日样本",
        unlockWhen: { stageAtLeast: 1 },
      },
      {
        id: "cross_check",
        title: "交叉核验",
        description: "获得第二名NPC或正式来源",
        unlockWhen: { stageAtLeast: 2 },
      },
      {
        id: "experiment",
        title: "形成现实实验",
        description: "选择一个可执行试做",
        unlockWhen: { stageAtLeast: 3 },
      },
    ],
    optionalStoryBeats: [
      {
        id: "layoff_context",
        title: "组织变化",
        description: "理解信息受组织环境影响",
        unlockWhen: { requiresFacts: ["team_recent_layoff"] },
      },
    ],
    triggerConditions: ["进入从业者咖啡馆", "提出具体岗位问题"],
    hiddenInformation: {
      team_recent_layoff: "林珊团队近期调整影响了她的判断",
      team_opening_uncertain: "唐宁提到的岗位尚未正式批准",
      transfer_request_rejected: "乔文曾申请转岗但未获批准",
    },
    evidenceItems: [
      {
        id: "task_sample",
        title: "真实任务样本",
        proves: "岗位名称与日常任务可能不同",
        source: "从业者访谈",
      },
      {
        id: "second_source",
        title: "第二来源",
        proves: "区分个体经历与共性",
        source: "交叉访谈",
      },
      {
        id: "job_posting",
        title: "正式岗位说明",
        proves: "公开资格与任务",
        source: "招聘原文",
      },
    ],
    allowedEndings: [
      {
        id: "validated_experiment",
        title: "形成验证实验",
        type: "success",
        description: "基于多来源设计试做",
        requirements: {
          stageAtLeast: 4,
          evidence: ["task_sample", "second_source"],
        },
      },
      {
        id: "single_source_plan",
        title: "依据单一经验行动",
        type: "partial",
        description: "形成行动但证据仍偏单一",
        requirements: { stageAtLeast: 4, evidence: ["task_sample"] },
      },
      {
        id: "label_assumption",
        title: "仍按岗位名称判断",
        type: "failure",
        description: "没有取得具体任务证据",
        requirements: { stageAtLeast: 4 },
      },
      {
        id: "pause_path",
        title: "暂缓这条路径",
        type: "exit",
        description: "保留问题以后再查",
        requirements: { stageAtLeast: 4, intent: "exit_relationship" },
      },
    ],
    forbiddenChanges: [
      "任何NPC不能代表整个行业",
      "不允许凭空出现录用机会",
      "个人经验不能变成正式资格",
    ],
    successConditions: ["至少两个独立来源", "形成低成本现实实验"],
    failureConditions: ["仅依据岗位名称作结论"],
  },
];
export const missionById = Object.fromEntries(
  missionDefinitions.map((m) => [m.id, m]),
) as Record<string, MissionDefinition>;
export const createMissionState = (missionId: string): MissionRuntimeState => ({
  missionId,
  currentMissionStage: 0,
  status: "active",
  completedBeats: [],
  optionalBeats: [],
  discoveredFacts: [],
  playerEvidence: [],
  pastChoices: [],
  turn: 1,
});
export const createRelationship = (npcId: string): NPCRelationshipState => ({
  npcId,
  trust: 40,
  respect: 50,
  caution: 35,
  resentment: 10,
  powerGap: npcId === "director_zhou" ? 75 : 45,
  informationGap: 70,
  playerDependencies: [],
  npcDependencies: [],
});
