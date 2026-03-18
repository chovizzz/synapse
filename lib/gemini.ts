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
        max_tokens: 2048,
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

【平台缩写识别表 — 必须标准化输出】
TT / tt / tiktok / 抖音海外 → TikTok
TTCX → TTCX
FB / fb / facebook / 脸书 → Facebook
IG / ig / instagram / ins → Instagram
FB+IG / Meta / meta → Meta(Facebook & Instagram)
GG / GA / google / 谷歌 → Google Ads
DV360 / Google-DV360 → Google DV360
YT / youtube / 油管 → YouTube
Snap / SC / snapchat → Snapchat
TW / tw / twitter / X / 推特 → X(Twitter)
Kwai / kwai / 快手海外 → Kwai
BAI / 百度 → 百度推广
Bing / bing / 必应 → Bing
Bing-HW / bingHW → Bing-HW
Pinterest / pin / pinterest → Pinterest
Spotify / spotify → Spotify
Yandex / yandex → Yandex
Outbrain / outbrain → Outbrain
Taboola / taboola → Taboola
Transsnet / transsnet → Transsnet
Moloco / moloco → Moloco
SmartNews / smartnews → SmartNews
Mintegral / mintegral → Mintegral
YM / YM Service → YM Service
Yahoo / yahoo → Yahoo
Reddit / reddit → Reddit
Line / line → Line
VK / vk → VK
Bigo / bigo → Bigo
Quora / quora → Quora
Unity / unity / Unity Ads → Unity Ads
UC / uc → UC
LinkedIn / linkedin / 领英 → LinkedIn
Huawei Ads / HW Ads / huawei → Huawei Ads
GoodSpy / goodspy → GoodSpy
Naver / naver → Naver
Bilibili / bilibili / B站 → bilibili
Telegram / telegram → Telegram
Twitch / twitch → Twitch
Preciso / preciso → Preciso
Dable / dable → Dable
Eagllwin / eagllwin → Eagllwin
Haiistar / haiistar → Haiistar
Kakao / kakao → Kakao
TTD / The Trade Desk / thetradedesk → The Trade Desk
Adprime / adprime → adprime
RTBhouse / rtbhouse → RTBhouse
Creative Kicker / creativekicker → Creative Kicker
Popin / popin → Popin
OPPO / oppo / OPPO Ads → OPPO Ads
VIVO / vivo / VIVO Ads → VIVO Ads
多平台时用" & "连接，如 "Facebook & TikTok"

【字段提取规则】
1. region：目标投放地区，如"欧美"、"东南亚"、"全球"；多地区用"、"分隔
2. media_platform：广告平台（严格套用上方缩写表）；多平台用" & "连接
3. daily_budget_usd：测试日预算，统一换算为美元数字（人民币÷7，无则null）
4. target_kpi：主要优化指标，如 ROI、ROAS、CPA、CPM、安装量、注册量
5. target_roi：若KPI是ROI/ROAS则提取数值，否则null
6. product_type：产品品类，如"手游"、"工具App"、"女装"、"金融App"
7. campaign_objective：推广目的，如"用户获取"、"品牌曝光"、"促销转化"
8. product_url：提取文中出现的 App Store / Google Play / 官网 URL；无则null
9. soft_kpi：次留、3日留存、7日留存、LTV、ARPU 等软性指标；无则空字符串""
10. test_period：测试周期，如"2-3个月"、"首月"、"不限"；无则""
11. third_party_tracking：三方归因工具，如"Adjust"、"AppsFlyer"、"Firebase"、"Branch"；无则""
12. attribution_model：识别投放模式，输出"自投"/"代投"/"自投+代投"之一；无明确说明则""
13. expected_start_date：期望启动时间或合同预计完成时间，如"尽快"、"3月底"、"Q2"；无则""
14. policy_notes：特殊政策要求，如账户白名单、预付/后付方式、税务要求、平台特殊资质等；无则""
15. ambiguous_fields：无法明确提取的关键字段，给出具体追问话术

【边界处理示例】
- "ROI 1.2" → target_kpi="ROI", target_roi=1.2
- "ROAS 4倍" → target_kpi="ROAS", target_roi=null
- "soft kpi 留存或者roi为目标" → soft_kpi="次留/ROI"
- "Facebook 和 tiktok" → media_platform="Facebook & TikTok"
- "TT+FB" → media_platform="TikTok & Facebook"
- "Adjust" 出现在文中 → third_party_tracking="Adjust"
- "预付or后付：后付" → policy_notes="付款方式：后付"
- "自投/代投一起" → attribution_model="自投+代投"
- "尽快" → expected_start_date="尽快"

严格按JSON格式输出，不要任何多余文字：
{
  "region": string,
  "media_platform": string,
  "daily_budget_usd": number | null,
  "target_kpi": string,
  "target_roi": number | null,
  "product_type": string,
  "campaign_objective": string,
  "product_url": string | null,
  "soft_kpi": string,
  "test_period": string,
  "third_party_tracking": string,
  "attribution_model": string,
  "expected_start_date": string,
  "policy_notes": string,
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
  const parsed = JSON.parse(text);
  // 兜底：确保所有字段存在，防止 AI 截断导致字段缺失
  return {
    region: parsed.region ?? "",
    media_platform: parsed.media_platform ?? "",
    daily_budget_usd: parsed.daily_budget_usd ?? null,
    target_kpi: parsed.target_kpi ?? "",
    target_roi: parsed.target_roi ?? null,
    product_type: parsed.product_type ?? "",
    campaign_objective: parsed.campaign_objective ?? "",
    product_url: parsed.product_url ?? null,
    soft_kpi: parsed.soft_kpi ?? "",
    test_period: parsed.test_period ?? "",
    third_party_tracking: parsed.third_party_tracking ?? "",
    attribution_model: parsed.attribution_model ?? "",
    expected_start_date: parsed.expected_start_date ?? "",
    policy_notes: parsed.policy_notes ?? "",
    ambiguous_fields: parsed.ambiguous_fields ?? [],
  };
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

// 多轮对话（带上下文）
export async function chatWithContext(
  systemContext: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  if (useDeepSeek) {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemContext },
          ...messages,
        ],
        temperature: 0.6,
        max_tokens: 1024,
      }),
    });
    if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`);
    const json = await res.json();
    return json.choices?.[0]?.message?.content || "抱歉，无法生成回复";
  } else {
    const history = messages
      .map((m) => `${m.role === "user" ? "用户" : "AI"}：${m.content}`)
      .join("\n");
    const fullPrompt = `${systemContext}\n\n以下是对话历史：\n${history}`;
    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: fullPrompt,
      config: { temperature: 0.6 },
    });
    return response.text || "抱歉，无法生成回复";
  }
}

// 多轮对话（流式）—— 逐 chunk 回调，支持 AbortSignal
export async function chatWithContextStream(
  systemContext: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  if (useDeepSeek) {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_KEY}`,
      },
      signal,
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemContext },
          ...messages,
        ],
        temperature: 0.6,
        max_tokens: 1024,
        stream: true,
      }),
    });
    if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`);
    if (!res.body) throw new Error("No response body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) onChunk(chunk);
        } catch {
          // skip malformed lines
        }
      }
    }
  } else {
    // Gemini stream
    const history = messages
      .map((m) => `${m.role === "user" ? "用户" : "AI"}：${m.content}`)
      .join("\n");
    const fullPrompt = `${systemContext}\n\n以下是对话历史：\n${history}`;
    const ai = getGemini();
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.0-flash",
      contents: fullPrompt,
      config: { temperature: 0.6 },
    });
    for await (const chunk of stream) {
      if (signal?.aborted) throw new Error("AbortError");
      const text = chunk.text;
      if (text) onChunk(text);
    }
  }
}

// 导出当前使用的提供商，方便调试
export const AI_PROVIDER = useDeepSeek ? "DeepSeek" : "Gemini";
