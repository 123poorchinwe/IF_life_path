export type Status="已开放"|"接近开放"|"需要调查"|"硬性受限"|"新发现";
const base=[
["gis-dev","GIS 开发","已开放","空间技术","以 WebGIS、空间服务和数据管线支持业务。"],["remote","遥感分析","已开放","空间技术","处理遥感影像并形成专题分析成果。"],["spatial","空间数据工程","已开放","空间技术","构建可复用的空间数据处理流程。"],["survey","测绘地信国企","接近开放","空间技术","参与基础测绘、数据生产与工程交付。"],["natural","自然资源技术岗","需要调查","公共事务","支持调查监测、规划与自然资源管理。"],["planning","国土空间规划","接近开放","公共事务","用空间证据支持规划编制与评估。"],["civil","公务员技术岗","硬性受限","公共事务","专业目录与应届身份构成明确门槛。"],["institute","科研院所","接近开放","研究科学","以项目和论文推进应用研究。"],["phd","GIS 博士","需要调查","研究科学","长期研究训练，导师与方向影响显著。"],["climate","气候风险分析","接近开放","跨行业","评估气候暴露、脆弱性与资产风险。"],["urban","城市数据分析","接近开放","跨行业","用多源城市数据回答运营和治理问题。"],["supply","供应链选址","新发现","跨行业","用网络和选址模型支持物流布局。"],["data-product","数据产品经理","需要调查","跨行业","连接用户问题、指标与数据能力。"],["ba","商业数据分析","接近开放","跨行业","用 SQL 和统计分析支持商业判断。"],["game-map","游戏世界构建","新发现","创意技术","将空间逻辑迁移到关卡和世界设计。"],
];
const more=["地图数据运营","空间可视化设计","LBS 产品分析","交通规划分析","基础设施风险","农业遥感","生态监测","无人机数据处理","数字孪生实施","智慧城市解决方案","环境咨询","保险灾害建模","新能源选址","房产数据研究","开源地理技术"];
export const careers=[...base,...more.map((t,i)=>[`more-${i}`,t,(["已开放","接近开放","需要调查","新发现"] as Status[])[i%4],["空间技术","跨行业","公共事务"][i%3],`将空间数据能力应用于${t}的真实业务问题。`])].map((x,i)=>({id:x[0] as string,title:x[1] as string,status:x[2] as Status,sector:x[3],description:x[4] as string,confidence:["已核验","有证据支持","基于迁移推断"][i%3],evidence:["Python 与空间分析项目可形成直接证据","路网项目包含数据清洗与可视化交付"],gaps:i%3===0?["一份工程化作品","目标岗位的正式要求"]:["行业语境与指标","来自真实岗位的多源证据"],verify:"选择 3 份真实岗位描述，对照任务、门槛和重复出现的技能。"}));

export const profileCards=[
{id:"p1",type:"事实",title:"GIS 硕士 · 2027 届",detail:"地理信息、地图学与空间分析方向。",evidence:"本人输入",confirmed:true},{id:"p2",type:"能力",title:"Python 数据处理",detail:"能处理空间矢量、栅格与表格数据。",evidence:"项目描述",confirmed:true},{id:"p3",type:"推断",title:"独立项目管理",detail:"曾拆分道路网络项目并按阶段交付。",evidence:"待确认",confirmed:false},{id:"p4",type:"能力",title:"空间网络分析",detail:"使用图结构完成路网可达性分析。",evidence:"作品",confirmed:true},{id:"p5",type:"限制",title:"企业证据不足",detail:"当前没有正式企业实习或业务案例。",evidence:"本人输入",confirmed:true},{id:"p6",type:"偏好",title:"希望保留研究性",detail:"偏好有问题探索空间、避免长期机械重复。",evidence:"当前表达",confirmed:false},{id:"p7",type:"资格",title:"应届身份窗口",detail:"预计 2027 年毕业，具体规则需逐岗核验。",evidence:"待核验",confirmed:true},{id:"p8",type:"限制",title:"经济缓冲有限",detail:"不适合长期无收入备考或高成本空档。",evidence:"本人输入",confirmed:true}
];
export const transferItems=[{icon:"⌁",title:"道路网络分析项目",tags:["Python","图结构","可视化"]},{icon:"◫",title:"海外合作汇报",tags:["英文沟通","跨团队","研究表达"]},{icon:"◉",title:"大型栅格处理",tags:["数据工程","质量检查","自动化"]},{icon:"◇",title:"校园地图作品",tags:["用户视角","交互","空间叙事"]}];

const skeletons=[
{type:"边界事件",title:"扩大的项目范围",npc:"周老师",role:"项目负责人",location:"实验室会议室",facts:["最初任务只有数据清洗","新增模型分析与汇报材料","截止时间没有调整"],message:"既然数据已经整理好了，完整分析应该不会增加太多工作。",signals:["任务范围变化","截止时间未变","成果归属不明"]},
{type:"信息事件",title:"岗位名称背后的工作",npc:"林珊",role:"GIS 企业校友",location:"线上访谈",facts:["岗位名称是空间算法工程师","日常工作以数据治理和客户交付为主","算法研究只占少部分"],message:"别只看岗位名字。你可以问团队上个月实际交付了什么。",signals:["名称与任务不一致","信息可交叉验证","校友经验是单一来源"]},
{type:"利益冲突",title:"秋招与项目交付撞期",npc:"陈述",role:"实验室博士后",location:"校园咖啡馆",facts:["目标企业将在一周后截止","项目也将在同周验收","你负责的数据模块尚未交接"],message:"我理解你要投递，但这个节点确实很难少一个人。",signals:["真实时间冲突","团队存在依赖","替代方案未讨论"]},
{type:"机会事件",title:"一次有限的引荐",npc:"唐宁",role:"城市数据产品经理",location:"行业讲座",facts:["对方愿意转发你的作品","只承诺一次 20 分钟交流","希望你先明确三个问题"],message:"我可以帮你介绍，但你最好先想清楚究竟想验证什么。",signals:["帮助边界明确","无结果承诺","需要准备成本"]},
{type:"风险事件",title:"口头承诺的培训项目",npc:"许睿",role:"培训顾问",location:"共享办公区",facts:["课程费用超过当前月度预算","对方口头承诺内部推荐","合同没有写明推荐标准"],message:"名额只保留到今晚，加入后我们会负责你的就业结果。",signals:["制造时间压力","书面条款缺失","结果承诺不可核验"]},
{type:"偶然事件",title:"失败面试留下的线索",npc:"高原",role:"技术面试官",location:"企业会议室",facts:["你完成了空间分析题","SQL 追问回答不完整","面试官指出数据建模比 GIS 工具更重要"],message:"这次未必合适，但你的空间思维是清楚的。工程基础还需要证据。",signals:["能力反馈具体","结果与潜力分开","单次评价需验证"]}
];
const choices=[
{text:"先核验任务、规则和书面证据",hint:"提高信息质量，但消耗时间与沟通精力",effect:{energy:-1,time:-1,info:2,support:0,money:0}},
{text:"接受当前机会，边行动边记录",hint:"保留进展，也承担部分不确定性",effect:{energy:-2,time:-1,info:1,support:1,money:0}},
{text:"明确边界，把资源留给主要目标",hint:"保护精力，关系可能短期承压",effect:{energy:1,time:0,info:0,support:-1,money:0}},
{text:"找第二来源，再决定是否投入",hint:"降低误判，但可能错过短窗口",effect:{energy:-1,time:-2,info:3,support:1,money:0}}
];
export const events=Array.from({length:40},(_,i)=>({...skeletons[i%skeletons.length],id:`event-${String(i+1).padStart(2,"0")}`,choices:choices.map((c,j)=>({...c,text:i<6?c.text:["要求明确范围与成果归属","保留记录后暂时推进","向相关成员交叉核验","拒绝并投入替代路径"][j]}))}));
