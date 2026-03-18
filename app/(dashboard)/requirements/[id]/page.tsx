"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronDown, ChevronUp, Check, Loader2 } from "lucide-react";
import type { Requirement, AIEvaluation } from "@/types";
import { getRequirements, saveRequirements } from "@/lib/store";
import { useRole } from "@/lib/role-context";
import { formatDate } from "@/lib/utils";
import { EvaluationCard } from "@/components/evaluation/EvaluationCard";

const STATUS_CONFIG = {
  PENDING: { label: "待分配", bg: "rgba(234,179,8,0.1)", color: "rgb(250,204,21)" },
  EVALUATING: { label: "评估中", bg: "rgba(59,130,246,0.1)", color: "rgb(96,165,250)" },
  ACCEPTED: { label: "已接单", bg: "rgba(34,197,94,0.1)", color: "rgb(74,222,128)" },
  IN_PROGRESS: { label: "投放中", bg: "rgba(34,197,94,0.1)", color: "rgb(74,222,128)" },
  REJECTED: { label: "已拒绝", bg: "rgba(239,68,68,0.1)", color: "rgb(248,113,113)" },
  COMPLETED: { label: "已完成", bg: "rgba(107,114,128,0.1)", color: "rgb(156,163,175)" },
};

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-xl"
      style={{ backgroundColor: "hsl(var(--primary))" }}
    >
      <Check size={14} />
      {message}
    </motion.div>
  );
}

export default function RequirementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useRole();

  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [evaluation, setEvaluation] = useState<AIEvaluation | undefined>(undefined);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [rawExpanded, setRawExpanded] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const updateRequirement = useCallback((updated: Requirement) => {
    const all = getRequirements();
    const next = all.map((r) => (r.id === updated.id ? updated : r));
    saveRequirements(next);
    setRequirement(updated);
  }, []);

  // Load requirement
  useEffect(() => {
    const reqs = getRequirements();
    const req = reqs.find((r) => r.id === id) ?? null;
    setRequirement(req);
    if (req?.aiEvaluation) {
      setEvaluation(req.aiEvaluation);
    }
  }, [id]);

  // Auto-trigger AI evaluation if needed
  useEffect(() => {
    if (!requirement) return;
    if (requirement.aiEvaluation) return;
    if (!requirement.structuredData) return;
    if (isEvaluating) return;

    setIsEvaluating(true);
    fetch("/api/ai/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ structuredData: requirement.structuredData }),
    })
      .then((res) => res.json())
      .then((body) => {
        if (body.success && body.data) {
          const updated: Requirement = {
            ...requirement,
            aiEvaluation: body.data as AIEvaluation,
            updatedAt: new Date().toISOString(),
          };
          updateRequirement(updated);
          setEvaluation(body.data as AIEvaluation);
        }
      })
      .catch(() => {/* silent — card shows loading state */})
      .finally(() => setIsEvaluating(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirement?.id]);

  const handleAccept = () => {
    if (!requirement) return;
    const updated: Requirement = {
      ...requirement,
      status: "ACCEPTED",
      updatedAt: new Date().toISOString(),
    };
    updateRequirement(updated);
    router.push("/projects/p1");
  };

  const handleRejectConfirm = () => {
    if (!requirement) return;
    const updated: Requirement = {
      ...requirement,
      status: "REJECTED",
      rejectionReason: rejectReason || "无",
      updatedAt: new Date().toISOString(),
    };
    updateRequirement(updated);
    setRejectMode(false);
    setRejectReason("");
  };

  const handleFollowUp = () => {
    setToast("已向商务发送追问通知");
  };

  if (!requirement) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: "hsl(var(--muted-foreground))" }}>
        <Loader2 className="animate-spin mr-2" size={16} />
        加载中…
      </div>
    );
  }

  const sd = requirement.structuredData;
  const statusCfg = STATUS_CONFIG[requirement.status];
  const isOptimizer = currentUser.role === "OPTIMIZER";

  const timelineEvents = [
    { label: "创建需求", time: requirement.createdAt, done: true },
    {
      label: "AI 评估完成",
      time: evaluation ? requirement.updatedAt : null,
      done: !!evaluation,
    },
    { label: "等待优化师响应", time: null, done: false, active: true },
  ];

  return (
    <>
      <div className="space-y-5 max-w-[1100px] mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          <button
            onClick={() => router.push("/requirements")}
            className="hover:text-white transition-colors"
          >
            需求管理
          </button>
          <ChevronRight size={12} />
          <span className="text-white">{requirement.clientName}</span>
        </div>

        {/* Two-column layout — stacks on mobile, side-by-side on lg+ */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* ─── Left col 55% ─── */}
          <div className="w-full lg:flex-[55] min-w-0 space-y-4">
            {/* Client info */}
            <div
              className="rounded-xl border p-5 space-y-3"
              style={{
                borderColor: "hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-lg font-semibold text-white">{requirement.clientName}</h1>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {sd?.product_type && (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: "hsl(var(--secondary))",
                          color: "hsl(var(--muted-foreground))",
                        }}
                      >
                        {sd.product_type}
                      </span>
                    )}
                    {sd?.media_platform && (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: "hsl(var(--secondary))",
                          color: "hsl(var(--muted-foreground))",
                        }}
                      >
                        {sd.media_platform}
                      </span>
                    )}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: "hsl(var(--primary))" }}
                  >
                    {requirement.creatorName.slice(-1)}
                  </div>
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {requirement.creatorName}
                  </span>
                </div>
              </div>
            </div>

            {/* Structured params */}
            {sd && (
              <div
                className="rounded-xl border p-5"
                style={{
                  borderColor: "hsl(var(--border))",
                  backgroundColor: "hsl(var(--card))",
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                  需求参数
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    { label: "投放地区", value: sd.region },
                    { label: "媒体平台", value: sd.media_platform },
                    { label: "日预算", value: sd.daily_budget_usd != null ? `$${sd.daily_budget_usd}/天` : "—" },
                    { label: "核心指标", value: sd.target_kpi },
                    { label: "目标ROI", value: sd.target_roi != null ? sd.target_roi.toString() : "—" },
                    { label: "产品类型", value: sd.product_type },
                    { label: "推广目标", value: sd.campaign_objective },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-[11px] mb-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {label}
                      </div>
                      <div className="text-sm font-medium text-white">{value || "—"}</div>
                    </div>
                  ))}
                </div>

                {sd.ambiguous_fields.length > 0 && (
                  <div className="mt-4 pt-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
                    <div className="text-[11px] mb-2 text-yellow-400">待确认字段</div>
                    {sd.ambiguous_fields.map((f, i) => (
                      <div key={i} className="text-xs text-white/70 mb-1">
                        · {f.field}：{f.question}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Raw input (collapsible) */}
            <div
              className="rounded-xl border overflow-hidden"
              style={{
                borderColor: "hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
              }}
            >
              <button
                onClick={() => setRawExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium hover:bg-white/5 transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                <span>原始输入</span>
                {rawExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <AnimatePresence initial={false}>
                {rawExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      className="px-5 pb-4 text-sm leading-relaxed"
                      style={{
                        borderTop: "1px solid hsl(var(--border))",
                        color: "hsl(var(--muted-foreground))",
                        backgroundColor: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <p className="pt-3">{requirement.rawInput}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status timeline */}
            <div
              className="rounded-xl border p-5"
              style={{
                borderColor: "hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
              }}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                状态时间线
              </h3>
              <div className="space-y-0">
                {timelineEvents.map((ev, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{
                          borderColor: ev.done
                            ? "hsl(var(--primary))"
                            : ev.active
                            ? "rgb(250,204,21)"
                            : "hsl(var(--border))",
                          backgroundColor: ev.done ? "hsl(var(--primary))" : "transparent",
                        }}
                      >
                        {ev.done && <Check size={10} className="text-white" />}
                        {ev.active && !ev.done && (
                          <div className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
                        )}
                      </div>
                      {idx < timelineEvents.length - 1 && (
                        <div
                          className="w-px flex-1 my-1"
                          style={{
                            height: 24,
                            backgroundColor: ev.done ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))",
                          }}
                        />
                      )}
                    </div>
                    <div className="pb-4">
                      <div
                        className="text-sm font-medium"
                        style={{ color: ev.active && !ev.done ? "rgb(250,204,21)" : "hsl(var(--foreground))" }}
                      >
                        {ev.label}
                      </div>
                      {ev.time && (
                        <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {formatDate(ev.time)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Right col 45% ─── */}
          <div className="w-full lg:flex-[45] min-w-0 space-y-4">
            {/* AI Evaluation card */}
            <div
              className="rounded-xl border p-5"
              style={{
                borderColor: "hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                  AI 评估
                </h3>
                {isEvaluating && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Loader2 size={12} className="animate-spin" />
                    评估中…
                  </div>
                )}
              </div>
              <EvaluationCard evaluation={evaluation} isLoading={isEvaluating && !evaluation} />
            </div>

            {/* Optimizer actions */}
            {isOptimizer && (
              <div
                className="rounded-xl border p-5 space-y-3"
                style={{
                  borderColor: "hsl(var(--border))",
                  backgroundColor: "hsl(var(--card))",
                }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                  操作
                </h3>

                <div className="flex gap-2">
                  <button
                    onClick={handleAccept}
                    disabled={requirement.status === "ACCEPTED" || requirement.status === "REJECTED"}
                    className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "hsl(var(--primary))" }}
                  >
                    接单
                  </button>
                  <button
                    onClick={() => setRejectMode((v) => !v)}
                    disabled={requirement.status === "ACCEPTED" || requirement.status === "REJECTED"}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      border: "1px solid #EF4444",
                      color: "#EF4444",
                      backgroundColor: "transparent",
                    }}
                  >
                    拒绝
                  </button>
                  <button
                    onClick={handleFollowUp}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
                    style={{
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--muted-foreground))",
                      backgroundColor: "transparent",
                    }}
                  >
                    追问
                  </button>
                </div>

                <AnimatePresence>
                  {rejectMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="pt-2 space-y-2">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="请填写拒绝原因（选填）"
                          rows={3}
                          className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none"
                          style={{
                            backgroundColor: "hsl(var(--secondary))",
                            border: "1px solid hsl(var(--border))",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleRejectConfirm}
                            className="flex-1 py-1.5 rounded-lg text-xs font-medium text-white"
                            style={{ backgroundColor: "#EF4444" }}
                          >
                            确认拒绝
                          </button>
                          <button
                            onClick={() => { setRejectMode(false); setRejectReason(""); }}
                            className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                            style={{
                              backgroundColor: "hsl(var(--secondary))",
                              color: "hsl(var(--muted-foreground))",
                            }}
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {requirement.status === "REJECTED" && requirement.rejectionReason && (
                  <div className="rounded-lg p-3 text-xs bg-red-500/10 text-red-400">
                    已拒绝：{requirement.rejectionReason}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
}
