import { GoogleGenAI } from "@google/genai";

// 自动检测使用哪个 AI 提供商
// 优先级：DeepSeek > Gemini（哪个 Key 存在就用哪个）
const DEEPSEEK_KEY =
  process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || "";
const GEMINI_KEY =
  process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

const useDeepSeek = !!DEEPSEEK_KEY;

// Gemini 客户端（仅在使用 Gemini 时初始化）
let _ai: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
  return _ai;
}

// 统一 AI 调用入口，自动路由到 DeepSeek 或 Gemini
async function callAI(systemPrompt: string, userMessage: string): Promise<string> {
  if (useDeepSeek) {
    // DeepSeek（OpenAI 兼容接口）
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });
    if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`);
    const json = await res.json();
    return json.choices?.[0]?.message?.content || "{}";
  } else {
    // Gemini Flash
    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });
    return response.text || "{}";
  }
}

// M1: 需求解析 Prompt
export const PARSE_SYSTEM_PROMPT = `你是广告代投公司的AI需求助理，名叫 Synapse。
从商务人员描述的客户原话中，精准提取广告投放需求的关键信息。

提取规则：
1. region：目标投放地区，如"北美"、"东南亚"、"全球"
2. media_platform：广告平台，如 Facebook、TikTok、Google（多个取主要一个）
3. daily_budget_usd：每日预算，统一换算为美元数字（人民币按汇率7换算）
4. target_kpi：主要优化目标，如 ROI、ROAS、CPA、CPM、安装量
5. target_roi：若KPI是ROI提取数值，否则null
6. product_type：产品品类，如"手游"、"女装"、"金融App"
7. campaign_objective：推广目的，如"用户获取"、"品牌曝光"、"促销转化"
8. ambiguous_fields：无法明确提取的字段，给出追问话术

边界处理：
- "ROI 1.2" → target_kpi="ROI", target_roi=1.2
- "ROAS 4倍" → target_kpi="ROAS", target_roi=null
- "社媒" → media_platform="Facebook/Instagram"，并在ambiguous_fields追问平台

严格按JSON格式输出，不要任何多余文字：
{
  "region": string,
  "media_platform": string,
  "daily_budget_usd": number | null,
  "target_kpi": string,
  "target_roi": number | null,
  "product_type": string,
  "campaign_objective": string,
  "ambiguous_fields": [{"field": string, "question": string}]
}`;

// M2: 评估建议 Prompt
export const EVALUATE_SYSTEM_PROMPT = `你是拥有5年以上 Facebook、TikTok、Google 广告代投经验的资深评估专家。
对给定的广告投放需求进行专业评估。

评估维度：
1. success_rate（0-100整数）：ROI目标超行业均值20%以上降分15-25，日预算低于$100降分10-15，游戏/电商基础70-85，金融/医疗基础50-65
2. confidence：high（信息完整）/ medium（部分模糊）/ low（严重不足）
3. risks（2-4条）：ROI目标过高、预算过低、竞争激烈、地区不熟悉等
4. strategy_suggestions（严格3条）：具体可执行的出价/测试/素材建议
5. estimated_timeline：如"7-14天"、"首月见效"
6. similar_case_hint：一句话历史案例参考，增加真实感

严格按JSON格式输出：
{
  "success_rate": number,
  "confidence": "high" | "medium" | "low",
  "risks": [{"level": "high" | "medium" | "low", "description": string}],
  "strategy_suggestions": [string, string, string],
  "estimated_timeline": string,
  "similar_case_hint": string
}`;

// 解析需求（M1）
export async function parseRequirement(rawInput: string) {
  const text = await callAI(
    PARSE_SYSTEM_PROMPT,
    `请从以下客户原话中提取广告投放需求信息：\n\n"${rawInput}"`
  );
  return JSON.parse(text);
}

// 生成评估（M2）
export async function evaluateRequirement(structuredData: Record<string, unknown>) {
  const dataStr = JSON.stringify(structuredData, null, 2);
  const text = await callAI(
    EVALUATE_SYSTEM_PROMPT,
    `请对以下广告投放需求进行专业评估：\n\n${dataStr}`
  );
  return JSON.parse(text);
}

// 导出当前使用的提供商，方便调试
export const AI_PROVIDER = useDeepSeek ? "DeepSeek" : "Gemini";
