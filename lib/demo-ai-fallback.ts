import type { StructuredRequirement, AIEvaluation } from "@/types";

/** 演示现场 AI 失败时的最小可用结构化结果（不调用模型） */
export function fallbackStructuredFromRaw(rawInput: string): StructuredRequirement {
  const preview = rawInput.trim().slice(0, 120);
  return {
    region: "待确认（演示降级）",
    media_platform: "Facebook",
    daily_budget_usd: 500,
    target_kpi: "ROI",
    target_roi: 1.1,
    product_type: "待确认",
    campaign_objective: "用户获取",
    product_url: null,
    soft_kpi: "次留",
    test_period: "2-4 周",
    third_party_tracking: "Adjust",
    attribution_model: "代投",
    expected_start_date: "尽快",
    policy_notes: "本单为演示降级数据，请核对后修改。原文摘要：" + preview,
    ambiguous_fields: [
      { field: "region", question: "请确认具体投放国家/地区？" },
      { field: "product_type", question: "请补充产品类型与链接？" },
    ],
  };
}

export function fallbackEvaluation(): AIEvaluation {
  return {
    success_rate: 72,
    confidence: "medium",
    risks: [
      { level: "medium", description: "演示降级：未调用真实模型，评分仅供参考" },
      { level: "low", description: "建议补充地区与预算细节后再正式评估" },
    ],
    strategy_suggestions: [
      "演示模式：先小预算测试再放量",
      "核对媒体平台与 KPI 是否与商务一致",
      "参考经验库中同行业案例",
    ],
    estimated_timeline: "1–2 个工作日（演示数据）",
    similar_case_hint: "可在经验库中搜索同行业案例",
  };
}

export function isDemoSafeMode(): boolean {
  return process.env.DEMO_SAFE_MODE === "1" || process.env.DEMO_SAFE_MODE === "true";
}
