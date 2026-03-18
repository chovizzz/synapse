import { NextRequest } from "next/server";
import { chatWithContextStream } from "@/lib/gemini";
import type { AIChatMessage, StructuredRequirement, AIEvaluation } from "@/types";

const CHAT_SYSTEM_PROMPT = (
  req: StructuredRequirement,
  evalData: AIEvaluation
) => `你是广告代投领域的资深策略顾问，名叫 Synapse AI。
你正在就以下这条广告投放需求与用户进行深度策略对话。

【需求信息】
- 投放地区：${req.region}
- 媒体平台：${req.media_platform}
- 日预算：${req.daily_budget_usd != null ? `$${req.daily_budget_usd}/天` : "未知"}
- 核心指标：${req.target_kpi}
- 目标 ROI：${req.target_roi ?? "未设定"}
- 产品类型：${req.product_type}
- 推广目标：${req.campaign_objective}

【AI 评估结论】
- 成功率预估：${evalData.success_rate}%
- 置信度：${evalData.confidence}
- 主要风险：${evalData.risks.map((r) => r.description).join("；")}
- 策略建议：${evalData.strategy_suggestions.join("；")}
- 预计见效周期：${evalData.estimated_timeline}
- 参考案例：${evalData.similar_case_hint}

【你的职责】
- 基于以上需求和评估结论，回答用户关于策略的所有追问
- 给出具体、可落地的广告操作建议
- 如果用户改变了某个参数（如预算、ROI目标），重新评估并给出调整建议
- 语言风格：专业但简洁，避免空话，重点给数字和操作步骤
- 回复使用中文，适当使用换行提升可读性`;

const CHAT_SYSTEM_PROMPT_NO_EVAL = (req: StructuredRequirement) =>
  `你是广告代投领域的资深策略顾问，名叫 Synapse AI。
你正在就以下广告投放需求与用户进行策略对话（AI 评估尚未完成）。

【需求信息】
- 投放地区：${req.region}
- 媒体平台：${req.media_platform}
- 日预算：${req.daily_budget_usd != null ? `$${req.daily_budget_usd}/天` : "未知"}
- 核心指标：${req.target_kpi}
- 产品类型：${req.product_type}
- 推广目标：${req.campaign_objective}

请基于以上需求信息回答用户问题，语言风格专业简洁，回复使用中文。`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, requirementData, evaluationData } = body as {
      messages: AIChatMessage[];
      requirementData: StructuredRequirement;
      evaluationData: AIEvaluation | undefined;
    };

    if (!messages || !requirementData) {
      return new Response(
        JSON.stringify({ success: false, error: "缺少必要参数" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemContext = evaluationData
      ? CHAT_SYSTEM_PROMPT(requirementData, evaluationData)
      : CHAT_SYSTEM_PROMPT_NO_EVAL(requirementData);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await chatWithContextStream(
            systemContext,
            messages,
            (chunk) => {
              const line = `data: ${JSON.stringify({ chunk })}\n\n`;
              controller.enqueue(encoder.encode(line));
            },
            req.signal
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          const isAbort =
            (err as Error)?.name === "AbortError" ||
            (err as Error)?.message === "AbortError";
          if (!isAbort) {
            const errLine = `data: ${JSON.stringify({ error: "AI 对话失败，请重试" })}\n\n`;
            controller.enqueue(encoder.encode(errLine));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[/api/ai/chat]", err);
    return new Response(
      JSON.stringify({ success: false, error: "AI 对话失败，请重试" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
