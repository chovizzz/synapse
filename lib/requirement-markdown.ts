import type { Requirement } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "草稿",
  PENDING: "待分配",
  EVALUATING: "评估中",
  ACCEPTED: "已接单",
  REJECTED: "已拒绝",
  IN_PROGRESS: "投放中",
  COMPLETED: "已完成",
};

export function buildRequirementMarkdown(r: Requirement): string {
  const sd = r.structuredData;
  let md = `# 需求摘要 · ${r.clientName}\n\n`;
  md += `- **状态**：${STATUS_LABEL[r.status] ?? r.status}\n`;
  md += `- **创建人**：${r.creatorName}\n`;
  if (r.assignedOptimizerName) md += `- **指派优化师**：${r.assignedOptimizerName}\n`;
  md += `- **创建时间**：${r.createdAt}\n\n`;
  md += `## 客户原话\n\n${r.rawInput}\n\n`;

  if (sd) {
    md += `## 结构化参数\n\n`;
    md += `| 字段 | 值 |\n|------|----|\n`;
    md += `| 投放地区 | ${sd.region || "—"} |\n`;
    md += `| 媒体平台 | ${sd.media_platform || "—"} |\n`;
    md += `| 日预算(USD) | ${sd.daily_budget_usd ?? "—"} |\n`;
    md += `| 核心指标 | ${sd.target_kpi || "—"} |\n`;
    md += `| 目标 ROI | ${sd.target_roi ?? "—"} |\n`;
    md += `| 产品类型 | ${sd.product_type || "—"} |\n`;
    md += `| 推广目标 | ${sd.campaign_objective || "—"} |\n\n`;
  }

  if (r.aiEvaluation) {
    const ev = r.aiEvaluation;
    md += `## AI 评估\n\n`;
    md += `- 成功率：${ev.success_rate}%\n`;
    md += `- 置信度：${ev.confidence}\n`;
    if (ev.risks?.length) {
      md += `\n### 风险\n\n`;
      ev.risks.forEach((x) => {
        md += `- (${x.level}) ${x.description}\n`;
      });
    }
    if (ev.strategy_suggestions?.length) {
      md += `\n### 策略建议\n\n`;
      ev.strategy_suggestions.forEach((s, i) => {
        md += `${i + 1}. ${s}\n`;
      });
    }
    md += `\n`;
  }

  if (r.rejectionReason) {
    md += `## 拒绝原因\n\n${r.rejectionReason}\n\n`;
  }

  md += `---\n*由 Synapse 导出 · 演示用途*\n`;
  return md;
}
