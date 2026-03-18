"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight, ChevronDown, ChevronUp, Check, CheckCircle2, Loader2,
  Send, MessageSquare, X, Bot, Info, BarChart2, History
} from "lucide-react";
import type { Requirement, AIEvaluation, FollowUp, User } from "@/types";
import { getRequirements, saveRequirements, getFollowUps, addFollowUp, getStoredUsers } from "@/lib/store";
import { useRole } from "@/lib/role-context";
import { formatDate, generateId, cn } from "@/lib/utils";
import { EvaluationCard } from "@/components/evaluation/EvaluationCard";
import AIChat from "@/components/requirements/AIChat";

const STATUS_CONFIG = {
  DRAFT: { label: "草稿", tw: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400" },
  PENDING: { label: "待分配", tw: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400" },
  EVALUATING: { label: "评估中", tw: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  ACCEPTED: { label: "已接单", tw: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" },
  IN_PROGRESS: { label: "投放中", tw: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" },
  REJECTED: { label: "已拒绝", tw: "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400" },
  COMPLETED: { label: "已完成", tw: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400" },
};

type Tab = "info" | "evaluation" | "followup" | "aichat";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "info", label: "基本信息", icon: Info },
  { key: "evaluation", label: "AI 评估", icon: BarChart2 },
  { key: "followup", label: "追问记录", icon: History },
  { key: "aichat", label: "AI 对话", icon: Bot },
];

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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl bg-indigo-600 dark:bg-[hsl(var(--primary))]"
    >
      <Check size={14} />
      {message}
    </motion.div>
  );
}

// Right-side sliding CommDrawer for follow-ups
function CommDrawer({
  open,
  onClose,
  followUps,
  input,
  onInputChange,
  onSend,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  followUps: FollowUp[];
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  currentUserId: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [open, followUps]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[360px] max-w-[90vw] flex flex-col bg-white dark:bg-[hsl(var(--card))] border-l border-slate-200 dark:border-[hsl(var(--border))] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[hsl(var(--border))]">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-indigo-500" />
                <span className="font-semibold text-slate-900 dark:text-white text-sm">追问记录</span>
                {followUps.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold">
                    {followUps.length}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <X size={16} className="text-slate-400 dark:text-[hsl(var(--muted-foreground))]" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {followUps.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                    <MessageSquare size={20} className="text-indigo-400" />
                  </div>
                  <p className="text-sm text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                    暂无追问记录
                  </p>
                  <p className="text-xs text-slate-300 dark:text-[hsl(var(--muted-foreground)/0.6)]">
                    发起第一条追问吧
                  </p>
                </div>
              ) : (
                followUps.map((fu) => {
                  const isOwn = fu.fromId === currentUserId;
                  return (
                    <div key={fu.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[85%] space-y-1">
                        <div className={`text-[10px] font-medium ${isOwn ? "text-right" : ""} text-slate-400 dark:text-[hsl(var(--muted-foreground))]`}>
                          {fu.fromName} · {fu.fromRole === "OPTIMIZER" ? "优化师" : "商务"}
                        </div>
                        <div
                          className={cn(
                            "text-sm px-4 py-2.5 leading-relaxed",
                            isOwn
                              ? "bg-indigo-600 dark:bg-[hsl(var(--primary))] text-white rounded-2xl rounded-tr-sm"
                              : "bg-slate-100 dark:bg-[hsl(var(--secondary))] text-slate-800 dark:text-[hsl(var(--foreground))] rounded-2xl rounded-tl-sm"
                          )}
                        >
                          {fu.content}
                        </div>
                        <div className={`text-[10px] text-slate-300 dark:text-[hsl(var(--muted-foreground)/0.5)] ${isOwn ? "text-right" : ""}`}>
                          {formatDate(fu.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-100 dark:border-[hsl(var(--border))]">
              <div className="flex items-end gap-2 rounded-2xl bg-slate-50 dark:bg-[hsl(var(--secondary))] px-3 py-2">
                <textarea
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  placeholder="发起追问或回复…"
                  rows={2}
                  className="flex-1 resize-none bg-transparent outline-none text-sm text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/30 leading-relaxed"
                />
                <button
                  onClick={onSend}
                  disabled={!input.trim()}
                  className="flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 bg-indigo-600 dark:bg-[hsl(var(--primary))]"
                >
                  <Send size={13} className="text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [followUpInput, setFollowUpInput] = useState("");

  // 商务预审：提交给优化师
  const [optimizers, setOptimizers] = useState<User[]>([]);
  const [selectedOptimizerId, setSelectedOptimizerId] = useState("");
  const [isSubmittingToOptimizer, setIsSubmittingToOptimizer] = useState(false);

  // AI 对话状态（提升到父组件，切 Tab 不丢失）
  const [chatMessages, setChatMessages] = useState<import("@/types").AIChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isReEvaluating, setIsReEvaluating] = useState(false);

  const updateRequirement = useCallback((updated: Requirement) => {
    const all = getRequirements();
    const next = all.map((r) => (r.id === updated.id ? updated : r));
    saveRequirements(next);
    setRequirement(updated);
  }, []);

  useEffect(() => {
    const reqs = getRequirements();
    const req = reqs.find((r) => r.id === id) ?? null;
    setRequirement(req);
    if (req?.aiEvaluation) setEvaluation(req.aiEvaluation);
    setFollowUps(getFollowUps(id));
    // 加载优化师列表供商务选择
    const allUsers = getStoredUsers();
    const opts = allUsers.filter((u) => u.role === "OPTIMIZER");
    setOptimizers(opts);
    if (opts.length > 0) setSelectedOptimizerId(opts[0].id);
  }, [id]);

  useEffect(() => {
    if (!requirement || requirement.aiEvaluation || !requirement.structuredData || isEvaluating) return;

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
      .catch(() => {})
      .finally(() => setIsEvaluating(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirement?.id]);

  const handleReEvaluate = () => {
    if (!requirement?.structuredData || isReEvaluating) return;
    setIsReEvaluating(true);
    fetch("/api/ai/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ structuredData: requirement.structuredData }),
    })
      .then((r) => r.json())
      .then((body) => {
        if (body.success && body.data) {
          const updated: Requirement = {
            ...requirement,
            aiEvaluation: body.data as AIEvaluation,
            updatedAt: new Date().toISOString(),
          };
          updateRequirement(updated);
          setEvaluation(body.data as AIEvaluation);
          setToast("评估已重新生成");
        }
      })
      .catch(() => {})
      .finally(() => setIsReEvaluating(false));
  };

  const handleSubmitToOptimizer = () => {
    if (!requirement) return;
    const optimizer = optimizers.find((u) => u.id === selectedOptimizerId);
    setIsSubmittingToOptimizer(true);
    updateRequirement({
      ...requirement,
      status: "PENDING",
      assignedOptimizerId: optimizer?.id,
      assignedOptimizerName: optimizer?.name,
      updatedAt: new Date().toISOString(),
    });
    setToast("已提交给优化师，等待响应");
    setIsSubmittingToOptimizer(false);
  };

  const handleAccept = () => {
    if (!requirement) return;
    updateRequirement({ ...requirement, status: "ACCEPTED", updatedAt: new Date().toISOString() });
    router.push("/projects/p1");
  };

  const handleRejectConfirm = () => {
    if (!requirement) return;
    updateRequirement({
      ...requirement,
      status: "REJECTED",
      rejectionReason: rejectReason || "无",
      updatedAt: new Date().toISOString(),
    });
    setRejectMode(false);
    setRejectReason("");
  };

  const handleSendFollowUp = () => {
    const content = followUpInput.trim();
    if (!content) return;
    const fu: FollowUp = {
      id: generateId(),
      requirementId: id,
      fromId: currentUser.id,
      fromName: currentUser.name,
      fromRole: currentUser.role,
      content,
      createdAt: new Date().toISOString(),
    };
    addFollowUp(fu);
    setFollowUps((prev) => [...prev, fu]);
    setFollowUpInput("");
  };

  if (!requirement) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
        <Loader2 className="animate-spin mr-2" size={16} />
        加载中…
      </div>
    );
  }

  const sd = requirement.structuredData;
  const statusCfg = STATUS_CONFIG[requirement.status];
  const isOptimizer = currentUser.role === "OPTIMIZER";
  const isBusiness = currentUser.role === "BUSINESS";
  const isDraft = requirement.status === "DRAFT";

  const timelineEvents = isDraft
    ? [
        { label: "创建需求", time: requirement.createdAt, done: true },
        { label: "AI 评估完成", time: evaluation ? requirement.updatedAt : null, done: !!evaluation },
        { label: "提交给优化师", time: null, done: false, active: true },
      ]
    : [
        { label: "创建需求", time: requirement.createdAt, done: true },
        { label: "AI 评估完成", time: evaluation ? requirement.updatedAt : null, done: !!evaluation },
        { label: "等待优化师响应", time: null, done: false, active: true },
      ];

  return (
    <>
      <div className="space-y-5 max-w-[1100px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
          <button onClick={() => router.push("/requirements")} className="hover:text-slate-900 dark:hover:text-white transition-colors">
            需求管理
          </button>
          <ChevronRight size={12} />
          <span className="text-slate-900 dark:text-white font-medium">{requirement.clientName}</span>
        </div>

        {/* DRAFT 提示横幅 */}
        {isDraft && (
          <div className="rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/5 px-5 py-3 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse flex-shrink-0" />
            <p className="text-sm text-violet-700 dark:text-violet-300 font-medium">
              草稿 · 商务预审中
            </p>
            <span className="text-xs text-violet-500 dark:text-violet-400/70">
              AI 评估结果仅你可见，查看并与 AI 对话优化后，再提交给优化师
            </span>
          </div>
        )}

        {/* Client info card */}
        <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{requirement.clientName}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {sd?.product_type && (
                  <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[hsl(var(--secondary))] text-slate-500 dark:text-[hsl(var(--muted-foreground))]">
                    {sd.product_type}
                  </span>
                )}
                {sd?.media_platform && (
                  <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[hsl(var(--secondary))] text-slate-500 dark:text-[hsl(var(--muted-foreground))]">
                    {sd.media_platform}
                  </span>
                )}
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", statusCfg.tw)}>
                  {statusCfg.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Follow-up drawer trigger */}
              <button
                onClick={() => setDrawerOpen(true)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border",
                  followUps.length > 0
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                    : "border-slate-200 dark:border-[hsl(var(--border))] text-slate-500 dark:text-[hsl(var(--muted-foreground))] hover:border-indigo-300 dark:hover:border-[hsl(var(--primary)/0.5)] hover:text-indigo-600 dark:hover:text-[hsl(var(--primary))]"
                )}
              >
                <MessageSquare size={14} />
                追问
                {followUps.length > 0 && (
                  <span className="text-[10px] px-1.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    {followUps.length}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold text-white bg-indigo-600 dark:bg-[hsl(var(--primary))]">
                  {requirement.creatorName.slice(-1)}
                </div>
                <span className="text-xs text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                  {requirement.creatorName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-[hsl(var(--secondary))] w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === key
                  ? "bg-white dark:bg-[hsl(var(--card))] text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-[hsl(var(--muted-foreground))] hover:text-slate-700 dark:hover:text-white"
              )}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab: Basic Info */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Structured params */}
            {sd && (
              <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-5 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                  需求参数
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {/* 基础字段 */}
                  <div>
                    <div className="text-[11px] mb-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">投放地区</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{sd.region || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] mb-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">媒体平台</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{sd.media_platform || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] mb-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">测试日预算</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {sd.daily_budget_usd != null ? `$${sd.daily_budget_usd}/天` : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] mb-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">核心指标</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{sd.target_kpi || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] mb-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">目标ROI</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {sd.target_roi != null ? sd.target_roi.toString() : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] mb-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">产品类型</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{sd.product_type || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[11px] mb-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">推广目标</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{sd.campaign_objective || "—"}</div>
                  </div>
                  {/* 扩展字段 */}
                  {sd.soft_kpi && (
                    <div>
                      <div className="text-[11px] mb-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">Soft KPI</div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{sd.soft_kpi}</div>
                    </div>
                  )}
                  {sd.test_period && (
                    <div>
                      <div className="text-[11px] mb-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">测试周期</div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{sd.test_period}</div>
                    </div>
                  )}
                  {sd.third_party_tracking && (
                    <div>
                      <div className="text-[11px] mb-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">三方归因</div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{sd.third_party_tracking}</div>
                    </div>
                  )}
                  {sd.attribution_model && (
                    <div>
                      <div className="text-[11px] mb-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">自投/代投</div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{sd.attribution_model}</div>
                    </div>
                  )}
                  {sd.expected_start_date && (
                    <div>
                      <div className="text-[11px] mb-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">期望启动时间</div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{sd.expected_start_date}</div>
                    </div>
                  )}
                  {sd.policy_notes && (
                    <div className="col-span-2">
                      <div className="text-[11px] mb-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">政策备注</div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{sd.policy_notes}</div>
                    </div>
                  )}
                  {sd.product_url && (
                    <div className="col-span-2">
                      <div className="text-[11px] mb-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">产品链接</div>
                      <a
                        href={sd.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-indigo-500 hover:underline break-all"
                      >
                        {sd.product_url}
                      </a>
                    </div>
                  )}
                </div>
                {sd.ambiguous_fields.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[hsl(var(--border))]">
                    <div className="text-[11px] mb-2 text-yellow-600 dark:text-yellow-400 font-medium">待确认字段</div>
                    {sd.ambiguous_fields.map((f, i) => (
                      <div key={i} className="text-xs text-slate-500 dark:text-white/70 mb-1">· {f.field}：{f.question}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {/* Raw input */}
              <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] shadow-sm overflow-hidden">
                <button
                  onClick={() => setRawExpanded((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-500 dark:text-[hsl(var(--muted-foreground))]"
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
                      <div className="px-5 pb-4 text-sm leading-relaxed border-t border-slate-100 dark:border-[hsl(var(--border))] text-slate-600 dark:text-[hsl(var(--muted-foreground))] bg-slate-50 dark:bg-white/2">
                        <p className="pt-3">{requirement.rawInput}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status timeline */}
              <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-5 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                  状态时间线
                </h3>
                <div className="space-y-0">
                  {timelineEvents.map((ev, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                            ev.done
                              ? "border-indigo-500 bg-indigo-500 dark:border-[hsl(var(--primary))] dark:bg-[hsl(var(--primary))]"
                              : ev.active
                              ? "border-yellow-400 bg-transparent"
                              : "border-slate-200 dark:border-[hsl(var(--border))] bg-transparent"
                          )}
                        >
                          {ev.done && <Check size={10} className="text-white" />}
                          {ev.active && !ev.done && <div className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />}
                        </div>
                        {idx < timelineEvents.length - 1 && (
                          <div className={cn("w-px my-1", ev.done ? "bg-indigo-200 dark:bg-indigo-500/30" : "bg-slate-200 dark:bg-[hsl(var(--border))]")} style={{ height: 24 }} />
                        )}
                      </div>
                      <div className="pb-4">
                        <div className={cn("text-sm font-medium", ev.active && !ev.done ? "text-yellow-600 dark:text-yellow-400" : "text-slate-900 dark:text-[hsl(var(--foreground))]")}>
                          {ev.label}
                        </div>
                        {ev.time && <div className="text-xs mt-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">{formatDate(ev.time)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: AI Evaluation */}
        {activeTab === "evaluation" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[hsl(var(--muted-foreground))]">AI 评估</h3>
                {isEvaluating && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                    <Loader2 size={12} className="animate-spin" />
                    评估中…
                  </div>
                )}
              </div>
              <EvaluationCard evaluation={evaluation} isLoading={isEvaluating && !evaluation} />
            </div>

            {/* 商务预审：提交给优化师 */}
            {isBusiness && isDraft && (
              <div className="rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/5 p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">提交给优化师</h3>
                <p className="text-xs text-slate-500 dark:text-[hsl(var(--muted-foreground))]">
                  对 AI 评估结果满意后，选择优化师并提交。优化师将收到需求并进行接单评估。
                </p>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 dark:text-[hsl(var(--muted-foreground))]">选择优化师</label>
                  <select
                    value={selectedOptimizerId}
                    onChange={(e) => setSelectedOptimizerId(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--secondary))] text-slate-800 dark:text-[hsl(var(--foreground))] focus:border-violet-400 transition-colors"
                  >
                    <option value="">暂不指定</option>
                    {optimizers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSubmitToOptimizer}
                  disabled={isSubmittingToOptimizer}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingToOptimizer ? (
                    <><Loader2 size={14} className="animate-spin" />提交中…</>
                  ) : (
                    <><CheckCircle2 size={14} />提交给优化师</>
                  )}
                </button>
              </div>
            )}

            {/* Optimizer actions */}
            {isOptimizer && !isDraft && (
              <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[hsl(var(--muted-foreground))]">操作</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleAccept}
                    disabled={requirement.status === "ACCEPTED" || requirement.status === "REJECTED"}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all bg-indigo-600 hover:bg-indigo-700 dark:bg-[hsl(var(--primary))] dark:hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    接单
                  </button>
                  <button
                    onClick={() => setRejectMode((v) => !v)}
                    disabled={requirement.status === "ACCEPTED" || requirement.status === "REJECTED"}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all border border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    拒绝
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
                          className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none border border-slate-200 dark:border-[hsl(var(--border))] bg-slate-50 dark:bg-[hsl(var(--secondary))] text-slate-800 dark:text-[hsl(var(--foreground))] focus:border-red-400 transition-colors"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleRejectConfirm}
                            className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-all"
                          >
                            确认拒绝
                          </button>
                          <button
                            onClick={() => { setRejectMode(false); setRejectReason(""); }}
                            className="flex-1 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-[hsl(var(--secondary))] text-slate-500 dark:text-[hsl(var(--muted-foreground))] hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {requirement.status === "REJECTED" && requirement.rejectionReason && (
                  <div className="rounded-xl p-3 text-xs bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20">
                    已拒绝：{requirement.rejectionReason}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Follow-up history (inline view) */}
        {activeTab === "followup" && (
          <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[hsl(var(--border))]">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">追问对话</h3>
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
              >
                <Send size={12} />
                发起追问
              </button>
            </div>
            <div className="p-5 space-y-4 min-h-[200px]">
              {followUps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <MessageSquare size={24} className="text-slate-200 dark:text-slate-600" />
                  <p className="text-sm text-slate-400 dark:text-[hsl(var(--muted-foreground))]">暂无追问记录</p>
                </div>
              ) : (
                followUps.map((fu) => {
                  const isOwn = fu.fromId === currentUser.id;
                  return (
                    <div key={fu.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[75%] space-y-1">
                        <div className={cn("text-[10px] font-medium text-slate-400 dark:text-[hsl(var(--muted-foreground))]", isOwn ? "text-right" : "")}>
                          {fu.fromName} · {fu.fromRole === "OPTIMIZER" ? "优化师" : "商务"}
                        </div>
                        <div className={cn(
                          "text-sm px-4 py-2.5 leading-relaxed",
                          isOwn
                            ? "bg-indigo-600 dark:bg-[hsl(var(--primary))] text-white rounded-2xl rounded-tr-sm"
                            : "bg-slate-100 dark:bg-[hsl(var(--secondary))] text-slate-800 dark:text-[hsl(var(--foreground))] rounded-2xl rounded-tl-sm"
                        )}>
                          {fu.content}
                        </div>
                        <div className={cn("text-[10px] text-slate-300 dark:text-[hsl(var(--muted-foreground)/0.5)]", isOwn ? "text-right" : "")}>
                          {formatDate(fu.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab: AI Chat */}
        {activeTab === "aichat" && (
          sd ? (
            <AIChat
              requirementData={sd}
              evaluationData={evaluation}
              messages={chatMessages}
              onMessagesChange={setChatMessages}
              loading={chatLoading}
              onLoadingChange={setChatLoading}
              onReEvaluate={handleReEvaluate}
              isReEvaluating={isReEvaluating}
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-10 shadow-sm text-center">
              <div className="flex flex-col items-center gap-3">
                <Bot size={28} className="text-slate-200 dark:text-slate-600" />
                <p className="text-sm text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                  需求数据加载中，请稍候
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* CommDrawer */}
      <CommDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        followUps={followUps}
        input={followUpInput}
        onInputChange={setFollowUpInput}
        onSend={handleSendFollowUp}
        currentUserId={currentUser.id}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
}
