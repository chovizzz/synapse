"use client";

import { BookOpen, ChevronRight } from "lucide-react";
import type { KnowledgeCase } from "@/types";

interface Props {
  cases: KnowledgeCase[];
  onOpenCase: (c: KnowledgeCase) => void;
}

export function SimilarKnowledgeCases({ cases, onOpenCase }: Props) {
  if (cases.length === 0) return null;

  return (
    <div
      className="rounded-2xl border p-4 sm:p-5"
      style={{
        borderColor: "hsl(var(--border))",
        backgroundColor: "hsl(var(--card))",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={16} style={{ color: "hsl(var(--primary))" }} />
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">相似经验案例</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-[hsl(var(--secondary))] text-slate-500 dark:text-[hsl(var(--muted-foreground))]">
          规则匹配
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
        根据客户行业、投放地区与媒体平台从经验库中推荐，便于话术与策略参考。
      </p>
      <ul className="space-y-2">
        {cases.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onOpenCase(c)}
              className="w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{c.title}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {c.industry} · {c.mediaPlatform} · {c.region}
                </div>
              </div>
              <ChevronRight size={16} className="flex-shrink-0 text-slate-400" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
