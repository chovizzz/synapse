"use client";

import type { KnowledgeCase } from "@/types";
import { formatDate } from "@/lib/utils";
import { Star, MapPin, Clock } from "lucide-react";

interface CaseCardProps {
  case: KnowledgeCase;
  onClick: () => void;
}

export function CaseCard({ case: c, onClick }: CaseCardProps) {
  const summary =
    c.strategySummary.length > 50
      ? c.strategySummary.slice(0, 50) + "..."
      : c.strategySummary;

  return (
    <div
      onClick={onClick}
      className="relative rounded-xl border p-5 cursor-pointer transition-all duration-200"
      style={{
        borderColor: "hsl(var(--border))",
        backgroundColor: "hsl(var(--card))",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "hsl(var(--primary) / 0.5)";
        el.style.boxShadow = "0 10px 15px -3px rgba(59,130,246,0.05)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "hsl(var(--border))";
        el.style.boxShadow = "";
      }}
    >
      {/* Highlight badge */}
      {c.isHighlight && (
        <div
          className="absolute -top-2 -left-1 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: "rgba(234,179,8,0.9)", color: "#1a1200" }}
        >
          <Star size={10} fill="currentColor" />
          优秀案例
        </div>
      )}

      {/* Top: industry tag + media badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: "rgba(59,130,246,0.12)",
              color: "rgb(96,165,250)",
            }}
          >
            {c.industry}
          </span>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: "hsl(var(--secondary))",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            {c.mediaPlatform}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 leading-snug">
        {c.title}
      </h3>

      {/* Budget + KPI row */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="text-xs"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          预算 {c.budgetRange}
        </span>
        <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          目标 {c.targetKpi}
          {c.targetRoi !== undefined ? ` ${c.targetRoi}` : ""}
        </span>
      </div>

      {/* Actual ROI */}
      {c.actualRoi !== undefined && (
        <div className="mb-3">
          <span
            className="text-xs"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            实际 {c.targetKpi}
          </span>
          <div className="text-2xl font-bold" style={{ color: "rgb(74,222,128)" }}>
            {c.actualRoi.toFixed(2)}
          </div>
        </div>
      )}

      {/* Strategy summary */}
      <p
        className="text-xs leading-relaxed mb-4"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        {summary}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <MapPin size={11} style={{ color: "hsl(var(--muted-foreground))" }} />
          <span
            className="text-[11px]"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {c.region}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={11} style={{ color: "hsl(var(--muted-foreground))" }} />
          <span
            className="text-[11px]"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {formatDate(c.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
