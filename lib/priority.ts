import type { RequirementPriority } from "@/types";

/**
 * 根据 AI 评分推导需求优先级
 * ≥ 75 → HIGH，45–74 → MEDIUM，< 45 → LOW，未评估 → MEDIUM
 */
export function derivePriority(successRate?: number): RequirementPriority {
  if (successRate == null) return "MEDIUM";
  if (successRate >= 75) return "HIGH";
  if (successRate >= 45) return "MEDIUM";
  return "LOW";
}
