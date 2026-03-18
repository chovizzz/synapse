"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { X, ExternalLink, Star } from "lucide-react";
import type { KnowledgeCase } from "@/types";

interface CaseDetailProps {
  case: KnowledgeCase | null;
  onClose: () => void;
}

function MetaItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl p-3 flex flex-col gap-1 bg-slate-50 dark:bg-[hsl(var(--secondary))]">
      <span className="text-[11px] text-slate-400 dark:text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-green-600 dark:text-green-400" : "text-slate-900 dark:text-[hsl(var(--foreground))]"}`}>
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
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Card */}
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-[hsl(var(--border))] shadow-2xl bg-white dark:bg-[hsl(var(--card))]">
              {/* Header — blue semantic color */}
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100 dark:border-[hsl(var(--border))] rounded-t-3xl bg-indigo-600 dark:bg-indigo-900/50">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-white/20 text-white">
                      {c.industry}
                    </span>
                    {c.isHighlight && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-yellow-400 text-yellow-900">
                        <Star size={9} className="fill-yellow-900" />
                        优秀案例
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white">{c.title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 rounded-xl p-2 transition-colors hover:bg-white/20"
                >
                  <X size={18} className="text-white" />
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
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                    策略摘要
                  </h3>
                  <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-sm leading-relaxed text-slate-700 dark:text-[hsl(var(--foreground))]">
                    <ReactMarkdown>{c.strategySummary}</ReactMarkdown>
                  </div>
                </div>

                {/* Key insights */}
                {c.keyInsights.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                      关键洞察
                    </h3>
                    <ul className="space-y-2">
                      {c.keyInsights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span className="text-sm leading-relaxed text-slate-700 dark:text-[hsl(var(--foreground))]">
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
                        className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[hsl(var(--secondary))] text-slate-500 dark:text-[hsl(var(--muted-foreground))]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* CTA */}
                <div className="pt-4 border-t border-slate-100 dark:border-[hsl(var(--border))]">
                  <button
                    onClick={() => router.push("/requirements/new")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-indigo-600 hover:bg-indigo-700 dark:bg-[hsl(var(--primary))] dark:hover:opacity-90 text-white shadow-md shadow-indigo-100 dark:shadow-none"
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
