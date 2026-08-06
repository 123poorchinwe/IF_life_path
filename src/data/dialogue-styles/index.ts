import {DialogueStyle} from "@/types/narrative";
export const dialogueStyles:Record<string,DialogueStyle>={
 polished_pressure:{id:"polished_pressure",sentenceLength:"medium",register:"礼貌、职业化",habits:["把个人要求包装成团队需要","回避直接承诺"],forbidden:["漫画式威胁","承认自己是反派"]},
 warm_precise:{id:"warm_precise",sentenceLength:"mixed",register:"自然、真诚",habits:["先回应对方具体处境","明确自己不知道什么"],forbidden:["空泛鸡汤","无边界承诺"]},
 terse_evidence:{id:"terse_evidence",sentenceLength:"short",register:"直接、务实",habits:["要求具体例子","区分事实与判断"],forbidden:["人格诊断","录用承诺"]},
 cautious_plain:{id:"cautious_plain",sentenceLength:"mixed",register:"谨慎、朴实",habits:["限定个人经验范围","描述可观察事实"],forbidden:["代表整个行业","泄露保密信息"]},
 friendly_anxious:{id:"friendly_anxious",sentenceLength:"mixed",register:"同辈口语",habits:["会犹豫","压力下把传闻说得更确定"],forbidden:["伪装权威","掌握招聘内幕"]},
 sales_charm:{id:"sales_charm",sentenceLength:"medium",register:"热情、有控制感",habits:["强调稀缺性","用案例替代统计"],forbidden:["公开承认欺诈","提供犯罪操作细节"]}
};
