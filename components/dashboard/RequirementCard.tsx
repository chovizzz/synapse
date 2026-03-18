"use client";

import { useRouter } from "next/navigation";
import type { Requirement, RequirementStatus } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";

const STATUS_CONFIG: Record<RequirementStatus, { label: string; bg: string; color: string }> = {
  DRAFT: { label: "草稿", bg: "rgba(139,92,246,0.1)", color: "rgb(167,139,250)" },
  PENDING: { label: "待分配", bg: "rgba(234,179,8,0.1)", color: "rgb(250,204,21)" },
  EVALUATING: { label: "评估中", bg: "rgba(59,130,246,0.1)", color: "rgb(96,165,250)" },
  ACCEPTED: { label: "已接单", bg: "rgba(34,197,94,0.1)", color: "rgb(74,222,128)" },
  IN_PROGRESS: { label: "投放中", bg: "rgba(34,197,94,0.1)", color: "rgb(74,222,128)" },
  REJECTED: { label: "已拒绝", bg: "rgba(239,68,68,0.1)", color: "rgb(248,113,113)" },
  COMPLETED: { label: "已完成", bg: "rgba(107,114,128,0.1)", color: "rgb(156,163,175)" },
};

interface RequirementCardProps {
  requirement: Requirement;
  showScore?: boolean;
}

export function RequirementCard({ requirement, showScore }: RequirementCardProps) {
  const router = useRouter();
  const status = STATUS_CONFIG[requirement.status];
  const score = requirement.aiEvaluation?.success_rate;

  return (
    <div
      onClick={() => router.push(`/requirements/${requirement.id}`)}
      className="rounded-lg border p-4 cursor-pointer transition-all"
      style={{
        borderColor: "hsl(var(--border))",
        backgroundColor: "hsl(var(--card))",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary) / 0.5)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[hsl(var(--foreground))] text-sm truncate">{requirement.clientName}</div>
          {requirement.structuredData && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: "hsl(var(--secondary))",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                {requirement.structuredData.product_type}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: "hsl(var(--secondary))",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                {requirement.structuredData.media_platform}
              </span>
              {requirement.structuredData.daily_budget_usd !== null && (
                <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {formatCurrency(requirement.structuredData.daily_budget_usd)}/天
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {showScore && score !== undefined && (
            <div
              className="w-9 h-9 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: "hsl(var(--primary))" }}
            >
              <span className="text-[10px] font-bold" style={{ color: "hsl(var(--primary))" }}>
                {score}
              </span>
            </div>
          )}
          <span
            className="text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap"
            style={{ backgroundColor: status.bg, color: status.color }}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="mt-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
        {formatDate(requirement.createdAt)}
      </div>
    </div>
  );
}
