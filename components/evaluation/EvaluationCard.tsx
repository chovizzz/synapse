import type { AIEvaluation } from "@/types";
import { ScoreCircle } from "./ScoreCircle";
import { RiskBadge } from "./RiskBadge";
import { StrategyList } from "./StrategyList";

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "高置信度",
  medium: "中等置信度",
  low: "低置信度",
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "text-green-400",
  medium: "text-yellow-400",
  low: "text-red-400",
};

interface EvaluationCardProps {
  evaluation: AIEvaluation | undefined;
  isLoading?: boolean;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
    />
  );
}

export function EvaluationCard({ evaluation, isLoading }: EvaluationCardProps) {
  if (isLoading || !evaluation) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-[120px] w-[120px] rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Score */}
      <div className="flex flex-col items-center gap-2">
        <ScoreCircle score={evaluation.success_rate} size={120} />
        <div className="flex items-center gap-1.5 text-xs">
          <span style={{ color: "hsl(var(--muted-foreground))" }}>置信度：</span>
          <span className={`font-medium ${CONFIDENCE_COLOR[evaluation.confidence] ?? "text-white"}`}>
            {CONFIDENCE_LABEL[evaluation.confidence] ?? evaluation.confidence}
          </span>
        </div>
        {evaluation.estimated_timeline && (
          <span
            className="text-[11px] px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "hsl(var(--secondary))",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            预计见效：{evaluation.estimated_timeline}
          </span>
        )}
      </div>

      {/* Risks */}
      {evaluation.risks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
            风险提示
          </h4>
          {evaluation.risks.map((risk, idx) => (
            <RiskBadge key={idx} level={risk.level} description={risk.description} />
          ))}
        </div>
      )}

      {/* Strategy */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
          策略建议
        </h4>
        <StrategyList suggestions={evaluation.strategy_suggestions} />
      </div>

      {/* Similar case */}
      {evaluation.similar_case_hint && (
        <div
          className="rounded-lg p-3"
          style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
        >
          <p className="text-xs italic leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
            💡 {evaluation.similar_case_hint}
          </p>
        </div>
      )}
    </div>
  );
}
