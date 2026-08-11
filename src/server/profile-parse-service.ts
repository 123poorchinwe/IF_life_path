import { z } from "zod";
import mammoth from "mammoth";
// Import one pinned PDF.js build. `pdf-parse` selects its bundled PDF.js version
// with a dynamic require, which makes bundlers include four complete engines and
// pushes the CloudBase ZIP over its 1.5 MB upload limit.
import PDFJS from "pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js";
import { getDialogueProviderConfig } from "@/ai/npc-dialogue-generator";
import { profileCardTypes, type ProfileCard } from "@/types/profile";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const cardSchema = z.object({
  type: z.enum(profileCardTypes),
  title: z.string().min(1).max(60),
  detail: z.string().min(1).max(220),
  evidence: z.string().min(1).max(100),
  confirmed: z.boolean(),
});
const aiSchema = z.object({ cards: z.array(cardSchema).min(3).max(18) });

function cleanText(value: string) {
  return value.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

async function extractFile(file: File) {
  if (file.size > MAX_FILE_BYTES) throw new Error("file_too_large");
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  if (name.endsWith(".pdf") || file.type === "application/pdf") return cleanText(await extractPdfText(buffer));
  if (name.endsWith(".docx")) return cleanText((await mammoth.extractRawText({ buffer })).value);
  if (name.endsWith(".txt") || file.type.startsWith("text/")) return cleanText(buffer.toString("utf8"));
  throw new Error("unsupported_file_type");
}

async function extractPdfText(buffer: Buffer) {
  const engine = PDFJS as unknown as {
    disableWorker: boolean;
    getDocument(data: Buffer): Promise<{
      numPages: number;
      getPage(page: number): Promise<{ getTextContent(options: object): Promise<{ items: Array<{ str: string; transform: number[] }> }> }>;
      destroy(): void;
    }>;
  };
  engine.disableWorker = true;
  const document = await engine.getDocument(buffer);
  let text = "";
  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false });
      let lastY: number | undefined;
      for (const item of content.items) {
        const y = item.transform?.[5];
        text += lastY === undefined || y === lastY ? item.str : `\n${item.str}`;
        lastY = y;
      }
      text += "\n\n";
    }
  } finally {
    document.destroy();
  }
  return text;
}

function fallbackCards(text: string): ProfileCard[] {
  const cards: Omit<ProfileCard, "id">[] = [];
  const add = (type: ProfileCard["type"], title: string, detail: string, evidence: string, confirmed = false) => {
    if (!cards.some((card) => card.title === title)) cards.push({ type, title, detail, evidence, confirmed });
  };
  const degree = text.match(/博士|硕士|本科|专科/);
  if (degree) add("事实", `${degree[0]}学历背景`, "学历来自简历原文，具体学位和毕业状态仍由你确认。", `原文出现“${degree[0]}”`, true);
  const major = text.match(/(?:专业|方向|主修|研究方向)[：:\s]*([^，。；\n]{2,30})|([^，。；\n]{2,20}(?:专业|方向))/);
  if (major) {
    const value = (major[1] || major[2]).trim();
    add("事实", `专业/研究方向：${value}`, "专业名称来自提交材料；涉及岗位资格时仍需按正式专业目录核验。", `原文出现“${value}”`, true);
  }
  const year = text.match(/20\d{2}(?:年|届)/);
  if (year) add("资格", `毕业时间：${year[0]}`, "可能影响校招和应届身份窗口，具体资格需要按岗位公告核验。", `原文出现“${year[0]}”`, true);
  const skills: Array<[RegExp, string]> = [[/python/i, "Python"], [/sql/i, "SQL"], [/arcgis|qgis|gis/i, "GIS / 空间分析"], [/java/i, "Java"], [/javascript|typescript|react|vue/i, "Web 开发"], [/遥感|remote sensing/i, "遥感分析"], [/机器学习|machine learning/i, "机器学习"]];
  skills.forEach(([pattern, label]) => {
    if (pattern.test(text)) add("能力", label, `简历中出现了 ${label} 相关工具或经历，熟练程度需要结合项目证据确认。`, "简历关键词", true);
  });
  if (/项目|课题|研究|负责|参与/.test(text)) add("推断", "项目协作与交付", "简历包含项目或研究经历，但你的职责边界、产出和独立程度仍需确认。", "项目描述推断");
  const internshipMissing = /(?:缺少|没有|暂无|未有|不足)[^。；\n]{0,10}实习|实习[^。；\n]{0,8}(?:缺少|不足)/.test(text);
  if (/实习/.test(text) && !internshipMissing) add("事实", "包含实习经历", "简历提到了实习，需要继续确认岗位、持续时间与实际任务。", "简历实习段落", true);
  else add("限制", "企业场景证据待补", internshipMissing ? "材料明确提到实习经历不足，可通过低成本项目或短期实践补充证据。" : "当前文本没有识别到明确实习经历，这不代表你没有实习，请确认或补充。", internshipMissing ? "本人明确表达" : "当前材料未识别到", internshipMissing);
  if (/读博|考公|国企|企业|转行|数据分析/.test(text)) add("偏好", "正在比较多条职业路径", "材料中出现多个当前选项，系统不会替你直接确定唯一答案。", "当前选择描述", false);
  if (cards.length < 3) {
    add("事实", "已提交个人经历材料", "系统已读取材料，但可识别的明确字段较少，建议补充专业、项目和目标选择。", "本人提交", true);
    add("偏好", "职业偏好尚待确认", "当前材料不足以判断你对稳定、收入、自主性和地域的取舍。", "证据不足", false);
  }
  return cards.slice(0, 14).map((card, index) => ({ ...card, id: `profile-${index + 1}` }));
}

function extractJson(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced || raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  return JSON.parse(candidate);
}

async function generateCards(text: string): Promise<ProfileCard[] | null> {
  const provider = getDialogueProviderConfig();
  if (!provider.enabled || (process.env.AI_MOCK_MODE1 || process.env.AI_MOCK_MODE) === "true") return null;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    provider.provider === "ollama" ? 45_000 : 18_000,
  );
  try {
    const base = provider.baseUrl.replace(/\/$/, "");
    const ollama = provider.provider === "ollama";
    const endpoint = ollama
      ? `${base.replace(/\/v1$/, "")}/api/chat`
      : `${base}/chat/completions`;
    const messages = [
      { role: "system", content: "你是职业档案解析器。只提取材料支持的内容，事实与推断必须区分。资格不能猜测，缺失信息不能写成负面事实。只输出JSON。" },
      { role: "user", content: `请将以下材料解析为3到14张卡。类型只能是：事实、能力、推断、资格、限制、偏好。每张卡必须包含type、title、detail、evidence、confirmed五个字段；confirmed必须是布尔值。明确提供的事实、实际使用过的能力和明确资格可为true；推断和偏好为false。缺少实习、作品、技能或经济缓冲等内容必须归入“限制”，不能包装成普通事实。evidence必须引用或概括原文依据。输出JSON对象，唯一顶层字段为cards。\n\n材料：\n${text.slice(0, 12000)}` },
    ];
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(provider.token ? { Authorization: `Bearer ${provider.token}` } : {}),
      },
      signal: controller.signal,
      body: JSON.stringify(
        ollama
          ? {
              model: provider.model,
              messages,
              stream: false,
              think: false,
              format: "json",
              options: { temperature: 0.15, num_predict: 1600 },
            }
          : {
              model: provider.model,
              temperature: 0.15,
              messages,
            },
      ),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const raw = ollama
      ? payload.message?.content
      : payload.choices?.[0]?.message?.content;
    if (typeof raw !== "string") return null;
    return aiSchema.parse(extractJson(raw)).cards.map((card, index) => ({ ...card, id: `profile-${index + 1}` }));
  } catch (error) {
    console.warn(
      "Profile AI parse fallback",
      provider.provider,
      error instanceof Error ? error.message : "unknown_error",
    );
    return null;
  } finally { clearTimeout(timeout); }
}

export async function parseProfileRequest(req: Request) {
  try {
    const type = req.headers.get("content-type") || "";
    let text = "";
    let sourceName = "粘贴文本";
    if (type.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) throw new Error("missing_file");
      sourceName = file.name;
      text = await extractFile(file);
    } else {
      const body = z.object({ text: z.string().min(20).max(20000) }).parse(await req.json());
      text = cleanText(body.text);
    }
    if (text.length < 20) throw new Error("insufficient_text");
    const aiCards = await generateCards(text);
    return { status: 200, payload: { cards: aiCards || fallbackCards(text), sourceText: text.slice(0, 20000), sourceName, usedAI: Boolean(aiCards) } };
  } catch (error) {
    const code = error instanceof Error ? error.message : "parse_failed";
    return { status: code === "file_too_large" ? 413 : 400, payload: { error: code } };
  }
}
