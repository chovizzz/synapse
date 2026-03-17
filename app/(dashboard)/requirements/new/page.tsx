"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { StepIndicator } from "@/components/requirements/StepIndicator";
import { ParseAnimation } from "@/components/requirements/ParseAnimation";
import { useRole } from "@/lib/role-context";
import { getRequirements, saveRequirements } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MOCK_CLIENTS, MOCK_USERS } from "@/lib/mock-data";
import { StructuredRequirement, Requirement } from "@/types";

const DEMO_INPUT =
  "我们想在北美推一款策略手游，ROI要到1.2，预算每天500美金，跑Facebook和Instagram";

const FIELD_LABELS: Record<keyof Omit<StructuredRequirement, "ambiguous_fields">, string> = {
  region: "投放地区",
  media_platform: "媒体平台",
  daily_budget_usd: "日预算(美元)",
  target_kpi: "核心指标",
  target_roi: "目标ROI",
  product_type: "产品类型",
  campaign_objective: "推广目标",
};

export default function NewRequirementPage() {
  const router = useRouter();
  const { currentUser } = useRole();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [rawInput, setRawInput] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(MOCK_CLIENTS[0].id);
  const [customClient, setCustomClient] = useState("");

  // Step 2
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<StructuredRequirement | null>(null);

  // Step 3
  const [editableData, setEditableData] = useState<StructuredRequirement | null>(null);
  const [assignedOptimizerId, setAssignedOptimizerId] = useState(
    MOCK_USERS.find((u) => u.role === "OPTIMIZER")?.id ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const optimizers = MOCK_USERS.filter((u) => u.role === "OPTIMIZER");

  const clientName =
    selectedClientId === "__custom__"
      ? customClient.trim() || "未知客户"
      : MOCK_CLIENTS.find((c) => c.id === selectedClientId)?.name ?? "未知客户";

  // ── Step 1 → 2: AI 解析 ──────────────────────────────────────────────────
  async function handleParse() {
    if (!rawInput.trim()) return;
    setIsParsing(true);
    setParseError(null);
    setStep(2);

    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const data: StructuredRequirement = json.data;
      setParsedData(data);
      setEditableData({ ...data });
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "解析失败，请重试");
    } finally {
      setIsParsing(false);
    }
  }

  // ── Step 2 → 3: 确认 ─────────────────────────────────────────────────────
  function handleConfirm() {
    if (!parsedData) return;
    setStep(3);
  }

  // ── Step 3: 提交 ──────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!editableData) return;
    setIsSubmitting(true);

    const newId = `r-${generateId()}`;
    const optimizer = MOCK_USERS.find((u) => u.id === assignedOptimizerId);

    const newReq: Requirement = {
      id: newId,
      clientId: selectedClientId === "__custom__" ? `c-${generateId()}` : selectedClientId,
      clientName,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      assignedOptimizerId: optimizer?.id,
      assignedOptimizerName: optimizer?.name,
      rawInput,
      structuredData: editableData,
      status: "EVALUATING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existing = getRequirements();
    saveRequirements([newReq, ...existing]);

    // 异步触发 AI 评估，不阻塞跳转
    fetch("/api/ai/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ structuredData: editableData }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const reqs = getRequirements();
          const updated = reqs.map((r) =>
            r.id === newId ? { ...r, aiEvaluation: json.data, status: "PENDING" as const } : r
          );
          saveRequirements(updated);
        }
      })
      .catch(() => {/* 静默失败 */});

    router.push(`/requirements/${newId}`);
  }

  // ── 渲染 ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-white">新建客户需求</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          粘贴客户原话，AI 自动解析为结构化需求单
        </p>
      </div>

      {/* 步骤指示器 */}
      <StepIndicator currentStep={step} />

      {/* Step 内容区 */}
      <AnimatePresence mode="wait">
        {/* ── STEP 1 ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {/* 客户选择 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[hsl(var(--foreground))]">
                选择客户
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className={cn(
                  "w-full rounded-lg border border-[hsl(var(--border))]",
                  "bg-[hsl(var(--card))] text-[hsl(var(--foreground))]",
                  "px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50"
                )}
              >
                {MOCK_CLIENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="__custom__">+ 新客户（手动输入）</option>
              </select>
              {selectedClientId === "__custom__" && (
                <input
                  type="text"
                  placeholder="输入新客户名称"
                  value={customClient}
                  onChange={(e) => setCustomClient(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border border-[hsl(var(--border))]",
                    "bg-[hsl(var(--card))] text-[hsl(var(--foreground))]",
                    "px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 mt-2"
                  )}
                />
              )}
            </div>

            {/* 原话输入 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[hsl(var(--foreground))]">
                客户原话
              </label>
              <div className="relative">
                <textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="把客户说的原话粘贴在这里..."
                  rows={5}
                  className={cn(
                    "w-full rounded-lg border border-[hsl(var(--border))]",
                    "bg-[hsl(var(--card))] text-[hsl(var(--foreground))]",
                    "px-4 py-3 text-sm resize-none min-h-[120px]",
                    "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50",
                    "placeholder:text-[hsl(var(--muted-foreground))]"
                  )}
                />
                {/* 一键填入 */}
                <button
                  type="button"
                  onClick={() => setRawInput(DEMO_INPUT)}
                  className={cn(
                    "absolute bottom-3 right-3 text-xs px-2.5 py-1 rounded-md",
                    "border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]",
                    "hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary))]/50 transition-colors"
                  )}
                >
                  一键填入演示数据
                </button>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                示例：我们想在北美推一款策略手游，ROI要到1.2，预算每天500美金，跑Facebook和Instagram
              </p>
            </div>

            {/* 底部按钮 */}
            <button
              onClick={handleParse}
              disabled={!rawInput.trim()}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
                "bg-[hsl(var(--primary))] text-white font-semibold text-sm",
                "transition-opacity duration-200",
                !rawInput.trim() ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"
              )}
            >
              AI 解析
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* 原话预览 */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 p-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">客户原话</p>
              <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed">{rawInput}</p>
            </div>

            {/* 解析动画区 */}
            <ParseAnimation data={parsedData} isLoading={isParsing} />

            {/* 错误提示 */}
            {parseError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
                ⚠️ {parseError}
              </div>
            )}

            {/* 底部按钮 */}
            {!isParsing && parsedData && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-3"
              >
                <button
                  onClick={() => { setParsedData(null); setStep(1); }}
                  className={cn(
                    "flex-1 py-3 rounded-xl border border-[hsl(var(--border))]",
                    "text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  )}
                >
                  重新输入
                </button>
                <button
                  onClick={handleConfirm}
                  className={cn(
                    "flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl",
                    "bg-[hsl(var(--primary))] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                  )}
                >
                  确认，进入下一步
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {!isParsing && parseError && (
              <button
                onClick={() => { setParseError(null); setStep(1); }}
                className={cn(
                  "w-full py-3 rounded-xl border border-[hsl(var(--border))]",
                  "text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                )}
              >
                返回修改
              </button>
            )}
          </motion.div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && editableData && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--primary))]" />
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                  解析结果确认 — 可手动修改
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(FIELD_LABELS) as Array<keyof typeof FIELD_LABELS>).map((key) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs text-[hsl(var(--muted-foreground))]">
                      {FIELD_LABELS[key]}
                    </label>
                    <input
                      type={key === "daily_budget_usd" || key === "target_roi" ? "number" : "text"}
                      value={
                        editableData[key] != null ? String(editableData[key]) : ""
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        const isNum = key === "daily_budget_usd" || key === "target_roi";
                        setEditableData((prev) =>
                          prev
                            ? {
                                ...prev,
                                [key]: isNum ? (raw === "" ? null : Number(raw)) : raw,
                              }
                            : prev
                        );
                      }}
                      className={cn(
                        "w-full rounded-lg border border-[hsl(var(--border))]",
                        "bg-[hsl(var(--background))] text-[hsl(var(--foreground))]",
                        "px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50"
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 分配优化师 */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-3">
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">分配优化师</p>
              <select
                value={assignedOptimizerId}
                onChange={(e) => setAssignedOptimizerId(e.target.value)}
                className={cn(
                  "w-full rounded-lg border border-[hsl(var(--border))]",
                  "bg-[hsl(var(--background))] text-[hsl(var(--foreground))]",
                  "px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50"
                )}
              >
                <option value="">暂不分配</option>
                {optimizers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className={cn(
                  "flex-1 py-3 rounded-xl border border-[hsl(var(--border))]",
                  "text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                )}
              >
                返回修改
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  "flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl",
                  "bg-[hsl(var(--primary))] text-white font-semibold text-sm",
                  "transition-opacity duration-200",
                  isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    提交需求
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
