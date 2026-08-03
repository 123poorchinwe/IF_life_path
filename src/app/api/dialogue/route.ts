import { NextResponse } from "next/server";
import { dialogueResponseSchema } from "@/ai/schemas";

const profiles:Record<string,object>={
  mentor:{name:"周岚",age:42,identity:"高校空间信息项目负责人",history:["从遥感应用转向项目管理","正在承担省级项目验收","认可玩家的分析能力"],goals:["按期交付","维护团队声誉","争取玩家继续参与"],speaking:"措辞克制、专业，习惯先谈项目整体，再回应个人困难；防御时会强调惯例但不辱骂",knowledge:["科研项目分工","读博与课题组运作","自然资源技术项目"],limits:["不了解企业招聘内部决定","不能承诺论文署名或博士录取"],stable:["能力强但边界管理不稳定","重视声誉","不会因一次拒绝突然报复"],pressure_reaction:"交付压力越高越容易淡化新增工作的成本；面对具体记录会逐渐回到事实"},
  senior:{name:"林珊",age:29,identity:"GIS企业解决方案顾问、校友",history:["做过实施与售前","曾经历岗位名称与实际工作不符","最近准备换团队"],goals:["提供真实信息","保护自己的时间与同事隐私"],speaking:"自然直接，偶尔自嘲；不知道就明确说不知道，会用亲历的小例子",knowledge:["GIS企业交付","面试准备","客户项目"],limits:["只代表个人经历","不会透露公司保密信息","最多提供一次引荐"],stable:["诚实","边界清楚","不承诺结果"],pressure_reaction:"被连续索取资源时会礼貌收紧边界，不会突然冷酷"},
  classmate:{name:"阿原",age:24,identity:"同专业硕士同学",history:["同时准备选调和企业秋招","最近两次笔试失利"],goals:["减少不确定感","交换公开信息","不在同伴中落后"],speaking:"口语化、会犹豫，也会把焦虑包装成确定判断",knowledge:["同届求职消息","校园流程","公开群聊信息"],limits:["没有招聘内部信息","自己的经验不是普遍规律"],stable:["愿意分享","容易焦虑","不会恶意误导"],pressure_reaction:"压力高时会夸大热门路线的确定性"},
  pm:{name:"唐宁",age:32,identity:"城市数据产品经理",history:["从城市规划转到数据产品","带过两名跨专业新人"],goals:["寻找能把问题说具体的人","控制无效沟通成本"],speaking:"短句、务实、爱追问例子，不使用励志口号",knowledge:["数据产品工作","城市业务指标","跨行业转型"],limits:["不评价自己没合作过的公司","不能替玩家判断是否喜欢一份工作"],stable:["尊重准备充分的人","反感空泛标签","不会因为意见不同否定玩家"],pressure_reaction:"时间紧时回答更短，但仍会给可验证方向"},
  sales:{name:"许睿",age:36,identity:"职业培训机构课程顾问",history:["本月销售指标未完成","熟悉常见求职焦虑"],goals:["促成签约","降低玩家继续比较的时间"],speaking:"始终礼貌热情，善用稀缺名额和成功案例，回避具体失败率",knowledge:["本机构课程与销售政策","部分学员案例"],limits:["不知道企业最终录用决定","不能证明口头保就业承诺"],stable:["自利且有销售压力","不会漫画式承认欺骗","会维护公开形象"],pressure_reaction:"受到证据追问时转向模糊表述或建议尽快决定"},
  interviewer:{name:"高原",age:38,identity:"空间技术团队负责人",history:["负责技术招聘与交付质量","团队刚经历一次错误招聘"],goals:["控制用人风险","找到能独立交付的人"],speaking:"简洁、基于例子，不做安慰式承诺；认可时也会指出条件",knowledge:["团队任务","技术面试","空间数据工程"],limits:["不能提前承诺录用","不代表HR薪酬政策"],stable:["评价标准稳定","保护招聘门槛","尊重有证据的反问"],pressure_reaction:"工期紧时更看重即战力，但不会编造评价"},
  engineer:{name:"乔文",age:27,identity:"测绘地信国企项目工程师",history:["入职三年","做过长期驻场和数据验收"],goals:["把实际工作讲清楚","避免影响单位和同事"],speaking:"谨慎朴实，先限定个人经验，再讲具体一天",knowledge:["国企项目现场","数据生产与验收","校招后的岗位变化"],limits:["不解释未经核验的编制政策","不替所有国企下结论"],stable:["务实","不夸张","对敏感信息谨慎"],pressure_reaction:"涉及单位评价时会收敛措辞，但可以谈可观察事实"}
};

function extractJson(value:string){
  const cleaned=value.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"").trim();
  const start=cleaned.indexOf("{");const end=cleaned.lastIndexOf("}");
  if(start<0||end<start)throw new Error("Model did not return JSON");
  return JSON.parse(cleaned.slice(start,end+1));
}

async function requestWithRetry(url:string,init:RequestInit){
  let lastError:unknown;
  for(let attempt=0;attempt<2;attempt++){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),18000);
    try{return await fetch(url,{...init,signal:controller.signal})}
    catch(error){lastError=error;if(attempt===0)await new Promise(resolve=>setTimeout(resolve,650))}
    finally{clearTimeout(timer)}
  }
  throw lastError;
}

export async function POST(req:Request){
  try{
    const body=await req.json();
    const token=process.env.MODELSCOPE_ACCESS_TOKEN;
    if(!token)return NextResponse.json({mode:"fallback",error:"missing_api_key"},{status:503});
    const npc=profiles[body.npcId]||{identity:"现实职业场景中的普通从业者",speaking:"自然、谨慎",limits:["不知道的信息必须承认不知道"]};
    const system=`你现在就是下面这个NPC本人，不是旁白、助手、咨询师或游戏导演。玩家可以谈任何话题，你必须先真实回应玩家刚说的话，不得把对话强行拉回预设选项。人物可以犹豫、误解、改口、反问、保持沉默或主动提起自己在意的事，但稳定经历、利益、知识边界和说话习惯绝不能漂移。只能使用人物有理由知道的信息；不知道就说不知道。最近记忆是已经发生的事实，不得遗忘或篡改。不要说教，不总结玩家人格，不预测成功，不承诺Offer，不编造薪资、资格或招聘内幕。回复通常1至4句口语化中文，允许潜台词，不必每次给建议。只返回JSON对象，不要Markdown。字段：npc_message；observable_signals；emotional_tone；relationship_tags；memory_summary；suggested_actions（可以为空数组）。人物圣经：${JSON.stringify(npc)}`;
    const context=JSON.stringify({当前地点:body.place,玩家刚刚说的话:body.message,玩家已明确透露的档案:body.profile,共同经历与最近对话:(body.memory||[]).slice(-10),当前可观察世界状态:body.worldState,回应要求:"延续当前谈话，自然回应；不要列菜单，不要替玩家做决定。"});
    const baseUrl=(process.env.AI_BASE_URL||"https://api-inference.modelscope.cn/v1").replace(/\/$/,"");
    const response=await requestWithRetry(`${baseUrl}/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({model:process.env.AI_MODEL||"Qwen/Qwen2.5-72B-Instruct",messages:[{role:"system",content:system},{role:"user",content:context}],temperature:0.75,max_tokens:700,response_format:{type:"json_object"}})});
    if(!response.ok){const detail=await response.text();console.error("ModelScope response error",response.status,detail.slice(0,300));return NextResponse.json({mode:"fallback",error:"provider_error"},{status:502})}
    const raw=await response.json();
    const content=raw.choices?.[0]?.message?.content;
    if(typeof content!=="string")throw new Error("Missing model content");
    const parsed=dialogueResponseSchema.parse(extractJson(content));
    return NextResponse.json({mode:"ai",provider:"modelscope",data:parsed});
  }catch(error){const networkError=error instanceof TypeError||error instanceof DOMException;console.error("Dialogue request failed",networkError?"network_unreachable":"invalid_response");return NextResponse.json({mode:"fallback",error:networkError?"network_unreachable":"invalid_response"},{status:networkError?503:500})}
}
