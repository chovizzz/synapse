"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { StepIndicator } from "@/components/requirements/StepIndicator";
import { ParseAnimation } from "@/components/requirements/ParseAnimation";
import { useRole } from "@/lib/role-context";
import { getRequirements, saveRequirements, getClients, getStoredUsers } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { StructuredRequirement, Requirement, Client, User } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEMO_INPUT =
  "我们想在北美推一款策略手游，ROI要到1.2，预算每天500美金，跑Facebook和Instagram";

const FIELD_LABELS: Record<keyof Omit<StructuredRequirement, "ambiguous_fields">, string> = {
  region: "投放地区",
  media_platform: "媒体平台",
  daily_budget_usd: "测试日预算(美元)",
  target_kpi: "核心指标",
  target_roi: "目标ROI",
  product_type: "产品类型",
  campaign_objective: "推广目标",
  product_url: "产品链接",
  soft_kpi: "Soft KPI",
  test_period: "测试周期",
  third_party_tracking: "三方归因",
  attribution_model: "自投/代投",
  expected_start_date: "期望启动时间",
  policy_notes: "政策备注",
};

const NUMBER_FIELDS: Array<keyof Omit<StructuredRequirement, "ambiguous_fields">> = [
  "daily_budget_usd",
  "target_roi",
];

export default function NewRequirementPage() {
  const router = useRouter();
  const { currentUser } = useRole();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // 从 store 加载客户和优化师
  const [clients, setClients] = useState<Client[]>([]);
  const [optimizers, setOptimizers] = useState<User[]>([]);

  useEffect(() => {
    const allClients = getClients();
    const allUsers = getStoredUsers();
    setClients(allClients);
    setOptimizers(allUsers.filter((u) => u.role === "OPTIMIZER"));
  }, []);

  // Step 1
  const [rawInput, setRawInput] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [customClient, setCustomClient] = useState("");

  // Step 2
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<StructuredRequirement | null>(null);

  // Step 3
  const [editableData, setEditableData] = useState<StructuredRequirement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 客户加载完后设置默认选中
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  const clientName =
    selectedClientId === "__custom__"
      ? customClient.trim() || "未知客户"
      : clients.find((c) => c.id === selectedClientId)?.name ?? "未知客户";

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

  // ── Step 3: 保存为草稿（DRAFT）──────────────────────────────────────────
  async function handleSubmit() {
    if (!editableData) return;
    setIsSubmitting(true);

    const newId = `r-${generateId()}`;

    const newReq: Requirement = {
      id: newId,
      clientId: selectedClientId === "__custom__" ? `c-${generateId()}` : selectedClientId,
      clientName,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      rawInput,
      structuredData: editableData,
      status: "DRAFT",
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
            r.id === newId ? { ...r, aiEvaluation: json.data } : r
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
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">新建客户需求</h1>
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
              <Select
                value={selectedClientId}
                onValueChange={(v) => setSelectedClientId(v ?? "")}
                itemToStringLabel={(v) => {
                  if (!v) return "选择客户";
                  if (v === "__custom__") return "+ 新客户（手动输入）";
                  return clients.find((c) => c.id === v)?.name ?? String(v);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择客户" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">+ 新客户（手动输入）</SelectItem>
                </SelectContent>
              </Select>
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
              <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed break-all">{rawInput}</p>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(Object.keys(FIELD_LABELS) as Array<keyof typeof FIELD_LABELS>).map((key) => {
                  const isNum = NUMBER_FIELDS.includes(key);
                  const rawVal = editableData[key];
                  const displayVal = rawVal != null ? String(rawVal) : "";
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-xs text-[hsl(var(--muted-foreground))]">
                        {FIELD_LABELS[key]}
                      </label>
                      <input
                        type={isNum ? "number" : "text"}
                        value={displayVal}
                        onChange={(e) => {
                          const v = e.target.value;
                          setEditableData((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  [key]: isNum
                                    ? v === "" ? null : Number(v)
                                    : v,
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
                  );
                })}
              </div>
            </div>

            {/* 提示说明 */}
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 flex gap-3">
              <div className="text-violet-400 mt-0.5 flex-shrink-0">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-violet-400">保存为草稿，先预览 AI 评估</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  需求将保存为草稿（仅你可见），AI 会自动运行评估。你可以和 AI 对话调整评估，满意后再提交给优化师。
                </p>
              </div>
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
                    保存中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    保存草稿并预览评估
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
