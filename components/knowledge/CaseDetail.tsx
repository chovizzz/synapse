"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { X, ExternalLink } from "lucide-react";
import type { KnowledgeCase } from "@/types";

interface CaseDetailProps {
  case: KnowledgeCase | null;
  onClose: () => void;
}

interface MetaItemProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function MetaItem({ label, value, highlight }: MetaItemProps) {
  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-1"
      style={{ backgroundColor: "hsl(var(--secondary))" }}
    >
      <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
        {label}
      </span>
      <span
        className="text-sm font-semibold"
        style={{ color: highlight ? "rgb(74,222,128)" : "hsl(var(--foreground))" }}
      >
        {value}
      </span>
    </div>
  );
}

export function CaseDetail({ case: c, onClose }: CaseDetailProps) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {c && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          />

          {/* Card */}
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl"
              style={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
              }}
            >
              {/* Header */}
              <div
                className="sticky top-0 z-10 flex items-start justify-between gap-4 p-6 pb-4 border-b"
                style={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: "rgba(59,130,246,0.12)",
                        color: "rgb(96,165,250)",
                      }}
                    >
                      {c.industry}
                    </span>
                    {c.isHighlight && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                        style={{
                          backgroundColor: "rgba(234,179,8,0.9)",
                          color: "#1a1200",
                        }}
                      >
                        ⭐ 优秀案例
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white">{c.title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-white/10"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Meta grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <MetaItem label="媒体平台" value={c.mediaPlatform} />
                  <MetaItem label="投放地区" value={c.region} />
                  <MetaItem label="预算范围" value={c.budgetRange} />
                  <MetaItem label="目标 KPI" value={c.targetKpi + (c.targetRoi !== undefined ? ` ${c.targetRoi}` : "")} />
                  {c.actualRoi !== undefined && (
                    <MetaItem
                      label={`实际 ${c.targetKpi}`}
                      value={String(c.actualRoi.toFixed(2))}
                      highlight
                    />
                  )}
                </div>

                {/* Strategy summary */}
                <div>
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    策略摘要
                  </h3>
                  <div
                    className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed"
                    style={{ color: "hsl(var(--foreground))" }}
                  >
                    <ReactMarkdown>{c.strategySummary}</ReactMarkdown>
                  </div>
                </div>

                {/* Key insights */}
                {c.keyInsights.length > 0 && (
                  <div>
                    <h3
                      className="text-xs font-semibold uppercase tracking-wider mb-3"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      关键洞察
                    </h3>
                    <ul className="space-y-2">
                      {c.keyInsights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span
                            className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: "rgb(96,165,250)" }}
                          />
                          <span
                            className="text-sm leading-relaxed"
                            style={{ color: "hsl(var(--foreground))" }}
                          >
                            {insight}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                {c.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {c.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "hsl(var(--secondary))",
                          color: "hsl(var(--muted-foreground))",
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* CTA */}
                <div
                  className="pt-4 border-t"
                  style={{ borderColor: "hsl(var(--border))" }}
                >
                  <button
                    onClick={() => router.push("/requirements/new")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                    style={{
                      backgroundColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                    }}
                  >
                    <ExternalLink size={15} />
                    参考此案例创建需求
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
