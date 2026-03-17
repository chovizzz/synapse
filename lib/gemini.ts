import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey });
  return _ai;
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
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `请从以下客户原话中提取广告投放需求信息：\n\n"${rawInput}"`,
    config: {
      systemInstruction: PARSE_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });
  const text = response.text || "{}";
  return JSON.parse(text);
}

// 生成评估（M2）
export async function evaluateRequirement(structuredData: Record<string, unknown>) {
  const ai = getAI();
  const dataStr = JSON.stringify(structuredData, null, 2);
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `请对以下广告投放需求进行专业评估：\n\n${dataStr}`,
    config: {
      systemInstruction: EVALUATE_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });
  const text = response.text || "{}";
  return JSON.parse(text);
}
